import { PRICING, type TierKey } from "@/lib/value-grid";
import { Check, ArrowRight } from "lucide-react";

const PERKS = [
  "8-hour build day with Adam Anderson",
  "All 25 deliverables, finished in the room",
  "Lunch + coffee + working tables",
  "Take-home digital packet (every file, every link)",
  "30-day follow-up email check-ins",
];

export function PricingTiers({
  selected,
  onSelect,
  scrollTargetId = "register-form",
}: {
  selected: TierKey;
  onSelect: (t: TierKey) => void;
  scrollTargetId?: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TierCard
        tier="founders"
        selected={selected === "founders"}
        onSelect={() => onSelect("founders")}
        scrollTargetId={scrollTargetId}
        badge="Best value · first 7 seats"
        gradient
      />
      <TierCard
        tier="cohort"
        selected={selected === "cohort"}
        onSelect={() => onSelect("cohort")}
        scrollTargetId={scrollTargetId}
        badge="Standard cohort seat"
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
}: {
  tier: TierKey;
  selected: boolean;
  onSelect: () => void;
  scrollTargetId: string;
  badge: string;
  gradient?: boolean;
}) {
  const t = PRICING[tier];
  return (
    <div
      className={`relative rounded-2xl p-[1px] transition ${
        gradient ? "bg-hero-gradient" : "bg-white/10"
      } ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      <div className="rounded-2xl bg-card p-6 md:p-7 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {badge}
          </span>
          {selected && (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary">
              Selected
            </span>
          )}
        </div>
        <h3 className="mt-3 text-2xl font-semibold">{t.label}</h3>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-5xl font-semibold tabular-nums">${t.price}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>
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
          onClick={() => {
            onSelect();
            if (typeof window !== "undefined") {
              document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
            gradient
              ? "bg-hero-gradient text-white hover:opacity-90"
              : "border border-white/20 hover:bg-white/10"
          }`}
        >
          Reserve this seat <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
