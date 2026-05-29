import { type TierKey } from "@/lib/value-grid";
import { type Cohort, formatPriceCents, toPublicSeats, toPublicTaken } from "@/lib/cohorts";
import type { CohortAvailability } from "@/lib/cohort-availability.functions";
import { Check, ArrowRight, Lock } from "lucide-react";

const PERKS = [
  "8-hour build day with Adam Anderson",
  "All 25 deliverables, finished in the room",
  "Complete 4-page website — branded, written, SEO-configured, delivered live within 2 weeks",
  "Catered lunch + coffee + working tables",
  "Take-home digital packet (every file, every link)",
  "30-day follow-up email check-ins",
];

export function PricingTiers({
  selected,
  onSelect,
  cohort,
  availability,
  scrollTargetId = "register-form",
}: {
  selected: TierKey;
  onSelect: (t: TierKey) => void;
  cohort: Cohort;
  availability?: CohortAvailability;
  scrollTargetId?: string;
}) {
  const foundersSoldOut = availability?.founders.soldOut ?? false;
  const cohortSoldOut = availability?.cohort.soldOut ?? false;

  // Public-facing seat counts are half of the real internal capacity.
  // soldOut still uses real numbers (from availability) so we never oversell.
  const publicFoundersCapacity = toPublicSeats(cohort.foundersSeats);
  const publicCohortCapacity = toPublicSeats(cohort.cohortSeats);

  const publicFoundersTaken =
    availability != null
      ? toPublicTaken(availability.founders.displayedTaken, cohort.foundersSeats, publicFoundersCapacity)
      : undefined;
  const publicCohortTaken =
    availability != null
      ? toPublicTaken(availability.cohort.displayedTaken, cohort.cohortSeats, publicCohortCapacity)
      : undefined;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TierCard
        tier="founders"
        selected={selected === "founders"}
        onSelect={() => onSelect("founders")}
        scrollTargetId={scrollTargetId}
        badge={`Best value · first ${publicFoundersCapacity} seats`}
        gradient
        priceCents={cohort.foundersPriceCents}
        capacity={publicFoundersCapacity}
        displayedTaken={publicFoundersTaken}
        soldOut={foundersSoldOut}
        disabled={foundersSoldOut}
        sellingFast={availability?.founders.showSellingFast ?? false}
      />
      <TierCard
        tier="cohort"
        selected={selected === "cohort"}
        onSelect={() => onSelect("cohort")}
        scrollTargetId={scrollTargetId}
        badge={`Standard cohort seat · next ${publicCohortCapacity}`}
        priceCents={cohort.cohortPriceCents}
        capacity={publicCohortCapacity}
        displayedTaken={publicCohortTaken}
        soldOut={cohortSoldOut}
        disabled={cohortSoldOut}
        sellingFast={availability?.cohort.showSellingFast ?? false}
        unlocksWhen={!foundersSoldOut ? "Founders fills up" : undefined}
      />
    </div>
  );
}

function TierCard({
  tier,
  selected,
  onSelect,
  scrollTargetId,
  badge,
  gradient,
  priceCents,
  capacity,
  displayedTaken,
  soldOut,
  disabled,
  unlocksWhen,
  sellingFast,
}: {
  tier: TierKey;
  selected: boolean;
  onSelect: () => void;
  scrollTargetId: string;
  badge: string;
  gradient?: boolean;
  priceCents: number;
  capacity: number;
  displayedTaken?: number;
  soldOut: boolean;
  disabled: boolean;
  unlocksWhen?: string;
  sellingFast?: boolean;
}) {
  const label = tier === "founders" ? "Founders Seat" : "Cohort Seat";
  const subtitle =
    tier === "founders" ? `First ${capacity} to register` : `Next ${capacity} seats`;
  const remaining =
    typeof displayedTaken === "number" ? Math.max(capacity - displayedTaken, 0) : undefined;

  return (
    <div
      className={`relative rounded-2xl p-[1px] transition ${
        gradient ? "bg-hero-gradient" : "bg-white/10"
      } ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="rounded-2xl bg-card p-5 md:p-7 h-full flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {badge}
          </span>
          {soldOut ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Sold out
            </span>
          ) : sellingFast ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
              </span>
              Selling fast
            </span>
          ) : selected ? (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary">
              Selected
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-2xl font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums md:text-4xl lg:text-5xl">
            {formatPriceCents(priceCents)}
          </span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>
        {typeof remaining === "number" && (
          <div className="mt-2 text-xs">
            {soldOut ? (
              <span className="text-muted-foreground">
                {capacity}/{capacity} claimed
              </span>
            ) : (
              <span className="text-amber-300">
                {remaining} of {capacity} seats left
              </span>
            )}
          </div>
        )}
        {unlocksWhen && !soldOut && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Available now · price applies once {unlocksWhen}.
          </p>
        )}
        <ul className="mt-6 space-y-2.5 text-sm">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-2">
              <Check className="size-4 mt-0.5 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onSelect();
            if (typeof window !== "undefined") {
              document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
            disabled
              ? "border border-white/10 text-muted-foreground cursor-not-allowed"
              : gradient
              ? "bg-hero-gradient text-white hover:opacity-90"
              : "border border-white/20 hover:bg-white/10"
          }`}
        >
          {disabled ? "Sold out" : "Reserve this seat"}
          {!disabled && <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
