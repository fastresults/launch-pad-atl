import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeavyLifting } from "./HeavyLifting";
import { OpsStageMasthead } from "./OpsStageArt";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";
import {
  DEFAULT_RATE, RATE_CHOICES, RETAINER_DAYS, RETAINER_MONTHLY, RETAINER_MONTHS,
  computeInvestment, hours, money, rateLabel,
} from "@/lib/ops-investment";

/**
 * The decision moment: what this runway costs you in hours and money if you
 * build it yourself, against the retainer if Adam's team builds it. Every
 * figure comes from this venture's own step list.
 */
export function InvestmentCompare({
  tasks, onChoose, busy, currentMode, rateCents, onRate,
}: {
  tasks: OpsTask[];
  onChoose: (mode: DeliveryMode) => void;
  busy?: boolean;
  currentMode?: DeliveryMode | null;
  rateCents?: number | null;
  onRate?: (cents: number) => void;
}) {
  const [rate, setRate] = useState(rateCents || DEFAULT_RATE);
  const inv = useMemo(() => computeInvestment(tasks, rate), [tasks, rate]);
  const [confirm, setConfirm] = useState(false);

  const pickRate = (cents: number) => { setRate(cents); onRate?.(cents); };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
        <OpsStageMasthead phase={2} className="w-[46%]" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Before you start</p>
        <h2 className="relative mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Who is going to actually do this work?
        </h2>
        <p className="relative mt-2 max-w-2xl text-sm text-muted-foreground">
          There are {inv.taskCount} steps between the foundation you have and a business that runs —
          {" "}{inv.specialistCount} of them are specialist work. Decide once, here, and the rest of this
          dashboard reshapes around your answer. You can change it later.
        </p>

        <WorkSplit
          taskCount={inv.taskCount}
          specialistCount={inv.specialistCount}
          totalMinutes={inv.totalMinutes}
          specialistMinutes={inv.specialistMinutes}
          founderMinutes={inv.founderMinutes}
        />
      </div>

      <HeavyLifting tasks={tasks} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------------------------------------------------- self */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 sm:p-6">
          <OpsStageMasthead phase={1} className="w-[38%] opacity-[0.12]" />
          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> You build it
          </div>
          <h3 className="relative mt-2 text-lg font-semibold tracking-tight">Your team runs the list</h3>

          <dl className="mt-5 space-y-3 text-sm">
            <Line label="Your hands-on hours" value={hours(inv.founderMinutes)} />
            <Line label="Specialist hours you'd learn or hire out" value={hours(inv.specialistMinutes)} />
            <div className="rounded-xl border border-border/40 bg-background/40 px-3.5 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Your time is worth</span>
                <div className="flex gap-1">
                  {RATE_CHOICES.map((c) => (
                    <button
                      key={c} type="button" onClick={() => pickRate(c)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] tabular-nums transition",
                        c === rate ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:text-foreground",
                      )}
                    >{money(c)}</button>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{hours(inv.totalMinutes)} at {rateLabel(rate)}</span>
                <span className="text-lg font-semibold tabular-nums">{money(inv.opportunityCostCents)}</span>
              </div>
            </div>
            <Line
              label="Plus what you'd still pay outside"
              value={`${money(inv.outsourcedLowCents)} – ${money(inv.outsourcedHighCents)}`}
              hint="Entity and filings, books, CRM and A2P, funnels, site, brand collateral, campaign creative — at typical market rates."
            />
          </dl>

          <div className="mt-5 rounded-xl border border-border/40 bg-background/30 px-3.5 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Real cost</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {money(inv.selfLowCents)} – {money(inv.selfHighCents)}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              And it lands whenever it lands. No committed dates, no one to chase but yourself.
            </p>
          </div>

          <Button
            variant="outline" className="mt-5 w-full" disabled={busy}
            onClick={() => onChoose("self")}
          >
            We'll build it ourselves
          </Button>
          <button
            type="button" disabled={busy} onClick={() => onChoose("mixed")}
            className="mt-2 text-center text-[11px] text-muted-foreground hover:text-foreground"
          >
            Or decide step by step — some ours, some yours
          </button>
        </div>

        {/* ------------------------------------------------------ retained */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] p-5 shadow-lg shadow-primary/5 ring-1 ring-primary/10 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Adam's team builds it
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">Done with you, on committed dates</h3>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl font-semibold tabular-nums">{money(RETAINER_MONTHLY)}</span>
            <span className="text-sm text-muted-foreground">/ month · {RETAINER_DAYS} days</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {Array.from({ length: RETAINER_MONTHS }).map((_, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" /> Mo {i + 1}
              </span>
            ))}
            <span className="ml-auto text-sm font-semibold tabular-nums">{money(inv.retainerTotalCents)} total</span>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <Line
              label="What's covered"
              value={`All ${inv.taskCount} steps`}
              hint={`Including the ${inv.specialistCount} specialist moves — entity, books, CRM, funnels, site, brand and campaign.`}
            />
            <Line
              label="Your hours drop to"
              value={hours(inv.retainedFounderMinutes)}
              hint="Approvals, decisions, and the handful of things only an owner can sign."
            />
            <Line label="Effective cost per completed step" value={`about ${money(inv.perStepCents)}`} />
          </dl>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            {[
              "A named owner on every step",
              "A committed date on every step",
              "The finished work product linked in your dashboard",
              "You approve or ask for changes — nothing ships past you",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{line}
              </li>
            ))}
          </ul>

          {confirm ? (
            <div className="mt-5 rounded-xl border border-primary/30 bg-background/50 p-3.5">
              <p className="text-xs font-medium">Here's what happens next</p>
              <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>1. Every specialist step moves to Adam's team with a committed date.</li>
                <li>2. You get a kickoff call to confirm names, logins and priorities.</li>
                <li>3. Work products appear here as they're delivered, for your approval.</li>
              </ol>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" disabled={busy} onClick={() => onChoose("retained")}>
                  Confirm — {money(RETAINER_MONTHLY)}/mo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>Back</Button>
              </div>
            </div>
          ) : (
            <Button className="mt-5 w-full" disabled={busy} onClick={() => setConfirm(true)}>
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Retain Adam's team
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 px-5 py-4 text-sm">
        <span className="text-muted-foreground">Difference: </span>
        <span className="font-semibold tabular-nums">
          {inv.deltaCents >= 0 ? money(inv.deltaCents) : `${money(-inv.deltaCents)} the other way`}
        </span>
        <span className="text-muted-foreground"> and </span>
        <span className="font-semibold tabular-nums">{hours(inv.totalMinutes - inv.retainedFounderMinutes)}</span>
        <span className="text-muted-foreground"> of your life back.</span>
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Figures come from your own {inv.taskCount}-step runway.
        </span>
      </div>

      {currentMode && (
        <p className="text-center text-[11px] text-muted-foreground">
          Currently set to {currentMode === "retained" ? "Adam's team" : currentMode === "self" ? "your team" : "step by step"}.
        </p>
      )}
    </div>
  );
}

/**
 * The argument as a picture: how much of this runway is specialist work. One
 * track, two shares, the figures hung off it — not three flat number boxes.
 */
function WorkSplit({
  taskCount, specialistCount, totalMinutes, specialistMinutes, founderMinutes,
}: {
  taskCount: number; specialistCount: number;
  totalMinutes: number; specialistMinutes: number; founderMinutes: number;
}) {
  const pct = totalMinutes > 0 ? Math.round((specialistMinutes / totalMinutes) * 100) : 0;
  return (
    <div className="relative mt-6 rounded-xl border border-border/40 bg-background/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm">
          <span className="text-xl font-semibold tabular-nums">{taskCount}</span>
          <span className="ml-1.5 text-muted-foreground">steps to run</span>
        </p>
        <p className="text-sm">
          <span className="text-xl font-semibold tabular-nums">{hours(totalMinutes)}</span>
          <span className="ml-1.5 text-muted-foreground">of work in front of you</span>
        </p>
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full bg-primary/85 transition-all"
          style={{ width: `${pct}%` }}
        />
        <div className="h-full flex-1 bg-foreground/15" />
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <p className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/85" />
          <span>
            <span className="font-medium text-foreground">{hours(specialistMinutes)} specialist</span>
            <span className="text-muted-foreground"> — {specialistCount} steps that need a trade skill ({pct}% of the work)</span>
          </span>
        </p>
        <p className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground/25" />
          <span>
            <span className="font-medium text-foreground">{hours(founderMinutes)} owner work</span>
            <span className="text-muted-foreground"> — decisions and approvals only you can make</span>
          </span>
        </p>
      </div>
    </div>
  );
}

function Line({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="shrink-0 font-semibold tabular-nums">{value}</dd>
      </div>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export default InvestmentCompare;
