// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { REVIEW_SECTIONS, SUB_STEPS, isFieldFilled, type SubStepKey } from "@/lib/reviewCopy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { TrackChip } from "@/components/hub/TrackChip";
import { trackFor } from "@/lib/asset-tracks";
import { DaySprintDeckDialog } from "@/components/hub/DaySprintDeckDialog";
import type { LaunchDay } from "@/lib/launch-14day-plan";


import { Button } from "@/components/ui/button";
import { ShareLinkBar } from "@/components/hub/ShareLinkBar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  appendSnapshotSources,
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
  listBlockedDocs,

} from "@/lib/foundersHub.functions";
import {
  uploadVentureSource,
  listVentureSources,
  deleteVentureSource,
  retryExtraction,
  type VentureSource,
} from "@/lib/venture-sources";
import { provenanceLabel } from "@/lib/canonical-context";
import { useCanonicalContext } from "@/hooks/use-canonical-context";
import { IndustryCombobox } from "@/components/hub/IndustryCombobox";
import { LegalSetupCard } from "@/components/foundation/LegalSetupCard";
import { TRACKS, getTrack, type TrackKey } from "@/lib/tracks";
import { ConceptStudio } from "@/components/hub/ConceptStudio";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { RewriteFeedbackDialog } from "@/components/hub/RewriteFeedbackDialog";
import { IntakeGatewayDialog, type IntakeTarget } from "@/components/hub/IntakeGatewayDialog";
import { BulkUnlockDialog } from "@/components/hub/BulkUnlockDialog";
import { BrandStudio } from "@/components/hub/BrandStudio";
import { getBrandKit } from "@/lib/brandKit.functions";
import { getSignedStorageUrl } from "@/lib/storageSignedUrl";

const BRAND_KIT_REQUIRED_TYPES = new Set<string>(["website_prd", "presell_landing_prd"]);
import { SocialStudio } from "@/components/hub/SocialStudio";
import { ContentStudio } from "@/components/hub/ContentStudio";
import { FounderRoadmapCard } from "@/components/hub/FounderRoadmapCard";
import { TimelineHubCard } from "@/components/hub/TimelineHubCard";

import { LaunchPlanner14Day } from "@/components/hub/LaunchPlanner14Day";
import { SectionIntro } from "@/components/hub/SectionIntro";
import { DashboardWelcomeStrip } from "@/components/hub/DashboardWelcomeStrip";
import { HUB_DASHBOARD_INTROS } from "@/lib/hub-dashboard-copy";
import { ViewModeToggle, type HubViewMode } from "@/components/hub/ViewModeToggle";
import { CategoryActions } from "@/components/hub/CategoryActions";
import { STAGE_DECKS, slugify } from "@/components/workshop-slides/registry";
import { DeckDialog } from "@/components/workshop-slides/DeckDialog";
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
  Presentation,
  XCircle,
  Upload,
  FileText,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { SectionHeader } from "@/components/hub/SectionHeader";

const STEPS = [
  { n: 1, key: "concept", label: "Your idea" },
  { n: 2, key: "enriching", label: "Research" },
  { n: 3, key: "review", label: "Review" },
  { n: 4, key: "generate", label: "Write assets" },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to your startups
        </Link>
        {snapshotId && (
          <Link
            to={`/dashboard/documents?venture=${snapshotId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View this venture's files →
          </Link>
        )}
      </div>

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
            : done ? "border-status-success/40 bg-status-success/10 text-status-success"
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
        <div className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/5 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-status-danger" />
          <div className="flex-1">
            <div className="font-medium text-status-danger">Enrichment failed</div>
            <div className="text-xs text-status-danger">{prog.message ?? "Unknown error"}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => retry.mutate()}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button>
        </div>
      )}
      {!isError && isStale && (
        <div className="flex items-center justify-between rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm">
          <span>Looks like enrichment may have stalled.</span>
          <Button size="sm" variant="outline" onClick={() => retry.mutate()}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button>
        </div>
      )}
    </div>
  );
}

// Legacy SECTIONS shape kept for backwards-compat in any other consumers.
// The Review wizard itself reads from REVIEW_SECTIONS in src/lib/reviewCopy.ts.
const SECTIONS = REVIEW_SECTIONS.map((s) => ({
  key: s.key,
  label: s.key === "foundation" ? "Business Foundation"
    : s.key === "market" ? "Target Market & Value"
    : s.key === "operations" ? "Business Model & Operations"
    : "Growth & Vision",
  fields: s.fields.map((f) => ({ key: f.key, label: f.label, multiline: f.multiline })),
}));

function buildReviewForm(snapshot: any): Record<string, Record<string, string>> {
  const ex = snapshot.extracted_data ?? {};
  const out: any = {};
  for (const s of REVIEW_SECTIONS) {
    out[s.key] = {};
    for (const f of s.fields) out[s.key][f.key] = ex?.[s.key]?.[f.key] ?? "";
  }
  return out;
}

function ReviewStep({ snapshot, onSaved }: { snapshot: any; onSaved: () => void }) {
  // Flat form state keyed by section→field; mirrors the persisted extracted_data shape.
  const [form, setForm] = useState<Record<string, Record<string, string>>>(() => buildReviewForm(snapshot));

  const [active, setActive] = useState<SubStepKey>("setup");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savingNow, setSavingNow] = useState(false);
  const dirtyRef = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  // R5 — provenance map: tells us which canonical source each field's value
  // originated from, so FieldGroup can render "from your Brief" etc.
  const [provenanceMap, setProvenanceMap] = useState<Record<string, string>>({});
  const { data: canonicalCtx } = useCanonicalContext();
  useEffect(() => {
    if (!canonicalCtx) return;
    const fieldToCanonical: Record<string, string> = {
      "foundation.company_name": "company_name",
      "foundation.concept": "one_line_pitch",
      "foundation.problem": "problem_statement",
      "market.target_customers": "target_customer",
      "market.value_proposition": "unique_insight",
      "market.differentiators": "unique_insight",
      "operations.revenue_model": "business_model",
      "operations.pricing": "pricing_idea",
      "vision.short_term_goals": "twelve_month_vision",
    };
    const out: Record<string, string> = {};
    for (const [fieldPath, canonicalKey] of Object.entries(fieldToCanonical)) {
      const src = canonicalCtx.provenance[canonicalKey];
      if (src) out[fieldPath] = src;
    }
    setProvenanceMap(out);
  }, [canonicalCtx]);

  useEffect(() => {
    if (dirtyRef.current) return;
    setForm(buildReviewForm(snapshot));
  }, [snapshot.id, snapshot.updated_at]);

  // Debounced auto-save: kicks in 800ms after the last edit. Replaces the old "Save draft" button.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      try {
        setSavingNow(true);
        await updateExtractedData({ data: { id: snapshot.id, extracted_data: formRef.current } });
        setSavedAt(new Date());
        dirtyRef.current = false;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Auto-save failed");
      } finally {
        setSavingNow(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, snapshot.id]);

  const setField = (section: string, key: string, value: string) => {
    dirtyRef.current = true;
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  };

  // Completeness per sub-step drives the dots in the sticky stepper.
  const completeness = useMemo(() => {
    const required = (section: string) =>
      REVIEW_SECTIONS.find((s) => s.key === section)!.fields.filter((f) => !f.optional);
    const allFilled = (section: string) =>
      required(section).every((f) => isFieldFilled(form[section]?.[f.key]));
    const setupOk =
      !!snapshot.founder_name && !!snapshot.founder_email && !!snapshot.industry && !!snapshot.track;
    return {
      setup: setupOk,
      story: allFilled("foundation"),
      market: allFilled("market"),
      model: allFilled("operations") && allFilled("vision"),
      lock: snapshot.concept_status === "locked",
    } as Record<SubStepKey, boolean>;
  }, [form, snapshot]);

  const advance = useMutation({
    mutationFn: async () => {
      await updateExtractedData({ data: { id: snapshot.id, extracted_data: formRef.current } });
      await advanceToGenerate({ data: { id: snapshot.id } });
    },
    onSuccess: () => { toast.success("On to generation"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to continue"),
  });

  const goNext = () => {
    const idx = SUB_STEPS.findIndex((s) => s.key === active);
    if (idx < SUB_STEPS.length - 1) setActive(SUB_STEPS[idx + 1].key);
  };
  const goPrev = () => {
    const idx = SUB_STEPS.findIndex((s) => s.key === active);
    if (idx > 0) setActive(SUB_STEPS[idx - 1].key);
  };

  const current = SUB_STEPS.find((s) => s.key === active)!;
  const isLast = active === "lock";
  const locked = snapshot.concept_status === "locked";

  const reextract = useMutation({
    mutationFn: () => retryEnrichment({ data: { id: snapshot.id } }),
    onSuccess: () => { toast.success("Re-extracting from your uploaded sources…"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Re-extract failed"),
  });
  const sm = snapshot.source_materials ?? null;
  const hasSources = !!sm && (((sm.documents ?? []).length ?? 0) > 0 || ((sm.urls ?? []).length ?? 0) > 0);

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Review the brief</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm what we got right. Fix what's off. Then continue.
          </p>
        </div>
        {hasSources && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => reextract.mutate()}
            disabled={reextract.isPending}
            title="Re-run extraction using the assets and URLs you uploaded"
          >
            {reextract.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Re-extract from my sources
          </Button>
        )}
      </div>

      <SourceRecoveryPanel snapshot={snapshot} onSaved={onSaved} />

      <ReviewSubStepper active={active} completeness={completeness} onJump={setActive} savedAt={savedAt} savingNow={savingNow} />


      <div>
        <h3 className="text-lg font-semibold">{current.title}</h3>
        <p className="text-sm text-muted-foreground">{current.subtitle}</p>
      </div>

      {active === "setup" && (
        <SetupSubStep snapshot={snapshot} onSaved={onSaved} />
      )}

      {active === "story" && (
        <FieldGroup
          sectionKey="foundation"
          form={form}
          setField={setField}
          provenanceMap={provenanceMap}
          contextChips={[
            { label: "Founder", value: snapshot.founder_name },
            { label: "Industry", value: snapshot.industry },
            { label: "Location", value: [snapshot.city, snapshot.region].filter(Boolean).join(", ") },
          ]}
        />
      )}

      {active === "market" && (
        <FieldGroup sectionKey="market" form={form} setField={setField} provenanceMap={provenanceMap} />
      )}

      {active === "model" && (
        <div className="space-y-5">
          <FieldGroup
            sectionKey="operations"
            form={form}
            setField={setField}
            provenanceMap={provenanceMap}
            heading="How you make money"
          />
          <FieldGroup
            sectionKey="vision"
            form={form}
            setField={setField}
            provenanceMap={provenanceMap}
            heading="Where you're going"
            collapsedByDefault
          />
        </div>
      )}

      {active === "lock" && (
        <div className="space-y-5">
          <ConceptStudio snapshot={snapshot} onChanged={onSaved} />
          <details className="rounded-2xl border border-white/10 bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Where this came from — research sources
            </summary>
            <div className="mt-4">
              <ResearchPanel snapshot={snapshot} />
            </div>
          </details>
        </div>
      )}

      {/* Sticky CTA bar — always visible, explains exactly what's blocking continue. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={goPrev} disabled={active === "setup"}>
            ← Back
          </Button>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {savingNow ? "Saving…" : savedAt ? `Saved ${timeAgo(savedAt)}` : "Changes auto-save"}
          </div>
          {!isLast ? (
            <Button onClick={goNext}>
              Next: {SUB_STEPS[SUB_STEPS.findIndex((s) => s.key === active) + 1].label} →
            </Button>
          ) : (
            <Button
              onClick={() => advance.mutate()}
              disabled={advance.isPending || !locked}
              title={!locked ? "Lock your concept above to continue" : undefined}
            >
              {advance.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Continue to assets →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Source library for this venture — single source of truth for documents that
 * feed enrichment. Reads `attendee_documents` scoped to `snapshot_id`, lets
 * the founder add or remove files, and rebuilds `source_materials` (and
 * triggers re-extraction) without ever asking them to re-upload something
 * we already have.
 */
function SourceRecoveryPanel({ snapshot, onSaved }: { snapshot: any; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sources, setSources] = useState<VentureSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const sm = snapshot.source_materials ?? null;
  const legacyDocCount = (sm?.documents ?? []).length ?? 0;

  const refresh = useCallback(async () => {
    setLoadingSources(true);
    try {
      const rows = await listVentureSources({ snapshotId: snapshot.id });
      setSources(rows);
    } finally {
      setLoadingSources(false);
    }
  }, [snapshot.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFiles = useCallback(async (incoming: File[]) => {
    const accepted = incoming.slice(0, 5).filter((f) => f.size <= 20 * 1024 * 1024);
    if (incoming.some((f) => f.size > 20 * 1024 * 1024)) toast.error("Some files were over 20 MB and were skipped");
    if (!accepted.length) return;
    setUploading(true);
    try {
      for (const file of accepted) {
        try {
          await uploadVentureSource({
            file,
            snapshotId: snapshot.id,
            kind: "venture_source",
            waitForExtraction: true,
          });
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
        }
      }
      await refresh();
      toast.success("Saved to your venture library");
    } finally {
      setUploading(false);
    }
  }, [snapshot.id, refresh]);

  const qc = useQueryClient();
  const rebuild = useMutation({
    mutationFn: async () => {
      setRebuilding(true);
      const fresh = await listVentureSources({ snapshotId: snapshot.id });
      await appendSnapshotSources({
        data: {
          id: snapshot.id,
          source_materials: {
            documents: fresh
              .filter((s) => (s.extracted_text ?? "").trim().length > 0)
              .map((s) => ({ filename: s.original_name, text: s.extracted_text ?? "" })),
            conceptDraft: snapshot.business_concept ?? "",
          },
        },
      });
      // Actually trigger the AI enrichment pass against the freshly-merged
      // library. Without this, the form fields never change and the button
      // is a no-op on content quality.
      await retryEnrichment({ data: { id: snapshot.id } });
    },
    onSuccess: () => {
      setRebuilding(false);
      toast.success("Re-enriching your brief from the full library — this takes ~30–60s.");
      try { window.dispatchEvent(new CustomEvent("venture-sources:changed")); } catch {}
      qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshot.id] });
      onSaved();
    },
    onError: (e) => {
      setRebuilding(false);
      toast.error(e instanceof Error ? e.message : "Could not rebuild");
    },
  });

  const readyCount = sources.filter((s) => (s.extracted_text ?? "").trim().length > 0).length;
  const totalCount = sources.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-card/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Venture source library</h3>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            {loadingSources ? "Loading…" : totalCount === 0
              ? legacyDocCount > 0
                ? `This venture has ${legacyDocCount} legacy source text${legacyDocCount === 1 ? "" : "s"} attached but no uploaded files. Add your founder docs once and they'll stay here for every future enrichment.`
                : "Add the founder docs once. We'll keep them attached to this venture and feed them into every re-extraction."
              : `${readyCount} of ${totalCount} file${totalCount === 1 ? "" : "s"} ready to use as context.`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          Add docs
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.markdown,.rtf,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,image/*"
        className="hidden"
        onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(Array.from(e.dataTransfer.files ?? []));
        }}
        className={`mt-3 rounded-xl border border-dashed p-4 text-center text-sm transition ${dragOver ? "border-foreground bg-background" : "border-border bg-background/40"}`}
      >
        Drop PDF, DOCX, TXT, Markdown, or image files here
      </div>
      {sources.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {sources.map((s) => {
            const ready = (s.extracted_text ?? "").trim().length > 0;
            return (
              <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{s.original_name}</span>
                <span className={`shrink-0 ${ready ? "text-status-success" : s.extraction_error ? "text-status-danger" : "text-muted-foreground"}`}>
                  {ready
                    ? `${Math.round((s.extracted_text ?? "").length / 1000)}k chars`
                    : s.extraction_error
                      ? "Unreadable"
                      : "Processing…"}
                </span>
                {s.extraction_error && (
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retry extraction"
                    onClick={async () => { await retryExtraction(s.id); await refresh(); }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Remove"
                  onClick={async () => { await deleteVentureSource(s.id); await refresh(); }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {readyCount > 0 && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={() => rebuild.mutate()} disabled={rebuilding}>
            {rebuilding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
            Rebuild enriched brief from library
          </Button>
        </div>
      )}
    </div>
  );
}


function timeAgo(d: Date): string {
  const s = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return d.toLocaleTimeString();
}

// Sticky sub-stepper with completeness dots. Lets advanced users jump around;
// novices read it left-to-right as a checklist.
function ReviewSubStepper({
  active, completeness, onJump, savedAt, savingNow,
}: {
  active: SubStepKey;
  completeness: Record<SubStepKey, boolean>;
  onJump: (k: SubStepKey) => void;
  savedAt: Date | null;
  savingNow: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-2 rounded-2xl border border-white/10 bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {SUB_STEPS.map((s, i) => {
          const isActive = s.key === active;
          const isDone = completeness[s.key];
          return (
            <li key={s.key} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onJump(s.key)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition ${
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : isDone
                      ? "border-status-success/40 bg-status-success/10 text-status-success hover:border-status-success/60"
                      : "border-white/10 text-muted-foreground hover:border-white/25"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                <span className="font-semibold">3.{s.n}</span>
                <span>{s.label}</span>
              </button>
              {i < SUB_STEPS.length - 1 && <span className="text-muted-foreground/40">·</span>}
            </li>
          );
        })}
        <li className="ml-auto text-[11px] text-muted-foreground">
          {savingNow ? "Saving…" : savedAt ? `Saved ${timeAgo(savedAt)}` : "Auto-saves as you type"}
        </li>
      </ol>
    </div>
  );
}

// 3.1 — read-only summary of Founder & Market with a single "Edit details" affordance.
// Avoids re-rendering the giant form (and the duplicate Track grid) on this page.
function SetupSubStep({ snapshot, onSaved }: { snapshot: any; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const track = getTrack(snapshot.track as TrackKey | undefined);
  const rows: { label: string; value: string; missing?: boolean }[] = [
    { label: "Founder", value: snapshot.founder_name || "—", missing: !snapshot.founder_name },
    { label: "Email", value: snapshot.founder_email || "—", missing: !snapshot.founder_email },
    { label: "Phone", value: snapshot.founder_phone || "—" },
    { label: "Location", value: [snapshot.city, snapshot.region, snapshot.country].filter(Boolean).join(", ") || "—" },
    { label: "Market scope", value: snapshot.market_scope ? String(snapshot.market_scope) : "—" },
    { label: "Industry", value: [snapshot.industry, snapshot.sub_industry].filter(Boolean).join(" · ") || "—", missing: !snapshot.industry },
    { label: "Track", value: track?.label || "—", missing: !snapshot.track },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Founder & market</h3>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit details</Button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 text-sm last:border-b-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className={`text-right ${r.missing ? "text-status-warning" : ""}`}>
              {r.missing && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-status-warning align-middle" />}
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        You chose your track on step 1. Use <button className="underline" onClick={() => setEditing(true)}>Edit details</button> if anything here is off.
      </p>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit founder &amp; market</DialogTitle>
            <DialogDescription>
              Update the founder, market, and track details used to generate this startup kit.
            </DialogDescription>
          </DialogHeader>
          <FounderMarketCard snapshot={snapshot} onSaved={() => { onSaved(); setEditing(false); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reusable per-section editor with plain-English helpers and per-field "Looks good" toggles.
function FieldGroup({
  sectionKey, form, setField, heading, collapsedByDefault, contextChips, provenanceMap,
}: {
  sectionKey: "foundation" | "market" | "operations" | "vision";
  form: Record<string, Record<string, string>>;
  setField: (section: string, key: string, value: string) => void;
  heading?: string;
  collapsedByDefault?: boolean;
  contextChips?: { label: string; value?: string }[];
  provenanceMap?: Record<string, string>;
}) {
  const section = REVIEW_SECTIONS.find((s) => s.key === sectionKey)!;
  const [open, setOpen] = useState(!collapsedByDefault);

  const body = (
    <div className="space-y-4">
      {contextChips && contextChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {contextChips.filter((c) => c.value).map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/80">{c.label}:</span> {c.value}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {section.fields.map((f) => {
          const value = form[sectionKey]?.[f.key] ?? "";
          const filled = isFieldFilled(value);
          const provSource = provenanceMap?.[`${sectionKey}.${f.key}`] ?? "";
          const provLabel = filled && provSource ? provenanceLabel(provSource) : "";
          return (
            <div key={f.key} className={`grid gap-1.5 ${f.multiline ? "md:col-span-2" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">
                  {f.label}
                  {f.optional && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">optional</span>}
                </Label>
                {filled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-status-success">
                    <CheckCircle2 className="h-3 w-3" /> Looks good
                  </span>
                ) : !f.optional ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-status-warning">
                    <Circle className="h-3 w-3" /> Needs your input
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{f.helper}</p>
              {f.multiline ? (
                <Textarea rows={3} value={value} onChange={(e) => setField(sectionKey, f.key, e.target.value)} placeholder={f.example} />
              ) : (
                <Input value={value} onChange={(e) => setField(sectionKey, f.key, e.target.value)} placeholder={f.example} />
              )}
              {provLabel && (
                <p className="text-[11px] text-muted-foreground/80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 align-middle mr-1.5" />
                  Pulled in {provLabel} — edit if you want to refine it here.
                </p>
              )}
              {f.example && f.multiline && !provLabel && (
                <p className="text-[11px] italic text-muted-foreground/70">e.g. {f.example}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!heading) return <div className="rounded-2xl border border-white/10 bg-card p-5">{body}</div>;

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="mb-3 flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold">{heading}</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && body}
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
  const [rewriteTarget, setRewriteTarget] = useState<{ type: string; name: string } | null>(null);
  const [intakeTarget, setIntakeTarget] = useState<IntakeTarget>(null);
  const brandStudioRef = useRef<HTMLElement | null>(null);
  const [bonusOpen, setBonusOpen] = useState(true);

  // Guided vs advanced UI density. Persisted per-snapshot so returning users keep their choice.
  const viewModeKey = `hub:viewMode:${snapshot.id}`;
  const [viewMode, setViewModeState] = useState<HubViewMode>(() => {
    if (typeof window === "undefined") return "guided";
    const stored = window.localStorage.getItem(viewModeKey);
    return stored === "advanced" ? "advanced" : "guided";
  });
  const setViewMode = useCallback((v: HubViewMode) => {
    setViewModeState(v);
    try { window.localStorage.setItem(viewModeKey, v); } catch {}
  }, [viewModeKey]);
  const isGuided = viewMode === "guided";

  const brandKitQ = useQuery({
    queryKey: ["brandKit", snapshot.id],
    queryFn: () => getBrandKit(snapshot.id),
    refetchInterval: 8000,
  });
  const brandKit = brandKitQ.data ?? null;
  const brandKitLocked = brandKit?.status === "locked";
  // A provisional kit we inferred from finished assets also unblocks generation.
  const brandKitInferred = brandKit?.status === "auto";
  const brandKitReady = brandKitLocked || brandKitInferred;
  const brandKitLockedAt = brandKit?.locked_at ?? null;


  const openBrandWizard = useCallback(() => {
    setBonusOpen(true);
    if (brandStudioRef.current) {
      brandStudioRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const genOne = useMutation({
    mutationFn: (vars: { documentType: string; rewriteFeedback?: string; rewriteTags?: string[]; intakeAnswers?: Record<string, any> }) =>
      generateDocument({ data: { snapshotId: snapshot.id, ...vars } }),
    onSuccess: () => { toast.success("Asset ready"); qc.invalidateQueries({ queryKey: ["hub"] }); },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Generation failed";
      if (/brand_kit_required|Brand Wizard/i.test(msg)) {
        toast.error("Finish the Brand Wizard first — it powers this deliverable.");
        openBrandWizard();
      } else {
        toast.error(msg);
      }
    },
  });

  const bulk = useMutation({
    mutationFn: (vars: { category?: string | null; retryOnly?: boolean; days?: number[] } | undefined) =>
      bulkGenerate({
        data: {
          snapshotId: snapshot.id,
          category: vars?.category ?? null,
          retryOnly: vars?.retryOnly === true,
          days: vars?.days,
        },
      }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars?.days?.length
          ? `Finishing Day ${vars.days.join(", ")}…`
          : vars?.retryOnly
            ? "Trying those again…"
            : vars?.category
              ? `Writing the ${vars.category} section…`
              : "We'll keep writing in the background",
      );
      qc.invalidateQueries({ queryKey: ["hub"] });
    },


    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Couldn't start";
      if (msg === "unlock_required") setShowUnlock(true);
      else toast.error(msg);
    },
  });

  const [showUnlock, setShowUnlock] = useState(false);
  const [openDeckSlug, setOpenDeckSlug] = useState<string | null>(null);
  const [openDayDeck, setOpenDayDeck] = useState<LaunchDay | null>(null);


  // Per-section open/collapse state (persisted per snapshot)
  const openSectionsKey = `hub:sectionOpen:${snapshot.id}`;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(`hub:sectionOpen:${snapshot.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(openSectionsKey, JSON.stringify(openSections));
    } catch {}
  }, [openSections, openSectionsKey]);
  const toggleSection = useCallback((cat: string) => {
    setOpenSections((prev) => ({ ...prev, [cat]: !(prev[cat] ?? false) }));
  }, []);

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

  const blockedQ = useQuery({
    queryKey: ["hub", "blocked", snapshot.id],
    queryFn: () => listBlockedDocs({ data: { snapshotId: snapshot.id } }),
    refetchInterval: 15000,
  });


  // Sourcing assets are always surfaced; when the venture isn't classified as physical,
  // the UI badges them "Physical products only" and excludes them from required counters.
  const SOURCING_ONLY_TYPES = useMemo(
    () => new Set(["supplier_shortlist", "bom_and_landed_cost"]),
    [],
  );
  const isPhysical = (snapshot as any)?.sourcing_profile?.is_physical_product === true;
  const types = typesQ.data ?? [];
  const docs = docsQ.data ?? [];
  const docByType = useMemo(() => new Map(docs.map((d) => [d.document_type, d])), [docs]);
  const typeByKey = useMemo(() => new Map(types.map((t: any) => [t.type, t])), [types]);
  // For non-physical ventures, sourcing assets are optional — exclude them from headline totals
  // so counters like "48/48 assets ready" reflect what the founder actually needs to ship.
  // Assets the server has recorded as not applicable to this venture never
  // count toward the total — otherwise the counter parks below 100% forever.
  const notApplicableKeys = useMemo(
    () => new Set(docs.filter((d: any) => d.status === "not_applicable").map((d: any) => d.document_type)),
    [docs],
  );
  const requiredTypes = (isPhysical
    ? types
    : types.filter((t: any) => !SOURCING_ONLY_TYPES.has(t.type))
  ).filter((t: any) => !notApplicableKeys.has(t.type));

  const completedKeys = new Set(docs.filter((d) => d.status === "complete").map((d) => d.document_type));
  const completeCount = new Set(
    docs
      .filter((d) => d.status === "complete")
      .map((d) => d.document_type)
      .filter((k) => requiredTypes.some((t: any) => t.type === k)),
  ).size;
  const total = requiredTypes.length;
  const job = jobQ.data;
  const jobRunning = job?.status === "running" || job?.status === "queued";
  const blocked = (blockedQ.data ?? []) as { document_type: string; blocked_reason: string }[];
  const blockedKeys = new Set(blocked.map((b) => b.document_type));
  // Only surface real errors here — anything waiting on the founder shows in
  // the "Needs you" group instead.
  const failures = (failuresQ.data ?? []).filter((f: any) => !blockedKeys.has(f.document_type));
  const retryRound = (job as any)?.retry_round ?? 0;
  const retryRemaining = (job as any)?.retry_remaining ?? 0;


  useEffect(() => {
    const readyHeroPaths = docs
      .filter((d: any) => d?.hero_image_path && d?.hero_image_status === "ready")
      .map((d: any) => d.hero_image_path as string);
    if (!readyHeroPaths.length) return;
    const frame = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          readyHeroPaths.forEach((path) => getSignedStorageUrl("venture-doc-images", path, 3600).catch(() => {}));
        }, { timeout: 1500 })
      : window.setTimeout(() => {
          readyHeroPaths.forEach((path) => getSignedStorageUrl("venture-doc-images", path, 3600).catch(() => {}));
        }, 300);
    return () => {
      if (window.cancelIdleCallback && typeof frame === "number") window.cancelIdleCallback(frame);
      else window.clearTimeout(frame as number);
    };
  }, [docs]);

  // Stale = doc was generated before the concept was last locked/updated.
  const conceptChangedAt = snapshot?.concept_locked_at ?? snapshot?.updated_at ?? null;
  const isStale = (d: any) => {
    if (!d || d.status !== "complete") return false;
    const docAt = d.updated_at ? new Date(d.updated_at).getTime() : 0;
    if (!docAt) return false;
    const cAt = conceptChangedAt ? new Date(conceptChangedAt).getTime() : 0;
    if (cAt > 0 && cAt - docAt > 60_000) return true;
    // Brand-kit-dependent deliverables also go stale when the brand kit was
    // re-locked after the doc was generated.
    if (BRAND_KIT_REQUIRED_TYPES.has(d.document_type) && brandKitLockedAt) {
      const bAt = new Date(brandKitLockedAt).getTime();
      if (bAt > 0 && bAt - docAt > 60_000) return true;
    }
    return false;
  };
  const staleDocs = docs.filter(isStale);
  const staleCount = staleDocs.length;

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

  // Per-category progress
  const categoryProgress = useMemo(() => {
    return categories.map(([cat, items]) => {
      const done = items.filter((t: any) => completedKeys.has(t.type)).length;
      return { cat, total: items.length, done, complete: done === items.length };
    });
  }, [categories, completedKeys]);

  const nextCategory = categoryProgress.find((c) => !c.complete) ?? null;

  // Per-category facilitator deck state: unlocked once every prior category is complete.
  const deckStateByCat = useMemo(() => {
    const m = new Map<string, { slug: string; available: boolean; unlocked: boolean; prevLabel?: string }>();
    let allPriorDone = true;
    let prevLabel: string | undefined;
    for (const c of categoryProgress) {
      const slug = slugify(c.cat);
      const deck = STAGE_DECKS.find((d) => d.slug === slug);
      m.set(c.cat, { slug, available: !!deck?.available, unlocked: allPriorDone, prevLabel });
      if (!c.complete) allPriorDone = false;
      prevLabel = c.cat;
    }
    return m;
  }, [categoryProgress]);

  // ---- Hero state machine ----
  let heroTitle: string;
  let heroSub: string;
  let heroPrimary: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean } | null = null;
  let heroSecondary: { label: string; onClick: () => void } | null = null;
  let heroTertiary: { label: string; onClick: () => void } | null = null;
  let heroShowProgress = false;
  let heroDone = false;

  if (jobRunning) {
    heroTitle = "We're writing your assets…";
    heroSub = currentDocLabel
      ? `Working on: ${currentDocLabel}. You can leave this page — we'll keep going in the background.`
      : "You can leave this page — we'll keep going in the background.";
    heroShowProgress = true;
    if (job?.id) {
      heroSecondary = { label: job.cancel_requested ? "Stopping…" : "Stop", onClick: () => cancel.mutate(job.id) };
    }
  } else if (!nextCategory) {
    heroTitle = "Your startup kit is ready";
    heroSub = `All ${total} assets are ready. Open any one below to read or download.`;
    heroDone = true;
    heroPrimary = {
      label: "View first asset",
      onClick: () => {
        const first = docs.find((d: any) => d.status === "complete");
        if (first) setViewerDoc(first);
      },
    };
    heroSecondary = { label: "Generate all (re-run)", onClick: () => setShowUnlock(true) };
  } else {
    const isFirstRun = completeCount === 0;
    const remaining = total - completeCount;
    const nextRemaining = nextCategory.total - nextCategory.done;
    heroTitle = isFirstRun
      ? "Let's build your startup kit, one section at a time"
      : "Pick up where you left off";
    heroSub = isFirstRun
      ? `We'll write your ${total} assets in guided sections — Foundation first, then Strategy, Operations, and the rest. Generate one section, read it, then move on.`
      : `${completeCount} of ${total} done — ${remaining} remaining. Next section: ${nextCategory.cat}.`;
    heroShowProgress = !isFirstRun;
    if (isFirstRun) {
      heroPrimary = {
        label: `Generate ${nextCategory.cat} (${nextRemaining} doc${nextRemaining === 1 ? "" : "s"})`,
        onClick: () => bulk.mutate({ category: nextCategory.cat }),
        disabled: bulk.isPending,
        loading: bulk.isPending,
      };
      heroSecondary = { label: `Generate all ${total}`, onClick: () => setShowUnlock(true) };
    } else {
      heroPrimary = {
        label: `Generate remaining ${remaining} doc${remaining === 1 ? "" : "s"}`,
        onClick: () => bulk.mutate({ category: null }),
        disabled: bulk.isPending,
        loading: bulk.isPending,
      };
      heroSecondary = {
        label: `Just ${nextCategory.cat} (${nextRemaining})`,
        onClick: () => bulk.mutate({ category: nextCategory.cat }),
      };
      heroTertiary = { label: `Re-run all ${total}`, onClick: () => setShowUnlock(true) };
    }
  }

  const pct = jobRunning
    ? (job?.progress_pct ?? 0)
    : total > 0
      ? Math.round((completeCount / total) * 100)
      : 0;

  return (
    <div className="theme-dark-scope space-y-6 rounded-2xl bg-background p-4 text-foreground sm:p-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardWelcomeStrip snapshotId={snapshot.id} hasProgress={completeCount > 0} />
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      <ShareLinkBar snapshotId={snapshot.id} />

      {/* Hero — either the generate/next-action card, OR the Founder Roadmap once the kit is done */}
      {heroDone ? (
        <FounderRoadmapCard snapshot={snapshot} documentCount={completeCount} docs={docs} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-card p-6">
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
                <Button size="sm" variant="outline" onClick={heroSecondary.onClick} disabled={bulk.isPending}>
                  {heroSecondary.label}
                </Button>
              )}
              {heroTertiary && (
                <Button size="sm" variant="ghost" onClick={heroTertiary.onClick}>
                  {heroTertiary.label}
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
              {retryRound > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retrying {retryRemaining} asset{retryRemaining === 1 ? "" : "s"} (round {retryRound} of 3)…
                </p>
              )}
            </div>
          )}

          {/* Waiting on the founder — never retried automatically. */}
          {blocked.length > 0 && (
            <div className="mt-3 rounded-lg border border-status-warning/20 bg-status-warning/5 p-3 text-xs text-status-warning">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  Needs you — {blocked.length} asset{blocked.length === 1 ? "" : "s"} waiting
                </span>
                <Button size="sm" variant="outline" onClick={openBrandWizard}>
                  Open Brand Wizard
                </Button>

              </div>
              <p className="mt-1 opacity-90">{blocked[0].blocked_reason}</p>
            </div>
          )}

          {/* Real errors — only shown once every retry round has been used. */}
          {failures.length > 0 && !jobRunning && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowFailures((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-status-warning hover:text-status-warning/80"
                >
                  <AlertCircle className="h-3 w-3" />
                  {failures.length} asset{failures.length === 1 ? "" : "s"} couldn't be written yet
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulk.isPending}
                  onClick={() => bulk.mutate({ retryOnly: true })}
                >
                  {bulk.isPending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                  Try these again
                </Button>
              </div>
              {showFailures && (
                <ul className="space-y-1 rounded-lg border border-status-warning/20 bg-status-warning/5 p-2 text-xs text-status-warning">
                  {failures.slice(0, 6).map((f: any) => {
                    const t = typeByKey.get(f.document_type) as any;
                    return <li key={f.id}><span className="font-medium">{t?.name ?? f.document_type}</span> — {f.error}</li>;
                  })}
                </ul>
              )}
            </div>
          )}

        </div>
      )}


      {/* The whole build, end to end, as one thing the founder can argue with. */}
      <TimelineHubCard
        snapshotId={snapshot.id}
        timeline={(snapshot as any).venture_timeline}
        scenario={(snapshot as any).venture_timeline_scenario}
        metrics={(snapshot as any).executive_metrics}
        onOpenAsset={(key) => {
          const d = docs.find((x: any) => x.document_type === key);
          if (d) setViewerDoc(d);
          else toast.info("That asset hasn't been written yet.");
        }}
      />

      <div className="space-y-3">
        <SectionIntro copy={HUB_DASHBOARD_INTROS.sprint} variant={isGuided ? "minimal" : "full"} />

        <LaunchPlanner14Day
        docs={docs}
        typeByKey={typeByKey}
        completedKeys={completedKeys}
        isPhysical={isPhysical}
        sourcingOnlyKeys={SOURCING_ONLY_TYPES}
        onOpenDoc={(d) => setViewerDoc(d)}
        onGenerateDoc={(key) => {
          const t = typeByKey.get(key) as any;
          if (!t) return;
          if (t.intake_schema) {
            const d = docs.find((x: any) => x.document_type === key);
            setIntakeTarget({
              type: t.type,
              name: t.name,
              schema: t.intake_schema,
              initial: d?.intake_answers ?? null,
              isRegenerate: false,
            });
          } else {
            genOne.mutate({ documentType: key });
          }
        }}
        onScrollToDoc={(key) => {
          const el = document.getElementById(`doc-${key}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-primary");
            setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1600);
          }
        }}
        isGeneratingKey={(key) => genOne.isPending && genOne.variables?.documentType === key}
        jobRunning={jobRunning}
        onOpenDayDeck={(d) => setOpenDayDeck(d)}
        onFinishDay={(d) => bulk.mutate({ days: [d.day] })}
        snapshotId={snapshot.id}
      />
      </div>



      {/* Stale-concept banner — full in advanced, compact chip in guided */}
      {staleCount > 0 && (
        isGuided ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-status-warning/40 bg-status-warning/10 px-3 py-1 text-xs text-status-warning">
            <RefreshCw className="h-3 w-3" />
            {staleCount} asset{staleCount === 1 ? "" : "s"} out of date · rewrite to match concept
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
            <div className="flex items-start gap-2">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Concept changed since last generation</div>
                <div className="text-xs opacity-90">
                  {staleCount} asset{staleCount === 1 ? "" : "s"} {staleCount === 1 ? "was" : "were"} written before your latest concept update. Rewrite them to match.
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Document list header */}
      {isGuided ? (
        <h2 className="px-1 text-lg font-semibold tracking-tight">Your assets</h2>
      ) : (
        <SectionIntro
          copy={HUB_DASHBOARD_INTROS.library}
          actions={
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setOpenSections(Object.fromEntries(categories.map(([c]) => [c, true])))}
              >
                <ChevronsUpDown className="mr-1 h-3 w-3" />
                Expand all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setOpenSections(Object.fromEntries(categories.map(([c]) => [c, false])))}
              >
                <ChevronsDownUp className="mr-1 h-3 w-3" />
                Collapse all
              </Button>
            </>
          }
        />
      )}


      {/* Category stepper — jump-nav, advanced only. In guided mode the section headers directly below already convey progress. */}
      {!isGuided && categoryProgress.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categoryProgress.map((c, i) => {
            const active = !jobRunning && nextCategory?.cat === c.cat;
            const tone = c.complete
              ? "border-status-success/40 bg-status-success/10 text-status-success"
              : active
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-white/10 text-muted-foreground";
            return (
              <span key={c.cat} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${tone}`}>
                <span className="font-medium">{i + 1}. {c.cat}</span>
                <span className="opacity-70">{c.done}/{c.total}</span>
                {c.complete && <CheckCircle2 className="h-3 w-3" />}
              </span>
            );
          })}
        </div>
      )}

      {categories.map(([cat, items], catIndex) => {
        const catDone = items.filter((t: any) => completedKeys.has(t.type)).length;
        const catTotal = items.length;
        const catComplete = catDone === catTotal;
        const catGenerating = jobRunning && bulk.variables?.category === cat;
        const deck = deckStateByCat.get(cat);
        const isActive = !jobRunning && nextCategory?.cat === cat;
        const isLocked = deck ? !deck.unlocked && !catComplete : false;
        const defaultOpen = isActive || (catDone > 0 && !catComplete);
        const isOpen = openSections[cat] ?? defaultOpen;
        const status: "complete" | "in_progress" | "not_started" | "locked" | "generating" = catGenerating
          ? "generating"
          : catComplete
            ? "complete"
            : isLocked
              ? "locked"
              : catDone > 0
                ? "in_progress"
                : isActive
                  ? "in_progress"
                  : "not_started";
        const contentId = `hub-section-${slugify(cat)}`;
        const headerActions = (
          <CategoryActions
            mode={viewMode}
            deck={deck}
            catDone={catDone}
            catComplete={catComplete}
            catGenerating={catGenerating}
            disabled={bulk.isPending || jobRunning}
            catLabel={cat}
            onOpenDeck={(slug) => setOpenDeckSlug(slug)}
            onRegenerate={() => {
              // No client-side brand gate: if the Brand Wizard isn't locked the
              // server infers a provisional kit from finished assets.
              bulk.mutate({ category: cat });
            }}

          />
        );
        return (
        <Collapsible key={cat} open={isOpen} onOpenChange={() => toggleSection(cat)} asChild>
          <section className="space-y-3">
            <SectionHeader
              cat={cat}
              index={catIndex}
              done={catDone}
              total={catTotal}
              isOpen={isOpen}
              onToggle={() => toggleSection(cat)}
              status={status}
              contentId={contentId}
              actions={headerActions}
            />
            <CollapsibleContent
              id={contentId}
              className="overflow-hidden data-[state=closed]:hidden"
            >
              <div className="grid gap-3 pt-1 md:grid-cols-2">
            {items.map((t) => {
              const d = docByType.get(t.type);
              const deps = (t.dependencies ?? []) as string[];
              const depsMet = deps.every((dep) => completedKeys.has(dep));
              const status = d?.status ?? "pending";
              const isComplete = status === "complete";
              const hasReadableContent = Boolean(d?.content && String(d.content).trim().length > 0);
              const generating = status === "generating" || (genOne.isPending && genOne.variables?.documentType === t.type);
              const needsBrandKit = BRAND_KIT_REQUIRED_TYPES.has(t.type);
              const brandGated = needsBrandKit && !brandKitReady;
              const Icon = isComplete ? CheckCircle2 : brandGated ? Lock : depsMet ? Circle : Lock;
              const tone = isComplete ? "text-status-success" : depsMet && !brandGated ? "text-foreground" : "text-muted-foreground";

              let statusLine: string;
              if (isComplete) statusLine = "Ready to read";
              else if (generating && hasReadableContent) statusLine = "Updating… previous version available";
              else if (generating) statusLine = "Writing now…";
              else if (status === "failed") statusLine = "Needs another try";
              else if (brandGated) statusLine = "We'll infer your brand from finished assets";
              else if (!depsMet) {
                const missing = deps.find((dep) => !completedKeys.has(dep));
                const missingLabel = missing ? ((typeByKey.get(missing) as any)?.name ?? missing) : "earlier assets";
                statusLine = `Waiting on ${missingLabel}`;
              } else statusLine = "Not started yet";

              const stale = isStale(d);
              const staleLabel = needsBrandKit && brandKitLockedAt && d?.updated_at && new Date(brandKitLockedAt).getTime() - new Date(d.updated_at).getTime() > 60_000
                ? "Brand updated"
                : "Concept updated";
              return (
                <div key={t.type} id={`doc-${t.type}`} className={`scroll-mt-24 rounded-xl border bg-card p-4 transition-shadow ${stale ? "border-status-warning/40" : brandGated ? "border-primary/30" : "border-white/10"}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`mt-0.5 h-4 w-4 ${tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="truncate text-sm font-medium">{t.name}</h4>
                        <TrackChip track={trackFor(t.type)} />
                        {needsBrandKit && brandKitInferred && (
                          <Badge variant="outline" className="border-status-warning/40 text-[10px] text-status-warning">
                            Brand inferred — review in Wizard
                          </Badge>
                        )}
                        {needsBrandKit && !brandKitInferred && (
                          <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                            Uses your Brand Kit
                          </Badge>
                        )}
                        {(d as any)?.intake_source === "derived" && (
                          <Badge variant="outline" className="border-status-warning/40 text-[10px] text-status-warning">
                            Assumptions used — review inputs
                          </Badge>
                        )}
                        {(d as any)?.status === "not_applicable" && (
                          <Badge variant="outline" className="border-white/20 text-[10px] text-muted-foreground">
                            Doesn't apply to this venture
                          </Badge>
                        )}


                        {stale && (
                          <Badge variant="outline" className="border-status-warning/40 text-[10px] text-status-warning">
                            {staleLabel}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      <div className="mt-1 text-[10px] text-muted-foreground">{statusLine} · ~{t.estimated_minutes} min</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brandGated && !isComplete ? (
                      <Button size="sm" variant="outline" onClick={openBrandWizard}>
                        <Sparkles className="mr-1 h-3 w-3" /> Open Brand Wizard
                      </Button>
                    ) : isComplete || hasReadableContent ? (
                      <Button size="sm" onClick={() => setViewerDoc(d)}>
                        <Eye className="mr-1 h-3 w-3" /> Read
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!depsMet || generating || jobRunning}
                        onClick={() => {
                          if (t.intake_schema) {
                            setIntakeTarget({
                              type: t.type,
                              name: t.name,
                              schema: t.intake_schema,
                              initial: d?.intake_answers ?? null,
                              isRegenerate: false,
                            });
                          } else {
                            genOne.mutate({ documentType: t.type });
                          }
                        }}
                        title={!depsMet ? "Finish earlier assets first" : undefined}
                      >
                        {generating ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Writing…</>
                        ) : (
                          <><Play className="mr-1 h-3 w-3" />{t.intake_schema ? "Start" : "Generate"}</>
                        )}
                      </Button>
                    )}
                    {isComplete && !brandGated && (
                      <Button
                        size="sm"
                        variant={stale ? "default" : "outline"}
                        onClick={() => genOne.mutate({ documentType: t.type })}
                        disabled={jobRunning || generating}
                        title="Rebuild this asset with your current brand — no notes needed"
                      >
                        {generating ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Rebuilding…</>
                        ) : (
                          <><RefreshCw className="mr-1 h-3 w-3" />Regenerate</>
                        )}
                      </Button>
                    )}
                    {isComplete && (

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (brandGated) {
                            openBrandWizard();
                            return;
                          }
                          if (t.intake_schema) {
                            setIntakeTarget({
                              type: t.type,
                              name: t.name,
                              schema: t.intake_schema,
                              initial: d?.intake_answers ?? null,
                              isRegenerate: true,
                            });
                          } else {
                            setRewriteTarget({ type: t.type, name: t.name });
                          }
                        }}
                        disabled={jobRunning || generating}
                      >
                        {t.intake_schema ? "Edit & regenerate" : "Rewrite"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {String(cat).toLowerCase().includes("foundation") && (
              <div className="md:col-span-2">
                <LegalSetupCard />
              </div>
            )}
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
        );
      })}

      {/* Bonus tools - deferred. Brand Wizard lives here and is required for Website PRD. */}
      {(() => {
        const bonusIndex = categories.length;
        const bonusStatus: "complete" | "in_progress" | "not_started" = brandKitLocked
          ? "complete"
          : "in_progress";
        return (
          <section
            ref={brandStudioRef as any}
            id="brand-studio"
            className="theme-dark-scope space-y-3 scroll-mt-24 rounded-2xl bg-background p-3 text-foreground sm:p-4"
          >

            <SectionHeader
              cat="Brand Wizard & bonus tools"
              index={bonusIndex}
              done={brandKitLocked ? 1 : 0}
              total={1}
              isOpen={bonusOpen}
              onToggle={() => setBonusOpen((v) => !v)}
              contentId="brand-studio-body"
              status={bonusStatus}
              icon={Wand2}
              label="Brand Wizard & bonus tools"
              tagline="Lock your brand colors, typography and logo — the Website PRD uses them verbatim."
              accentVar="--brand-violet"
              badges={
                !brandKitLocked ? (
                  <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                    Required for Website PRD
                  </Badge>
                ) : null
              }
            />
            {bonusOpen && (
              <div id="brand-studio-body" className="space-y-4 pt-1">
                <BrandStudio snapshot={snapshot} />
                <SocialStudio snapshot={snapshot} />
                <ContentStudio snapshot={snapshot} />
              </div>
            )}
          </section>
        );
      })()}



      <DocumentViewer doc={viewerDoc} open={viewerDoc !== null} onOpenChange={(o) => !o && setViewerDoc(null)} />
      <RewriteFeedbackDialog
        target={rewriteTarget}
        onClose={() => setRewriteTarget(null)}
        onSubmit={(feedback, tags) => {
          if (rewriteTarget) {
            genOne.mutate({ documentType: rewriteTarget.type, rewriteFeedback: feedback, rewriteTags: tags });
          }
          setRewriteTarget(null);
        }}
      />
      <IntakeGatewayDialog
        target={intakeTarget}
        snapshotId={snapshot.id}
        onClose={() => setIntakeTarget(null)}
        onSubmit={(answers) => {
          if (intakeTarget) {
            genOne.mutate({ documentType: intakeTarget.type, intakeAnswers: answers });
          }
          setIntakeTarget(null);
        }}
      />
      <BulkUnlockDialog
        open={showUnlock}
        onOpenChange={setShowUnlock}
        snapshotId={snapshot.id}
        totalDocs={total}
        onUnlocked={() => bulk.mutate({ category: null })}
      />
      <DeckDialog slug={openDeckSlug} onOpenChange={(o) => { if (!o) setOpenDeckSlug(null); }} />
      <DaySprintDeckDialog
        day={openDayDeck}
        typeByKey={typeByKey}
        completedKeys={completedKeys}
        isPhysical={isPhysical}
        sourcingOnlyKeys={SOURCING_ONLY_TYPES}
        onOpenChange={(o) => { if (!o) setOpenDayDeck(null); }}
        onJumpToAsset={(key) => {
          setOpenDayDeck(null);
          setTimeout(() => {
            const el = document.getElementById(`doc-${key}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("ring-2", "ring-primary");
              setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1600);
            }
          }, 100);
        }}
      />

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
        <div className="mt-4 rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-xs">
          <div className="mb-1 font-medium text-status-warning">Needs your input</div>
          <ul className="list-inside list-disc space-y-0.5 text-status-warning">
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
    track: (snapshot.track ?? "") as TrackKey | "",
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

      <div className="grid gap-1.5">
        <Label className="text-xs">Track</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const selected = form.track === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => set("track", t.key)}
                className={`flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition ${
                  selected
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="text-xs font-medium">{t.label}</div>
                <div className="text-[10px] leading-snug text-muted-foreground">{t.oneLiner}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


