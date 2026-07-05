// @ts-nocheck
import { useMemo, useState } from "react";
import { Sparkles, CheckCircle2, Circle, ArrowRight, Loader2, ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNCH_14DAY_PLAN, CATEGORY_DOT, type LaunchDay } from "@/lib/launch-14day-plan";

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
}

function tileState(
  day: LaunchDay,
  completedKeys: Set<string>,
  typeByKey: Map<string, any>,
  isOptional: (k: string) => boolean,
) {
  const allKeys = day.assetKeys.filter((k) => typeByKey.has(k));
  const requiredKeys = allKeys.filter((k) => !isOptional(k));
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
}: Props) {
  const optionalKeys = useMemo(
    () => sourcingOnlyKeys ?? new Set<string>(["supplier_shortlist", "bom_and_landed_cost"]),
    [sourcingOnlyKeys],
  );
  const isOptional = (k: string) => !isPhysical && optionalKeys.has(k);

  const docByType = useMemo(() => {
    const m = new Map<string, any>();
    for (const d of docs ?? []) m.set(d.document_type, d);
    return m;
  }, [docs]);

  const daysWithState = useMemo(
    () => LAUNCH_14DAY_PLAN.map((d) => ({ day: d, ...tileState(d, completedKeys, typeByKey, isOptional) })),
    [completedKeys, typeByKey, isPhysical, optionalKeys],
  );

  const daysComplete = daysWithState.filter((d) => d.state === "complete").length;
  const totalAssets = daysWithState.reduce((s, d) => s + d.total, 0);
  const assetsReady = daysWithState.reduce((s, d) => s + d.done, 0);

  // Default-open the first non-complete day so the panel is never empty.
  const firstIncomplete = daysWithState.find((d) => d.state !== "complete")?.day.day ?? 1;
  const [openDay, setOpenDay] = useState<number>(firstIncomplete);
  const active = daysWithState.find((d) => d.day.day === openDay) ?? daysWithState[0];

  const renderTile = (entry: typeof daysWithState[number]) => {
    const { day, state, done, total } = entry;
    const isOpen = openDay === day.day;

    const base =
      "group relative flex h-20 w-full flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all";
    const stateClass =
      state === "complete"
        ? "border-status-success/40 bg-status-success/10 hover:bg-status-success/15"
        : state === "partial"
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-white/10 bg-card/60 hover:bg-card/80";
    const ring = isOpen ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "";

    return (
      <button
        key={day.day}
        type="button"
        onClick={() => setOpenDay(day.day)}
        className={`${base} ${stateClass} ${ring}`}
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
          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
            {state === "complete" ? (
              <CheckCircle2 className="h-3 w-3 text-status-success" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            <span>
              {done}/{total || "–"}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-background via-card to-background p-6 shadow-sm">
      <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <Rocket className="h-3.5 w-3.5" /> 14-Day Launch Method
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Your day-by-day sprint</h2>
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

        {/* Detail panel */}
        {active && (
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
              <div className="text-right text-xs text-muted-foreground">
                {active.done}/{active.total} assets ready today
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {active.day.assetKeys
                .filter((k) => typeByKey.has(k))
                .map((k) => {
                  const t = typeByKey.get(k);
                  const d = docByType.get(k);
                  const isComplete = d?.status === "complete";
                  const generating = d?.status === "generating" || isGeneratingKey?.(k);
                  const optional = isOptional(k);
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
                            {optional && (
                              <span
                                className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300"
                                title="Only needed if you're shipping a physical product"
                              >
                                Physical products only
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {isComplete
                              ? "Ready to open"
                              : generating
                                ? "Writing now…"
                                : optional
                                  ? "Optional — skip unless you're shipping a physical product"
                                  : "Not started yet"}
                          </div>
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
                })}
              {active.day.assetKeys.filter((k) => typeByKey.has(k)).length === 0 && (
                <li className="rounded-lg border border-dashed border-white/10 bg-background/30 px-3 py-4 text-center text-xs text-muted-foreground">
                  No assets mapped to this day yet.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
