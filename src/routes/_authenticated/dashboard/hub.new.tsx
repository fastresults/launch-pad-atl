// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IndustryCombobox } from "@/components/hub/IndustryCombobox";
import { TRACKS, TRACK_BY_KEY, pickSeedForTrack, type TrackKey } from "@/lib/tracks";
import { INDUSTRIES } from "@/lib/industries";
import { createSnapshot } from "@/lib/foundersHub.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Sparkles, Upload, FileText, X, Wand2, MapPin, CheckCircle2, Link2, Globe } from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type DroppedFile = {
  id: string;
  name: string;
  size: number;
  status: "reading" | "ready" | "error";
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

const MAX_URLS = 3;

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf";

// TODO: remove after testing — dev-only seed URLs for reverse-engineered test fills
const SEED_URLS = [
  "https://linear.app",
  "https://vercel.com",
  "https://resend.com",
  "https://cal.com",
  "https://posthog.com",
  "https://retool.com",
  "https://supabase.com",
  "https://cursor.com",
  "https://www.perplexity.ai",
  "https://granola.ai",
  "https://attio.com",
  "https://www.beehiiv.com",
  "https://mercury.com",
  "https://ramp.com",
  "https://www.notion.com",
];

// TODO: remove after testing — naive industry inference from a concept blurb
function guessIndustry(concept: string): string {
  const c = concept.toLowerCase();
  if (/\b(bank|payment|fintech|invoic|payroll|ledger|treasury|card)\b/.test(c)) return "Financial Services";
  if (/\b(developer|api|sdk|devtool|deploy|infrastructure|database|observability)\b/.test(c)) return "Developer Tools";
  if (/\b(ai|llm|model|agent|machine learning|gpt)\b/.test(c)) return "Artificial Intelligence";
  if (/\b(shop|store|ecommerce|e-commerce|retail|merchandise)\b/.test(c)) return "E-commerce & Retail";
  if (/\b(marketing|seo|crm|sales|outreach|campaign|newsletter)\b/.test(c)) return "Marketing & Sales";
  if (/\b(health|clinic|patient|medical|wellness|therapy)\b/.test(c)) return "Healthcare";
  if (/\b(school|learn|education|course|tutor|student)\b/.test(c)) return "Education";
  if (/\b(notes|productivity|workflow|collaborat|task|project management)\b/.test(c)) return "Productivity Software";
  return "Software & SaaS";
}

async function extractFileText(file: File): Promise<{ text: string; error?: string }> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isText = name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") ||
    file.type === "text/plain" || file.type === "text/markdown";

  if (isPdf) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
      if (!merged) return { text: "", error: "PDF looks scanned (no text inside). Try a text-based export." };
      return { text: merged };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Couldn't read PDF" };
    }
  }
  if (isText) {
    try {
      const text = (await file.text()).trim();
      if (!text) return { text: "", error: "File was empty" };
      return { text };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Couldn't read file" };
    }
  }
  return { text: "", error: "DOCX coming soon — export to PDF or paste the text below." };
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
  const [path, setPath] = useState<Path>("manual");
  const [companyName, setCompanyName] = useState(prefill?.company_name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessConcept, setBusinessConcept] = useState(prefill?.business_concept ?? "");
  const [diff, setDiff] = useState(prefill?.differentiation_statement ?? "");
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [filling, setFilling] = useState(false);
  // Founder + market context
  const [founderName, setFounderName] = useState(prefill?.founder_name ?? "");
  const [founderEmail, setFounderEmail] = useState(prefill?.founder_email ?? "");
  const [founderPhone, setFounderPhone] = useState(prefill?.founder_phone ?? "");
  const [city, setCity] = useState(prefill?.city ?? "");
  const [region, setRegion] = useState(prefill?.region ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "United States");
  const [marketScope, setMarketScope] = useState<"local" | "regional" | "national" | "international">(prefill?.market_scope ?? "local");
  const [industry, setIndustry] = useState(prefill?.industry ?? "");
  const [subIndustry, setSubIndustry] = useState(prefill?.sub_industry ?? "");
  const [track, setTrack] = useState<TrackKey | "">(prefill?.track ?? "lifestyle");
  const [showTrackHelp, setShowTrackHelp] = useState(false);
  const [trackPulse, setTrackPulse] = useState(false);
  const trackSectionRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prefill from authenticated user once
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const meta: any = u.user_metadata ?? {};
      if (!founderEmail && u.email) setFounderEmail(u.email);
      if (!founderName) {
        const n = meta.display_name || meta.name || meta.full_name;
        if (n) setFounderName(n);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(async (incoming: File[]) => {
    if (!incoming.length) return;
    setFiles((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) {
        toast.error(`Max ${MAX_FILES} files`);
        return prev;
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
        status: "reading",
      }));
      // Kick off extraction outside of setState
      queued.forEach((entry, i) => {
        const file = accepted[i];
        extractFileText(file).then(({ text, error }) => {
          setFiles((curr) =>
            curr.map((x) =>
              x.id === entry.id
                ? error
                  ? { ...x, status: "error", error }
                  : { ...x, status: "ready", text }
                : x,
            ),
          );
        });
      });
      return [...prev, ...queued];
    });
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const readyFiles = files.filter((f) => f.status === "ready" && (f.text ?? "").trim());

  const draftFromFiles = async () => {
    if (!readyFiles.length || drafting) return;
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("venture-synthesize-concept", {
        body: {
          sources: readyFiles.map((f) => ({ filename: f.name, text: f.text })),
          industryValues: INDUSTRIES.map((i) => i.value),
        },
      });
      if (error) throw error;
      const concept = (data?.concept ?? "").trim();
      if (!concept) throw new Error("Empty draft from the model");

      // Process = overwrite. The button is the user's explicit "fill the whole form" intent.
      setBusinessConcept(concept);
      const filled: string[] = ["business concept"];

      const setIf = (val: unknown, setter: (v: string) => void, label: string) => {
        if (typeof val === "string" && val.trim()) {
          setter(val.trim());
          filled.push(label);
        }
      };
      setIf(data?.company_name, setCompanyName, "company name");
      setIf(data?.differentiation_statement, setDiff, "differentiation");
      setIf(data?.founder_name, setFounderName, "founder name");
      setIf(data?.founder_email, setFounderEmail, "founder email");
      setIf(data?.founder_phone, setFounderPhone, "founder phone");
      setIf(data?.city, setCity, "city");
      setIf(data?.region, setRegion, "state / region");
      setIf(data?.sub_industry, setSubIndustry, "sub-industry");
      if (path === "manual" && typeof data?.website_url === "string" && data.website_url.trim()) {
        setWebsiteUrl(data.website_url.trim());
        filled.push("website");
      }
      if (typeof data?.country === "string" && data.country.trim()) {
        setCountry(data.country.trim());
        filled.push("country");
      }
      const scope = data?.market_scope;
      if (scope && ["local", "regional", "national", "international"].includes(scope)) {
        setMarketScope(scope);
        filled.push("market scope");
      }
      if (typeof data?.industry === "string" && data.industry && INDUSTRIES.some((i) => i.value === data.industry)) {
        setIndustry(data.industry);
        filled.push("industry");
      }
      // Track is intentionally left to the user.

      setProcessed(true);
      toast.success(`Filled ${filled.length} field${filled.length === 1 ? "" : "s"} — pick a Track and review`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't process the document");
    } finally {
      setDrafting(false);
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
        },
      }),
    onSuccess: ({ id }) => {
      toast.success("Venture created — enriching now");
      nav(`/dashboard/hub/${id}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create venture"),
  });

  const missingFields: string[] = [];
  if (businessConcept.trim().length < 20) missingFields.push("Business concept (min 20 chars)");
  if (path === "manual" && !companyName.trim()) missingFields.push("Company name");
  if (path !== "manual" && !websiteUrl.trim()) missingFields.push(path === "own" ? "Your website URL" : "Competitor URL");
  if (!founderName.trim()) missingFields.push("Founder name");
  if (!founderEmail.trim()) missingFields.push("Founder email");
  if (!city.trim()) missingFields.push("City");
  if (!region.trim()) missingFields.push("State / region");
  if (!country.trim()) missingFields.push("Country");
  if (!marketScope) missingFields.push("Market scope");
  if (!industry.trim()) missingFields.push("Industry");
  if (!track) missingFields.push("Track");
  const canSubmit = missingFields.length === 0 && !create.isPending;


  return (
    <div className="space-y-6">
      <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to ventures
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Step 1 of 4 — Concept
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {fromBrief ? "Your Startup Snapshot — ready to confirm" : "Tell us about the venture"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fromBrief
            ? "We pre-filled this from your founder brief. Skim it, fix anything that's off, and pick your city/state — then we generate."
            : "Pick how you want us to enrich it. We'll pull context, then you review before generation."}
        </p>
      </div>

      {fromBrief && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="font-medium">Pre-filled from your startup brief</div>
            <div className="mt-0.5 text-muted-foreground">
              Edit anything that's off. The only things we still need from you are your <strong>city / state</strong>{!industry ? " and " : ""}{!industry ? <strong>industry</strong> : null}.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFromBrief(false)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}


      <div className="grid gap-2 md:grid-cols-3">
        {([
          { k: "own", label: "I have a website", hint: "We'll scrape it" },
          { k: "competitor", label: "Patterned from competitor", hint: "Borrow + differentiate" },
          { k: "manual", label: "Manual", hint: "Describe it yourself" },
        ] as { k: Path; label: string; hint: string }[]).map((opt) => (
          <button
            key={opt.k}
            type="button"
            onClick={() => setPath(opt.k)}
            className={`rounded-xl border p-4 text-left transition ${
              path === opt.k ? "border-foreground bg-card" : "border-white/10 bg-card/40 hover:border-white/20"
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</div>
          </button>
        ))}
      </div>

      {/* Founder + market context */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Founder & market</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          We use these to scope research and ground every document — especially when you're operating in a specific local market.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fname">Your name <span className="text-status-danger">*</span></Label>
            <Input id="fname" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="femail">Contact email <span className="text-status-danger">*</span></Label>
            <Input id="femail" type="email" value={founderEmail} onChange={(e) => setFounderEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fphone">Phone <span className="text-muted-foreground text-[10px]">(optional)</span></Label>
            <Input id="fphone" type="tel" value={founderPhone} onChange={(e) => setFounderPhone(e.target.value)} placeholder="+1 555 123 4567" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="country">Country <span className="text-status-danger">*</span></Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">City / town <span className="text-status-danger">*</span></Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Atlanta" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="region">State / region <span className="text-status-danger">*</span></Label>
            <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Georgia" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Market scope <span className="text-status-danger">*</span></Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(["local", "regional", "national", "international"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMarketScope(s)}
                  className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition ${
                    marketScope === s ? "border-foreground bg-foreground text-background" : "border-white/10 hover:border-white/20"
                  }`}
                >{s}</button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {marketScope === "local" && "Operates in one city/metro — we'll prioritize local competitors and area-specific research."}
              {marketScope === "regional" && "Serves a state or multi-state region."}
              {marketScope === "national" && "Serves customers across one country."}
              {marketScope === "international" && "Serves customers in multiple countries."}
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label>Industry <span className="text-status-danger">*</span></Label>
            <IndustryCombobox value={industry} onChange={setIndustry} />
            <Input
              className="mt-1"
              value={subIndustry}
              onChange={(e) => setSubIndustry(e.target.value)}
              placeholder="Niche or sub-industry (optional) — e.g. specialty pour-over"
            />
          </div>
        </div>

        {/* Track selector */}
        <div
          ref={trackSectionRef}
          className={`space-y-3 rounded-xl border bg-background/40 p-4 transition ${
            trackPulse
              ? "border-status-danger/70 ring-2 ring-status-danger/40 animate-pulse"
              : "border-white/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label className="text-sm">Track <span className="text-status-danger">*</span></Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                What kind of startup is this? We tune the tone &amp; framing of every document to match.
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
              This workshop is built primarily for <strong>Main Street founders</strong> — first-time owners opening a café, salon, trade, local service, indie product, or small e-commerce brand. That's the default. Pick a different track only if you're building something materially different (venture-track SaaS, a two-sided marketplace, deep tech, etc.). Tracks don't change which 34 deliverables you get — they change the voice and framing. You can change this later.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
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
        </div>
      </div>




      <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <div className="grid gap-2">
          <Label htmlFor="company">Company name {path === "manual" && <span className="text-status-danger">*</span>}</Label>
          <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Northbound Roasters" />
        </div>

        {path !== "manual" && (
          <div className="grid gap-2">
            <Label htmlFor="url">{path === "own" ? "Your website URL *" : "Competitor URL *"}</Label>
            <Input id="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
        )}

        <div className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-4">
          <div>
            <div className="text-sm font-medium">Your business concept</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Type it, dictate it, or drop in your notes — pick whatever's easiest. We'll use it to build everything else.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = Array.from(e.dataTransfer.files ?? []);
              addFiles(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition ${
              dragOver ? "border-primary bg-primary/5" : "border-white/15 hover:border-white/30"
            }`}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">Drop your pitch deck, plan, one-pager, or notes</span>
              <span className="text-muted-foreground"> — we'll fill out the whole form</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              PDF · TXT · MD · up to {MAX_FILES} files, 20 MB each
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                addFiles(list);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className={`shrink-0 text-[11px] uppercase tracking-wider ${
                    f.status === "ready" ? "text-status-success" :
                    f.status === "error" ? "text-status-danger" :
                    "text-muted-foreground"
                  }`}>
                    {f.status === "reading" ? "Reading…" : f.status === "ready" ? "Ready" : (f.error ?? "Couldn't read")}
                  </span>
                  <button type="button" onClick={() => removeFile(f.id)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {readyFiles.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <div className="font-medium">
                  {processed ? "Processed — review the form below" : `${readyFiles.length} file${readyFiles.length === 1 ? "" : "s"} ready`}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {processed
                    ? "We filled every field we could from your document. Pick a Track to unlock Create & enrich."
                    : "Click Process document and we'll fill out the whole form for you."}
                </div>
              </div>
              <Button
                type="button"
                onClick={draftFromFiles}
                disabled={drafting}
                className="shrink-0"
              >
                {drafting ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Processing…</>
                ) : (
                  <><Wand2 className="mr-1.5 h-4 w-4" />{processed ? "Re-process" : "Process document"}</>
                )}
              </Button>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="concept">Business concept *</Label>
              <div className="flex items-center gap-2">
                {/* TODO: remove after testing — scrapes a real startup site and reverse-engineers a concept */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground"
                  disabled={filling}
                  onClick={async () => {
                    if (!track) {
                      toast.error("Pick a Track first — it shapes the test concept and research.");
                      trackSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      setTrackPulse(true);
                      setTimeout(() => setTrackPulse(false), 1600);
                      return;
                    }
                    setFilling(true);
                    try {
                      const seed = pickSeedForTrack(track);
                      const { data, error } = await supabase.functions.invoke(
                        "dev-reverse-engineer-concept",
                        { body: { url: seed.url, track } },
                      );
                      if (error) throw error;
                      if (!data?.company || !data?.concept) throw new Error("Empty response");
                      setCompanyName(data.company);
                      if (path !== "manual") setWebsiteUrl(data.url);
                      setBusinessConcept(data.concept);
                      if (path === "competitor" && data.diff) setDiff(data.diff);

                      // Fill founder fields so the form is one-click submittable
                      const { data: userData } = await supabase.auth.getUser();
                      const u = userData.user;
                      const meta: any = u?.user_metadata ?? {};
                      const ts = Date.now();
                      if (!founderName.trim()) {
                        setFounderName(meta.display_name || meta.name || meta.full_name || "Test Founder");
                      }
                      if (!founderEmail.trim()) {
                        setFounderEmail(u?.email || `test+${ts}@example.com`);
                      }
                      if (!founderPhone.trim()) setFounderPhone("+1 555 010 0123");

                      // Market context comes from the track seed, not hardcoded
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
                  {filling ? "Scraping…" : "🧪 Fill test concept"}
                </Button>
                <VoiceRecorder
                  size="sm"
                  context="Founder describing their business concept — what they're building, who it's for, and why it matters."
                  onTranscript={(text) =>
                    setBusinessConcept((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                  }
                />
              </div>
            </div>
            <Textarea
              id="concept"
              value={businessConcept}
              onChange={(e) => setBusinessConcept(e.target.value)}
              placeholder="Describe what you're building, who it's for, and why it matters — or drop notes above and we'll draft it for you. You can also tap the mic to dictate."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">{businessConcept.trim().length} characters (min 20)</p>
          </div>
        </div>

        {path === "competitor" && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="diff">How you'll differentiate</Label>
              <VoiceRecorder
                size="sm"
                context="Founder explaining how their venture will differentiate from a competitor."
                onTranscript={(text) =>
                  setDiff((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                }
              />
            </div>
            <Textarea id="diff" value={diff} onChange={(e) => setDiff(e.target.value)} rows={3} placeholder="What you'll do differently from the competitor. Tap the mic to dictate." />
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        {!canSubmit && missingFields.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Still needed: <span className="font-medium text-foreground">{missingFields.join(" · ")}</span>
          </div>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={canSubmit ? -1 : 0}>
                <Button disabled={!canSubmit} onClick={() => create.mutate()}>
                  {create.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Creating…</> : "Create & enrich →"}
                </Button>
              </span>
            </TooltipTrigger>
            {!canSubmit && missingFields.length > 0 && (
              <TooltipContent side="top" align="end" className="max-w-xs">
                <div className="text-xs font-medium">Add these to continue:</div>
                <ul className="mt-1 list-disc pl-4 text-xs">
                  {missingFields.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
