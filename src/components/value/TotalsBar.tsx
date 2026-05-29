import { VALUE_TOTALS, formatCostRange, formatHoursRange, PRICING } from "@/lib/value-grid";
import { toPublicSeats } from "@/lib/cohorts";
import { DollarSign, Clock, Sparkles } from "lucide-react";

export function TotalsBar() {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5 md:p-8 grid gap-5 md:grid-cols-3 md:gap-6">
      <Stat
        icon={<DollarSign className="size-5" />}
        label="Market value of what you walk out with"
        value={formatCostRange(VALUE_TOTALS.costMin, VALUE_TOTALS.costMax)}
      />
      <Stat
        icon={<Clock className="size-5" />}
        label="Time to build it yourself"
        value={formatHoursRange(VALUE_TOTALS.hoursMin, VALUE_TOTALS.hoursMax)}
        sub="≈ 2–3 months of nights & weekends"
      />
      <Stat
        icon={<Sparkles className="size-5" />}
        label="Your investment"
        value={`from $${PRICING.founders.price}`}
        sub={`$${PRICING.cohort.price} after first ${toPublicSeats(PRICING.founders.seats)} seats`}
        accent
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "rounded-xl bg-hero-gradient p-5 text-white" : "p-1"}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${accent ? "opacity-90" : "text-muted-foreground"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums md:text-3xl">{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent ? "opacity-90" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}
