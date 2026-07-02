// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper, Lock, ArrowLeft, ArrowRight, Sparkles, Loader2, Calendar, Wand2,
  RefreshCw, Check, Eye, Trash2, Image as ImageIcon, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { getBrandKit } from "@/lib/brandKit.functions";
import { listSnapshotDocuments } from "@/lib/foundersHub.functions";
import {
  parseCalendarPosts, listCalendarPosts, listContentAds, generateContentAd,
  deleteContentAd, getContentProgress, upsertContentProgress, groupPostsByWeek,
  type ContentPost, type ContentAd, type AdAspect,
} from "@/lib/content-autopilot.functions";
import { AssetPreviewDialog, type PreviewableAsset } from "@/components/hub/social/AssetPreviewDialog";
import { RegenerateAssetDialog } from "@/components/hub/social/RegenerateAssetDialog";
import { AssetImage } from "@/components/hub/social/AssetImage";

const ART_DIRECTIONS = [
  { id: "editorial", label: "Editorial" },
  { id: "photographic", label: "Photographic" },
  { id: "geometric", label: "Geometric" },
  { id: "illustrative", label: "Illustrative" },
];

const ASPECTS: { id: AdAspect; label: string; hint: string }[] = [
  { id: "1:1", label: "1:1 square", hint: "Feed default (1080×1080)" },
  { id: "4:5", label: "4:5 portrait", hint: "IG/FB feed native (1080×1350)" },
  { id: "9:16", label: "9:16 story", hint: "Stories/Reels/TikTok (1080×1920)" },
];

// Prefer the source hook over a stored last_headline when the stored value
// looks like a truncated prefix (older versions appended "…"). This keeps the
// regenerate dialog from re-sending a chopped headline.
function pickHeadlineForEdit(hook: string | null | undefined, lastHeadline: string | null | undefined): string | null {
  const h = (hook ?? "").trim();
  const l = (lastHeadline ?? "").trim();
  if (!l) return h || null;
  if (/[…]|\.{3}$/.test(l)) return h || l;
  if (h && l.length < h.length && h.startsWith(l.replace(/[.…]+$/, ""))) return h;
  return l;
}


export function ContentStudio({ snapshot }: { snapshot: any }) {
  const snapshotId: string = snapshot.id;
  const qc = useQueryClient();

  const kitQ = useQuery({ queryKey: ["brandKit", snapshotId], queryFn: () => getBrandKit(snapshotId) });
  const kit = kitQ.data;
  const locked = kit?.status === "locked";

  const docsQ = useQuery({
    queryKey: ["hub", "docs", snapshotId],
    queryFn: () => listSnapshotDocuments({ data: { snapshotId } }),
  });
  const calendarDoc = (docsQ.data ?? []).find(
    (d: any) => d.document_type === "content_calendar_90day" && d.status === "complete",
  );

  const postsQ = useQuery({
    queryKey: ["content-posts", snapshotId],
    queryFn: () => listCalendarPosts(snapshotId),
    enabled: locked && !!calendarDoc,
  });
  const posts = postsQ.data ?? [];

  const adsQ = useQuery({
    queryKey: ["content-ads", snapshotId],
    queryFn: () => listContentAds(snapshotId),
    enabled: locked,
  });
  const ads = adsQ.data ?? [];

  const progQ = useQuery({
    queryKey: ["content-progress", snapshotId],
    queryFn: () => getContentProgress(snapshotId),
    enabled: locked,
  });
  const progress = progQ.data;

  const [step, setStep] = useState(1);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [direction, setDirection] = useState<string>("editorial");
  const [aspects, setAspects] = useState<AdAspect[]>(["1:1"]);
  const [autoRunWeek, setAutoRunWeek] = useState<number | null>(null);

  // Hydrate from progress
  useEffect(() => {
    if (!progress) return;
    if (progress.current_step) setStep(progress.current_step);
    if (progress.selected_weeks?.length) setSelectedWeeks(progress.selected_weeks);
    if (progress.art_direction) setDirection(progress.art_direction);
    if (progress.default_aspects?.length) setAspects(progress.default_aspects);
  }, [progress?.snapshot_id]);

  const persist = async (patch: any) => {
    try { await upsertContentProgress(snapshotId, patch); }
    catch (e: any) { console.warn("content-progress save failed", e); }
  };

  const [parsing, setParsing] = useState(false);
  const runParse = async () => {
    setParsing(true);
    try {
      const r = await parseCalendarPosts(snapshotId);
      await qc.invalidateQueries({ queryKey: ["content-posts", snapshotId] });
      toast.success(`Parsed ${r.count} posts from your 90-day calendar`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to parse calendar");
    } finally {
      setParsing(false);
    }
  };

  // Auto-parse the calendar the first time the user opens Content Studio.
  const [autoParsed, setAutoParsed] = useState(false);
  useEffect(() => {
    if (!locked || !calendarDoc) return;
    if (postsQ.isLoading || parsing || autoParsed) return;
    if ((postsQ.data ?? []).length > 0) return;
    setAutoParsed(true);
    void runParse();
  }, [locked, calendarDoc, postsQ.isLoading, postsQ.data, parsing, autoParsed]);

  // Default the week selector to Week 1 as soon as posts arrive.
  useEffect(() => {
    if (selectedWeeks.length > 0) return;
    const weeks = Array.from(new Set(posts.map((p) => p.week))).sort((a, b) => a - b);
    if (weeks.length === 0) return;
    setSelectedWeeks([weeks[0]]);
  }, [posts, selectedWeeks.length]);

  // ---- Gate ----
  if (kitQ.isLoading || docsQ.isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-4 text-xs text-muted-foreground">
        Loading Content Studio…
      </div>
    );
  }

  if (!locked) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-status-info" />
          <h3 className="text-sm font-semibold">Content Studio</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Brand-gated
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Lock your Brand Wizard first — Content Studio uses your palette, typography and logo to
          keep every ad visually consistent with your channel covers.
        </p>
      </div>
    );
  }

  if (!calendarDoc) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-status-info" />
          <h3 className="text-sm font-semibold">Content Studio</h3>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Generate your <b>90-Day Content Calendar</b> deliverable first — Content Studio turns
          each planned post into a 1:1 / 4:5 / 9:16 social ad using your locked brand kit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-status-info" />
          <h3 className="text-sm font-semibold">Content Studio</h3>
          <Badge variant="outline" className="text-[10px]">Step {step} of 5</Badge>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {ads.length} ads generated · {posts.length} planned posts
        </div>
      </header>

      {step === 1 && (
        <Step1Calendar
          posts={posts}
          parsing={parsing}
          onParse={runParse}
          onNext={async () => { setStep(2); await persist({ current_step: 2 }); }}
          onGenerateNow={async (week) => {
            setSelectedWeeks([week]);
            setAutoRunWeek(week);
            setStep(4);
            await persist({
              current_step: 4,
              selected_weeks: [week],
              art_direction: direction,
              default_aspects: aspects,
            });
          }}
        />
      )}

      {step === 2 && (
        <Step2Weeks
          posts={posts}
          selectedWeeks={selectedWeeks}
          onChange={setSelectedWeeks}
          onBack={() => setStep(1)}
          onNext={async () => {
            if (!selectedWeeks.length) { toast.error("Pick at least one week"); return; }
            setStep(3);
            await persist({ current_step: 3, selected_weeks: selectedWeeks });
          }}
        />
      )}

      {step === 3 && (
        <Step3Style
          direction={direction}
          onDirection={setDirection}
          aspects={aspects}
          onAspects={setAspects}
          onBack={() => setStep(2)}
          onNext={async () => {
            if (!aspects.length) { toast.error("Pick at least one aspect ratio"); return; }
            setStep(4);
            await persist({ current_step: 4, art_direction: direction, default_aspects: aspects });
          }}
        />
      )}

      {step === 4 && (
        <Step4BuildAds
          snapshotId={snapshotId}
          direction={direction}
          aspects={aspects}
          selectedWeeks={selectedWeeks}
          posts={posts}
          ads={ads}
          autoRunWeek={autoRunWeek}
          onAutoRunConsumed={() => setAutoRunWeek(null)}
          onAddWeek={async (week) => {
            const nextWeeks = Array.from(new Set([...selectedWeeks, week])).sort((a, b) => a - b);
            setSelectedWeeks(nextWeeks);
            setAutoRunWeek(week);
            await persist({ selected_weeks: nextWeeks, current_step: 4 });
          }}
          onBack={() => setStep(3)}
          onDone={async () => { setStep(5); await persist({ current_step: 5 }); }}
        />
      )}


      {step === 5 && (
        <Step5Launch
          ads={ads}
          selectedWeeks={selectedWeeks}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}

// ============================================================
// STEP 1 — Parse the calendar
// ============================================================
function Step1Calendar({
  posts, parsing, onParse, onNext, onGenerateNow,
}: {
  posts: ContentPost[]; parsing: boolean; onParse: () => Promise<void>; onNext: () => void;
  onGenerateNow: (week: number) => Promise<void> | void;
}) {
  const grouped = groupPostsByWeek(posts);
  const weeks = Array.from(grouped.keys()).sort((a, b) => a - b);
  const firstWeek = weeks[0];
  const week1Posts = firstWeek != null ? (grouped.get(firstWeek) ?? []) : [];
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" /> 1 · Read your 90-day calendar
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          We parse each week's planned posts (Hook, Body, CTA, Pillar) so we can turn them into
          brand-consistent ad creatives.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-background/40 p-4 text-xs">
          {parsing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Reading your 90-day content calendar…
            </div>
          ) : (
            <>
              No posts parsed yet.
              <div className="mt-2">
                <Button size="sm" onClick={onParse} disabled={parsing}>
                  <Sparkles className="mr-1 h-3 w-3" /> Parse calendar
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-background/40 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <b>{posts.length}</b> posts across <b>{grouped.size}</b> week{grouped.size === 1 ? "" : "s"}.
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onParse} disabled={parsing}>
                {parsing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                Re-parse
              </Button>
            </div>
          </div>

          {week1Posts.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Week {firstWeek} queue · {week1Posts.length} post{week1Posts.length === 1 ? "" : "s"}
                </div>
                <Badge variant="outline" className="text-[10px]">Ready to generate</Badge>
              </div>
              <ul className="space-y-1.5">
                {week1Posts.map((p, i) => (
                  <li key={p.id} className="flex items-start gap-2 rounded-md border border-white/5 bg-background/40 p-2 text-[11px]">
                    <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 px-1 text-[10px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        {p.day && <span>{p.day}</span>}
                        {p.platform && <><span>·</span><span>{p.platform}</span></>}
                        {p.pillar && <><span>·</span><span>{p.pillar}</span></>}
                        {p.format && <><span>·</span><span>{p.format}</span></>}
                      </div>
                      <div className="mt-0.5 font-medium text-foreground line-clamp-2">
                        {p.hook || p.body || "(no hook)"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <footer className="flex justify-end gap-2">
        {firstWeek != null && week1Posts.length > 0 && (
          <Button
            variant="outline"
            onClick={() => onGenerateNow(firstWeek)}
            disabled={posts.length === 0}
          >
            <Sparkles className="mr-1 h-3 w-3" /> Generate Week {firstWeek} now
          </Button>
        )}
        <Button onClick={onNext} disabled={posts.length === 0}>
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
    </div>
  );
}

// ============================================================
// STEP 2 — Pick weeks
// ============================================================
function Step2Weeks({
  posts, selectedWeeks, onChange, onBack, onNext,
}: {
  posts: ContentPost[]; selectedWeeks: number[]; onChange: (w: number[]) => void;
  onBack: () => void; onNext: () => void;
}) {
  const grouped = groupPostsByWeek(posts);
  const weeks = Array.from(grouped.keys()).sort((a, b) => a - b);
  const toggle = (w: number) => {
    onChange(selectedWeeks.includes(w) ? selectedWeeks.filter((x) => x !== w) : [...selectedWeeks, w].sort((a, b) => a - b));
  };
  const allOn = weeks.length > 0 && weeks.every((w) => selectedWeeks.includes(w));
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> 2 · Which week(s) do you want ads for?
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          Batch by week. You can come back and generate additional weeks anytime.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onChange(allOn ? [] : weeks)}>
          {allOn ? "Clear all" : "Select all"}
        </Button>
        {weeks.map((w) => {
          const on = selectedWeeks.includes(w);
          const count = grouped.get(w)?.length ?? 0;
          return (
            <button
              key={w}
              type="button"
              onClick={() => toggle(w)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-background/40 text-foreground hover:border-white/30"}`}
            >
              {on && <Check className="h-3 w-3" />}
              Week {w} <span className="text-muted-foreground">· {count}</span>
            </button>
          );
        })}
      </div>
      <footer className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button onClick={onNext} disabled={!selectedWeeks.length}>
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
    </div>
  );
}

// ============================================================
// STEP 3 — Style
// ============================================================
function Step3Style({
  direction, onDirection, aspects, onAspects, onBack, onNext,
}: {
  direction: string; onDirection: (d: string) => void;
  aspects: AdAspect[]; onAspects: (a: AdAspect[]) => void;
  onBack: () => void; onNext: () => void;
}) {
  const toggleAspect = (a: AdAspect) => {
    onAspects(aspects.includes(a) ? aspects.filter((x) => x !== a) : [...aspects, a]);
  };
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> 3 · Art direction & aspect ratios
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          Keep consistent with your Social Studio covers, or explore a new direction for ads.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ART_DIRECTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDirection(d.id)}
            className={`rounded-lg border p-3 text-left text-xs transition ${direction === d.id ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/30"}`}
          >
            <div className="font-semibold">{d.label}</div>
          </button>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Default aspect ratios per post</div>
        <div className="flex flex-wrap gap-1.5">
          {ASPECTS.map((a) => {
            const on = aspects.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAspect(a.id)}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-background/40 hover:border-white/30"}`}
                title={a.hint}
              >
                {on && <Check className="h-3 w-3" />}
                <span className="font-medium">{a.label}</span>
                <span className="text-muted-foreground text-[10px]">· {a.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button onClick={onNext} disabled={!aspects.length}>
          Build ads <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
    </div>
  );
}

// ============================================================
// STEP 4 — Build ads (per-post, per-aspect)
// ============================================================
type AdTask = {
  post: ContentPost;
  aspect: AdAspect;
  ad?: ContentAd | null;
};

function Step4BuildAds({
  snapshotId, direction, aspects, selectedWeeks, posts, ads,
  autoRunWeek, onAutoRunConsumed, onAddWeek, onBack, onDone,
}: {
  snapshotId: string; direction: string; aspects: AdAspect[];
  selectedWeeks: number[]; posts: ContentPost[]; ads: ContentAd[];
  autoRunWeek?: number | null; onAutoRunConsumed?: () => void;
  onAddWeek?: (week: number) => Promise<void> | void;
  onBack: () => void; onDone: () => void;
}) {

  const qc = useQueryClient();
  const scoped = useMemo(() => posts.filter((p) => selectedWeeks.includes(p.week)), [posts, selectedWeeks]);

  const tasks: AdTask[] = useMemo(() => {
    const out: AdTask[] = [];
    for (const p of scoped) {
      for (const a of aspects) {
        const match = ads.find((x) => x.post_id === p.id && x.aspect === a);
        out.push({ post: p, aspect: a, ad: match ?? null });
      }
    }
    return out;
  }, [scoped, aspects, ads]);

  const [running, setRunning] = useState(false);
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regen, setRegen] = useState<null | { task: AdTask; focusSection?: any }>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const key = (t: AdTask) => `${t.post.id}:${t.aspect}`;
  const setBusy = (k: string, v: boolean) =>
    setRunningKeys((prev) => { const n = { ...prev }; if (v) n[k] = true; else delete n[k]; return n; });

  const waitForRecoveredAd = async (t: AdTask, knownIds: Set<string>) => {
    for (let i = 0; i < 10; i += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, i < 2 ? 1200 : 2500));
      const fresh = await listContentAds(snapshotId);
      const recovered = fresh.find(
        (ad) => ad.post_id === t.post.id && ad.aspect === t.aspect && !knownIds.has(ad.id),
      );
      if (recovered) {
        await qc.setQueryData(["content-ads", snapshotId], fresh);
        await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
        return recovered;
      }
    }
    return null;
  };

  const doGenerate = async (t: AdTask, opts?: any) => {
    const k = key(t);
    const knownIds = new Set(ads.filter((ad) => ad.post_id === t.post.id && ad.aspect === t.aspect).map((ad) => ad.id));
    setBusy(k, true);
    try {
      await generateContentAd(snapshotId, t.post.id, t.aspect, direction, opts);
      await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
      setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    } catch (e: any) {
      const msg = e?.message || "Generation failed";
      const recoverable = /failed to fetch|network|timeout|context canceled|cancel/i.test(msg);
      if (recoverable) {
        toast.message("Still finishing in the background…", {
          description: "We’ll refresh this tile as soon as the finished ad is saved.",
        });
        const recovered = await waitForRecoveredAd(t, knownIds);
        if (recovered) {
          setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
          toast.success("Ad finished and was added to the queue");
          return;
        }
      }
      setErrors((p) => ({ ...p, [k]: msg }));
      toast.error(msg);
    } finally {
      setBusy(k, false);
    }
  };

  const runWeek = async (week: number) => {
    setRunning(true);
    try {
      for (const t of tasks) {
        if (t.post.week !== week || t.ad) continue;
        await doGenerate(t);
      }
      toast.success(`Week ${week} ads generated`);
    } finally {
      setRunning(false);
    }
  };

  // Auto-kick "Generate week" when arriving via the Step 1 shortcut.
  useEffect(() => {
    if (autoRunWeek == null) return;
    if (running) return;
    if (tasks.length === 0) return;
    const pending = tasks.some((t) => t.post.week === autoRunWeek && !t.ad);
    onAutoRunConsumed?.();
    if (pending) void runWeek(autoRunWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunWeek, tasks.length]);

  const runAll = async () => {
    setRunning(true);
    try {
      for (const t of tasks) if (!t.ad) await doGenerate(t);
      toast.success("All ads generated");
    } finally {
      setRunning(false);
    }
  };

  const doDelete = async (t: AdTask) => {
    if (!t.ad) return;
    if (!window.confirm("Delete this ad? The tile will reset.")) return;
    const k = key(t);
    setBusy(k, true);
    try {
      await deleteContentAd(snapshotId, t.ad.id);
      await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    } finally { setBusy(k, false); }
  };

  const previewable = tasks.map((t, i) => (t.ad?.signed_url ? i : -1)).filter((i) => i >= 0);
  const doneCount = tasks.filter((t) => !!t.ad).length;
  const anyDone = doneCount > 0;

  // Group by week for readable layout
  const byWeek = new Map<number, AdTask[]>();
  for (const t of tasks) {
    if (!byWeek.has(t.post.week)) byWeek.set(t.post.week, []);
    byWeek.get(t.post.week)!.push(t);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> 4 · Build ad creatives
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {doneCount} of {tasks.length} ads ready · {aspects.join(", ")} · {direction}
          </p>
        </div>
        {tasks.some((t) => !t.ad) && (
          <Button size="sm" onClick={runAll} disabled={running}>
            {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Generate all ({tasks.filter((t) => !t.ad).length})
          </Button>
        )}
      </div>

      {Array.from(byWeek.keys()).sort((a, b) => a - b).map((w) => {
        const wTasks = byWeek.get(w)!;
        const wDone = wTasks.filter((t) => t.ad).length;
        return (
          <div key={w} className="rounded-xl border border-white/10 bg-background/40 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Week {w}</Badge>
                <span className="text-[10px] text-muted-foreground">{wDone}/{wTasks.length} ads</span>
              </div>
              {wTasks.some((t) => !t.ad) && (
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => runWeek(w)} disabled={running}>
                  <Sparkles className="mr-1 h-3 w-3" /> Generate week
                </Button>
              )}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {wTasks.map((t) => {
                const k = key(t);
                const busy = !!runningKeys[k];
                const err = errors[k];
                const url = t.ad?.signed_url;
                return (
                  <li key={k} className="flex items-start gap-3 rounded-lg border border-white/5 bg-background/40 p-2 text-xs">
                    <button
                      type="button"
                      onClick={() => { if (url) setPreviewIdx(tasks.indexOf(t)); }}
                      disabled={!url}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-muted/40 flex items-center justify-center ${url ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40" : ""}`}
                    >
                      {url ? (
                        <AssetImage src={url} alt="ad preview" className="h-full w-full object-contain" />
                      ) : busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-status-info" />
                      ) : err ? (
                        <span className="text-[10px] text-status-danger">failed</span>
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px]">{t.aspect}</Badge>
                        {t.post.platform && <span className="text-[10px] text-muted-foreground">{t.post.platform}</span>}
                        {t.ad?.qa_status === "fail" && (
                          <span className="rounded bg-status-warning/15 px-1 text-[9px] font-medium text-status-warning">QA fail</span>
                        )}
                      </div>
                      <div className="mt-0.5 line-clamp-2 font-medium" title={t.post.hook ?? undefined}>
                        {t.post.hook || t.post.body?.slice(0, 80) || "(no hook)"}
                      </div>
                      {t.post.pillar && (
                        <div className="text-[10px] text-muted-foreground">{t.post.pillar}</div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {!t.ad && !err && (
                          <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={running || busy}
                            onClick={() => doGenerate(t)}>
                            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                            Generate
                          </Button>
                        )}
                        {(t.ad || err) && (
                          <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={running || busy}
                            onClick={() => setRegen({ task: t })}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                          </Button>
                        )}
                        {url && (
                          <Button size="sm" variant="ghost" className="h-6 text-[11px]"
                            onClick={() => setPreviewIdx(tasks.indexOf(t))}>
                            <Eye className="mr-1 h-3 w-3" /> Preview
                          </Button>
                        )}
                        {t.ad && (
                          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-status-danger hover:bg-status-danger/10"
                            disabled={busy || running} onClick={() => doDelete(t)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <footer className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button onClick={onDone} disabled={!anyDone}>
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>

      {regen && (
        <RegenerateAssetDialog
          open={!!regen}
          onOpenChange={(v) => { if (!v) setRegen(null); }}
          scope="single"
          targetLabel={`${regen.task.aspect} · ${regen.task.post.hook?.slice(0, 40) || regen.task.post.pillar || "ad"}`}
          thumbnailUrl={regen.task.ad?.signed_url ?? null}
          currentDirection={regen.task.ad?.art_direction || direction}
          canvasPlan={regen.task.ad?.canvas_plan ?? null}
          currentHeadline={pickHeadlineForEdit(regen.task.post.hook, regen.task.ad?.last_headline)}
          currentLogoSize={(regen.task.ad as any)?.last_logo_size ?? null}
          initialIntensity="balanced"
          focusSection={regen.focusSection}
          onSubmit={async (input) => { await doGenerate(regen.task, input); }}
        />
      )}

      {previewIdx !== null && (() => {
        const t = tasks[previewIdx];
        if (!t?.ad) return null;
        const goPrev = () => {
          const pos = previewable.indexOf(previewIdx);
          setPreviewIdx(previewable[(pos - 1 + previewable.length) % previewable.length]);
        };
        const goNext = () => {
          const pos = previewable.indexOf(previewIdx);
          setPreviewIdx(previewable[(pos + 1) % previewable.length]);
        };
        const asset: PreviewableAsset = {
          url: t.ad.signed_url,
          title: `${t.aspect} — ${t.post.hook?.slice(0, 60) || t.post.pillar || "ad"}`,
          subtitle: `Week ${t.post.week}${t.post.platform ? " · " + t.post.platform : ""}`,
          platform: t.post.platform,
          assetKind: t.aspect,
          width: t.ad.width,
          height: t.ad.height,
          canvasPlan: t.ad.canvas_plan,
          qaStatus: t.ad.qa_status,
          qaNotes: t.ad.qa_notes,
          modelUsed: t.ad.model_used,
          lastFeedback: t.ad.last_feedback,
          lastHeadline: t.ad.last_headline,
          lastLogoSize: t.ad.last_logo_size,
          updatedAt: t.ad.updated_at,
        };
        return (
          <AssetPreviewDialog
            open={previewIdx !== null}
            onOpenChange={(v) => !v && setPreviewIdx(null)}
            asset={asset}
            onPrev={previewable.length > 1 ? goPrev : undefined}
            onNext={previewable.length > 1 ? goNext : undefined}
            busy={!!runningKeys[key(t)]}
            onRegenerate={() => setRegen({ task: t })}
            onEditHeadline={() => setRegen({ task: t, focusSection: "headline" })}
            onEditLogoSize={() => setRegen({ task: t, focusSection: "logo" })}
            onDelete={t.ad ? () => { setPreviewIdx(null); doDelete(t); } : undefined}
          />
        );
      })()}
    </div>
  );
}

// ============================================================
// STEP 5 — Launch summary
// ============================================================
function Step5Launch({
  ads, selectedWeeks, onBack,
}: {
  ads: ContentAd[]; selectedWeeks: number[]; onBack: () => void;
}) {
  const scoped = ads.filter((a) => selectedWeeks.length === 0 || true);
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">5 · Your ad batch is ready</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Download individual creatives from the preview modal, then schedule them alongside your calendar posts.
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-background/40 p-3 text-xs">
        <b>{scoped.length}</b> ad{scoped.length === 1 ? "" : "s"} produced across weeks {selectedWeeks.join(", ") || "—"}.
      </div>
      <footer className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
      </footer>
    </div>
  );
}
