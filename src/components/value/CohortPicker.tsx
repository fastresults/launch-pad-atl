import { type Cohort, getFirstSoldOut, toPublicSeats, toPublicTaken } from "@/lib/cohorts";
import type { CohortAvailability } from "@/lib/cohort-availability.functions";
import { CalendarDays, Check, Lock, MapPin } from "lucide-react";

type Props = {
  cohorts: Cohort[];
  selectedId: string;
  onSelect: (id: string) => void;
  availability?: CohortAvailability;
};

export function CohortPicker({ cohorts, selectedId, onSelect, availability }: Props) {
  if (cohorts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-5 text-sm text-muted-foreground">
        No upcoming cohorts scheduled yet.
      </div>
    );
  }

  const featured = cohorts.find((c) => c.id === selectedId) ?? cohorts[0];
  const firstSoldOut = getFirstSoldOut(cohorts);

  // Sequential scarcity for the featured (active) cohort pill:
  // While Founders has real seats, the pill reflects Founders scarcity.
  // Once Founders sells out, it rolls to Cohort scarcity.
  const availabilityForFeatured =
    availability && availability.cohort_id === featured.id ? availability : undefined;

  let pillTier: "founders" | "cohort" | null = null;
  let pillSeatsLeft: number | undefined;
  let pillShow = false;

  if (availabilityForFeatured) {
    if (!availabilityForFeatured.founders.soldOut) {
      pillTier = "founders";
      const pubCap = toPublicSeats(featured.foundersSeats);
      const pubTaken = toPublicTaken(
        availabilityForFeatured.founders.displayedTaken,
        featured.foundersSeats,
        pubCap,
      );
      pillSeatsLeft = Math.max(pubCap - pubTaken, 0);
      pillShow = availabilityForFeatured.founders.showSellingFast;
    } else if (!availabilityForFeatured.cohort.soldOut) {
      pillTier = "cohort";
      const pubCap = toPublicSeats(featured.cohortSeats);
      const pubTaken = toPublicTaken(
        availabilityForFeatured.cohort.displayedTaken,
        featured.cohortSeats,
        pubCap,
      );
      pillSeatsLeft = Math.max(pubCap - pubTaken, 0);
      pillShow = availabilityForFeatured.cohort.showSellingFast;
    }
  } else {
    // Fallback when availability isn't loaded yet — preserve previous behavior.
    pillShow = featured.status === "filling";
    pillSeatsLeft = featured.seatsLeft != null ? toPublicSeats(featured.seatsLeft) : undefined;
  }

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
              {pillShow && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
                  </span>
                  Filling up
                  {typeof pillSeatsLeft === "number" && (
                    <>
                      {" · "}
                      {pillSeatsLeft} {pillTier === "cohort" ? "Cohort" : pillTier === "founders" ? "Founders" : ""}
                      {pillTier ? " " : ""}seats left
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-lg font-semibold text-foreground">
              {featured.dateLabel}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span className="truncate">{featured.cityLabel}</span>
            </div>
          </div>
        </div>
        {firstSoldOut && featured.id !== firstSoldOut.id && (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            <span>
              <span className="line-through">{firstSoldOut.shortLabel}</span> sold out
            </span>
          </div>
        )}
      </div>

      {/* Different-location callout */}
      {!featured.isDefaultVenue && featured.status !== "sold_out" && (
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-5 py-3 md:px-6">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <div className="text-xs leading-relaxed text-amber-100">
              <span className="font-semibold text-amber-200">
                Heads up — this cohort meets in {featured.venueCity}, not Norcross.
              </span>{" "}
              <span className="text-amber-100/90">
                {featured.venueName} · {featured.venueAddress}, {featured.venueCity}, {featured.venueRegion} {featured.venuePostal}
              </span>{" "}
              <a
                href={featured.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-amber-50"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Pill rail */}
      <div className="px-3 py-3 md:px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
          {cohorts.map((c) => (
            <CohortPill
              key={c.id}
              cohort={c}
              selected={c.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          Monthly cohorts · 8:00 AM – 4:30 PM ET · Most meet in Norcross, GA
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

  const [month, day] = cohort.shortLabel.split(" ");

  return (
    <button
      type="button"
      disabled={isSoldOut}
      onClick={() => !isSoldOut && onSelect(cohort.id)}
      aria-pressed={selected}
      aria-label={`${cohort.dateLabel}${isSoldOut ? " (sold out)" : ""}${!cohort.isDefaultVenue ? ` in ${cohort.cityLabel}` : ""}`}
      className={`${base} ${stateClass}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] uppercase tracking-wider ${isSoldOut ? "line-through" : "text-muted-foreground"}`}>
          {month}
        </span>
        {isFilling && !selected && (
          <span className="inline-block size-1.5 rounded-full bg-amber-400" />
        )}
        {selected && !isSoldOut && (
          <Check className="size-3 text-primary" />
        )}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${isSoldOut ? "line-through" : ""}`}>
        {day}
      </div>
      {isSoldOut ? (
        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/70">
          Sold out
        </div>
      ) : !cohort.isDefaultVenue ? (
        <div className="mt-0.5 flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-300">
          <MapPin className="size-2.5" />
          {cohort.venueCity}
        </div>
      ) : null}
    </button>
  );
}
