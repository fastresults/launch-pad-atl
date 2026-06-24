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
  advanceToGenerate,
  listDocumentTypes,
  listSnapshotDocuments,
  generateDocument,
  bulkGenerate,
  getActiveJob,
  cancelJob,
  listFailures,
} from "@/lib/foundersHub.functions";
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
  { n: 1, key: "concept", label: "Concept" },
  { n: 2, key: "enriching", label: "Enriching" },
  { n: 3, key: "review", label: "Review" },
  { n: 4, key: "generate", label: "Generate" },
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
        <ArrowLeft className="h-4 w-4" /> Back to ventures
      </Link>

      <StepIndicator current={step} />

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
        {["scraping", "research", "extraction", "validation"].map((stage) => (
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
          We've drafted this from your concept. Edit anything that's off — every document downstream uses this.
        </p>
      </div>

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

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
        </Button>
        <Button onClick={() => advance.mutate()} disabled={advance.isPending}>
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

  const genOne = useMutation({
    mutationFn: (documentType: string) => generateDocument({ data: { snapshotId: snapshot.id, documentType } }),
    onSuccess: () => { toast.success("Document generated"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const bulk = useMutation({
    mutationFn: () => bulkGenerate({ data: { snapshotId: snapshot.id } }),
    onSuccess: () => { toast.success("Bulk generation started"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk run failed"),
  });

  const cancel = useMutation({
    mutationFn: (jobId: string) => cancelJob({ data: { jobId } }),
    onSuccess: () => { toast.success("Cancel requested"); qc.invalidateQueries({ queryKey: ["hub"] }); },
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
  const completedKeys = new Set(docs.filter((d) => d.status === "complete").map((d) => d.document_type));
  const totalMin = types.reduce((s, t) => s + (t.estimated_minutes ?? 5), 0);
  const completeCount = completedKeys.size;
  const job = jobQ.data;
  const jobRunning = job?.status === "running" || job?.status === "queued";

  const categories = useMemo(() => {
    const map = new Map<string, typeof types>();
    for (const t of types) {
      if (!map.has(t.category)) map.set(t.category, [] as any);
      map.get(t.category)!.push(t);
    }
    return Array.from(map.entries());
  }, [types]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Generate your documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {completeCount} / {types.length} complete · ~{totalMin} min total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => bulk.mutate()} disabled={bulk.isPending || jobRunning}>
              {bulk.isPending || jobRunning ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Running…</>
              ) : (
                <><Sparkles className="mr-1.5 h-4 w-4" />Generate all {types.length}</>
              )}
            </Button>
            {jobRunning && job?.id && (
              <Button variant="outline" size="sm" onClick={() => cancel.mutate(job.id)} disabled={cancel.isPending || job.cancel_requested}>
                <XCircle className="mr-1 h-3 w-3" />{job.cancel_requested ? "Canceling…" : "Cancel"}
              </Button>
            )}
          </div>
        </div>
        {job && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{job.status}{job.current_document_type ? ` · ${job.current_document_type}` : ""}</span>
              <span>{job.progress_pct ?? 0}%</span>
            </div>
            <Progress value={job.progress_pct ?? 0} />
            {job.error && <p className="text-xs text-red-400">{job.error}</p>}
          </div>
        )}
        {(failuresQ.data?.length ?? 0) > 0 && (
          <details className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-red-200">
              {failuresQ.data.length} recent failure{failuresQ.data.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 space-y-1.5">
              {failuresQ.data.slice(0, 8).map((f: any) => (
                <li key={f.id} className="text-red-300/80">
                  <span className="font-mono text-red-200">{f.document_type}</span> — {f.error}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {categories.map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((t) => {
              const d = docByType.get(t.type);
              const depsMet = (t.dependencies ?? []).every((dep: string) => completedKeys.has(dep));
              const status = d?.status ?? "pending";
              const Icon = status === "complete" ? CheckCircle2 : depsMet ? Circle : Lock;
              const tone = status === "complete" ? "text-emerald-400" : depsMet ? "text-foreground" : "text-muted-foreground";
              const generating = status === "generating" || genOne.isPending && genOne.variables === t.type;
              return (
                <div key={t.type} className="rounded-xl border border-white/10 bg-card p-4">
                  <div className="flex items-start gap-2">
                    <Icon className={`mt-0.5 h-4 w-4 ${tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-sm font-medium">{t.name}</h4>
                        {!depsMet && <Badge variant="outline" className="text-[10px]">Locked</Badge>}
                        {status === "failed" && <Badge variant="destructive" className="text-[10px]">Failed</Badge>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        ~{t.estimated_minutes} min
                        {d?.word_count ? ` · ${d.word_count} words` : ""}
                        {d?.quality_score ? ` · quality ${d.quality_score}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={status === "complete" ? "outline" : "default"}
                      disabled={!depsMet || generating || jobRunning}
                      onClick={() => genOne.mutate(t.type)}
                    >
                      {generating ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Generating…</>
                      ) : status === "complete" ? "Regenerate" : (<><Play className="mr-1 h-3 w-3" />Generate</>)}
                    </Button>
                    {status === "complete" && d && (
                      <Button size="sm" variant="ghost" onClick={() => setViewerDoc(d)}>
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog open={viewerDoc !== null} onOpenChange={(o) => !o && setViewerDoc(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewerDoc?.document_type?.replace(/_/g, " ")}</DialogTitle>
          </DialogHeader>
          <article className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewerDoc?.content ?? ""}</ReactMarkdown>
          </article>
          <div className="flex gap-2 pt-3">
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(viewerDoc?.content ?? "");
              toast.success("Copied");
            }}>Copy</Button>
            <Button size="sm" variant="outline" onClick={() => {
              const blob = new Blob([viewerDoc?.content ?? ""], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${viewerDoc?.document_type}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download .md</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
