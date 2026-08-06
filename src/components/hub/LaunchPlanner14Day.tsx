// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, CheckCircle2, Circle, ArrowRight, Loader2, ExternalLink, Rocket, Clock, Presentation, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNCH_14DAY_PLAN, CATEGORY_DOT, type LaunchDay } from "@/lib/launch-14day-plan";
import { TRACK_META, TRACK_ORDER, trackFor, timeSplit, formatDuration, timeChipLabel, type AssetTrack } from "@/lib/asset-tracks";
import { TrackChip } from "@/components/hub/TrackChip";

const SORT_STORAGE_KEY = "hub:launch14:sortMode";
type SortMode = "sequence" | "track";

// Cross-references between sprint assets. Key = row asset, value = companion
// asset that lives elsewhere in the framework and directly supports it.
const COMPANION_ASSET: Record<string, { key: string; label: string; category: string }> = {
  pre_sell_offer_test: {
    key: "presell_landing_prd",
    label: "Pre-Sell Landing PRD + AI-builder prompt",
    category: "Marketing",
  },
  landing_page_waitlist_test: {
    key: "presell_landing_prd",
    label: "Pre-Sell Landing PRD + AI-builder prompt",
    category: "Marketing",
  },
};



interface Props {
  docs: any[];
  typeByKey: Map<string, any>;
  completedKeys: Set<string>;
  onOpenDoc: (doc: any) => void;
  onGenerateDoc: (key: string) => void;
  onScrollToDoc: (key: string) => void;
  isGeneratingKey?: (key: string) => boolean;
  jobRunning?: boolean;
  isPhysical?: boolean;
  sourcingOnlyKeys?: Set<string>;
  onOpenDayDeck?: (day: LaunchDay) => void;
  onFinishDay?: (day: LaunchDay) => void;
  snapshotId?: string;
}

function dayMinutes(day: LaunchDay, typeByKey: Map<string, any>, optionalKeys: Set<string>): number {
  return day.assetKeys
    .filter((k) => typeByKey.has(k) && !optionalKeys.has(k))
    .reduce((s, k) => s + (typeByKey.get(k)?.estimated_minutes ?? 0), 0);
}

function daySplit(day: LaunchDay, typeByKey: Map<string, any>, optionalKeys: Set<string>) {
  return day.assetKeys
    .filter((k) => typeByKey.has(k) && !optionalKeys.has(k))
    .reduce(
      (acc, k) => {
        const mins = typeByKey.get(k)?.estimated_minutes ?? 0;
        const s = timeSplit(trackFor(k), mins);
        acc.total += mins;
        acc.read += s.read;
        acc.do += s.do;
        return acc;
      },
      { total: 0, read: 0, do: 0 },
    );
}


function tileState(
  day: LaunchDay,
  completedKeys: Set<string>,
  typeByKey: Map<string, any>,
  optionalKeys: Set<string>,
) {
  const allKeys = day.assetKeys.filter((k) => typeByKey.has(k));
  const requiredKeys = allKeys.filter((k) => !optionalKeys.has(k));
  if (requiredKeys.length === 0) return { state: "pending" as const, done: 0, total: 0 };
  const done = requiredKeys.filter((k) => completedKeys.has(k)).length;
  if (done === requiredKeys.length) return { state: "complete" as const, done, total: requiredKeys.length };
  if (done > 0) return { state: "partial" as const, done, total: requiredKeys.length };
  return { state: "pending" as const, done, total: requiredKeys.length };
}

export function LaunchPlanner14Day({
  docs,
  typeByKey,
  completedKeys,
  onOpenDoc,
  onGenerateDoc,
  onScrollToDoc,
  isGeneratingKey,
  jobRunning,
  isPhysical = false,
  sourcingOnlyKeys,
  onOpenDayDeck,
  snapshotId,
}: Props) {

  const optionalKeys = useMemo(
    () =>
      !isPhysical
        ? (sourcingOnlyKeys ?? new Set<string>(["supplier_shortlist", "bom_and_landed_cost"]))
        : new Set<string>(),
    [sourcingOnlyKeys, isPhysical],
  );
  const isOptional = (k: string) => optionalKeys.has(k);

  const docByType = useMemo(() => {
    const m = new Map<string, any>();
    for (const d of docs ?? []) m.set(d.document_type, d);
    return m;
  }, [docs]);

  const daysWithState = useMemo(
    () => LAUNCH_14DAY_PLAN.map((d) => ({ day: d, ...tileState(d, completedKeys, typeByKey, optionalKeys) })),
    [completedKeys, typeByKey, optionalKeys],
  );

  const daysComplete = daysWithState.filter((d) => d.state === "complete").length;
  const totalAssets = daysWithState.reduce((s, d) => s + d.total, 0);
  const assetsReady = daysWithState.reduce((s, d) => s + d.done, 0);

  // Default-open the first non-complete day so the panel is never empty.
  const firstIncomplete = daysWithState.find((d) => d.state !== "complete")?.day.day ?? 1;
  const [openDay, setOpenDay] = useState<number>(firstIncomplete);
  const active = daysWithState.find((d) => d.day.day === openDay) ?? daysWithState[0];

  // --- Attract-loop pulse ---------------------------------------------------
  // First-time visitors don't always realize the day tiles are clickable, so we
  // walk a soft pulse from Day 1 -> Day 14 until the user interacts. Any real
  // interaction dismisses the loop for this sprint permanently.
  const attractKey = snapshotId ? `hub:sprintAttractDismissed:${snapshotId}` : null;
  const sprintDone = daysWithState.length > 0 && daysWithState.every((d) => d.state === "complete");
  const [attractOn, setAttractOn] = useState(false);
  const [attractDay, setAttractDay] = useState<number | null>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const attractContainerRef = useRef<HTMLDivElement | null>(null);

  const dismissAttract = useCallback((persist: boolean) => {
    setAttractOn(false);
    setAttractDay(null);
    if (persist && attractKey) {
      try { window.localStorage.setItem(attractKey, "1"); } catch {}
    }
  }, [attractKey]);

  useEffect(() => {
    if (sprintDone || prefersReducedMotion || !attractKey) return;
    try {
      if (window.localStorage.getItem(attractKey)) return;
    } catch { /* storage blocked; still animate */ }
    const t = window.setTimeout(() => setAttractOn(true), 1200);
    return () => window.clearTimeout(t);
  }, [attractKey, sprintDone, prefersReducedMotion]);

  // Keep the cycle counter + latest daysWithState/openDay in refs so parent
  // re-renders (new Set/Map identities) don't reset the interval mid-cycle.
  const attractIdxRef = useRef(0);
  const daysRef = useRef(daysWithState);
  const openDayRef = useRef(openDay);
  useEffect(() => { daysRef.current = daysWithState; }, [daysWithState]);
  useEffect(() => { openDayRef.current = openDay; }, [openDay]);

  useEffect(() => {
    if (!attractOn) return;
    if (daysRef.current.length === 0) return;
    attractIdxRef.current = 0;
    const pickAt = (idx: number) => {
      const days = daysRef.current;
      let d = days[idx % days.length].day.day;
      if (d === openDayRef.current) d = days[(idx + 1) % days.length].day.day;
      return d;
    };
    setAttractDay(pickAt(0));
    const tick = window.setInterval(() => {
      const days = daysRef.current;
      if (days.length === 0) return;
      attractIdxRef.current = (attractIdxRef.current + 1) % days.length;
      setAttractDay(pickAt(attractIdxRef.current));
    }, 1800);
    return () => window.clearInterval(tick);
  }, [attractOn]);

  // Pause when the planner is off-screen; resume on re-entry (unless dismissed).
  useEffect(() => {
    const el = attractContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const dismissed = attractKey ? (() => { try { return !!window.localStorage.getItem(attractKey); } catch { return false; } })() : false;
    if (dismissed || sprintDone || prefersReducedMotion) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.2) setAttractOn(false);
      else setAttractOn(true);
    }, { threshold: [0, 0.2, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [attractKey, sprintDone, prefersReducedMotion]);

  const [sortMode, setSortMode] = useState<SortMode>("sequence");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_STORAGE_KEY);
      if (saved === "sequence" || saved === "track") setSortMode(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(SORT_STORAGE_KEY, sortMode); } catch {}
  }, [sortMode]);

  const renderTile = (entry: typeof daysWithState[number]) => {
    const { day, state, done, total } = entry;
    const isOpen = openDay === day.day;


    const base =
      "group relative flex h-24 w-full flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all";

    const stateClass =
      state === "complete"
        ? "border-status-success/40 bg-status-success/10 hover:bg-status-success/15"
        : state === "partial"
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-white/10 bg-card/60 hover:bg-card/80";
    const ring = isOpen ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "";
    const attracting = !isOpen && attractOn && attractDay === day.day;
    const attractClass = attracting ? "animate-attract-pulse ring-2 ring-primary/50 ring-offset-2 ring-offset-background z-10" : "";

    return (
      <button
        key={day.day}
        type="button"
        onClick={() => { dismissAttract(true); setOpenDay(day.day); }}
        onMouseEnter={() => dismissAttract(true)}
        onFocus={() => dismissAttract(true)}
        className={`${base} ${stateClass} ${ring} ${attractClass}`}
        aria-label={`Day ${day.day}: ${day.theme}`}
        aria-expanded={isOpen}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Day {day.day}
          </span>
          <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[day.category]}`} aria-hidden />
        </div>
        <div className="w-full">
          <div className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
            {day.theme}
          </div>
          <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              {state === "complete" ? (
                <CheckCircle2 className="h-3 w-3 text-status-success" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {done}/{total || "–"}
            </span>
            {dayMinutes(day, typeByKey, optionalKeys) > 0 && (
              <span className="flex items-center gap-0.5 tabular-nums">
                <Clock className="h-2.5 w-2.5" />
                {formatDuration(dayMinutes(day, typeByKey, optionalKeys))}
              </span>
            )}
          </div>

        </div>
      </button>
    );
  };

  return (
    <div
      ref={attractContainerRef}
      onClickCapture={() => dismissAttract(true)}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-background via-card to-background p-6 shadow-sm"
    >
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your day-by-day sprint</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              From concept to first paying customer in fourteen focused days. Click any day to see
              the exact assets you'll ship — and jump straight to them.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/60 px-3 py-2 text-right">
            <div className="text-xs text-muted-foreground">Sprint progress</div>
            <div className="text-lg font-semibold">
              {daysComplete}<span className="text-muted-foreground">/14 days</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {assetsReady}/{totalAssets} assets ready
            </div>
          </div>
        </div>


        {/* Week 1 */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Week 1
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Foundation & Validation
            </span>
            <div className="ml-2 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" aria-hidden />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysWithState.slice(0, 7).map(renderTile)}
          </div>
        </div>

        {/* Week 2 */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
              Week 2
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Build, Launch, Sell
            </span>
            <div className="ml-2 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" aria-hidden />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysWithState.slice(7, 14).map(renderTile)}
          </div>
        </div>

        {active && (() => {
          const availableKeys = active.day.assetKeys.filter((k) => typeByKey.has(k));

          const renderRow = (k: string) => {
            const t = typeByKey.get(k);
            const d = docByType.get(k);
            const isComplete = d?.status === "complete";
            const generating = d?.status === "generating" || isGeneratingKey?.(k);
            const optional = isOptional(k);
            const track = trackFor(k);
            return (
              <li
                key={k}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                  optional
                    ? "border-dashed border-amber-400/30 bg-amber-500/5"
                    : "border-white/5 bg-background/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                  ) : generating ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{t?.name ?? k}</span>
                      <TrackChip track={track} />
                      {optional && (
                        <span
                          className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
                          title="Only needed if you're shipping a physical product"
                        >
                          Physical products only
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>
                        {isComplete
                          ? "Ready to open"
                          : generating
                            ? "Writing now…"
                            : optional
                              ? "Optional — skip unless shipping a physical product"
                              : "Not started yet"}
                      </span>
                      {(t?.estimated_minutes ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="opacity-40">·</span>
                          <Clock className="h-3 w-3" />
                          <span className="tabular-nums">{timeChipLabel(track, t.estimated_minutes)}</span>
                        </span>
                      )}
                    </div>
                    {(() => {
                      const companion = COMPANION_ASSET[k];
                      if (!companion || !typeByKey.has(companion.key) || k === companion.key) return null;
                      const cDoc = docByType.get(companion.key);
                      const cReady = cDoc?.status === "complete";
                      return (
                        <button
                          type="button"
                          onClick={() => onScrollToDoc(companion.key)}
                          className="mt-1 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                          title={`Jump to ${companion.label} in ${companion.category}`}
                        >
                          <FileText className="h-3 w-3" />
                          {cReady ? "Ready" : "Available"}: {companion.label} · under {companion.category}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      );
                    })()}
                  </div>
                </div>


                <div className="flex items-center gap-1">
                  {isComplete ? (
                    <>
                      <Button size="sm" onClick={() => onOpenDoc(d)}>
                        Open <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onScrollToDoc(k)} title="Jump to card below">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={optional ? "ghost" : "outline"}
                        onClick={() => onGenerateDoc(k)}
                        disabled={generating || jobRunning}
                        title={optional ? "Only needed if you're shipping a physical product" : undefined}
                      >
                        {generating ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-3 w-3" />
                        )}
                        Generate
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onScrollToDoc(k)} title="Jump to card below">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          };

          const grouped: Array<{ track: AssetTrack; keys: string[] }> = TRACK_ORDER
            .map((tr) => ({ track: tr, keys: availableKeys.filter((k) => trackFor(k) === tr) }))
            .filter((g) => g.keys.length > 0);

          return (
            <div className="mt-6 rounded-xl border border-white/10 bg-card/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[active.day.category]}`} aria-hidden />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Day {active.day.day} · {active.day.category}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{active.day.theme}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{active.day.objective}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Done when:</span> {active.day.doneWhen}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {(() => {
                    const s = daySplit(active.day, typeByKey, optionalKeys);
                    return (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {active.done}/{active.total} ready · <span className="tabular-nums">≈ {formatDuration(s.total)}</span> focused work
                        </div>
                        {(s.read > 0 || s.do > 0) && (
                          <div className="mt-0.5 text-[11px] text-muted-foreground/80 tabular-nums">
                            {s.read > 0 && <span className="text-indigo-400">Read {formatDuration(s.read)}</span>}
                            {s.read > 0 && s.do > 0 && <span className="mx-1 opacity-40">·</span>}
                            {s.do > 0 && <span className="text-teal-400">Build {formatDuration(s.do)}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-2">
                    {onOpenDayDeck && availableKeys.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => onOpenDayDeck(active.day)}
                        className="gap-1.5"
                      >
                        <Presentation className="h-3.5 w-3.5" /> Open Day Deck
                      </Button>
                    )}
                    {availableKeys.length > 1 && (
                      <div
                        className="inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-background/40 p-0.5"
                        role="group"
                        aria-label="Sort assets"
                      >
                        <span className="pl-2 pr-1 text-[10px] uppercase tracking-wider text-muted-foreground">Sort</span>
                        {(["sequence", "track"] as SortMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSortMode(mode)}
                            aria-pressed={sortMode === mode}
                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                              sortMode === mode
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {mode === "sequence" ? "Sequence" : "By track"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {availableKeys.length === 0 ? (
                <ul className="mt-4">
                  <li className="rounded-lg border border-dashed border-white/10 bg-background/30 px-3 py-4 text-center text-xs text-muted-foreground">
                    No assets mapped to this day yet.
                  </li>
                </ul>
              ) : sortMode === "sequence" ? (
                <ul className="mt-4 space-y-2">{availableKeys.map(renderRow)}</ul>
              ) : (
                <div className="mt-4 space-y-4">
                  {grouped.map(({ track, keys }) => {
                    const meta = TRACK_META[track];
                    const Icon = meta.icon;
                    return (
                      <div key={track}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
                          <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {meta.label} <span className="text-muted-foreground/70">· {keys.length}</span>
                          </span>
                          <div className="ml-2 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" aria-hidden />
                        </div>
                        <ul className="space-y-2">{keys.map(renderRow)}</ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
