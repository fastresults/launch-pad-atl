// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getSnapshot,
  retryEnrichment,
  updateExtractedData,
  updateFounderContext,
  advanceToGenerate,
  listDocumentTypes,
  listSnapshotDocuments,
  generateDocument,
  bulkGenerate,
  getActiveJob,
  cancelJob,
  listFailures,
} from "@/lib/foundersHub.functions";
import { IndustryCombobox } from "@/components/hub/IndustryCombobox";
import { ConceptStudio } from "@/components/hub/ConceptStudio";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { BrandStudio } from "@/components/hub/BrandStudio";
import { SocialStudio } from "@/components/hub/SocialStudio";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  AlertCircle,
  Eye,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { n: 1, key: "concept", label: "Your idea" },
  { n: 2, key: "enriching", label: "Research" },
  { n: 3, key: "review", label: "Review" },
  { n: 4, key: "generate", label: "Write documents" },
];

function statusToStep(status: string): number {
  if (status === "input") return 1;
  if (status === "enriching") return 2;
  if (status === "review") return 3;
  return 4;
}

export default function HubSnapshotPage() {
  return (
    <FoundersHubGate>
      <Inner />
    </FoundersHubGate>
  );
}

function Inner() {
  const { snapshotId = "" } = useParams();
  const qc = useQueryClient();

  const snapQ = useQuery({
    queryKey: ["hub", "snapshot", snapshotId],
    queryFn: () => getSnapshot({ data: { id: snapshotId } }),
    refetchInterval: (q) => {
      const s = q.state.data;
      return s && (s.status === "enriching" || s.status === "generating") ? 3000 : false;
    },
  });

  const snap = snapQ.data;
  const step = snap ? statusToStep(snap.status) : 1;

  return (
    <div className="space-y-6">
      <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to your startups
      </Link>

      {step < 4 && <StepIndicator current={step} />}

      {!snap ? (
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-sm text-muted-foreground">Loading…</div>
      ) : snap.status === "enriching" ? (
        <EnrichingStep snapshot={snap} onRetry={() => qc.invalidateQueries({ queryKey: ["hub"] })} />
      ) : snap.status === "review" ? (
        <ReviewStep
          snapshot={snap}
          onSaved={() => qc.invalidateQueries({ queryKey: ["hub"] })}
        />
      ) : (
        <GenerateStep snapshot={snap} />
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {STEPS.map((s) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <li key={s.n} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
            active ? "border-foreground bg-foreground text-background"
            : done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 text-muted-foreground"
          }`}>
            <span className="font-semibold">{s.n}</span>
            <span>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function EnrichingStep({ snapshot, onRetry }: { snapshot: any; onRetry: () => void }) {
  const prog = snapshot.enrichment_progress ?? {};
  const pct = Math.max(5, Math.min(95, prog.progress ?? 10));
  const updatedAt = prog.updatedAt ? new Date(prog.updatedAt).getTime() : new Date(snapshot.updated_at).getTime();
  const isStale = Date.now() - updatedAt > 90_000;
  const isError = prog.stage === "error";

  const retry = useMutation({
    mutationFn: () => retryEnrichment({ data: { id: snapshot.id } }),
    onSuccess: () => { toast.success("Retrying enrichment"); onRetry(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Retry failed"),
  });

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-card p-6">
      <div>
        <h2 className="text-xl font-semibold">Enriching your venture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {prog.message ?? "Pulling context, scanning the market, and extracting structured data…"}
        </p>
      </div>
      <Progress value={pct} />
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {["scraping", "competitors", "market", "voice", "synthesis", "validation"].map((stage) => (
          <span key={stage} className={`rounded-full border px-2 py-0.5 ${
            prog.stage === stage ? "border-foreground text-foreground" : "border-white/10"
          }`}>{stage}</span>
        ))}
      </div>
      {isError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
          <div className="flex-1">
            <div className="font-medium text-red-200">Enrichment failed</div>
            <div className="text-xs text-red-300/80">{prog.message ?? "Unknown error"}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => retry.mutate()}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button>
        </div>
      )}
      {!isError && isStale && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <span>Looks like enrichment may have stalled.</span>
          <Button size="sm" variant="outline" onClick={() => retry.mutate()}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button>
        </div>
      )}
    </div>
  );
}

const SECTIONS: { key: string; label: string; fields: { key: string; label: string; multiline?: boolean }[] }[] = [
  {
    key: "foundation",
    label: "Business Foundation",
    fields: [
      { key: "company_name", label: "Company name" },
      { key: "founder_name", label: "Founder name" },
      { key: "location", label: "Business location" },
      { key: "industry", label: "Industry" },
      { key: "concept", label: "Business concept", multiline: true },
      { key: "problem", label: "Problem you solve", multiline: true },
    ],
  },
  {
    key: "market",
    label: "Target Market & Value",
    fields: [
      { key: "target_customers", label: "Target customers", multiline: true },
      { key: "value_proposition", label: "Value proposition", multiline: true },
      { key: "differentiators", label: "Differentiators", multiline: true },
      { key: "market_size", label: "Market size" },
    ],
  },
  {
    key: "operations",
    label: "Business Model & Operations",
    fields: [
      { key: "revenue_model", label: "Revenue model", multiline: true },
      { key: "pricing", label: "Pricing" },
      { key: "key_processes", label: "Key processes", multiline: true },
      { key: "team", label: "Team", multiline: true },
    ],
  },
  {
    key: "vision",
    label: "Growth & Vision",
    fields: [
      { key: "short_term_goals", label: "Short-term goals (12 mo)", multiline: true },
      { key: "long_term_goals", label: "Long-term goals (3-5 yr)", multiline: true },
      { key: "mission", label: "Mission" },
      { key: "vision", label: "Vision" },
    ],
  },
];

function ReviewStep({ snapshot, onSaved }: { snapshot: any; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, Record<string, string>>>(() => {
    const ex = snapshot.extracted_data ?? {};
    const out: any = {};
    for (const s of SECTIONS) {
      out[s.key] = {};
      for (const f of s.fields) out[s.key][f.key] = ex?.[s.key]?.[f.key] ?? "";
    }
    return out;
  });

  const save = useMutation({
    mutationFn: () => updateExtractedData({ data: { id: snapshot.id, extracted_data: form } }),
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const advance = useMutation({
    mutationFn: async () => {
      await updateExtractedData({ data: { id: snapshot.id, extracted_data: form } });
      await advanceToGenerate({ data: { id: snapshot.id } });
    },
    onSuccess: () => { toast.success("On to generation"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to continue"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review the brief</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We've drafted this from your concept and the deep-research pass. Edit anything that's off — every document downstream uses this.
        </p>
      </div>

      <FounderMarketCard snapshot={snapshot} onSaved={onSaved} />

      <ResearchPanel snapshot={snapshot} />

      <ConceptStudio snapshot={snapshot} onChanged={onSaved} />






      {SECTIONS.map((section) => (
        <div key={section.key} className="space-y-3 rounded-2xl border border-white/10 bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {section.fields.map((f) => (
              <div key={f.key} className={`grid gap-1.5 ${f.multiline ? "md:col-span-2" : ""}`}>
                <Label className="text-xs">{f.label}</Label>
                {f.multiline ? (
                  <Textarea
                    rows={3}
                    value={form[section.key][f.key]}
                    onChange={(e) => setForm({ ...form, [section.key]: { ...form[section.key], [f.key]: e.target.value } })}
                  />
                ) : (
                  <Input
                    value={form[section.key][f.key]}
                    onChange={(e) => setForm({ ...form, [section.key]: { ...form[section.key], [f.key]: e.target.value } })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-2">
        {snapshot.concept_status !== "locked" && (
          <p className="mr-auto text-xs text-amber-300">
            Lock your concept in Concept Studio above to unlock document generation.
          </p>
        )}
        <Button variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
        </Button>
        <Button onClick={() => advance.mutate()} disabled={advance.isPending || snapshot.concept_status !== "locked"}>
          {advance.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Continue to documents →
        </Button>
      </div>
    </div>
  );
}

function GenerateStep({ snapshot }: { snapshot: any }) {
  const qc = useQueryClient();
  const typesQ = useQuery({ queryKey: ["hub", "types"], queryFn: listDocumentTypes });
  const docsQ = useQuery({
    queryKey: ["hub", "docs", snapshot.id],
    queryFn: () => listSnapshotDocuments({ data: { snapshotId: snapshot.id } }),
    refetchInterval: 4000,
  });
  const jobQ = useQuery({
    queryKey: ["hub", "job", snapshot.id],
    queryFn: () => getActiveJob({ data: { snapshotId: snapshot.id } }),
    refetchInterval: (q) =>
      q.state.data?.status === "running" || q.state.data?.status === "queued" ? 3000 : false,
  });

  const [viewerDoc, setViewerDoc] = useState<any>(null);
  const [showHelper, setShowHelper] = useState(true);
  const [showFailures, setShowFailures] = useState(false);

  const genOne = useMutation({
    mutationFn: (documentType: string) => generateDocument({ data: { snapshotId: snapshot.id, documentType } }),
    onSuccess: () => { toast.success("Document ready"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const bulk = useMutation({
    mutationFn: () => bulkGenerate({ data: { snapshotId: snapshot.id } }),
    onSuccess: () => { toast.success("We'll keep writing in the background"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't start"),
  });

  const cancel = useMutation({
    mutationFn: (jobId: string) => cancelJob({ data: { jobId } }),
    onSuccess: () => { toast.success("Stopping…"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cancel failed"),
  });

  const failuresQ = useQuery({
    queryKey: ["hub", "failures", snapshot.id],
    queryFn: () => listFailures({ data: { snapshotId: snapshot.id } }),
    refetchInterval: 10000,
  });

  const types = typesQ.data ?? [];
  const docs = docsQ.data ?? [];
  const docByType = useMemo(() => new Map(docs.map((d) => [d.document_type, d])), [docs]);
  const typeByKey = useMemo(() => new Map(types.map((t: any) => [t.type, t])), [types]);
  const completedKeys = new Set(docs.filter((d) => d.status === "complete").map((d) => d.document_type));
  const completeCount = completedKeys.size;
  const total = types.length;
  const job = jobQ.data;
  const jobRunning = job?.status === "running" || job?.status === "queued";
  const failures = failuresQ.data ?? [];

  const currentDocLabel = job?.current_document_type
    ? (typeByKey.get(job.current_document_type) as any)?.name ?? job.current_document_type
    : null;

  const categories = useMemo(() => {
    const map = new Map<string, typeof types>();
    for (const t of types) {
      if (!map.has(t.category)) map.set(t.category, [] as any);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [types]);

  // ---- Hero state machine ----
  let heroTitle: string;
  let heroSub: string;
  let heroPrimary: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean } | null = null;
  let heroSecondary: { label: string; onClick: () => void } | null = null;
  let heroShowProgress = false;
  let heroDone = false;

  if (jobRunning) {
    heroTitle = "We're writing your documents…";
    heroSub = currentDocLabel
      ? `Working on: ${currentDocLabel}. You can leave this page — we'll keep going in the background.`
      : "You can leave this page — we'll keep going in the background.";
    heroShowProgress = true;
    if (job?.id) {
      heroSecondary = { label: job.cancel_requested ? "Stopping…" : "Stop", onClick: () => cancel.mutate(job.id) };
    }
  } else if (completeCount === 0) {
    heroTitle = "Let's build your startup kit";
    heroSub = `We'll write ${total || "your"} documents — strategy, brand, social and launch. It takes a few hours. You can leave and come back any time.`;
    heroPrimary = {
      label: "Start writing",
      onClick: () => bulk.mutate(),
      disabled: bulk.isPending || !total,
      loading: bulk.isPending,
    };
  } else if (completeCount < total) {
    heroTitle = "Pick up where you left off";
    heroSub = `${completeCount} of ${total} documents done. We'll write the rest for you.`;
    heroShowProgress = true;
    heroPrimary = {
      label: "Continue writing",
      onClick: () => bulk.mutate(),
      disabled: bulk.isPending,
      loading: bulk.isPending,
    };
  } else {
    heroTitle = "Your startup kit is ready";
    heroSub = `All ${total} documents are written. Open any one below to read or download.`;
    heroDone = true;
    heroPrimary = {
      label: "View first document",
      onClick: () => {
        const first = docs.find((d: any) => d.status === "complete");
        if (first) setViewerDoc(first);
      },
    };
    heroSecondary = { label: "Regenerate all", onClick: () => bulk.mutate() };
  }

  const pct = jobRunning
    ? (job?.progress_pct ?? 0)
    : total > 0
      ? Math.round((completeCount / total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero next-action card */}
      <div className={`rounded-2xl border p-6 ${heroDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-card"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{heroTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{heroSub}</p>
          </div>
          <div className="flex items-center gap-2">
            {heroPrimary && (
              <Button size="lg" onClick={heroPrimary.onClick} disabled={heroPrimary.disabled}>
                {heroPrimary.loading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                {heroPrimary.label}
              </Button>
            )}
            {heroSecondary && (
              <Button size="sm" variant="ghost" onClick={heroSecondary.onClick}>
                {heroSecondary.label}
              </Button>
            )}
          </div>
        </div>
        {heroShowProgress && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completeCount} of {total} done</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
        )}
        {failures.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFailures((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200"
          >
            <AlertCircle className="h-3 w-3" />
            {failures.length} document{failures.length === 1 ? "" : "s"} need another try
          </button>
        )}
        {showFailures && failures.length > 0 && (
          <ul className="mt-2 space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-100/80">
            {failures.slice(0, 6).map((f: any) => {
              const t = typeByKey.get(f.document_type) as any;
              return <li key={f.id}><span className="font-medium">{t?.name ?? f.document_type}</span> — {f.error}</li>;
            })}
          </ul>
        )}
      </div>

      {showHelper && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-card/40 px-4 py-2 text-xs text-muted-foreground">
          <span>This page writes your full startup kit. Hit one button and we'll do the rest — you can read each document as it finishes.</span>
          <button type="button" onClick={() => setShowHelper(false)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your documents</h3>
        <p className="text-xs text-muted-foreground">Read each one as it's ready, or generate them one at a time.</p>
      </div>

      {categories.map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{cat}</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((t) => {
              const d = docByType.get(t.type);
              const deps = (t.dependencies ?? []) as string[];
              const depsMet = deps.every((dep) => completedKeys.has(dep));
              const status = d?.status ?? "pending";
              const isComplete = status === "complete";
              const generating = status === "generating" || (genOne.isPending && genOne.variables === t.type);
              const Icon = isComplete ? CheckCircle2 : depsMet ? Circle : Lock;
              const tone = isComplete ? "text-emerald-400" : depsMet ? "text-foreground" : "text-muted-foreground";

              let statusLine: string;
              if (isComplete) statusLine = "Ready to read";
              else if (generating) statusLine = "Writing now…";
              else if (status === "failed") statusLine = "Needs another try";
              else if (!depsMet) {
                const missing = deps.find((dep) => !completedKeys.has(dep));
                const missingLabel = missing ? ((typeByKey.get(missing) as any)?.name ?? missing) : "earlier documents";
                statusLine = `Waiting on ${missingLabel}`;
              } else statusLine = "Not started yet";

              return (
                <div key={t.type} className="rounded-xl border border-white/10 bg-card p-4">
                  <div className="flex items-start gap-2">
                    <Icon className={`mt-0.5 h-4 w-4 ${tone}`} />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">{t.name}</h4>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      <div className="mt-1 text-[10px] text-muted-foreground">{statusLine} · ~{t.estimated_minutes} min</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {isComplete ? (
                      <Button size="sm" onClick={() => setViewerDoc(d)}>
                        <Eye className="mr-1 h-3 w-3" /> Read
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!depsMet || generating || jobRunning}
                        onClick={() => genOne.mutate(t.type)}
                        title={!depsMet ? "Finish earlier documents first" : undefined}
                      >
                        {generating ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Writing…</>
                        ) : (
                          <><Play className="mr-1 h-3 w-3" />Generate</>
                        )}
                      </Button>
                    )}
                    {isComplete && (
                      <Button size="sm" variant="ghost" onClick={() => genOne.mutate(t.type)} disabled={jobRunning}>
                        Rewrite
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Bonus tools - deferred */}
      <details open={completeCount === total && total > 0} className="rounded-2xl border border-white/10 bg-card/40 p-4">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Bonus tools (optional)</div>
              <div className="text-xs text-muted-foreground">Generate logos, social posts and brand assets once your documents are ready.</div>
            </div>
            <span className="text-xs text-muted-foreground">Show / hide</span>
          </div>
        </summary>
        <div className="mt-4 space-y-4">
          <BrandStudio snapshot={snapshot} />
          <SocialStudio snapshot={snapshot} />
        </div>
      </details>

      <DocumentViewer doc={viewerDoc} open={viewerDoc !== null} onOpenChange={(o) => !o && setViewerDoc(null)} />
    </div>
  );
}

function ResearchPanel({ snapshot }: { snapshot: any }) {
  const brief = snapshot.research_brief;
  const artifacts: any[] = Array.isArray(snapshot.research_artifacts) ? snapshot.research_artifacts : [];
  if (!brief && !artifacts.length) return null;

  const competitors = brief?.competitors ?? [];
  const market = brief?.market ?? {};
  const voice = brief?.customer_voice ?? [];
  const pricing = brief?.pricing_benchmarks ?? [];
  const gaps: string[] = brief?.gaps ?? [];
  const confidence = brief?.confidence ?? {};
  const sources = artifacts
    .filter((a) => a.source_url)
    .map((a) => ({ url: a.source_url, label: a.metadata?.title ?? a.step }));

  const overall = Math.round(confidence.overall ?? 0);

  return (
    <details open className="rounded-2xl border border-white/10 bg-card p-5">
      <summary className="flex cursor-pointer items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Deep research
        </span>
        <span className="text-xs text-muted-foreground">
          {sources.length} sources · confidence {overall}/100
        </span>
      </summary>

      {gaps.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
          <div className="mb-1 font-medium text-amber-200">Needs your input</div>
          <ul className="list-inside list-disc space-y-0.5 text-amber-100/80">
            {gaps.slice(0, 6).map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {competitors.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competitors</h4>
            <ul className="space-y-2 text-sm">
              {competitors.slice(0, 5).map((c: any, i: number) => (
                <li key={i} className="rounded-lg border border-white/10 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.name || c.url}</span>
                    {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground">↗</a>}
                  </div>
                  {c.positioning && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.positioning}</p>}
                  {c.pricing && <p className="mt-0.5 text-[11px] text-muted-foreground">Pricing: {c.pricing}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(market.size || market.trends || market.tailwinds) && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market</h4>
            <dl className="space-y-1.5 text-xs">
              {market.size && <div><dt className="text-muted-foreground">Size</dt><dd>{market.size}</dd></div>}
              {market.trends && <div><dt className="text-muted-foreground">Trends</dt><dd>{market.trends}</dd></div>}
              {market.tailwinds && <div><dt className="text-muted-foreground">Tailwinds</dt><dd>{market.tailwinds}</dd></div>}
              {market.headwinds && <div><dt className="text-muted-foreground">Headwinds</dt><dd>{market.headwinds}</dd></div>}
            </dl>
          </section>
        )}

        {voice.length > 0 && (
          <section className="md:col-span-2">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer voice</h4>
            <ul className="space-y-1.5 text-xs">
              {voice.slice(0, 4).map((v: any, i: number) => (
                <li key={i} className="rounded border border-white/10 p-2">
                  <p className="italic text-muted-foreground">"{v.quote}"</p>
                  {v.source_url && <a href={v.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-muted-foreground hover:text-foreground">{v.theme ?? "source"} ↗</a>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {pricing.length > 0 && (
          <section className="md:col-span-2">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing benchmarks</h4>
            <ul className="space-y-1 text-xs">
              {pricing.slice(0, 6).map((p: any, i: number) => (
                <li key={i} className="flex flex-wrap gap-x-2"><span className="font-medium">{p.competitor}</span><span className="text-muted-foreground">{p.tier}</span><span>{p.price}</span></li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {sources.length > 0 && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-muted-foreground">{sources.length} sources</summary>
          <ul className="mt-2 space-y-0.5">
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  [{i + 1}] {s.label} — {s.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </details>
  );
}

function FounderMarketCard({ snapshot, onSaved }: { snapshot: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    founder_name: snapshot.founder_name ?? "",
    founder_email: snapshot.founder_email ?? "",
    founder_phone: snapshot.founder_phone ?? "",
    city: snapshot.city ?? "",
    region: snapshot.region ?? "",
    country: snapshot.country ?? "",
    market_scope: (snapshot.market_scope ?? "local") as "local" | "regional" | "national" | "international",
    industry: snapshot.industry ?? "",
    sub_industry: snapshot.sub_industry ?? "",
  });

  const save = useMutation({
    mutationFn: () => updateFounderContext({ data: { id: snapshot.id, ...form } }),
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v as any }));

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Founder & market</h3>
        <Button size="sm" variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5"><Label className="text-xs">Founder name</Label>
          <Input value={form.founder_name} onChange={(e) => set("founder_name", e.target.value)} /></div>
        <div className="grid gap-1.5"><Label className="text-xs">Contact email</Label>
          <Input type="email" value={form.founder_email} onChange={(e) => set("founder_email", e.target.value)} /></div>
        <div className="grid gap-1.5"><Label className="text-xs">Phone</Label>
          <Input value={form.founder_phone} onChange={(e) => set("founder_phone", e.target.value)} /></div>
        <div className="grid gap-1.5"><Label className="text-xs">Country</Label>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
        <div className="grid gap-1.5"><Label className="text-xs">City / town</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
        <div className="grid gap-1.5"><Label className="text-xs">State / region</Label>
          <Input value={form.region} onChange={(e) => set("region", e.target.value)} /></div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">Market scope</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["local", "regional", "national", "international"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("market_scope", s)}
                className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition ${
                  form.market_scope === s ? "border-foreground bg-foreground text-background" : "border-white/10 hover:border-white/20"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Industry</Label>
          <IndustryCombobox value={form.industry} onChange={(v) => set("industry", v)} />
          <Input
            className="mt-1"
            value={form.sub_industry}
            onChange={(e) => set("sub_industry", e.target.value)}
            placeholder="Niche (optional)"
          />
        </div>
      </div>
    </div>
  );
}


