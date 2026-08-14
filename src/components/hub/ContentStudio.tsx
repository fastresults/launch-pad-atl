// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import {
  Newspaper, Lock, ArrowLeft, ArrowRight, Sparkles, Loader2, Calendar, Wand2,
  RefreshCw, Check, Eye, Trash2, Image as ImageIcon, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { getBrandKit, setStudioMarkChoice } from "@/lib/brandKit.functions";
import { listSnapshotDocuments } from "@/lib/foundersHub.functions";
import {
  parseCalendarPosts, listCalendarPosts, listContentAds, generateContentAd,
  deleteContentAd, getContentProgress, upsertContentProgress, groupPostsByWeek,
  planNextWeek,

  type ContentPost, type ContentAd, type AdAspect,
} from "@/lib/content-autopilot.functions";
import { AssetPreviewDialog, type PreviewableAsset } from "@/components/hub/social/AssetPreviewDialog";
import { RegenerateAssetDialog } from "@/components/hub/social/RegenerateAssetDialog";
import { AssetImage } from "@/components/hub/social/AssetImage";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SectionHeader } from "@/components/hub/SectionHeader";
import { LogoPlacementMenu } from "@/components/hub/brand/LogoPlacementMenu";
import { contentAllKey, contentGraphicKey, contentWeekKey, studioChoiceFor } from "@/lib/brand/collateral-marks";

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

// Editorial poster lockups — mirrors POSTER_LAYOUTS in the ad compositor.
const POSTER_LAYOUTS: { id: string; label: string; blurb: string }[] = [
  { id: "bottom-scrim", label: "Bottom scrim", blurb: "Cinematic gradient, type anchored bottom-left" },
  { id: "centered-plate", label: "Centered plate", blurb: "Soft brand plate, type centered" },
  { id: "edge-rule", label: "Edge rule", blurb: "Accent rule at the left edge, type stacked" },
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
    // A hub tab left open for hours must not show a stale "not started" week.
    refetchOnWindowFocus: true,
  });
  const ads = adsQ.data ?? [];

  const progQ = useQuery({
    queryKey: ["content-progress", snapshotId],
    queryFn: () => getContentProgress(snapshotId),
    enabled: locked,
    refetchOnWindowFocus: true,
  });
  const progress = progQ.data;


  const [step, setStep] = useState(1);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [direction, setDirection] = useState<string>("editorial");
  const [aspects, setAspects] = useState<AdAspect[]>(["1:1"]);
  const [posterLayout, setPosterLayout] = useState<string>("bottom-scrim");
  const [autoRunWeek, setAutoRunWeek] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Hydrate from progress
  useEffect(() => {
    if (!progress) return;
    if (progress.current_step) setStep(progress.current_step);
    if (progress.selected_weeks?.length) setSelectedWeeks(progress.selected_weeks);
    if (progress.art_direction) setDirection(progress.art_direction);
    if (progress.default_aspects?.length) setAspects(progress.default_aspects);
    if ((progress as any).poster_layout) setPosterLayout((progress as any).poster_layout);
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
      toast.error(edgeErrorMessage(e, "Failed to parse calendar"));
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

  // Generated work is the source of truth: any week that already has an ad is
  // active, whatever the saved selection says. Stops finished weeks from
  // collapsing back to "not started" when the saved list drifts.
  const weeksWithAds = useMemo(() => {
    const weekOf = new Map(posts.map((p) => [p.id, p.week] as const));
    return Array.from(
      new Set(ads.map((a) => weekOf.get(a.post_id)).filter((w): w is number => typeof w === "number")),
    ).sort((a, b) => a - b);
  }, [ads, posts]);

  const effectiveWeeks = useMemo(
    () => Array.from(new Set([...selectedWeeks, ...weeksWithAds])).sort((a, b) => a - b),
    [selectedWeeks, weeksWithAds],
  );

  // Self-heal the saved list so the drift doesn't come back next session.
  useEffect(() => {
    if (!progress) return;
    const saved = progress.selected_weeks ?? [];
    const missing = weeksWithAds.filter((w) => !saved.includes(w));
    if (!missing.length) return;
    const merged = Array.from(new Set([...saved, ...missing])).sort((a, b) => a - b);
    setSelectedWeeks((prev) => Array.from(new Set([...prev, ...missing])).sort((a, b) => a - b));
    void persist({ selected_weeks: merged });
  }, [progress?.snapshot_id, weeksWithAds.join(",")]);



  // ---- Gate ----
  if (kitQ.isLoading || docsQ.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Loading Content Studio…
      </div>
    );
  }

  if (!locked) {
    return (
      <div className="space-y-3">
        <SectionHeader
          cat="Content Studio"
          index={2}
          done={0}
          total={5}
          isOpen={expanded}
          onToggle={() => setExpanded((v) => !v)}
          contentId="content-studio-body"
          status="locked"
          icon={Newspaper}
          label="Content Studio"
          tagline="Turn planned posts into on-brand ads"
          accentVar="--status-info"
          badges={
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Brand-gated
            </span>
          }
        />
        {expanded && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Lock your Brand Wizard first — Content Studio uses your palette, typography and logo to
              keep every ad visually consistent with your channel covers.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!calendarDoc) {
    return (
      <div className="space-y-3">
        <SectionHeader
          cat="Content Studio"
          index={2}
          done={0}
          total={5}
          isOpen={expanded}
          onToggle={() => setExpanded((v) => !v)}
          contentId="content-studio-body"
          status="not_started"
          icon={Newspaper}
          label="Content Studio"
          tagline="Turn planned posts into on-brand ads"
          accentVar="--status-info"
        />
        {expanded && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Generate your <b>90-Day Content Calendar</b> startup asset first — Content Studio turns
              each planned post into a 1:1 / 4:5 / 9:16 social ad using your locked brand kit.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        cat="Content Studio"
        index={2}
        done={step}
        total={5}
        isOpen={expanded}
        onToggle={() => setExpanded((v) => !v)}
        contentId="content-studio-body"
        status={step >= 5 ? "complete" : "in_progress"}
        icon={Newspaper}
        label="Content Studio"
        tagline="Turn planned posts into on-brand ads"
        accentVar="--status-info"
        badges={<Badge variant="outline" className="text-[10px]">Step {step} of 5</Badge>}
        actions={
          <span className="text-[10px] text-muted-foreground">
            {ads.length} ads generated · {posts.length} planned posts
          </span>
        }
      />
      {expanded && (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">


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
          posterLayout={posterLayout}
          onPosterLayout={setPosterLayout}
          aspects={aspects}
          onAspects={setAspects}
          onBack={() => setStep(2)}
          onNext={async () => {
            if (!aspects.length) { toast.error("Pick at least one aspect ratio"); return; }
            setStep(4);
            await persist({ current_step: 4, art_direction: direction, default_aspects: aspects, poster_layout: posterLayout } as any);
          }}
        />
      )}

      {step === 4 && (
        <Step4BuildAds
          snapshotId={snapshotId}
          direction={direction}
          posterLayout={posterLayout}
          aspects={aspects}
          selectedWeeks={effectiveWeeks}
          posts={posts}
          ads={ads}
          kit={kit}
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
          snapshotId={snapshotId}
          kit={kit}
          aspects={aspects}
          ads={ads}
          posts={posts}
          selectedWeeks={effectiveWeeks}
          onBack={() => setStep(4)}

          onAddWeek={async (week) => {
            const nextWeeks = Array.from(new Set([...selectedWeeks, week])).sort((a, b) => a - b);
            setSelectedWeeks(nextWeeks);
            setAutoRunWeek(week);
            setStep(4);
            await persist({ selected_weeks: nextWeeks, current_step: 4 });
          }}
        />
      )}

      </div>
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
        <div className="rounded-lg border border-border bg-background/40 p-4 text-xs">
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
          <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
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
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Week {firstWeek} queue · {week1Posts.length} post{week1Posts.length === 1 ? "" : "s"}
                </div>
                <Badge variant="outline" className="text-[10px]">Ready to generate</Badge>
              </div>
              <ul className="space-y-1.5">
                {week1Posts.map((p, i) => (
                  <li key={p.id} className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2 text-[11px]">
                    <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-border px-1 text-[10px] text-muted-foreground">
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
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/40 text-foreground hover:border-foreground/25"}`}
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
  direction, onDirection, posterLayout, onPosterLayout, aspects, onAspects, onBack, onNext,
}: {
  direction: string; onDirection: (d: string) => void;
  posterLayout: string; onPosterLayout: (l: string) => void;
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
            className={`rounded-lg border p-3 text-left text-xs transition ${direction === d.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-foreground/25"}`}
          >
            <div className="font-semibold">{d.label}</div>
          </button>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Poster layout</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {POSTER_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onPosterLayout(l.id)}
              className={`rounded-lg border p-3 text-left text-xs transition ${posterLayout === l.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-foreground/25"}`}
            >
              <div className="font-semibold">{l.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{l.blurb}</div>
            </button>
          ))}
        </div>
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
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/40 hover:border-foreground/25"}`}
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
  snapshotId, direction, posterLayout, aspects, selectedWeeks, posts, ads, kit,
  autoRunWeek, onAutoRunConsumed, onAddWeek, onBack, onDone,
}: {
  snapshotId: string; direction: string; posterLayout?: string; aspects: AdAspect[]; kit: any;
  selectedWeeks: number[]; posts: ContentPost[]; ads: ContentAd[];
  autoRunWeek?: number | null; onAutoRunConsumed?: () => void;
  onAddWeek?: (week: number) => Promise<void> | void;
  onBack: () => void; onDone: () => void;
}) {

  const qc = useQueryClient();
  const confirm = useConfirm();
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

  // A run is scoped: only the button that started it, and the tile actually in
  // flight, are allowed to look busy. Everything else is disabled, not spinning.
  const [run, setRun] = useState<null | { scope: "all" | "week"; week?: number; done: number; total: number }>(null);
  const running = run != null;
  const runLock = useRef(false);
  const inFlight = useRef<Set<string>>(new Set());
  const autoRan = useRef<Set<number>>(new Set());
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const [openWeeks, setOpenWeeks] = useState<string[] | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regen, setRegen] = useState<null | { task: AdTask; focusSection?: any }>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const key = (t: AdTask) => `${t.post.id}:${t.aspect}`;
  const placementKey = (t: AdTask) => contentGraphicKey(t.post.id, t.aspect);
  const inheritKeys = (week: number | string, aspect: string) => [contentWeekKey(week, aspect), contentAllKey(aspect)];
  const markPick = (t: AdTask) =>
    studioChoiceFor(kit?.studio_mark_choice, placementKey(t), t.aspect, inheritKeys(t.post.week, t.aspect));
  const exactPick = (t: AdTask) => kit?.studio_mark_choice?.[placementKey(t)] ?? null;
  const inheritedPick = (t: AdTask) =>
    studioChoiceFor(kit?.studio_mark_choice, "__none__", t.aspect, inheritKeys(t.post.week, t.aspect));
  const weekPick = (week: number, aspect: string) => kit?.studio_mark_choice?.[contentWeekKey(week, aspect)] ?? null;
  const allPick = (aspect: string) => kit?.studio_mark_choice?.[contentAllKey(aspect)] ?? null;
  const saveMark = async (t: AdTask, cell: any) => {
    await setStudioMarkChoice(snapshotId, placementKey(t), cell);
    await qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
  };
  const saveWeekMark = async (week: number, aspect: string, cell: any) => {
    await setStudioMarkChoice(snapshotId, contentWeekKey(week, aspect), cell);
    await qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
  };
  const saveAllMark = async (aspect: string, cell: any) => {
    await setStudioMarkChoice(snapshotId, contentAllKey(aspect), cell);
    await qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
  };

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
    // Synchronous guard: a second call for the same tile can never reach the worker.
    if (inFlight.current.has(k)) return;
    inFlight.current.add(k);
    const knownIds = new Set(ads.filter((ad) => ad.post_id === t.post.id && ad.aspect === t.aspect).map((ad) => ad.id));
    setBusy(k, true);
    try {
      await generateContentAd(snapshotId, t.post.id, t.aspect, direction, { posterLayout, markPick: markPick(t), placementKey: placementKey(t), ...(opts ?? {}) });
      await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
      setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    } catch (e: any) {
      const msg = edgeErrorMessage(e, "Generation failed");
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
      inFlight.current.delete(k);
      setBusy(k, false);
    }
  };

  const runWeek = async (week: number, opts?: { force?: boolean }) => {
    if (runLock.current) return;
    runLock.current = true;
    const queue = tasks.filter((t) => t.post.week === week && (!t.ad || opts?.force));
    setRun({ scope: "week", week, done: 0, total: queue.length });
    try {
      let refreshedArc = false;
      for (let i = 0; i < queue.length; i += 1) {
        setRun((r) => (r ? { ...r, done: i } : r));
        await doGenerate(queue[i], opts?.force && !refreshedArc ? { refreshArc: true } : undefined);
        refreshedArc = refreshedArc || !!opts?.force;
      }
      toast.success(opts?.force ? `Week ${week} ads regenerated` : `Week ${week} ads generated`);
    } finally {
      runLock.current = false;
      setRun(null);
    }
  };

  // Auto-kick "Generate week" when arriving via the Step 1 shortcut. One-shot per
  // week: the ref is marked before the async run so a re-render can't fire it twice.
  useEffect(() => {
    if (autoRunWeek == null) return;
    if (runLock.current) return;
    if (tasks.length === 0) return;
    if (autoRan.current.has(autoRunWeek)) return;
    autoRan.current.add(autoRunWeek);
    const pending = tasks.some((t) => t.post.week === autoRunWeek && !t.ad);
    onAutoRunConsumed?.();
    if (pending) void runWeek(autoRunWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunWeek, tasks.length]);

  const runAll = async (opts?: { force?: boolean }) => {
    if (runLock.current) return;
    runLock.current = true;
    const queue = tasks.filter((t) => !t.ad || opts?.force);
    setRun({ scope: "all", done: 0, total: queue.length });
    try {
      let refreshedArc = false;
      for (let i = 0; i < queue.length; i += 1) {
        setRun((r) => (r ? { ...r, done: i } : r));
        await doGenerate(queue[i], opts?.force && !refreshedArc ? { refreshArc: true } : undefined);
        refreshedArc = refreshedArc || !!opts?.force;
      }
      toast.success(opts?.force ? "All ads regenerated" : "All ads generated");
    } finally {
      runLock.current = false;
      setRun(null);
    }
  };


  const doDelete = async (t: AdTask) => {
    if (!t.ad) return;
    if (!(await confirm({ title: "Delete this ad?", description: "The tile will reset.", destructive: true, confirmText: "Delete" }))) return;
    const k = key(t);
    setBusy(k, true);
    try {
      await deleteContentAd(snapshotId, t.ad.id);
      await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(edgeErrorMessage(e, "Delete failed"));
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

  // All weeks known from the parsed calendar, and which ones are not yet activated in Step 4
  const allWeeks = Array.from(new Set(posts.map((p) => p.week))).sort((a, b) => a - b);
  const pendingWeeks = allWeeks.filter((w) => !selectedWeeks.includes(w));
  const postsByWeek = new Map<number, ContentPost[]>();
  for (const p of posts) {
    if (!postsByWeek.has(p.week)) postsByWeek.set(p.week, []);
    postsByWeek.get(p.week)!.push(p);
  }

  // Funnel arc: what each week argues, and how warm its audience is. Mirrors
  // the server-side campaign arc so the founder can see the sequence, not a
  // pile of interchangeable weeks.
  const FLIGHT: { stage: string; ask: string; temp: "Cold" | "Warm" | "Hot" }[] = [
    { stage: "Disrupt", ask: "No ask", temp: "Cold" },
    { stage: "Reframe", ask: "Follow", temp: "Cold" },
    { stage: "Proof", ask: "Learn", temp: "Warm" },
    { stage: "Differentiate", ask: "Compare", temp: "Warm" },
    { stage: "Objection", ask: "Ask us", temp: "Warm" },
    { stage: "Offer", ask: "Book", temp: "Hot" },
    { stage: "Proof at scale", ask: "Book", temp: "Hot" },
    { stage: "Urgency", ask: "Book now", temp: "Hot" },
  ];
  const stageFor = (w: number) => {
    const idx = allWeeks.indexOf(w);
    return FLIGHT[(idx >= 0 ? idx : w - 1) % FLIGHT.length];
  };
  const TEMP_CLASS: Record<string, string> = {
    Cold: "border-status-info/40 text-status-info",
    Warm: "border-primary/40 text-primary",
    Hot: "border-status-warning/50 text-status-warning",
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> 4 · Build ad creatives
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {doneCount} of {tasks.length} ads ready · {aspects.join(", ")} · {direction}
            {pendingWeeks.length > 0 && (
              <> · <span className="text-status-info">{pendingWeeks.length} more week{pendingWeeks.length === 1 ? "" : "s"} available below</span></>
            )}
          </p>
          {run && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-status-info">
              <Loader2 className="h-3 w-3 animate-spin" />
              {run.scope === "week" ? `Generating week ${run.week}` : "Generating all ads"} — ad {Math.min(run.done + 1, run.total)} of {run.total}
            </p>
          )}
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center">
            {tasks.some((t) => !t.ad) ? (
              <Button size="sm" className="rounded-r-none" onClick={() => runAll()} disabled={running}>
                {run?.scope === "all" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                Generate all ({tasks.filter((t) => !t.ad).length})
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="rounded-r-none" onClick={() => runAll({ force: true })} disabled={running}>
                {run?.scope === "all" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                Regenerate all ({tasks.length})
              </Button>
            )}
            {aspects.map((a) => (
              <LogoPlacementMenu
                key={`all-mark-${a}`}
                assetKind={a}
                logos={kit?.logos}
                value={allPick(a)}
                disabled={running}
                title={`Logo for every ad in this flight${aspects.length > 1 ? ` · ${a}` : ""}`}
                label={`all ${a} ads`}
                triggerClassName="h-8 rounded-l-none"
                onChange={(cell) => saveAllMark(a, cell)}
              />
            ))}
          </div>
        )}

      </div>

      {allWeeks.length > 1 && (
        <div className="rounded-xl border border-border bg-background/30 p-3">
          <p className="text-[11px] font-medium">Campaign arc — the flight builds one argument, week by week</p>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {allWeeks.map((w) => {
              const s = stageFor(w);
              return (
                <div
                  key={`flight-${w}`}
                  className={`min-w-[104px] flex-1 rounded-lg border px-2 py-1.5 ${TEMP_CLASS[s.temp]} bg-background/40`}
                >
                  <div className="text-[9px] uppercase tracking-wide opacity-70">Wk {w} · {s.temp}</div>
                  <div className="text-[11px] font-medium leading-tight">{s.stage}</div>
                  <div className="text-[9px] opacity-70">Ask: {s.ask}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(() => {
        // Compute a sensible default open item once weeks are known.

        const activeWeeks = Array.from(byWeek.keys()).sort((a, b) => a - b);
        let defaultOpen: string[] = [];
        const firstIncomplete = activeWeeks.find((w) => (byWeek.get(w) ?? []).some((t) => !t.ad));
        if (firstIncomplete != null) defaultOpen = [`w-${firstIncomplete}`];
        else if (activeWeeks.length) defaultOpen = [`w-${activeWeeks[activeWeeks.length - 1]}`];
        const value = openWeeks ?? defaultOpen;

        return (
          <Accordion
            type="multiple"
            value={value}
            onValueChange={(v) => setOpenWeeks(v as string[])}
            className="space-y-2"
          >
            {allWeeks.map((w) => {
              const isPending = !selectedWeeks.includes(w);
              const wTasks = byWeek.get(w) ?? [];
              const wPosts = postsByWeek.get(w) ?? [];
              const wDone = wTasks.filter((t) => t.ad).length;
              const wTotal = wTasks.length;
              const wPending = wTotal - wDone;
              // Only the week actually being generated looks busy; other weeks
              // are simply unavailable while a run is in flight.
              const isLoading = run?.scope === "week" && run.week === w;
              const isBlocked = running && !isLoading;

              return (
                <AccordionItem
                  key={`w-${w}`}
                  value={`w-${w}`}
                  className={`rounded-xl border ${isPending ? "border-dashed border-border bg-background/20" : "border-border bg-background/40"} px-3`}
                >
                  <div className="flex items-center gap-2">
                  <AccordionTrigger className="flex-1 py-2.5 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">Week {w}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${TEMP_CLASS[stageFor(w).temp]}`}>
                          {stageFor(w).stage}
                        </Badge>

                        {isPending ? (
                          <span className="text-[10px] text-muted-foreground">
                            {wPosts.length} planned post{wPosts.length === 1 ? "" : "s"} · not started
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {wDone}/{wTotal} ads{wPending === 0 ? " · done" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="flex shrink-0 items-center">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (running) return;
                          if (isPending) onAddWeek?.(w);
                          else if (wPending > 0) runWeek(w);
                          else if (wTotal > 0) runWeek(w, { force: true });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            if (running) return;
                            if (isPending) onAddWeek?.(w);
                            else if (wPending > 0) runWeek(w);
                            else if (wTotal > 0) runWeek(w, { force: true });
                          }
                        }}
                        className={
                          isPending || wTotal > 0
                            ? `inline-flex h-7 items-center gap-1 rounded-md rounded-r-none border border-input bg-background px-2 text-[11px] ${isBlocked ? "pointer-events-none opacity-40" : "hover:bg-accent hover:text-accent-foreground"}`
                            : "text-[10px] text-muted-foreground"
                        }
                        aria-disabled={running}
                      >
                        {isPending ? (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Add &amp; generate
                          </>
                        ) : wPending > 0 ? (
                          <>
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Generate week ({wPending})
                          </>
                        ) : wTotal > 0 ? (
                          <>
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Regenerate week ({wTotal})
                          </>
                        ) : (
                          "Done"
                        )}
                      </span>
                      {(isPending || wTotal > 0) && aspects.map((a) => (
                        <LogoPlacementMenu
                          key={`wk-mark-${w}-${a}`}
                          assetKind={a}
                          logos={kit?.logos}
                          value={weekPick(w, a)}
                          inherited={allPick(a)}
                          disabled={running}
                          title={`Logo for every week ${w} ad${aspects.length > 1 ? ` · ${a}` : ""}`}
                          label={`week ${w} ${a} ads`}
                          triggerClassName="h-7 rounded-l-none"
                          onChange={(cell) => saveWeekMark(w, a, cell)}
                        />
                      ))}
                  </div>
                  </div>

                  <AccordionContent className="pb-3">
                    {isPending ? (
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {wPosts.slice(0, 8).map((p) => (
                          <li key={p.id} className="truncate text-[11px] text-muted-foreground">
                            · {p.hook || p.pillar || "Untitled post"}
                          </li>
                        ))}
                        {wPosts.length > 8 && (
                          <li className="text-[11px] text-muted-foreground/70">+ {wPosts.length - 8} more</li>
                        )}
                      </ul>
                    ) : (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {wTasks.map((t) => {
                          const k = key(t);
                          const busy = !!runningKeys[k];
                          const err = errors[k];
                          const url = t.ad?.signed_url;
                          return (
                            <li key={k} className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-2 text-xs">
                              <button
                                type="button"
                                onClick={() => { if (url) setPreviewIdx(tasks.indexOf(t)); }}
                                disabled={!url}
                                className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40 flex items-center justify-center ${url ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40" : ""}`}
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
                                    <div className="inline-flex items-center"><Button size="sm" variant="outline" className="h-6 rounded-r-none text-[11px]" disabled={running || busy}
                                      onClick={() => doGenerate(t)}>
                                      {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                                      Generate
                                    </Button><LogoPlacementMenu assetKind={t.aspect} logos={kit?.logos} value={exactPick(t)} inherited={inheritedPick(t)} used={t.ad?.qa_notes?.logo_mark} disabled={running || busy} label={t.post.hook} onChange={(cell) => saveMark(t, cell)} /></div>
                                  )}
                                  {(t.ad || err) && (
                                    <div className="inline-flex items-center"><Button size="sm" variant="outline" className="h-6 rounded-r-none text-[11px]" disabled={running || busy}
                                      onClick={() => setRegen({ task: t })}>
                                      <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                                    </Button><LogoPlacementMenu assetKind={t.aspect} logos={kit?.logos} value={exactPick(t)} inherited={inheritedPick(t)} used={t.ad?.qa_notes?.logo_mark} disabled={running || busy} label={t.post.hook} onChange={(cell) => saveMark(t, cell)} /></div>
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
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        );
      })()}



      <PlanNextWeekCard
        snapshotId={snapshotId}
        nextWeek={(allWeeks.length ? allWeeks[allWeeks.length - 1] : 0) + 1}
      />


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
          currentScene={(regen.task.ad as any)?.qa_notes?.scene?.depict ?? null}
          initialIntensity="balanced"
          focusSection={regen.focusSection}
          assetKind={regen.task.aspect}
          logos={(kit as any)?.logos ?? null}
          initialMarkPick={markPick(regen.task)}
          usedMark={(regen.task.ad as any)?.qa_notes?.logo_mark ?? null}
          onSubmit={async (input) => {
            // The pick is the contract from here on: remember it for this
            // surface so later runs place the same artwork.
            try {
              await setStudioMarkChoice(snapshotId, placementKey(regen.task), input.markPick ?? null);
              await qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
            } catch { /* generation still carries the pick in its payload */ }
            await doGenerate(regen.task, input);
          }}
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
          post: t.post,
          snapshotId,

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
            logoPicker={<LogoPlacementMenu assetKind={t.aspect} logos={kit?.logos} value={exactPick(t)} inherited={inheritedPick(t)} used={t.ad?.qa_notes?.logo_mark} disabled={!!runningKeys[key(t)]} label={t.post.hook} onChange={(cell) => saveMark(t, cell)} />}
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
  snapshotId, kit, aspects = [], ads, posts, selectedWeeks, onBack, onAddWeek,
}: {
  snapshotId: string; kit?: any; aspects?: AdAspect[];
  ads: ContentAd[]; posts: ContentPost[]; selectedWeeks: number[];
  onBack: () => void;
  onAddWeek?: (week: number) => Promise<void> | void;
}) {

  const scoped = ads.filter((a) => selectedWeeks.length === 0 || true);
  const allWeeks = Array.from(new Set(posts.map((p) => p.week))).sort((a, b) => a - b);
  const pendingWeeks = allWeeks.filter((w) => !selectedWeeks.includes(w));
  const postsByWeek = new Map<number, ContentPost[]>();
  const postById = new Map<string, ContentPost>();
  for (const p of posts) {
    if (!postsByWeek.has(p.week)) postsByWeek.set(p.week, []);
    postsByWeek.get(p.week)!.push(p);
    postById.set(p.id, p);
  }
  // Group ads by week via their linked post
  const adsByWeek = new Map<number, ContentAd[]>();
  for (const a of ads) {
    const p = postById.get(a.post_id);
    if (!p) continue;
    if (!adsByWeek.has(p.week)) adsByWeek.set(p.week, []);
    adsByWeek.get(p.week)!.push(a);
  }
  const doneWeeks = Array.from(adsByWeek.keys()).sort((a, b) => a - b);
  const [openDone, setOpenDone] = useState<string[]>(() =>
    doneWeeks.length ? [`w-${doneWeeks[0]}`] : []
  );

  // Flat ordered list of ads mirroring accordion order → indices for prev/next
  const flatAds: ContentAd[] = [];
  for (const w of doneWeeks) for (const a of adsByWeek.get(w) ?? []) flatAds.push(a);
  const previewable = flatAds
    .map((a, i) => (a.signed_url ? i : -1))
    .filter((i) => i >= 0);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const confirm = useConfirm();

  const doDelete = async (adId: string) => {
    if (!(await confirm({ title: "Delete this ad?", description: "This can't be undone.", destructive: true, confirmText: "Delete" }))) return;
    setDeletingId(adId);
    try {
      await deleteContentAd(snapshotId, adId);
      await qc.invalidateQueries({ queryKey: ["content-ads", snapshotId] });
      toast.success("Deleted");
      setPreviewIdx(null);
    } catch (e: any) {
      toast.error(edgeErrorMessage(e, "Delete failed"));
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">5 · Your ad batch is ready</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Download individual creatives from the preview modal, then schedule them alongside your calendar posts.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
        <b>{scoped.length}</b> ad{scoped.length === 1 ? "" : "s"} produced across weeks {doneWeeks.join(", ") || "—"}.
      </div>

      {doneWeeks.length > 0 && (
        <Accordion
          type="multiple"
          value={openDone}
          onValueChange={(v) => setOpenDone(v as string[])}
          className="space-y-2"
        >
          {doneWeeks.map((w) => {
            const wAds = adsByWeek.get(w) ?? [];
            return (
              <AccordionItem
                key={`done-w-${w}`}
                value={`w-${w}`}
                className="rounded-xl border border-border bg-background/40 px-3"
              >
                <AccordionTrigger className="py-2.5 hover:no-underline">
                  <div className="flex flex-1 items-center gap-2 pr-2">
                    <Badge variant="outline" className="text-[10px]">Week {w}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {wAds.length} ad{wAds.length === 1 ? "" : "s"} ready
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {wAds.map((a) => {
                      const p = postById.get(a.post_id);
                      const flatIdx = flatAds.indexOf(a);
                      const canPreview = !!a.signed_url;
                      return (
                        <div
                          key={a.id}
                          className="group flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-border bg-background/30 p-2 transition hover:bg-muted/40"
                        >
                          <button
                            type="button"
                            onClick={() => canPreview && setPreviewIdx(flatIdx)}
                            disabled={!canPreview}
                            title={canPreview ? "Click to preview" : "No preview available"}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-background/60">
                              {a.signed_url ? (
                                <AssetImage src={a.signed_url} alt={p?.hook || "ad"} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] font-medium">
                                {p?.hook || p?.pillar || "Untitled"}
                              </div>
                              <div className="truncate text-[10px] text-muted-foreground">
                                {a.aspect}{p?.platform ? ` · ${p.platform}` : ""}
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); doDelete(a.id); }}
                            disabled={deletingId === a.id}
                            title="Delete ad"
                            className="shrink-0 rounded p-1.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive hover:opacity-100 disabled:opacity-40"
                          >
                            {deletingId === a.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}


      {pendingWeeks.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Keep going — more weeks in your plan
          </div>
          {pendingWeeks.map((w) => {
            const wPosts = postsByWeek.get(w) ?? [];
            return (
              <div key={`pending-${w}`} className="rounded-xl border border-dashed border-border bg-background/20 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Week {w}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {wPosts.length} planned post{wPosts.length === 1 ? "" : "s"} · not started
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    disabled={!onAddWeek}
                    onClick={() => onAddWeek?.(w)}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Add &amp; generate Week {w}
                  </Button>
                </div>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {wPosts.slice(0, 4).map((p) => (
                    <li key={p.id} className="truncate text-[11px] text-muted-foreground">
                      · {p.hook || p.pillar || "Untitled post"}
                    </li>
                  ))}
                  {wPosts.length > 4 && (
                    <li className="text-[11px] text-muted-foreground/70">+ {wPosts.length - 4} more</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <PlanNextWeekCard
        snapshotId={snapshotId}
        nextWeek={(allWeeks.length ? allWeeks[allWeeks.length - 1] : 0) + 1}
      />

      <footer className="flex justify-between">

        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back to build</Button>
      </footer>

      {previewIdx !== null && (() => {
        const ad = flatAds[previewIdx];
        if (!ad?.signed_url) return null;
        const p = postById.get(ad.post_id);
        const goPrev = () => {
          const pos = previewable.indexOf(previewIdx);
          setPreviewIdx(previewable[(pos - 1 + previewable.length) % previewable.length]);
        };
        const goNext = () => {
          const pos = previewable.indexOf(previewIdx);
          setPreviewIdx(previewable[(pos + 1) % previewable.length]);
        };
        const asset: PreviewableAsset = {
          url: ad.signed_url,
          title: `${ad.aspect} — ${p?.hook?.slice(0, 60) || p?.pillar || "ad"}`,
          subtitle: `Week ${p?.week ?? "?"}${p?.platform ? " · " + p.platform : ""}`,
          platform: p?.platform,
          assetKind: ad.aspect,
          width: ad.width,
          height: ad.height,
          canvasPlan: ad.canvas_plan,
          qaStatus: ad.qa_status,
          qaNotes: ad.qa_notes,
          modelUsed: ad.model_used,
          lastFeedback: ad.last_feedback,
          lastHeadline: ad.last_headline,
          lastLogoSize: ad.last_logo_size,
          updatedAt: ad.updated_at,
          post: p ?? null,
          snapshotId,

        };
        return (
          <AssetPreviewDialog
            open={previewIdx !== null}
            onOpenChange={(v) => !v && setPreviewIdx(null)}
            asset={asset}
            onPrev={previewable.length > 1 ? goPrev : undefined}
            onNext={previewable.length > 1 ? goNext : undefined}
            busy={deletingId === ad.id}
            onDelete={() => doDelete(ad.id)}
          />
        );
      })()}
    </div>
  );
}



// ============================================================
// Reusable card: "Plan Week N" — drafts the next week's posts
// ============================================================
function PlanNextWeekCard({ snapshotId, nextWeek }: { snapshotId: string; nextWeek: number }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    setBusy(true);
    try {
      const res = await planNextWeek(snapshotId, nextWeek);
      await qc.invalidateQueries({ queryKey: ["content-posts", snapshotId] });
      toast.success(`Week ${nextWeek} drafted — ${res.count} post${res.count === 1 ? "" : "s"} added`);
    } catch (e: any) {
      toast.error(edgeErrorMessage(e, "Failed to draft next week"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Week {nextWeek}</Badge>
            <span className="text-[10px] text-muted-foreground">Not planned yet</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Draft 3 posts for Week {nextWeek} that match your existing calendar tone and platforms.
          </p>
        </div>
        <Button size="sm" onClick={onClick} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
          Plan Week {nextWeek}
        </Button>
      </div>
    </div>
  );
}
