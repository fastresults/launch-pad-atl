import { useState } from "react";
import { VALUE_ROWS, VALUE_TOTALS, formatCostRange, formatHoursRange, type ValueRow } from "@/lib/value-grid";
import { Check, ChevronDown, ChevronUp, Clock, DollarSign, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PREVIEW_COUNT = 5;

function PostWorkshopTip({ row }: { row: ValueRow }) {
  if (!row.postWorkshop) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="What to do after the workshop"
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors align-middle"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-1">
          After the workshop
        </div>
        <p className="text-xs leading-relaxed">{row.postWorkshop}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const STAGE_TINT = [
  "from-fuchsia-500/10",
  "from-violet-500/10",
  "from-blue-500/10",
  "from-cyan-500/10",
  "from-emerald-500/10",
  "from-amber-500/10",
  "from-rose-500/10",
];

export function ValueGrid({ showCosts = true }: { showCosts?: boolean } = {}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? VALUE_ROWS : VALUE_ROWS.slice(0, PREVIEW_COUNT);
  const hiddenCount = VALUE_ROWS.length - PREVIEW_COUNT;

  // Group only the visible rows, but remember the first row per stage in the
  // full list so the stage label only renders on the actual first row of that stage.
  const firstIndexByStage = new Map<number, number>();
  VALUE_ROWS.forEach((r, i) => {
    if (!firstIndexByStage.has(r.stageN)) firstIndexByStage.set(r.stageN, i);
  });

  const grouped = visibleRows.reduce<Record<number, { row: ValueRow; globalIdx: number }[]>>((acc, r, i) => {
    (acc[r.stageN] ||= []).push({ row: r, globalIdx: i });
    return acc;
  }, {});
  const stageNums = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const ExpandToggle = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      aria-controls="value-grid-rows"
      className={`group w-full flex flex-col items-center justify-center gap-1 py-5 text-sm font-medium text-foreground hover:bg-white/[0.03] transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        {expanded ? (
          <>Show less <ChevronUp className="size-4 transition-transform group-hover:-translate-y-0.5" /></>
        ) : (
          <>Show all {VALUE_ROWS.length} deliverables <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" /></>
        )}
      </span>
      {!expanded && (
        <span className="text-xs text-muted-foreground">
          + {hiddenCount} more{showCosts ? ", market cost & DIY time totals" : ""}
        </span>
      )}
    </button>
  );


  return (
    <TooltipProvider delayDuration={150}>
    <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
      {/* Desktop / tablet table */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <div className="col-span-2">Stage</div>
          <div className={showCosts ? "col-span-6" : "col-span-9"}>Deliverable</div>
          {showCosts && <div className="col-span-2 text-right">Market cost</div>}
          {showCosts && <div className="col-span-1 text-right">DIY time</div>}
          <div className="col-span-1 text-right">Included</div>
        </div>
        <div id="value-grid-rows" className="relative">
          {stageNums.map((n) => (
            <div key={n} className={`bg-gradient-to-r ${STAGE_TINT[n - 1]} to-transparent`}>
              {grouped[n].map(({ row: r, globalIdx }) => {
                const isFirstOfStage = globalIdx === firstIndexByStage.get(r.stageN);
                return (
                  <div
                    key={r.deliverable}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center text-sm"
                  >
                    <div className="col-span-2">
                      {isFirstOfStage ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                            {n}
                          </span>
                          <span className="text-foreground/90">{r.stageLabel}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 pl-8">↳</span>
                      )}
                    </div>
                    <div className={`${showCosts ? "col-span-6" : "col-span-9"} text-foreground/90 flex items-center gap-2`}>
                      <span>{r.deliverable}</span>
                      <PostWorkshopTip row={r} />
                    </div>
                    {showCosts && (
                      <div className="col-span-2 text-right tabular-nums text-foreground/80">
                        {formatCostRange(r.marketCostMin, r.marketCostMax)}
                      </div>
                    )}
                    {showCosts && (
                      <div className="col-span-1 text-right tabular-nums text-muted-foreground">
                        {formatHoursRange(r.diyHoursMin, r.diyHoursMax)}
                      </div>
                    )}
                    <div className="col-span-1 flex justify-end">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="size-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-card" />
          )}
        </div>
        {expanded && showCosts && (
          <div className="grid grid-cols-12 gap-4 px-6 py-5 bg-hero-gradient text-white items-center">
            <div className="col-span-8 font-medium">
              Total if you built it all yourself or hired it out
            </div>
            <div className="col-span-2 text-right tabular-nums font-semibold">
              {formatCostRange(VALUE_TOTALS.costMin, VALUE_TOTALS.costMax)}
            </div>
            <div className="col-span-1 text-right tabular-nums font-semibold">
              {formatHoursRange(VALUE_TOTALS.hoursMin, VALUE_TOTALS.hoursMax)}
            </div>
            <div className="col-span-1 text-right text-xs uppercase tracking-[0.18em] opacity-90">
              All in
            </div>
          </div>
        )}
        <ExpandToggle className="border-t border-white/10" />
      </div>


      {/* Mobile cards grouped by stage */}
      <div className="lg:hidden">
        {stageNums.map((n) => (
          <div key={n} className={`bg-gradient-to-b ${STAGE_TINT[n - 1]} to-transparent`}>
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                {n}
              </span>
              <span className="font-medium">{grouped[n][0].row.stageLabel}</span>
            </div>
            {grouped[n].map(({ row: r }) => (
              <div key={r.deliverable} className="px-5 py-4 border-b border-white/5 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                  <span className="flex-1">{r.deliverable}</span>
                  <PostWorkshopTip row={r} />
                </div>
                {showCosts && (
                  <div className="flex gap-4 pl-6 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="size-3" />
                      {formatCostRange(r.marketCostMin, r.marketCostMax)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatHoursRange(r.diyHoursMin, r.diyHoursMax)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {expanded && showCosts && (
          <div className="px-5 py-5 bg-hero-gradient text-white">
            <div className="font-medium text-sm mb-2">If you built or hired it all yourself</div>
            <div className="flex justify-between text-sm">
              <span className="inline-flex items-center gap-1">
                <DollarSign className="size-4" />
                {formatCostRange(VALUE_TOTALS.costMin, VALUE_TOTALS.costMax)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                {formatHoursRange(VALUE_TOTALS.hoursMin, VALUE_TOTALS.hoursMax)}
              </span>
            </div>
          </div>
        )}

        <ExpandToggle className="border-t border-white/10" />
      </div>
    </div>
    </TooltipProvider>
  );
}
