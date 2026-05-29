import { COHORTS, FIRST_SOLD_OUT, type Cohort } from "@/lib/cohorts";
import { CalendarDays, Check, Lock } from "lucide-react";

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export function CohortPicker({ selectedId, onSelect }: Props) {
  const featured = COHORTS.find((c) => c.id === selectedId) ?? COHORTS[0];
  const isFilling = featured.status === "filling";

  return (
    <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
      {/* Featured row */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 md:px-6 bg-white/[0.02] border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-hero-gradient text-white">
            <CalendarDays className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {featured.status === "sold_out" ? "Sold out" : "Your cohort"}
              </span>
              {isFilling && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
                  </span>
                  Filling up
                  {typeof featured.seatsLeft === "number" && ` · ${featured.seatsLeft} seats left`}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-lg font-semibold text-foreground">
              {featured.dateLabel}
            </div>
          </div>
        </div>
        {FIRST_SOLD_OUT && featured.id !== FIRST_SOLD_OUT.id && (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            <span>
              <span className="line-through">{FIRST_SOLD_OUT.shortLabel}</span> sold out
            </span>
          </div>
        )}
      </div>

      {/* Pill rail */}
      <div className="px-3 py-3 md:px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
          {COHORTS.map((c) => (
            <CohortPill
              key={c.id}
              cohort={c}
              selected={c.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Workshops run the third Wednesday of every month · 8:00 AM – 4:30 PM ET
        </p>
      </div>
    </div>
  );
}

function CohortPill({
  cohort,
  selected,
  onSelect,
}: {
  cohort: Cohort;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const isSoldOut = cohort.status === "sold_out";
  const isFilling = cohort.status === "filling";

  const base =
    "group relative shrink-0 rounded-xl border px-3 py-2 text-left transition-all min-w-[88px]";
  const stateClass = isSoldOut
    ? "border-white/5 bg-white/[0.02] text-muted-foreground/60 cursor-not-allowed"
    : selected
    ? "border-primary bg-primary/10 text-foreground shadow-[0_0_0_1px_var(--color-primary)]"
    : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05] text-foreground/90";

  return (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={() => !isSoldOut && onSelect(cohort.id)}
      aria-pressed={selected}
      aria-label={`${cohort.dateLabel}${isSoldOut ? " (sold out)" : ""}`}
      className={`${base} ${stateClass}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] uppercase tracking-wider ${isSoldOut ? "line-through" : "text-muted-foreground"}`}>
          {cohort.shortLabel.split(" ")[0]}
        </span>
        {isFilling && !selected && (
          <span className="inline-block size-1.5 rounded-full bg-amber-400" />
        )}
        {selected && !isSoldOut && (
          <Check className="size-3 text-primary" />
        )}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${isSoldOut ? "line-through" : ""}`}>
        {cohort.shortLabel.split(" ")[1]}
      </div>
      {isSoldOut && (
        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/70">
          Sold out
        </div>
      )}
    </button>
  );
}
