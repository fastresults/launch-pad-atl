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
import { INDUSTRIES } from "@/lib/industries";
import { createSnapshot } from "@/lib/foundersHub.functions";
import {
  uploadVentureSource,
  attachSourcesToSnapshot,
  listVentureSources,
  deleteVentureSource,
  type VentureSource,
} from "@/lib/venture-sources";
import { supabase } from "@/integrations/supabase/client";
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
  Link2,
  Globe,
  Library,
  ChevronDown,
  ChevronUp,
  Mic,
  Type as TypeIcon,
} from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { toast } from "sonner";
import { useCanonicalContext } from "@/hooks/use-canonical-context";

type DroppedFile = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "ready" | "error";
  documentId?: string;
  text?: string;
  error?: string;
};

type ScrapedUrl = {
  id: string;
  url: string;
  status: "scraping" | "ready" | "error";
  title?: string | null;
  text?: string;
  charCount?: number;
  error?: string;
};

type IntakeTab = "upload" | "link" | "speak" | "type";

const MAX_URLS = 3;
const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT =
  ".pdf,.txt,.md,.markdown,.docx,.rtf,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,image/*";

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
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Synth state
  const [drafting, setDrafting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [aiFilled, setAiFilled] = useState<Record<string, boolean>>({});
  const [filling, setFilling] = useState(false);

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Prefill from canonical context.
  const { data: canonicalCtx } = useCanonicalContext();
  useEffect(() => {
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

  // Reusable library
  const [reusable, setReusable] = useState<VentureSource[]>([]);
  const [reuseSelected, setReuseSelected] = useState<Record<string, boolean>>({});
  const [showLibrary, setShowLibrary] = useState(false);
  useEffect(() => {
    listVentureSources()
      .then((rows) => setReusable(rows))
      .catch(() => {});
  }, []);

  const groupedReusable = useMemo(() => {
    const groups: Record<string, { label: string; items: VentureSource[] }> = {
      brief: { label: "From your Startup Brief", items: [] },
      founder: { label: "From your founder profile", items: [] },
      other: { label: "From previous ventures", items: [] },
      unassigned: { label: "Recently uploaded", items: [] },
    };
    for (const r of reusable) {
      if (r.used_in_brief || r.kind === "brief_source") groups.brief.items.push(r);
      else if (r.kind === "founder_bio") groups.founder.items.push(r);
      else if (r.snapshot_id) groups.other.items.push(r);
      else groups.unassigned.items.push(r);
    }
    return Object.entries(groups).filter(([, g]) => g.items.length > 0);
  }, [reusable]);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      if (!incoming.length) return;
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
          setFiles((curr) =>
            curr.map((x) =>
              x.id === entry.id
                ? row.extraction_error || !text
                  ? { ...x, status: "error", documentId: row.id, error: row.extraction_error ?? "Couldn't read file" }
                  : { ...x, status: "ready", documentId: row.id, text }
                : x,
            ),
          );
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
    [files.length],
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
  const reusedFiles = reusable.filter((r) => reusedIds.includes(r.id));
  const readyFiles = files.filter((f) => f.status === "ready" && (f.text ?? "").trim());
  const readyUrls = scrapedUrls.filter((u) => u.status === "ready" && (u.text ?? "").trim());
  const combinedDocs = [
    ...reusedFiles.map((r) => ({ filename: r.original_name, text: r.extracted_text ?? "", id: r.id })),
    ...readyFiles.map((f) => ({ filename: f.name, text: f.text ?? "", id: f.documentId })),
  ];

  const addUrl = async () => {
    const raw = urlInput.trim();
    if (!raw) return;
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
    const entry: ScrapedUrl = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: normalized,
      status: "scraping",
    };
    setScrapedUrls((prev) => [...prev, entry]);
    setUrlInput("");
    setScrapingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("venture-scrape-url", {
        body: { urls: [normalized] },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (!r) throw new Error("No result");
      setScrapedUrls((curr) =>
        curr.map((x) =>
          x.id === entry.id
            ? {
                ...x,
                status: r.error ? "error" : "ready",
                title: r.title ?? null,
                text: r.text ?? "",
                charCount: r.charCount ?? 0,
                error: r.error,
              }
            : x,
        ),
      );
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
      const hasUrls = readyUrls.length > 0;
      const hasDraft = businessConcept.trim().length >= 20;
      if (!hasFiles && !hasUrls && !hasDraft) return;
      if (drafting) return;
      setDrafting(true);
      try {
        const { data, error } = await supabase.functions.invoke("venture-synthesize-concept", {
          body: {
            sources: combinedDocs.map((d) => ({ filename: d.filename, text: d.text })),
            urls: readyUrls.map((u) => ({ url: u.url, title: u.title ?? null, text: u.text })),
            conceptDraft: hasDraft ? businessConcept.trim() : "",
            industryValues: INDUSTRIES.map((i) => i.value),
          },
        });
        if (error) throw error;
        const concept = (data?.concept ?? "").trim();
        if (!concept) throw new Error("Empty draft from the model");

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
        setIf(data?.company_name, setCompanyName, "companyName", "company name");
        setIf(data?.differentiation_statement, setDiff, "diff", "differentiation");
        setIf(data?.founder_name, setFounderName, "founderName", "founder name");
        setIf(data?.founder_email, setFounderEmail, "founderEmail", "founder email");
        setIf(data?.founder_phone, setFounderPhone, "founderPhone", "founder phone");
        setIf(data?.city, setCity, "city", "city");
        setIf(data?.region, setRegion, "region", "state / region");
        setIf(data?.sub_industry, setSubIndustry, "subIndustry", "sub-industry");
        if (typeof data?.website_url === "string" && data.website_url.trim()) {
          setWebsiteUrl(data.website_url.trim());
          markFilled("websiteUrl");
          // Silently flip to "own" so enrichment re-scrapes the founder's site.
          setPath("own");
          filled.push("website");
        }
        if (typeof data?.country === "string" && data.country.trim()) {
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
        if (typeof data?.industry === "string" && data.industry && INDUSTRIES.some((i) => i.value === data.industry)) {
          setIndustry(data.industry);
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
        if (!opts?.auto) toast.error(e instanceof Error ? e.message : "Couldn't process the document");
      } finally {
        setDrafting(false);
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

  // Missing-field map (key -> human label)
  const missing: { key: string; label: string }[] = [];
  if (businessConcept.trim().length < 20) missing.push({ key: "businessConcept", label: "Business concept" });
  if (!companyName.trim()) missing.push({ key: "companyName", label: "Company name" });
  if (!founderName.trim()) missing.push({ key: "founderName", label: "Founder name" });
  if (!founderEmail.trim()) missing.push({ key: "founderEmail", label: "Founder email" });
  if (!city.trim()) missing.push({ key: "city", label: "City" });
  if (!region.trim()) missing.push({ key: "region", label: "State / region" });
  if (!country.trim()) missing.push({ key: "country", label: "Country" });
  if (!industry.trim()) missing.push({ key: "industry", label: "Industry" });
  if (!track) missing.push({ key: "track", label: "Track" });
  const canSubmit = missing.length === 0 && !create.isPending;

  // Auto-expand review when there are missing fields (after first sync).
  useEffect(() => {
    if (reviewTouched) return;
    if (missing.length > 0) setReviewOpen(true);
    else setReviewOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing.length]);

  const jumpTo = (key: string) => {
    setReviewOpen(true);
    setReviewTouched(true);
    setTimeout(() => {
      const el = fieldRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement).focus?.();
      }
    }, 50);
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
    if (industry) parts.push(INDUSTRIES.find((i) => i.value === industry)?.label || industry);
    if (marketScope) parts.push(marketScope[0].toUpperCase() + marketScope.slice(1));
    return parts.join(" · ");
  }, [founderName, city, region, companyName, industry, marketScope]);

  const intakeStatus = drafting
    ? "Reading your sources…"
    : processed
      ? `Filled ${Object.keys(aiFilled).length} field${Object.keys(aiFilled).length === 1 ? "" : "s"} from your sources`
      : "Drop a doc, paste a link, speak, or type — we'll fill the rest";

  return (
    <div className="space-y-6 pb-32">
      <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to ventures
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Create a venture · 3 quick steps
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {fromBrief ? "Your Startup Snapshot — ready to confirm" : "Tell us about the venture"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fromBrief
            ? "We pre-filled this from your founder brief. Skim, fix anything off, then create."
            : "Give us anything — a deck, a link, a voice note. We'll fill the form, you confirm, we generate."}
        </p>
      </div>

      {/* ───────────────────────── STEP 1 — AI INTAKE ───────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Step 1</div>
            <h2 className="mt-0.5 text-lg font-semibold">Give us something to work with</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{intakeStatus}</p>
          </div>
          {drafting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>

        {/* Tabs */}
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

        {/* Upload tab */}
        {intakeTab === "upload" && (
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

            {groupedReusable.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5">
                <button
                  type="button"
                  onClick={() => setShowLibrary((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Library className="h-4 w-4 text-primary" />
                    Or pick from files you've already uploaded
                  </span>
                  {showLibrary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showLibrary && (
                  <div className="space-y-3 px-3 pb-3">
                    {groupedReusable.map(([key, group]) => (
                      <div key={key}>
                        <div className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </div>
                        <ul className="mt-1 space-y-1">
                          {group.items.map((r) => {
                            const ready = !!(r.extracted_text ?? "").trim();
                            return (
                              <li
                                key={r.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background/40"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!reuseSelected[r.id]}
                                  disabled={!ready}
                                  onChange={(e) => setReuseSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                                />
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">{r.original_name}</span>
                                <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
                                  {ready
                                    ? `${Math.round((r.extracted_text ?? "").length / 1000)}k chars`
                                    : r.extraction_error
                                      ? "Unreadable"
                                      : "Processing…"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Link tab */}
        {intakeTab === "link" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a URL — your site, a competitor, or a relevant article. Up to {MAX_URLS}.
            </p>
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
                placeholder="https://example.com"
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
        {intakeTab === "speak" && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Tap and tell us what you're building — 30 seconds is plenty. We'll transcribe it into your concept.
            </p>
            <div className="flex justify-center">
              <VoiceRecorder
                size="lg"
                context="Founder describing their business concept — what they're building, who it's for, and why it matters."
                onTranscript={(text) => {
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
        {intakeTab === "type" && (
          <div className="space-y-2">
            <Label htmlFor="concept-type">Describe what you're building</Label>
            <Textarea
              id="concept-type"
              ref={registerRef("businessConcept") as any}
              value={businessConcept}
              onChange={(e) => setBusinessConcept(e.target.value)}
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
          <div className="flex justify-end">
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
                try {
                  const seed = pickSeedForTrack(track);
                  const { data, error } = await supabase.functions.invoke("dev-reverse-engineer-concept", {
                    body: { url: seed.url, track },
                  });
                  if (error) throw error;
                  if (!data?.company || !data?.concept) throw new Error("Empty response");
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
                  if (!city.trim() && seed.city) setCity(seed.city);
                  if (!region.trim() && seed.region) setRegion(seed.region);
                  if (!country.trim() && seed.country) setCountry(seed.country);
                  setMarketScope(seed.market_scope);
                  if (!industry.trim()) setIndustry(seed.industry);
                  if (!subIndustry.trim() && seed.sub_industry) setSubIndustry(seed.sub_industry);
                  toast.success(`Filled ${TRACK_BY_KEY[track].label} test — ${data.company}`);
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
      </section>

      {/* ─────────────────── STEP 2 — CONFIRM (collapsible) ─────────────────── */}
      <section className="space-y-3 rounded-2xl border border-white/10 bg-card p-6">
        <button
          type="button"
          onClick={() => {
            setReviewOpen((v) => !v);
            setReviewTouched(true);
          }}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Step 2</div>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-semibold">
              Confirm what we found
              {missing.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              ) : (
                <span className="rounded-full bg-status-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-danger">
                  {missing.length} to fix
                </span>
              )}
            </h2>
            {!reviewOpen && summaryLine && (
              <p className="mt-1 text-sm text-muted-foreground">{summaryLine}</p>
            )}
            {!reviewOpen && !summaryLine && (
              <p className="mt-1 text-sm text-muted-foreground">Tap to fill in founder + market details.</p>
            )}
          </div>
          <span className="shrink-0 text-muted-foreground">
            {reviewOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
        </button>

        {reviewOpen && (
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
                    <IndustryCombobox value={industry} onChange={setIndustry} />
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
      </section>

      {/* ───────────────────── STEP 3 — TRACK + CREATE ────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Step 3</div>
            <h2 className="mt-0.5 text-lg font-semibold">Pick your track</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We tune the voice of every document to match. You can change this later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTrackHelp((v) => !v)}
            className="shrink-0 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {showTrackHelp ? "Hide" : "What's this?"}
          </button>
        </div>
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
      </section>

      {/* Sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {missing.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Still needed:</span>
              {missing.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => jumpTo(m.key)}
                  className="rounded-full border border-status-danger/40 bg-status-danger/10 px-2 py-0.5 font-medium text-status-danger hover:bg-status-danger/20"
                >
                  {m.label}
                </button>
              ))}
            </div>
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
    </div>
  );
}
