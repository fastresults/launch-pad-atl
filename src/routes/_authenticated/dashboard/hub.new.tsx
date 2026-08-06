// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IndustryCombobox } from "@/components/hub/IndustryCombobox";
import { TRACKS, TRACK_BY_KEY, pickSeedForTrack, TRACK_SEEDS, type TrackKey, type SeedEntry } from "@/lib/tracks";
import { SIC_CODES, findSicByCode, parseSicCode, sicValue } from "@/lib/sic-codes";
import { createSnapshot } from "@/lib/foundersHub.functions";
import {
  uploadVentureSource,
  attachSourcesToSnapshot,
  listVentureSources,
  listSourcesByOtherVentures,
  copySourceToSnapshot,
  deleteVentureSource,
  updateVentureSourceIntent,
  type VentureSource,
} from "@/lib/venture-sources";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
  FileText,
  X,
  Wand2,
  MapPin,
  CheckCircle2,
  Plus,
  Link2,
  Globe,
  Library,
  ChevronDown,
  ChevronUp,
  Mic,
  Compass,
  RotateCcw,
  Type as TypeIcon,
} from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { toast } from "sonner";
import { useCanonicalContext } from "@/hooks/use-canonical-context";
import { invokeEdge } from "@/lib/edge-invoke";
import { StepShell, StepStrip, StepNav, type StepState } from "@/components/hub/VentureWizard";


type DroppedFile = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "ready" | "error";
  documentId?: string;
  text?: string;
  error?: string;
};

type UrlIntent = "own" | "pattern";

type ScrapedUrl = {
  id: string;
  url: string;
  status: "scraping" | "ready" | "error";
  title?: string | null;
  text?: string;
  charCount?: number;
  error?: string;
  intent?: UrlIntent;
};

type IntakeTab = "upload" | "link" | "speak" | "type";

const MAX_URLS = 3;
const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT =
  ".pdf,.txt,.md,.markdown,.docx,.rtf,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,image/*";

/** Parse the intent/URL/title header a URL scrape stores at the top of its markdown body. */
function parseUrlCaptureMeta(text: string | null | undefined): {
  intent: UrlIntent;
  url: string | null;
  title: string | null;
} {
  if (!text) return { intent: "own", url: null, title: null };
  const head = text.slice(0, 1500);
  const titleMatch = head.match(/^#\s+(.+)$/m);
  const sourceMatch = head.match(/^Source:\s*(\S+)/im);
  const intentMatch = head.match(/^Intent:\s*(own|pattern)\b/im);
  return {
    intent: intentMatch && intentMatch[1].toLowerCase() === "pattern" ? "pattern" : "own",
    url: sourceMatch?.[1] ?? null,
    title: titleMatch?.[1]?.trim() ?? null,
  };
}

type Path = "own" | "competitor" | "manual";

export default function HubNewPage() {
  return (
    <FoundersHubGate>
      <Inner />
    </FoundersHubGate>
  );
}

function Inner() {
  const nav = useNavigate();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [fromBrief, setFromBrief] = useState<boolean>(!!prefill?.fromBrief);

  // Path is now invisible; defaults to "manual" and flips to "own" silently
  // if synthesis finds a website URL.
  const [path, setPath] = useState<Path>("manual");

  const [companyName, setCompanyName] = useState(prefill?.company_name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessConcept, setBusinessConcept] = useState(prefill?.business_concept ?? "");
  const [diff, setDiff] = useState(prefill?.differentiation_statement ?? "");

  // Intake tab state
  const [intakeTab, setIntakeTab] = useState<IntakeTab>("upload");

  // File / URL state
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [scrapedUrls, setScrapedUrls] = useState<ScrapedUrl[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [nextUrlIntent, setNextUrlIntent] = useState<UrlIntent>("own");
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Synth state
  const [drafting, setDrafting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [aiFilled, setAiFilled] = useState<Record<string, boolean>>({});
  const [filling, setFilling] = useState(false);
  const [seedUrlChoice, setSeedUrlChoice] = useState<string>(""); // "" = random
  const draftRunRef = useRef(0);

  // Founder + market context
  const [founderName, setFounderName] = useState(prefill?.founder_name ?? "");
  const [founderEmail, setFounderEmail] = useState(prefill?.founder_email ?? "");
  const [founderPhone, setFounderPhone] = useState(prefill?.founder_phone ?? "");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [region, setRegion] = useState(prefill?.region ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "United States");
  const [marketScope, setMarketScope] = useState<"local" | "regional" | "national" | "international">(
    prefill?.market_scope ?? "local",
  );
  const [industry, setIndustry] = useState(prefill?.industry ?? "");
  const [subIndustry, setSubIndustry] = useState(prefill?.sub_industry ?? "");
  const [track, setTrack] = useState<TrackKey | "">(prefill?.track ?? "lifestyle");
  const [showTrackHelp, setShowTrackHelp] = useState(false);

  // Collapsible "Review" card
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTouched, setReviewTouched] = useState(false);

  // ── Progressive wizard ────────────────────────────────────────────────
  // activeStep = the one expanded step. maxStepReached = furthest step the
  // founder has unlocked; steps at or below it stay clickable so they can
  // move backward and forward freely without losing any state.
  const [activeStep, setActiveStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const stepRefs = useRef<Record<number, HTMLElement | null>>({});


  // Prefill from canonical context.
  const { data: canonicalCtx } = useCanonicalContext();
  useEffect(() => {
    if (resetStepOneRef.current) return;
    if (!canonicalCtx) return;
    const ctx = canonicalCtx;
    setFounderName((cur) => cur || ctx.identity.full_name);
    setFounderEmail((cur) => cur || ctx.identity.email);
    setFounderPhone((cur) => cur || ctx.identity.phone);
    setCompanyName((cur) => cur || ctx.concept.company_name);
    setBusinessConcept((cur) => cur || ctx.concept.business_concept_blob);
    setDiff((cur) => cur || ctx.concept.differentiation);
    setIndustry((cur) => cur || ctx.market.industry);
    setMarketScope((cur) => (cur ? cur : (ctx.market.market_scope || "local")));
    if (ctx.market.industry || ctx.concept.business_concept_blob) {
      setFromBrief((cur) => cur || true);
    }
  }, [canonicalCtx]);

  // Reusable library — founder-level memory ONLY (sources not yet tied to a
  // venture: founder bio, Startup Brief captures, files dropped before a
  // venture existed). Files already attached to another venture are NEVER
  // listed here; Second Brain memory belongs to one venture.
  const [reusable, setReusable] = useState<VentureSource[]>([]);
  const [reuseSelected, setReuseSelected] = useState<Record<string, boolean>>({});
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [otherVentures, setOtherVentures] = useState<
    Array<{ snapshotId: string; ventureName: string; sources: VentureSource[] }>
  >([]);
  const [otherVenturesOpen, setOtherVenturesOpen] = useState(false);
  const resetStepOneRef = useRef(false);
  useEffect(() => {
    listVentureSources({ orphansOnly: true })
      .then((rows) => {
        setReusable(rows);
        if (resetStepOneRef.current) return;
        // Auto-attach everything readable from the founder's own unassigned
        // memory (brief sources, scraped URLs, founder bio). Never another
        // venture's material.
        setReuseSelected((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            if ((r.extracted_text ?? "").trim()) next[r.id] = true;
          }
          return next;
        });
      })
      .catch(() => {});
    listSourcesByOtherVentures()
      .then(setOtherVentures)
      .catch(() => {});
  }, []);

  // Memory chips = every readable source already on file for this founder.
  const memoryChips = useMemo(() => {
    return reusable
      .filter((r) => !!(r.extracted_text ?? "").trim() || r.extraction_error)
      .map((r) => {
        const name = r.original_name ?? "source";
        const lower = name.toLowerCase();
        // Any .md/.markdown source in our pipeline is a scraped URL or a
        // brief capture — render with the globe icon.
        const isUrlCapture = lower.endsWith(".md") || lower.endsWith(".markdown");
        const isAudio = /\.(mp3|m4a|wav|webm|ogg)$/i.test(name);
        const isImage = /\.(png|jpe?g|webp|gif)$/i.test(name);
        let origin: "brief" | "founder" | "venture" | "other" = "other";
        if (r.used_in_brief || r.kind === "brief_source") origin = "brief";
        else if (r.kind === "founder_bio") origin = "founder";
        else if (r.snapshot_id) origin = "venture";
        const meta = isUrlCapture
          ? parseUrlCaptureMeta(r.extracted_text)
          : { intent: "own" as UrlIntent, url: null, title: null };
        return { row: r, name, isUrlCapture, isAudio, isImage, origin, intent: meta.intent, capturedUrl: meta.url, capturedTitle: meta.title };
      });
  }, [reusable]);


  const activeMemoryChips = memoryChips.filter(({ row }) => !!reuseSelected[row.id]);
  const inactiveMemoryChips = memoryChips.filter(({ row }) => !reuseSelected[row.id]);
  const memoryEmpty = activeMemoryChips.length === 0;
  const showCollectionUI = memoryEmpty || addMoreOpen;

  // Append a freshly-saved source to the in-page memory so it shows up as a
  // pill in the "Your source memory" row immediately, instead of lingering in
  // a separate "SAVED" list below the dropzone.
  const appendToMemory = useCallback((row: VentureSource) => {
    resetStepOneRef.current = false;
    setReusable((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
    setReuseSelected((prev) => ({ ...prev, [row.id]: true }));
  }, []);

  // Copy (never move) a file that belongs to another venture into this
  // intake's memory. The source venture keeps its own copy.
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const copyFromVenture = useCallback(
    async (row: VentureSource) => {
      setCopyingId(row.id);
      try {
        const copy = await copySourceToSnapshot({ documentId: row.id, snapshotId: null });
        appendToMemory(copy);
        setOtherVentures((prev) =>
          prev
            .map((g) => ({ ...g, sources: g.sources.filter((s) => s.id !== row.id) }))
            .filter((g) => g.sources.length > 0),
        );
        toast.success("Copied into this venture's memory");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not copy that source");
      } finally {
        setCopyingId(null);
      }
    },
    [appendToMemory],
  );




  const addFiles = useCallback(
    async (incoming: File[]) => {
      if (!incoming.length) return;
      resetStepOneRef.current = false;
      const room = MAX_FILES - files.length;
      if (room <= 0) {
        toast.error(`Max ${MAX_FILES} files`);
        return;
      }
      const accepted = incoming.slice(0, room).filter((f) => {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} is over 20 MB`);
          return false;
        }
        return true;
      });
      const queued: DroppedFile[] = accepted.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        status: "uploading",
      }));
      setFiles((prev) => [...prev, ...queued]);

      queued.forEach(async (entry, i) => {
        const file = accepted[i];
        try {
          const row = await uploadVentureSource({ file, kind: "venture_source", waitForExtraction: true });
          const text = (row.extracted_text ?? "").trim();
          if (row.extraction_error || !text) {
            // Keep the failed entry visible so the founder can see why & retry.
            setFiles((curr) =>
              curr.map((x) =>
                x.id === entry.id
                  ? { ...x, status: "error", documentId: row.id, error: row.extraction_error ?? "Couldn't read file" }
                  : x,
              ),
            );
          } else {
            // Success → promote into memory chips and drop the transient row.
            appendToMemory(row);
            setFiles((curr) => curr.filter((x) => x.id !== entry.id));
          }
        } catch (e) {
          setFiles((curr) =>
            curr.map((x) =>
              x.id === entry.id
                ? { ...x, status: "error", error: e instanceof Error ? e.message : "Upload failed" }
                : x,
            ),
          );
        }
      });
    },
    [files.length, appendToMemory],
  );

  const removeFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (target?.documentId) {
      deleteVentureSource(target.documentId).catch(() => {});
    }
  };
  const removeUrl = (id: string) => setScrapedUrls((prev) => prev.filter((u) => u.id !== id));

  const reusedIds = Object.entries(reuseSelected).filter(([, v]) => v).map(([k]) => k);
  const reusedRows = reusable.filter((r) => reusedIds.includes(r.id));
  const readyFiles = files.filter((f) => f.status === "ready" && (f.text ?? "").trim());
  const readyUrls = scrapedUrls.filter((u) => u.status === "ready" && (u.text ?? "").trim());

  // Split reused memory rows into "own" content (uploaded docs + own-tagged
  // URL captures) vs "pattern references" (URL captures tagged as pattern).
  // Pattern refs are handed to the AI as inspiration only — never as identity.
  const reusedSplit = useMemo(() => {
    const own: Array<{ filename: string; text: string; id: string }> = [];
    const pattern: Array<{ url: string; title: string | null; text: string; id: string }> = [];
    for (const r of reusedRows) {
      const text = r.extracted_text ?? "";
      if (!text.trim()) continue;
      const name = r.original_name ?? "source";
      const isUrlCapture = /\.(md|markdown)$/i.test(name);
      const meta = isUrlCapture ? parseUrlCaptureMeta(text) : { intent: "own" as UrlIntent, url: null, title: null };
      if (isUrlCapture && meta.intent === "pattern") {
        pattern.push({ url: meta.url ?? name, title: meta.title, text, id: r.id });
      } else {
        own.push({ filename: name, text, id: r.id });
      }
    }
    return { own, pattern };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reusedRows.map((r) => r.id).join("|")]);

  const combinedDocs = [
    ...reusedSplit.own,
    ...readyFiles.map((f) => ({ filename: f.name, text: f.text ?? "", id: f.documentId })),
  ];
  // Transient URL scrapes the founder just added on this page (before they
  // land in memory) — respect their intent flag too.
  const readyOwnUrls = readyUrls.filter((u) => (u.intent ?? "own") === "own");
  const readyPatternUrls = readyUrls.filter((u) => u.intent === "pattern");
  const patternRefs = [
    ...reusedSplit.pattern,
    ...readyPatternUrls.map((u) => ({ url: u.url, title: u.title ?? null, text: u.text ?? "", id: u.id })),
  ];
  const hasPatternRefs = patternRefs.length > 0;
  const hasOwnSource = combinedDocs.length > 0 || readyOwnUrls.length > 0 || businessConcept.trim().length >= 20;


  const addUrl = async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    resetStepOneRef.current = false;
    if (scrapedUrls.length >= MAX_URLS) {
      toast.error(`Max ${MAX_URLS} URLs`);
      return;
    }
    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      new URL(normalized);
    } catch {
      toast.error("That doesn't look like a valid URL");
      return;
    }
    if (scrapedUrls.some((u) => u.url === normalized)) {
      toast.error("Already added that URL");
      return;
    }
    const intent: UrlIntent = nextUrlIntent;
    const entry: ScrapedUrl = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: normalized,
      status: "scraping",
      intent,
    };
    setScrapedUrls((prev) => [...prev, entry]);
    setUrlInput("");
    setScrapingUrl(true);
    try {
      const { data, error } = await invokeEdge("venture-scrape-url", {
        body: { urls: [normalized] },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (!r) throw new Error("No result");
      const text = (r?.text ?? "").trim();
      if (r.error || !text) {
        setScrapedUrls((curr) =>
          curr.map((x) =>
            x.id === entry.id
              ? { ...x, status: "error", error: r.error ?? "No content" }
              : x,
          ),
        );
      } else {
        // Persist the scrape as a venture source so it shows as a chip in
        // "Your source memory" alongside uploads.
        try {
          const host = new URL(normalized).hostname.replace(/^www\./, "");
          const patternSuffix = intent === "pattern" ? "__pattern" : "";
          const baseName = ((r.title || host).replace(/[^\w\-.]+/g, "_").slice(0, 80) || "link") + patternSuffix;
          // The `Intent:` header line is what we read back later to route this
          // scrape into "own" vs "pattern reference" buckets at synthesis time.
          const md = `# ${r.title || normalized}\n\nSource: ${normalized}\nIntent: ${intent}\n\n${text}`;
          const file = new File([md], `${baseName}.md`, { type: "text/markdown" });
          const row = await uploadVentureSource({ file, kind: "venture_source", waitForExtraction: true });
          appendToMemory(row);
          setScrapedUrls((curr) => curr.filter((x) => x.id !== entry.id));
        } catch (persistErr) {
          // Fall back to keeping the URL in its own list if persistence fails.
          setScrapedUrls((curr) =>

            curr.map((x) =>
              x.id === entry.id
                ? {
                    ...x,
                    status: "ready",
                    title: r.title ?? null,
                    text,
                    charCount: r.charCount ?? text.length,
                  }
                : x,
            ),
          );
        }
      }
    } catch (e) {
      setScrapedUrls((curr) =>
        curr.map((x) =>
          x.id === entry.id
            ? { ...x, status: "error", error: e instanceof Error ? e.message : "Scrape failed" }
            : x,
        ),
      );
    } finally {
      setScrapingUrl(false);
    }
  };

  const markFilled = (key: string) => setAiFilled((prev) => ({ ...prev, [key]: true }));

  const draftFromFiles = useCallback(
    async (opts?: { auto?: boolean }) => {
      const hasFiles = combinedDocs.length > 0;
      const hasOwnUrls = readyOwnUrls.length > 0;
      const hasPattern = patternRefs.length > 0;
      const hasDraft = businessConcept.trim().length >= 20;
      if (!hasFiles && !hasOwnUrls && !hasPattern && !hasDraft) return;
      if (drafting) return;
      const runId = ++draftRunRef.current;
      // Identity fields (name, contact, address, own website) should NEVER come
      // from a pattern reference. If pattern refs are the only signal about
      // identity we have, lock down the identity setters entirely.
      const identityFromPatternOnly = hasPattern && !hasFiles && !hasOwnUrls;
      setDrafting(true);
      try {
        const { data, error } = await invokeEdge("venture-synthesize-concept", {
          body: {
            sources: combinedDocs.map((d) => ({ filename: d.filename, text: d.text })),
            urls: readyOwnUrls.map((u) => ({ url: u.url, title: u.title ?? null, text: u.text })),
            patternUrls: patternRefs.map((p) => ({ url: p.url, title: p.title ?? null, text: p.text })),
            conceptDraft: hasDraft ? businessConcept.trim() : "",
            industryValues: SIC_CODES.map((c) => sicValue(c)),
          },
        });
        if (error) throw error;
        const concept = (data?.concept ?? "").trim();
        if (!concept) throw new Error("Empty draft from the model");
        if (runId !== draftRunRef.current) return;

        setBusinessConcept(concept);
        markFilled("businessConcept");
        const filled: string[] = ["business concept"];

        const setIf = (val: unknown, setter: (v: string) => void, key: string, label: string) => {
          if (typeof val === "string" && val.trim()) {
            setter(val.trim());
            markFilled(key);
            filled.push(label);
          }
        };
        const setIdentity = (val: unknown, setter: (v: string) => void, key: string, label: string) => {
          if (identityFromPatternOnly) return;
          setIf(val, setter, key, label);
        };
        setIdentity(data?.company_name, setCompanyName, "companyName", "company name");
        setIf(data?.differentiation_statement, setDiff, "diff", "differentiation");
        setIdentity(data?.founder_name, setFounderName, "founderName", "founder name");
        setIdentity(data?.founder_email, setFounderEmail, "founderEmail", "founder email");
        setIdentity(data?.founder_phone, setFounderPhone, "founderPhone", "founder phone");
        setIdentity(data?.city, setCity, "city", "city");
        setIdentity(data?.region, setRegion, "region", "state / region");
        setIf(data?.sub_industry, setSubIndustry, "subIndustry", "sub-industry");
        if (!identityFromPatternOnly && typeof data?.website_url === "string" && data.website_url.trim()) {
          setWebsiteUrl(data.website_url.trim());
          markFilled("websiteUrl");
          // Silently flip to "own" so enrichment re-scrapes the founder's site.
          setPath("own");
          filled.push("website");
        }
        if (!identityFromPatternOnly && typeof data?.country === "string" && data.country.trim()) {
          setCountry(data.country.trim());
          markFilled("country");
          filled.push("country");
        }
        const scope = data?.market_scope;
        if (scope && ["local", "regional", "national", "international"].includes(scope)) {
          setMarketScope(scope);
          markFilled("marketScope");
          filled.push("market scope");
        }
        if (typeof data?.industry === "string" && data.industry.trim()) {
          const code = parseSicCode(data.industry);
          const entry = code ? findSicByCode(code) : undefined;
          setIndustry(entry ? sicValue(entry) : data.industry.trim());
          markFilled("industry");
          filled.push("industry");
        }


        setProcessed(true);
        if (opts?.auto) {
          toast.success(`Auto-filled ${filled.length} field${filled.length === 1 ? "" : "s"} — scroll to confirm`);
        } else {
          toast.success(`Filled ${filled.length} field${filled.length === 1 ? "" : "s"} — review below`);
        }
      } catch (e) {
        if (runId === draftRunRef.current && !opts?.auto) toast.error(e instanceof Error ? e.message : "Couldn't process the asset");
      } finally {
        if (runId === draftRunRef.current) setDrafting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [combinedDocs.map((d) => d.id).join("|"), readyUrls.map((u) => u.id).join("|"), businessConcept, drafting],
  );

  // Auto-synthesize whenever a NEW source becomes ready.
  const autoSigRef = useRef<string>("");
  useEffect(() => {
    const sig = [
      ...combinedDocs.map((d) => `f:${d.id}`),
      ...readyUrls.map((u) => `u:${u.id}`),
    ].sort().join("|");
    if (!sig) return;
    if (sig === autoSigRef.current) return;
    autoSigRef.current = sig;
    // Fire async; tolerate races.
    draftFromFiles({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedDocs.map((d) => d.id).join("|"), readyUrls.map((u) => u.id).join("|")]);

  // Reset Step 1 — the founder can wipe every AI signal and every transient
  // source they've added on this page and start again with a clean slate.
  // Library files themselves are NOT deleted; they just become unselected.
  const [resetOpen, setResetOpen] = useState(false);

  const canonicalDefault = (key: string): string => {
    const ctx = canonicalCtx;
    switch (key) {
      case "companyName": return prefill?.company_name ?? ctx?.concept?.company_name ?? "";
      case "diff": return prefill?.differentiation_statement ?? ctx?.concept?.differentiation ?? "";
      case "founderName": return prefill?.founder_name ?? ctx?.identity?.full_name ?? "";
      case "founderEmail": return prefill?.founder_email ?? ctx?.identity?.email ?? "";
      case "founderPhone": return prefill?.founder_phone ?? ctx?.identity?.phone ?? "";
      case "city": return prefill?.city ?? "";
      case "region": return prefill?.region ?? "";
      case "country": return prefill?.country ?? "United States";
      case "websiteUrl": return "";
      case "subIndustry": return prefill?.sub_industry ?? "";
      case "businessConcept": return prefill?.business_concept ?? ctx?.concept?.business_concept_blob ?? "";
      case "industry": return prefill?.industry ?? ctx?.market?.industry ?? "";
      default: return "";
    }
  };
  const resetStepOne = () => {
    resetStepOneRef.current = true;
    draftRunRef.current += 1;
    // Unselect every chip so nothing in memory feeds synthesis.
    setReuseSelected({});
    // Clear transient intake.
    setFiles([]);
    setScrapedUrls([]);
    setUrlInput("");
    setNextUrlIntent("own");
    setIntakeTab("upload");
    setAddMoreOpen(false);
    // Full clean slate — clear EVERY Step 1 field regardless of whether the
    // AI touched it. Anything canonicalCtx/prefill would re-restore is wiped
    // too, otherwise the user perceives reset as broken when values stay put.
    setCompanyName("");
    setDiff("");
    setFounderName("");
    setFounderEmail("");
    setFounderPhone("");
    setCity("");
    setRegion("");
    setCountry("United States");
    setWebsiteUrl("");
    setSubIndustry("");
    setBusinessConcept("");
    setIndustry("");
    setMarketScope("local");
    setAiFilled({});
    setProcessed(false);
    setDrafting(false);
    setFromBrief(false);
    autoSigRef.current = "";
    // Back to a clean wizard — steps 2 and 3 re-lock.
    setActiveStep(1);
    setMaxStepReached(1);
    setResetOpen(false);

    toast.success("Step 1 cleared. Your library is still saved — add a source or type your concept to start again.");
  };
  const anySelectedChips = activeMemoryChips.length > 0;

  // Flip a saved memory chip's own↔pattern intent in place.
  const flipMemoryIntent = async (row: VentureSource, next: "own" | "pattern") => {
    try {
      const updated = await updateVentureSourceIntent(row.id, next);
      setReusable((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      // Force re-synthesis on next signal — intent change means identity gating may change.
      autoSigRef.current = "";
      toast.success(next === "pattern" ? "Marked as pattern only" : "Marked as your own");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update");
    }
  };


  const create = useMutation({
    mutationFn: () =>
      createSnapshot({
        data: {
          company_name: companyName || undefined,
          website_url: websiteUrl || undefined,
          business_concept: businessConcept,
          differentiation_statement: diff || undefined,
          founder_name: founderName || undefined,
          founder_email: founderEmail || undefined,
          founder_phone: founderPhone || undefined,
          city: city || undefined,
          region: region || undefined,
          country: country || undefined,
          market_scope: marketScope,
          industry: industry || undefined,
          sub_industry: subIndustry || undefined,
          track: track || undefined,
          source_materials:
            combinedDocs.length || readyUrls.length || businessConcept.trim()
              ? {
                  documents: combinedDocs.map((d) => ({ filename: d.filename, text: d.text })),
                  urls: readyUrls.map((u) => ({ url: u.url, title: u.title ?? null, text: u.text ?? "" })),
                  conceptDraft: businessConcept.trim(),
                }
              : undefined,
        },
      }),
    onSuccess: async ({ id }) => {
      const docIds = combinedDocs.map((d) => d.id).filter((x): x is string => !!x);
      if (docIds.length) {
        try {
          await attachSourcesToSnapshot({ documentIds: docIds, snapshotId: id });
        } catch (e) {
          console.warn("Could not attach uploaded files to venture:", e);
        }
      }
      toast.success("Venture created — enriching now");
      nav(`/dashboard/hub/${id}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create venture"),
  });

  // ── Per-step validation ───────────────────────────────────────────────
  // Step 2 owns the founder/market/concept fields; step 3 owns the track.
  const missingStep2: { key: string; label: string }[] = [];
  if (businessConcept.trim().length < 20) missingStep2.push({ key: "businessConcept", label: "Business concept" });
  if (!companyName.trim()) missingStep2.push({ key: "companyName", label: "Company name" });
  if (!founderName.trim()) missingStep2.push({ key: "founderName", label: "Founder name" });
  if (!founderEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(founderEmail.trim()))
    missingStep2.push({ key: "founderEmail", label: "Founder email" });
  if (!city.trim()) missingStep2.push({ key: "city", label: "City" });
  if (!region.trim()) missingStep2.push({ key: "region", label: "State / region" });
  if (!country.trim()) missingStep2.push({ key: "country", label: "Country" });
  if (!industry.trim()) missingStep2.push({ key: "industry", label: "Industry" });

  // Step 1 passes on real AI signal: a readable source or a typed concept —
  // and never while synthesis is still running (AI-first, not form-first).
  const readySourceCount = combinedDocs.length + readyUrls.length;
  const step1Valid = !drafting && (readySourceCount > 0 || businessConcept.trim().length >= 20);
  const step2Valid = missingStep2.length === 0;
  const step3Valid = !!track;
  const stepValid = [step1Valid, step2Valid, step3Valid];

  // Locked until reached; complete when passed and not currently open.
  const stepState = (n: number): StepState => {
    if (n === activeStep) return "active";
    if (n > maxStepReached) return "locked";
    return stepValid[n - 1] ? "complete" : "incomplete";
  };


  const missing = [...missingStep2, ...(track ? [] : [{ key: "track", label: "Track" }])];
  const canSubmit = step1Valid && step2Valid && step3Valid && !create.isPending;
  // First step that still blocks creation (1-indexed), or null when all pass.
  const blockingStep = !step1Valid ? 1 : !step2Valid ? 2 : !step3Valid ? 3 : null;

  const step1Blocker = drafting
    ? "Reading your sources…"
    : "Add a source or describe the startup (20+ characters)";

  // Move to a step, unlocking it as the furthest reached, and scroll it in.
  const goToStep = useCallback((n: number) => {
    setActiveStep(n);
    setMaxStepReached((prev) => Math.max(prev, n));
    setTimeout(() => {
      stepRefs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const goNext = useCallback(() => {
    if (activeStep >= 3) return;
    if (!stepValid[activeStep - 1]) return;
    goToStep(activeStep + 1);
  }, [activeStep, goToStep, stepValid[0], stepValid[1], stepValid[2]]);

  const goBack = useCallback(() => {
    if (activeStep <= 1) return;
    goToStep(activeStep - 1);
  }, [activeStep, goToStep]);

  const jumpTo = (key: string) => {
    const step = key === "track" ? 3 : 2;
    setActiveStep(step);
    setMaxStepReached((prev) => Math.max(prev, step));
    setReviewOpen(true);
    setReviewTouched(true);
    setTimeout(() => {
      const el = fieldRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement).focus?.();
      } else {
        stepRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };



  const registerRef = (key: string) => (el: HTMLElement | null) => {
    fieldRefs.current[key] = el;
  };

  const AiPill = ({ keyName }: { keyName: string }) =>
    aiFilled[keyName] ? (
      <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
        AI-filled
      </span>
    ) : null;

  const summaryLine = useMemo(() => {
    const parts: string[] = [];
    if (founderName.trim()) parts.push(founderName.trim());
    const loc = [city.trim(), region.trim()].filter(Boolean).join(", ");
    if (loc) parts.push(loc);
    if (companyName.trim()) parts.push(companyName.trim());
    if (industry) parts.push(findSicByCode(parseSicCode(industry) ?? "")?.title || industry);
    if (marketScope) parts.push(marketScope[0].toUpperCase() + marketScope.slice(1));
    return parts.join(" · ");
  }, [founderName, city, region, companyName, industry, marketScope]);

  const intakeStatus = drafting
    ? "Reading your sources…"
    : processed
      ? `Filled ${Object.keys(aiFilled).length} field${Object.keys(aiFilled).length === 1 ? "" : "s"} from your sources`
      : "Drop an asset, paste a link, speak, or type — we'll fill the rest";

  return (
    <div className="space-y-6 pb-32">
      <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to ventures
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Create a venture
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {fromBrief ? "Your Startup Snapshot — ready to confirm" : "Tell us about the venture"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fromBrief
            ? "We pre-filled this from your founder brief. Skim, fix anything off, then create."
            : "Give us anything — a deck, a link, a voice note. We'll fill the form, you confirm, we generate."}
        </p>
        <div className="mt-4">
          <StepStrip
            activeStep={activeStep}
            onSelect={goToStep}
            steps={[
              { n: 1, label: "Source", state: stepState(1) },
              { n: 2, label: "Confirm", state: stepState(2) },
              { n: 3, label: "Track", state: stepState(3) },
            ]}
          />
        </div>
      </div>

      {/* ───────────────────────── STEP 1 — AI INTAKE ───────────────────────── */}
      <StepShell
        n={1}
        state={stepState(1)}
        innerRef={(el) => {
          stepRefs.current[1] = el;
        }}
        onOpen={() => goToStep(1)}
        title={memoryEmpty ? "Give us something to work with" : "Your source memory"}
        description={
          memoryEmpty
            ? intakeStatus
            : "This is your founder-level memory — bio, brief captures and anything not yet tied to a venture. We'll carry it into this startup snapshot. Other ventures keep their own brain."
        }
        summary={
          readySourceCount > 0
            ? `${readySourceCount} source${readySourceCount === 1 ? "" : "s"} read${
                Object.keys(aiFilled).length ? ` · ${Object.keys(aiFilled).length} fields filled` : ""
              }`
            : "Concept described by hand"
        }
        headerRight={
          <div className="flex items-center gap-2">
            {drafting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setResetOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Clear every source and every AI-filled field"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset step 1
            </Button>
          </div>
        }
        footer={
          <StepNav
            canGoNext={step1Valid}
            blockedReason={step1Blocker}
            onNext={goNext}
            nextLabel="Continue to details"
          />
        }
      >
        <>


        {/* Memory chips — what we already have in collective memory */}
        {!memoryEmpty && (
          <div className="space-y-3">
            {anySelectedChips && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setReuseSelected({})}
                  className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Deselect all
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">

              {activeMemoryChips.map(({ row, name, isUrlCapture, isAudio, isImage, origin, intent }) => {
                const ready = !!(row.extracted_text ?? "").trim();
                const Icon = isUrlCapture ? Globe : isAudio ? Mic : isImage ? FileText : FileText;
                const isPattern = intent === "pattern";
                const dot = !ready
                  ? "bg-status-danger"
                  : "bg-status-success";
                const originLabel =
                  origin === "brief" ? "Brief" : origin === "founder" ? "Founder" : origin === "venture" ? "Venture" : "Library";
                return (
                  <div
                    key={row.id}
                    title={
                      (isPattern ? "Pattern reference · " : "") +
                      (ready
                        ? `${Math.round((row.extracted_text ?? "").length / 1000)}k chars · from ${originLabel}`
                        : row.extraction_error
                          ? `Couldn't read · from ${originLabel}`
                          : `Processing… · from ${originLabel}`)
                    }
                    className="group inline-flex max-w-[280px] items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs transition"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                    {isUrlCapture ? (
                      <button
                        type="button"
                        onClick={() => flipMemoryIntent(row, isPattern ? "own" : "pattern")}
                        title={isPattern ? "Click to use as your own site instead" : "Click to use as a pattern reference only"}
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition ${
                          isPattern
                            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                            : "border-white/20 bg-background/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isPattern ? "Pattern" : "Mine"}
                      </button>
                    ) : null}


                    <button
                      type="button"
                      onClick={() => setReuseSelected((prev) => ({ ...prev, [row.id]: false }))}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Don't use for this venture"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {hasPatternRefs && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-foreground/90">
                <span className="font-semibold text-primary">Pattern references active.</span>{" "}
                We'll use those sites for shape and positioning only — not for your startup's
                name, address, or contact info. Fill those in below.
              </div>
            )}

            {/* Explicit, opt-in reuse of another venture's material. Copies —
                never moves — so the other venture keeps its Second Brain. */}
            {otherVentures.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                <button
                  type="button"
                  onClick={() => setOtherVenturesOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="text-sm">
                    <span className="font-medium">Reuse a file from another venture?</span>{" "}
                    <span className="text-muted-foreground">
                      Each venture keeps its own brain — picking one copies it here.
                    </span>
                  </span>
                  {otherVenturesOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {otherVenturesOpen && (
                  <div className="mt-3 space-y-3">
                    {otherVentures.map((group) => (
                      <div key={group.snapshotId}>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.ventureName}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {group.sources.map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              disabled={copyingId === row.id}
                              onClick={() => copyFromVenture(row)}
                              className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-white/15 bg-background/60 px-3 py-1.5 text-xs transition hover:border-primary/40 hover:bg-primary/10 disabled:opacity-60"
                            >
                              {copyingId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="min-w-0 flex-1 truncate">{row.original_name ?? "source"}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}





            {/* Anything else? */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
              <div className="text-sm">
                <span className="font-medium">Anything else you want to add to memory?</span>{" "}
                <span className="text-muted-foreground">
                  We use what's above as your single source of truth.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={addMoreOpen ? "outline" : "ghost"}
                  onClick={() => {
                    resetStepOneRef.current = false;
                    setAddMoreOpen((v) => !v);
                  }}
                >
                  {addMoreOpen ? "Hide" : "Yes, add more"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {memoryEmpty && inactiveMemoryChips.length > 0 && !addMoreOpen && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
            <div className="text-sm">
              <span className="font-medium">Want to reuse something saved?</span>{" "}
              <span className="text-muted-foreground">Your library is still saved, but nothing is active for this startup.</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                resetStepOneRef.current = false;
                setAddMoreOpen(true);
              }}
            >
              Yes, add more
            </Button>
          </div>
        )}

        {showCollectionUI && inactiveMemoryChips.length > 0 && addMoreOpen && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Saved library sources</div>
              <button
                type="button"
                onClick={() => setAddMoreOpen(false)}
                className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Done
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {inactiveMemoryChips.map(({ row, name, isUrlCapture, isAudio, isImage, origin, intent }) => {
                const ready = !!(row.extracted_text ?? "").trim();
                const Icon = isUrlCapture ? Globe : isAudio ? Mic : isImage ? FileText : FileText;
                const isPattern = intent === "pattern";
                const originLabel =
                  origin === "brief" ? "Brief" : origin === "founder" ? "Founder" : origin === "venture" ? "Venture" : "Library";
                return (
                  <div
                    key={row.id}
                    title={
                      ready
                        ? `${Math.round((row.extracted_text ?? "").length / 1000)}k chars · from ${originLabel}`
                        : row.extraction_error
                          ? `Couldn't read · from ${originLabel}`
                          : `Processing… · from ${originLabel}`
                    }
                    className="group inline-flex max-w-[280px] items-center gap-2 rounded-full border border-white/10 bg-background/40 px-3 py-1.5 text-xs opacity-80 transition hover:opacity-100"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ready ? "bg-muted-foreground/40" : "bg-status-danger"}`} />
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                    {isUrlCapture ? (
                      <button
                        type="button"
                        onClick={() => flipMemoryIntent(row, isPattern ? "own" : "pattern")}
                        title={isPattern ? "Click to use as your own site instead" : "Click to use as a pattern reference only"}
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition ${
                          isPattern
                            ? "border-primary/30 bg-primary/5 text-primary/80 hover:bg-primary/10"
                            : "border-white/20 bg-background/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isPattern ? "Pattern" : "Mine"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        resetStepOneRef.current = false;
                        setReuseSelected((prev) => ({ ...prev, [row.id]: true }));
                      }}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Add to this venture"
                      title="Add to this venture"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs (collection UI) — shown only when memory is empty or founder opted to add more */}
        {showCollectionUI && (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-background/40 p-1 sm:grid-cols-4">
            {([
              { k: "upload", label: "Upload", icon: Upload },
              { k: "link", label: "Paste a link", icon: Link2 },
              { k: "speak", label: "Speak", icon: Mic },
              { k: "type", label: "Type", icon: TypeIcon },
            ] as { k: IntakeTab; label: string; icon: any }[]).map((t) => {
              const Icon = t.icon;
              const active = intakeTab === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setIntakeTab(t.k)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}


        {/* Upload tab */}
        {showCollectionUI && intakeTab === "upload" && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(Array.from(e.dataTransfer.files ?? []));
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragOver ? "border-primary bg-primary/5" : "border-white/15 hover:border-white/30"
              }`}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Drop your pitch deck, plan, one-pager, or notes</span>
                <span className="text-muted-foreground"> — we'll fill the whole form</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                PDF · DOCX · TXT · MD · PNG / JPG · up to {MAX_FILES} files, 20 MB each
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Your uploads stay private to your workspace.
            </p>

            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span
                      className={`shrink-0 text-[11px] uppercase tracking-wider ${
                        f.status === "ready"
                          ? "text-status-success"
                          : f.status === "error"
                            ? "text-status-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {f.status === "uploading" ? "Uploading…" : f.status === "ready" ? "Saved" : (f.error ?? "Couldn't read")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Library accordion removed — memory chips above are the single source of truth. */}

          </div>
        )}

        {/* Link tab */}
        {showCollectionUI && intakeTab === "link" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a URL — your own site, or a startup you want to learn from. Up to {MAX_URLS}.
            </p>

            {/* Intent toggle — always visible, prominent, decides how the AI treats the next URL. */}
            <div className="rounded-xl border-2 border-primary/20 bg-background/40 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                How should we use this link?
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  {
                    k: "own" as UrlIntent,
                    icon: Globe,
                    label: "My own site",
                    hint: "Pull name, contact, location, and content.",
                  },
                  {
                    k: "pattern" as UrlIntent,
                    icon: Compass,
                    label: "Pattern only",
                    hint: "Learn the shape. Won't copy their name or address.",
                  },
                ]).map((opt) => {
                  const active = nextUrlIntent === opt.k;
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.k}
                      type="button"
                      onClick={() => setNextUrlIntent(opt.k)}
                      aria-pressed={active}
                      className={`rounded-lg border-2 px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-white/10 bg-background/40 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            active ? "border-primary bg-primary" : "border-muted-foreground/40"
                          }`}
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                        </span>
                        <OptIcon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        {opt.label}
                      </div>
                      <div className="mt-1 pl-6 text-[11px] leading-snug text-muted-foreground">{opt.hint}</div>
                    </button>
                  );
                })}
              </div>
              {nextUrlIntent === "pattern" && (
                <p className="mt-2 rounded-md bg-primary/5 px-2 py-1.5 text-[11px] text-foreground/80">
                  You'll enter your own startup name, location, and contact below — we won't take them from the pattern site.
                </p>
              )}
            </div>


            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
                placeholder={nextUrlIntent === "pattern" ? "https://startup-you-admire.com" : "https://example.com"}
                disabled={scrapingUrl || scrapedUrls.length >= MAX_URLS}
              />
              <Button
                type="button"
                onClick={addUrl}
                disabled={scrapingUrl || !urlInput.trim() || scrapedUrls.length >= MAX_URLS}
                className="shrink-0"
              >
                {scrapingUrl ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Globe className="mr-1.5 h-4 w-4" />}
                Fetch
              </Button>
            </div>
            {scrapedUrls.length > 0 && (
              <ul className="space-y-1.5">
                {scrapedUrls.map((u) => (
                  <li key={u.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm">
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{u.title || u.url}</span>
                      {u.title && <span className="ml-1 text-xs text-muted-foreground">· {u.url}</span>}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        u.intent === "pattern"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-white/20 bg-background/60 text-muted-foreground"
                      }`}
                    >
                      {u.intent === "pattern" ? "Pattern" : "Mine"}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] uppercase tracking-wider ${
                        u.status === "ready"
                          ? "text-status-success"
                          : u.status === "error"
                            ? "text-status-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {u.status === "scraping" ? "Scraping…" : u.status === "ready" ? `${u.charCount ?? 0} chars` : (u.error ?? "Failed")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeUrl(u.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Remove URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}


        {/* Speak tab */}
        {showCollectionUI && intakeTab === "speak" && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Tap and tell us what you're building — 30 seconds is plenty. We'll transcribe it into your concept.
            </p>
            <div className="flex justify-center">
              <VoiceRecorder
                size="lg"
                context="Founder describing their business concept — what they're building, who it's for, and why it matters."
                onTranscript={(text) => {
                    resetStepOneRef.current = false;
                  setBusinessConcept((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
                  markFilled("businessConcept");
                }}
              />
            </div>
            {businessConcept.trim() && (
              <div className="rounded-lg bg-card p-3 text-left text-sm">
                <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Captured</div>
                {businessConcept}
              </div>
            )}
          </div>
        )}

        {/* Type tab */}
        {showCollectionUI && intakeTab === "type" && (
          <div className="space-y-2">
            <Label htmlFor="concept-type">Describe what you're building</Label>
            <Textarea
              id="concept-type"
              ref={registerRef("businessConcept") as any}
              value={businessConcept}
              onChange={(e) => {
                resetStepOneRef.current = false;
                setBusinessConcept(e.target.value);
              }}
              placeholder="What you're building, who it's for, why it matters."
              rows={6}
            />
            <div className="flex items-center justify-between">
              <p
                className={`text-xs ${
                  businessConcept.trim().length >= 20 ? "text-status-success" : "text-muted-foreground"
                }`}
              >
                {businessConcept.trim().length} / 20 minimum
                {businessConcept.trim().length >= 20 ? " ✓" : ""}
              </p>
              {businessConcept.trim().length >= 20 && !drafting && (
                <Button type="button" size="sm" variant="ghost" onClick={() => draftFromFiles()}>
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  Fill the form from this
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Re-process row */}
        {(combinedDocs.length > 0 || readyUrls.length > 0) && processed && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="text-muted-foreground">Added more sources? Re-run the fill.</div>
            <Button type="button" size="sm" variant="outline" onClick={() => draftFromFiles()} disabled={drafting}>
              {drafting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
              Re-process
            </Button>
          </div>
        )}

        {/* Dev-only test fill */}
        {import.meta.env.DEV && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {track && TRACK_SEEDS[track]?.length > 0 && (
              <select
                value={seedUrlChoice}
                onChange={(e) => setSeedUrlChoice(e.target.value)}
                disabled={filling}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground"
                aria-label="Dev seed picker"
              >
                <option value="">Random seed</option>
                {TRACK_SEEDS[track].map((s) => (
                  <option key={s.url} value={s.url}>
                    {s.url.replace(/^https?:\/\/(www\.)?/, "")}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
              disabled={filling}
              onClick={async () => {
                if (!track) {
                  toast.error("Pick a Track first — it shapes the test concept.");
                  return;
                }
                setFilling(true);
                // Build attempt order: chosen seed first (if any), then the rest shuffled.
                const allSeeds = TRACK_SEEDS[track];
                const chosen = seedUrlChoice
                  ? allSeeds.find((s) => s.url === seedUrlChoice)
                  : pickSeedForTrack(track);
                const rest = allSeeds.filter((s) => s.url !== chosen?.url);
                for (let i = rest.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [rest[i], rest[j]] = [rest[j], rest[i]];
                }
                const attempts: SeedEntry[] = [chosen!, ...rest].filter(Boolean);
                let lastErr: string | null = null;
                let seedUsed: SeedEntry | null = null;
                let data: any = null;
                try {
                  for (const seed of attempts) {
                    const res = await invokeEdge("dev-reverse-engineer-concept", {
                      body: { url: seed.url, track },
                    });
                    if (!res.error && res.data?.company && res.data?.concept) {
                      seedUsed = seed;
                      data = res.data;
                      break;
                    }
                    lastErr = res.error
                      ? `${seed.url.replace(/^https?:\/\//, "")}: ${res.error.message ?? "failed"}`
                      : `${seed.url.replace(/^https?:\/\//, "")}: empty response`;
                  }
                  if (!data || !seedUsed) {
                    throw new Error(lastErr ?? "All seeds failed");
                  }
                  setCompanyName(data.company);
                  if (path !== "manual") setWebsiteUrl(data.url);
                  setBusinessConcept(data.concept);
                  if (path === "competitor" && data.diff) setDiff(data.diff);
                  const { data: userData } = await supabase.auth.getUser();
                  const u = userData.user;
                  const meta: any = u?.user_metadata ?? {};
                  const ts = Date.now();
                  if (!founderName.trim())
                    setFounderName(meta.display_name || meta.name || meta.full_name || "Test Founder");
                  if (!founderEmail.trim()) setFounderEmail(u?.email || `test+${ts}@example.com`);
                  if (!founderPhone.trim()) setFounderPhone("+1 555 010 0123");
                  if (!city.trim() && seedUsed.city) setCity(seedUsed.city);
                  if (!region.trim() && seedUsed.region) setRegion(seedUsed.region);
                  if (!country.trim() && seedUsed.country) setCountry(seedUsed.country);
                  setMarketScope(seedUsed.market_scope);
                  if (!industry.trim()) setIndustry(seedUsed.industry);
                  if (!subIndustry.trim() && seedUsed.sub_industry) setSubIndustry(seedUsed.sub_industry);
                  toast.success(
                    `Filled ${TRACK_BY_KEY[track].label} test — ${data.company} (${seedUsed.url.replace(/^https?:\/\/(www\.)?/, "")})`,
                  );
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't fill test concept");
                } finally {
                  setFilling(false);
                }
              }}
            >
              {filling ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {filling ? "Scraping…" : "🧪 Fill test concept (dev)"}
            </Button>
          </div>
        )}
        </>
      </StepShell>

      {/* ─────────────────── STEP 2 — CONFIRM ─────────────────── */}
      <StepShell
        n={2}
        state={stepState(2)}
        innerRef={(el) => {
          stepRefs.current[2] = el;
        }}
        onOpen={() => goToStep(2)}
        title="Confirm what we found"
        description="Skim what the AI pulled from your sources and fix anything that's off."
        lockedHint="Add a source or describe the startup in step 1 to unlock."
        summary={summaryLine || "Founder + market details"}
        headerRight={
          missingStep2.length === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-status-success" />
          ) : (
            <span className="rounded-full bg-status-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-danger">
              {missingStep2.length} to fix
            </span>
          )
        }
        footer={
          <StepNav
            canGoNext={step2Valid}
            blockedReason={
              missingStep2.length
                ? `Still needed: ${missingStep2.map((m) => m.label).join(", ")}`
                : undefined
            }
            onBack={goBack}
            onNext={goNext}
            nextLabel="Continue to track"
          />
        }
      >
        {true && (

          <div className="space-y-5 pt-2">
            {/* Founder + market */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Founder & market</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="fname">
                    Your name <span className="text-status-danger">*</span>
                    <AiPill keyName="founderName" />
                  </Label>
                  <Input
                    id="fname"
                    ref={registerRef("founderName") as any}
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="femail">
                    Contact email <span className="text-status-danger">*</span>
                    <AiPill keyName="founderEmail" />
                  </Label>
                  <Input
                    id="femail"
                    ref={registerRef("founderEmail") as any}
                    type="email"
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="fphone">
                    Phone <span className="text-muted-foreground text-[10px]">(optional)</span>
                  </Label>
                  <Input id="fphone" type="tel" value={founderPhone} onChange={(e) => setFounderPhone(e.target.value)} placeholder="+1 555 123 4567" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="country">
                    Country <span className="text-status-danger">*</span>
                    <AiPill keyName="country" />
                  </Label>
                  <Input
                    id="country"
                    ref={registerRef("country") as any}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="city">
                    City / town <span className="text-status-danger">*</span>
                    <AiPill keyName="city" />
                  </Label>
                  <Input
                    id="city"
                    ref={registerRef("city") as any}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Atlanta"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="region">
                    State / region <span className="text-status-danger">*</span>
                    <AiPill keyName="region" />
                  </Label>
                  <Input
                    id="region"
                    ref={registerRef("region") as any}
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Georgia"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>
                    Market scope <span className="text-status-danger">*</span>
                    <AiPill keyName="marketScope" />
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {(["local", "regional", "national", "international"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMarketScope(s)}
                        className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition ${
                          marketScope === s ? "border-foreground bg-foreground text-background" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {marketScope === "local" && "Operates in one city/metro — we'll prioritize local competitors."}
                    {marketScope === "regional" && "Serves a state or multi-state region."}
                    {marketScope === "national" && "Serves customers across one country."}
                    {marketScope === "international" && "Serves customers in multiple countries."}
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label>
                    Industry <span className="text-status-danger">*</span>
                    <AiPill keyName="industry" />
                  </Label>
                  <div ref={registerRef("industry") as any}>
                    <IndustryCombobox value={industry} onChange={setIndustry} context={[companyName, businessConcept].filter(Boolean).join(" — ").slice(0, 600)} />
                  </div>
                  <Input
                    className="mt-1"
                    value={subIndustry}
                    onChange={(e) => setSubIndustry(e.target.value)}
                    placeholder="Niche or sub-industry (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Company + differentiation */}
            <div className="space-y-3 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Company</h3>
              <div className="grid gap-2">
                <Label htmlFor="company">
                  Company name <span className="text-status-danger">*</span>
                  <AiPill keyName="companyName" />
                </Label>
                <Input
                  id="company"
                  ref={registerRef("companyName") as any}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Northbound Roasters"
                />
              </div>

              {websiteUrl && (
                <div className="grid gap-2">
                  <Label htmlFor="url">
                    Website
                    <AiPill keyName="websiteUrl" />
                  </Label>
                  <Input id="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="concept">
                    Business concept <span className="text-status-danger">*</span>
                    <AiPill keyName="businessConcept" />
                  </Label>
                  <VoiceRecorder
                    size="sm"
                    context="Founder describing their business concept — what they're building, who it's for, and why it matters."
                    onTranscript={(text) =>
                      setBusinessConcept((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                    }
                  />
                </div>
                <Textarea
                  id="concept"
                  ref={registerRef("businessConcept") as any}
                  value={businessConcept}
                  onChange={(e) => setBusinessConcept(e.target.value)}
                  placeholder="Describe what you're building, who it's for, and why it matters."
                  rows={5}
                />
                <p
                  className={`text-xs ${
                    businessConcept.trim().length >= 20 ? "text-status-success" : "text-muted-foreground"
                  }`}
                >
                  {businessConcept.trim().length} / 20 minimum
                  {businessConcept.trim().length >= 20 ? " ✓" : ""}
                </p>
              </div>

              {(path === "competitor" || diff) && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="diff">
                      How you'll differentiate
                      <AiPill keyName="diff" />
                    </Label>
                    <VoiceRecorder
                      size="sm"
                      context="Founder explaining how their venture will differentiate from a competitor."
                      onTranscript={(text) => setDiff((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))}
                    />
                  </div>
                  <Textarea id="diff" value={diff} onChange={(e) => setDiff(e.target.value)} rows={3} placeholder="What you'll do differently." />
                </div>
              )}
            </div>
          </div>
        )}
      </StepShell>

      {/* ───────────────────── STEP 3 — TRACK + CREATE ────────────────────── */}
      <StepShell
        n={3}
        state={stepState(3)}
        innerRef={(el) => {
          stepRefs.current[3] = el;
        }}
        onOpen={() => goToStep(3)}
        title="Pick your track"
        description="We tune the voice of every document to match. You can change this later."
        lockedHint="Confirm your founder + market details in step 2 to unlock."
        summary={track ? TRACK_BY_KEY[track]?.label ?? "Track selected" : "No track picked yet"}
        headerRight={
          <button
            type="button"
            onClick={() => setShowTrackHelp((v) => !v)}
            className="shrink-0 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {showTrackHelp ? "Hide" : "What's this?"}
          </button>
        }
        footer={
          <StepNav
            canGoNext={canSubmit}
            blockedReason={!track ? "Pick a track to continue" : undefined}
            onBack={goBack}
            nextSlot={
              <Button size="sm" disabled={!canSubmit} onClick={() => create.mutate()}>
                {create.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Create &amp; start enrichment
                  </>
                )}
              </Button>
            }
          />
        }
      >

        {showTrackHelp && (
          <p className="rounded-md bg-white/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Built primarily for <strong>Main Street founders</strong> — first-time owners opening a café, salon, trade, local service, indie product, or small e-commerce brand. Pick a different track only if you're building something materially different (venture-track SaaS, marketplace, deep tech).
          </p>
        )}
        <div ref={registerRef("track") as any} className="grid gap-2 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const selected = track === t.key;
            const isDefault = t.key === "lifestyle";
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTrack(t.key)}
                className={`group relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
                }`}
              >
                {isDefault && (
                  <span className="absolute right-2 top-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary">
                    Most attendees
                  </span>
                )}
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[11px] leading-snug text-muted-foreground">{t.oneLiner}</div>
              </button>
            );
          })}
        </div>
      </StepShell>

      {/* Sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {blockingStep ? (
            <button
              type="button"
              onClick={() => goToStep(blockingStep)}
              className="flex items-center gap-2 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="rounded-full border border-status-danger/40 bg-status-danger/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-status-danger">
                Step {blockingStep}
              </span>
              {blockingStep === 1
                ? step1Blocker
                : blockingStep === 2
                  ? `Still needed: ${missingStep2.map((m) => m.label).join(", ")}`
                  : "Pick a track"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-status-success">
              <CheckCircle2 className="h-4 w-4" /> Ready to create
            </div>
          )}
          <Button size="lg" disabled={!canSubmit} onClick={() => create.mutate()} className="shrink-0">
            {create.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Create & start enrichment
              </>
            )}
          </Button>

        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset step 1?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every source used for this venture, the auto-drafted concept, and every AI-filled
              field. Files in your library are not deleted — they're just removed from this startup intake until
              you add them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep everything</AlertDialogCancel>
            <AlertDialogAction onClick={resetStepOne}>Yes, reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
}
