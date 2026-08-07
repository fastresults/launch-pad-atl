// @ts-nocheck
// Dynamic per-day "sprint deck" — a facilitator-style presentation generated
// from a LaunchDay + the venture's asset metadata. Reuses SlideLayout and
// ScaledSlide so it looks like the rest of our decks, but slides are built
// in-memory (no static registry / no override fetching).

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Compass,
  BookOpen,
  Activity,
  Zap,
  ListOrdered,
  Rocket,
} from "lucide-react";
import { SlideLayout } from "@/components/workshop-slides/SlideLayout";
import { ScaledSlide } from "@/components/workshop-slides/ScaledSlide";
import type { LaunchDay } from "@/lib/launch-14day-plan";
import {
  TRACK_META,
  TRACK_ORDER,
  formatDuration,
  timeChipLabel,
  timeSplit,
  trackFor,
  type AssetTrack,
} from "@/lib/asset-tracks";
import { guidanceFor, HOW_TO_COMPLETE } from "@/lib/launch-14day-guidance";

type Slide = { id: string; title: string; render: () => ReactNode };

type Props = {
  day: LaunchDay | null;
  typeByKey: Map<string, any>;
  completedKeys: Set<string>;
  isPhysical?: boolean;
  sourcingOnlyKeys?: Set<string>;
  onOpenChange: (open: boolean) => void;
  onJumpToAsset?: (key: string) => void;
};

const CATEGORY_KICKER_TONE: Record<string, string> = {
  Foundation: "text-primary",
  Strategy: "text-indigo-300",
  Operations: "text-teal-300",
  Finance: "text-amber-300",
  Governance: "text-slate-300",
  Brand: "text-fuchsia-300",
  Marketing: "text-sky-300",
  "Social & Content": "text-rose-300",
};

function TrackChipSlide({ track }: { track: AssetTrack }) {
  const m = TRACK_META[track];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 slide-chrome font-semibold uppercase tracking-wide ${m.chip}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {m.label}
    </span>
  );
}

function TimeChipSlide({ minutes, track }: { minutes: number; track: AssetTrack }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 slide-chrome font-medium text-white/80">
      <Clock className="h-4 w-4" aria-hidden />
      {timeChipLabel(track, minutes)}
    </span>
  );
}

export function DaySprintDeckDialog({
  day,
  typeByKey,
  completedKeys,
  isPhysical = false,
  sourcingOnlyKeys,
  onOpenChange,
  onJumpToAsset,
}: Props) {
  const optionalKeys = useMemo(
    () =>
      !isPhysical
        ? (sourcingOnlyKeys ?? new Set<string>(["supplier_shortlist", "bom_and_landed_cost"]))
        : new Set<string>(),
    [sourcingOnlyKeys, isPhysical],
  );

  const slides = useMemo<Slide[]>(() => {
    if (!day) return [];

    // Only include assets that actually exist for this venture, and skip
    // optional (physical-only) ones for non-physical ventures — those aren't
    // part of today's work.
    const availableKeys = day.assetKeys
      .filter((k) => typeByKey.has(k))
      .filter((k) => !optionalKeys.has(k));

    const orderedKeys = [...availableKeys].sort((a, b) => {
      const ta = TRACK_META[trackFor(a)].order;
      const tb = TRACK_META[trackFor(b)].order;
      if (ta !== tb) return ta - tb;
      return day.assetKeys.indexOf(a) - day.assetKeys.indexOf(b);
    });

    const totals = orderedKeys.reduce(
      (acc, k) => {
        const t = typeByKey.get(k);
        const mins = t?.estimated_minutes ?? 0;
        const s = timeSplit(trackFor(k), mins);
        acc.total += mins;
        acc.read += s.read;
        acc.do += s.do;
        return acc;
      },
      { total: 0, read: 0, do: 0 },
    );

    const guide = guidanceFor(day.day);
    const kickerTone = CATEGORY_KICKER_TONE[day.category] ?? "text-primary";
    const KICKER = `Day ${day.day} · ${day.category.toUpperCase()}`;
    const pl = (i: number, total: number) => `${i} / ${total}`;

    const firstNotComplete =
      orderedKeys.find((k) => !completedKeys.has(k)) ?? orderedKeys[0] ?? null;

    const grouped: Array<{ track: AssetTrack; keys: string[] }> = TRACK_ORDER
      .map((tr) => ({ track: tr, keys: orderedKeys.filter((k) => trackFor(k) === tr) }))
      .filter((g) => g.keys.length > 0);

    // ----- fixed slides -----
    const fixed: Slide[] = [];

    // 1. Cover
    fixed.push({
      id: "cover",
      title: "Cover",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="" variant="dark">
          <div className="max-w-[1500px]">
            <div className={`slide-kicker font-semibold mb-10 ${kickerTone}`}>
              Day {day.day} of 14 · Week {day.week} · {day.category}
            </div>
            <h1 className="slide-title-lg font-semibold tracking-tight">{day.theme}</h1>
            <p className="slide-subtitle mt-10 text-white/80 max-w-[1300px]">{day.objective}</p>
            <div className="mt-14 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 slide-chrome font-semibold text-white">
                <Clock className="h-5 w-5" /> ≈ {formatDuration(totals.total)} focused work
              </span>
              <span className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 slide-chrome text-white/80">
                {orderedKeys.length} assets today
              </span>
            </div>
          </div>
        </SlideLayout>
      ),
    });

    // 2. Why today matters
    fixed.push({
      id: "why",
      title: "Why today matters",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1500px]">
            <div className="slide-kicker font-semibold text-primary mb-8">Why today matters</div>
            <h2 className="slide-title font-semibold tracking-tight">{day.objective}</h2>
            <p className="slide-body-lg mt-8 max-w-[1200px] text-muted-foreground">{guide.why}</p>
          </div>
        </SlideLayout>
      ),
    });

    // 3. Done when
    fixed.push({
      id: "done-when",
      title: "What done looks like",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1500px]">
            <div className="slide-kicker font-semibold text-primary mb-8">What "done" looks like today</div>
            <div className="flex items-start gap-6">
              <CheckCircle2 className="h-16 w-16 shrink-0 text-status-success" />
              <h2 className="slide-title font-semibold tracking-tight">{day.doneWhen}</h2>
            </div>
          </div>
        </SlideLayout>
      ),
    });

    // 4. The plan overview (by track)
    fixed.push({
      id: "plan",
      title: "The plan",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1600px] w-full">
            <div className="slide-kicker font-semibold text-primary mb-8">The plan · by track</div>
            <div
              className={`grid gap-6 ${
                grouped.length >= 3 ? "grid-cols-3" : grouped.length === 2 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {grouped.map(({ track, keys }) => {
                const m = TRACK_META[track];
                const Icon = m.icon;
                const trackMins = keys.reduce(
                  (s, k) => s + (typeByKey.get(k)?.estimated_minutes ?? 0),
                  0,
                );
                return (
                  <div
                    key={track}
                    className="rounded-2xl border border-border bg-card/60 p-6 min-h-[420px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${m.dot}/20`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="slide-chrome font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.label} · {keys.length} · {formatDuration(trackMins)}
                      </div>
                    </div>
                    <ul className="mt-5 space-y-3">
                      {keys.map((k) => {
                        const t = typeByKey.get(k);
                        return (
                          <li key={k} className="rounded-xl border border-border/60 bg-background/40 p-3">
                            <div className="slide-body font-semibold leading-tight text-foreground">
                              {t?.name ?? k}
                            </div>
                            <div className="mt-1 slide-chrome text-muted-foreground">
                              <Clock className="mr-1 inline h-3.5 w-3.5" />
                              {timeChipLabel(track, t?.estimated_minutes ?? 0)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </SlideLayout>
      ),
    });

    // ----- asset slides -----
    const assetSlides: Slide[] = orderedKeys.map((k, i) => {
      const t = typeByKey.get(k);
      const track = trackFor(k);
      const mins = t?.estimated_minutes ?? 0;
      const status = completedKeys.has(k) ? "Ready to open" : "Not started yet";
      const howTo = HOW_TO_COMPLETE[track];
      return {
        id: `asset-${k}`,
        title: t?.name ?? k,
        render: () => (
          <SlideLayout stageKicker={KICKER} pageLabel="">
            <div className="grid w-full max-w-[1600px] grid-cols-2 gap-12">
              <div>
                <div className="slide-kicker font-semibold text-muted-foreground mb-6">
                  Asset {i + 1} of {orderedKeys.length}
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <TrackChipSlide track={track} />
                  <TimeChipSlide minutes={mins} track={track} />
                </div>
                <h2 className="slide-title font-semibold tracking-tight">{t?.name ?? k}</h2>
                <p className="slide-body-lg mt-6 text-muted-foreground">{t?.description ?? ""}</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card/60 p-8">
                <div>
                  <div className="slide-kicker font-semibold text-primary mb-4">How to complete this</div>
                  <p className="slide-body text-foreground/90">{howTo}</p>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="slide-chrome text-muted-foreground">
                    Status · <span className="text-foreground font-semibold">{status}</span>
                  </div>
                  {onJumpToAsset && (
                    <button
                      type="button"
                      onClick={() => onJumpToAsset(k)}
                      className="inline-flex items-center gap-3 rounded-2xl bg-primary px-6 py-4 slide-body font-semibold text-primary-foreground shadow hover:opacity-90 transition"
                    >
                      Open this asset <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </SlideLayout>
        ),
      };
    });

    // 5. Order of operations
    const orderSlide: Slide = {
      id: "order",
      title: "Order of operations",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1500px] w-full">
            <div className="slide-kicker font-semibold text-primary mb-8 flex items-center gap-3">
              <ListOrdered className="h-5 w-5" /> Order of operations
            </div>
            <ol className="space-y-4">
              {orderedKeys.map((k, i) => {
                const t = typeByKey.get(k);
                const track = trackFor(k);
                const m = TRACK_META[track];
                return (
                  <li
                    key={k}
                    className="flex items-center gap-6 rounded-2xl border border-border bg-card/60 px-6 py-5"
                  >
                    <span className="slide-title font-bold text-muted-foreground/50 w-16">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="slide-body-lg font-semibold text-foreground">{t?.name ?? k}</div>
                      <div className="mt-1 slide-chrome text-muted-foreground">
                        {m.label} · <Clock className="mr-1 inline h-3.5 w-3.5" />
                        {timeChipLabel(track, t?.estimated_minutes ?? 0)}
                      </div>
                    </div>
                    <span className={`h-3 w-3 rounded-full ${m.dot}`} aria-hidden />
                  </li>
                );
              })}
            </ol>
          </div>
        </SlideLayout>
      ),
    };

    // 6. Time budget
    const budgetSlide: Slide = {
      id: "budget",
      title: "Time budget",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1500px] w-full">
            <div className="slide-kicker font-semibold text-primary mb-8">Today's time budget</div>
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Total", value: formatDuration(totals.total), tone: "text-foreground" },
                { label: "Read", value: formatDuration(totals.read), tone: "text-indigo-400" },
                { label: "Build", value: formatDuration(totals.do), tone: "text-teal-400" },
                { label: "Assets", value: String(orderedKeys.length), tone: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-6 min-h-[220px] flex flex-col justify-between">
                  <div className="slide-chrome font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className={`slide-title-lg font-bold tracking-tight ${s.tone}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <div className="slide-kicker font-semibold text-primary mb-3">Suggested schedule</div>
              <p className="slide-body-lg text-foreground/90">{guide.suggestedSchedule}</p>
            </div>
          </div>
        </SlideLayout>
      ),
    };

    // 7. Pitfalls
    const pitfallsSlide: Slide = {
      id: "pitfalls",
      title: "Common pitfalls",
      render: () => (
        <SlideLayout stageKicker={KICKER} pageLabel="">
          <div className="max-w-[1500px] w-full">
            <div className="slide-kicker font-semibold text-amber-500 mb-8 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" /> Common pitfalls
            </div>
            <ul className="space-y-6">
              {guide.pitfalls.map((p, i) => (
                <li key={i} className="flex items-start gap-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                  <span className="slide-title-lg font-bold text-amber-500/70 w-16">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="slide-body-lg text-foreground/90">{p}</p>
                </li>
              ))}
            </ul>
          </div>
        </SlideLayout>
      ),
    };

    // 8. CTA
    const ctaSlide: Slide = {
      id: "cta",
      title: "Do this next",
      render: () => {
        const firstT = firstNotComplete ? typeByKey.get(firstNotComplete) : null;
        return (
          <SlideLayout stageKicker={KICKER} pageLabel="" variant="dark">
            <div className="max-w-[1500px]">
              <div className="slide-kicker font-semibold text-white/60 mb-8 flex items-center gap-3">
                <Rocket className="h-5 w-5" /> Do this next
              </div>
              <h2 className="slide-title-lg font-semibold tracking-tight">
                {firstT ? `Start with ${firstT.name}.` : "You're all caught up for today."}
              </h2>
              <p className="slide-subtitle mt-8 text-white/70 max-w-[1200px]">
                Close this deck and jump straight to the asset — everything you need to complete today
                is one click away.
              </p>
              {firstNotComplete && onJumpToAsset && (
                <button
                  type="button"
                  onClick={() => onJumpToAsset(firstNotComplete)}
                  className="mt-12 inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-5 slide-body-lg font-semibold text-primary-foreground shadow hover:opacity-90 transition"
                >
                  Start with {firstT?.name ?? "the first asset"} <ArrowRight className="h-6 w-6" />
                </button>
              )}
            </div>
          </SlideLayout>
        );
      },
    };

    return [...fixed, ...assetSlides, orderSlide, budgetSlide, pitfallsSlide, ctaSlide];
  }, [day, typeByKey, completedKeys, optionalKeys, onJumpToAsset]);

  const open = !!day;
  const [index, setIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [day?.day]);

  const goto = useCallback(
    (i: number) => {
      setIndex(Math.min(Math.max(i, 0), Math.max(slides.length - 1, 0)));
    },
    [slides.length],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goto(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goto(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goto(slides.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, goto, slides.length, toggleFullscreen]);

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2800);
  }, []);

  useEffect(() => {
    if (!open) return;
    bumpChrome();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [open, index, bumpChrome]);

  const current = slides[index];
  const progress = slides.length ? ((index + 1) / slides.length) * 100 : 0;
  const deckTitle = day ? `Day ${day.day} — ${day.theme}` : "Day sprint deck";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] h-[92dvh] max-h-[92dvh] p-0 gap-0 overflow-hidden bg-background border-border flex flex-col">
        <DialogTitle className="sr-only">{deckTitle}</DialogTitle>

        <div
          ref={stageRef}
          onMouseMove={bumpChrome}
          className="relative flex-1 min-h-0 bg-black overflow-hidden"
          aria-label="Day sprint deck"
        >
          <div
            className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-b from-black/70 to-transparent text-white transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <span className="truncate text-sm font-medium">{deckTitle}</span>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <span>Slide {index + 1} / {slides.length}</span>
              <span className="hidden sm:inline opacity-60">←/→ navigate · F fullscreen · Esc close</span>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-md hover:bg-white/10"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="absolute inset-0">
            <ScaledSlide key={index}>{current?.render()}</ScaledSlide>
          </div>

          <div className="sr-only" aria-live="polite">
            Slide {index + 1} of {slides.length}
          </div>

          <button
            onClick={() => goto(index - 1)}
            disabled={index === 0}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goto(index + 1)}
            disabled={index >= slides.length - 1}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-opacity duration-300 ${
              chromeVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="hidden md:flex shrink-0 items-center gap-2 px-4 py-3 bg-neutral-950 border-t border-white/10 overflow-x-auto">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goto(i)}
              className={`relative shrink-0 w-[160px] h-[90px] rounded-md overflow-hidden border-2 transition ${
                i === index ? "border-primary ring-2 ring-primary/40" : "border-white/10 hover:border-white/30"
              }`}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
            >
              <div className="absolute inset-0 bg-black">
                <ScaledSlide>{s.render()}</ScaledSlide>
              </div>
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
