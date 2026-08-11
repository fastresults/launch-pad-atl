// What the runway costs, two ways: the founder's own hours plus what they'd
// still have to outsource, versus the Startup Labs retainer. Every number here
// is computed from this venture's own task catalog — nothing is invented except
// the retainer terms and the market-rate table, both of which live right here.
import type { OpsTask } from "@/lib/ops-runway";

/** Retainer terms. Cents, so no float money anywhere. */
export const RETAINER_MONTHLY = 199_700;
export const RETAINER_MONTHS = 4;
export const RETAINER_TOTAL = RETAINER_MONTHLY * RETAINER_MONTHS; // 798,800 = $7,988
export const RETAINER_DAYS = 120;

/** Blended hourly rates a founder can put on their own time. */
export const RATE_CHOICES = [5000, 7500, 10000, 15000, 25000];
export const DEFAULT_RATE = 7500;

/**
 * Work most first-time founders cannot do themselves at any usable standard.
 * Matched on the step's slug and title, so it holds no matter who owns the row.
 */
const SPECIALIST = [
  /entity|operating-agreement|registered-agent|incorporat/,
  /ein|tax|accountant|bookkeep/,
  /qbo|quickbooks|chart-of-accounts|reconcil/,
  /bank|stripe|payment|merchant|invoice/,
  /ghl|crm|a2p|pipeline|automation|workflow/,
  /funnel|lead-magnet|nurture|retarget|list-build|segment/,
  /site|website|landing|prd|domain|dns|hosting/,
  /brand|logo|collateral|guideline|style-system/,
  /campaign|ad-|ads|creative|content|social|calendar/,
  /contract|msa|terms|privacy|compliance|insurance|license/,
  /offer|price|pricing|proposal|script/,
];

/** Steps only the founder can ever do — signatures, decisions, their own ID. */
const FOUNDER_ONLY = [
  /approve|sign-off|signoff|sign\b|decision|decide|choose/,
  /bank|id\b|identity|personal|owner/,
  /call|conversation|interview|outreach-personal|founder/,
];

/** Typical outside cost per hour for specialist work, by category. Cents. */
const MARKET_RATE: Record<string, [number, number]> = {
  Governance: [25000, 45000],
  Finance: [15000, 30000],
  Operations: [12500, 25000],
  Brand: [15000, 35000],
  Creative: [15000, 35000],
  Marketing: [12500, 27500],
  "Social & Content": [10000, 22500],
  Strategy: [20000, 40000],
  Foundation: [15000, 30000],
};
const MARKET_FALLBACK: [number, number] = [12500, 25000];

const slugOf = (t: OpsTask) => `${(t.task_key.split(".").pop() ?? t.task_key)} ${t.title}`.toLowerCase();

export const isSpecialistTask = (t: OpsTask) => SPECIALIST.some((re) => re.test(slugOf(t)));

/** Steps that stay on the founder's plate even when the team runs the build. */
export const isFounderOnlyTask = (t: OpsTask) =>
  FOUNDER_ONLY.some((re) => re.test(slugOf(t))) && !isSpecialistTask(t);

/** Fallback estimate so a step with no authored duration still counts. */
const minutesOf = (t: OpsTask) => t.minutes ?? (isSpecialistTask(t) ? 90 : 30);

export interface OpsInvestment {
  taskCount: number;
  specialistCount: number;
  totalMinutes: number;
  founderMinutes: number;
  specialistMinutes: number;
  /** Hours the founder still spends when the team runs it: approvals + decisions. */
  retainedFounderMinutes: number;
  /** Founder's own time valued at the chosen rate. Cents. */
  opportunityCostCents: number;
  /** What the specialist work costs at market, low → high. Cents. */
  outsourcedLowCents: number;
  outsourcedHighCents: number;
  selfLowCents: number;
  selfHighCents: number;
  retainerTotalCents: number;
  perStepCents: number;
  /** Midpoint of the self-build range minus the retainer. Cents; can be negative. */
  deltaCents: number;
  hoursSaved: number;
}

export function computeInvestment(tasks: OpsTask[], rateCents = DEFAULT_RATE): OpsInvestment {
  let totalMinutes = 0;
  let specialistMinutes = 0;
  let retainedFounderMinutes = 0;
  let specialistCount = 0;
  let outLow = 0;
  let outHigh = 0;

  for (const t of tasks) {
    const m = minutesOf(t);
    totalMinutes += m;
    if (isSpecialistTask(t)) {
      specialistMinutes += m;
      specialistCount += 1;
      const [lo, hi] = MARKET_RATE[t.category] ?? MARKET_FALLBACK;
      outLow += Math.round((m / 60) * lo);
      outHigh += Math.round((m / 60) * hi);
    }
    if (isFounderOnlyTask(t)) retainedFounderMinutes += m;
  }

  const founderMinutes = totalMinutes - specialistMinutes;
  const opportunityCostCents = Math.round((totalMinutes / 60) * rateCents);
  const selfLowCents = opportunityCostCents + outLow;
  const selfHighCents = opportunityCostCents + outHigh;
  const midpoint = Math.round((selfLowCents + selfHighCents) / 2);

  return {
    taskCount: tasks.length,
    specialistCount,
    totalMinutes,
    founderMinutes,
    specialistMinutes,
    retainedFounderMinutes,
    opportunityCostCents,
    outsourcedLowCents: outLow,
    outsourcedHighCents: outHigh,
    selfLowCents,
    selfHighCents,
    retainerTotalCents: RETAINER_TOTAL,
    perStepCents: tasks.length ? Math.round(RETAINER_TOTAL / tasks.length) : RETAINER_TOTAL,
    deltaCents: midpoint - RETAINER_TOTAL,
    hoursSaved: Math.max(0, Math.round((totalMinutes - retainedFounderMinutes) / 60)),
  };
}

/** $7,988 — no cents when they're zero, which for these numbers is always. */
export function money(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  });
}

export function hours(minutes: number): string {
  const h = Math.round(minutes / 60);
  return h <= 1 ? "1 hour" : `${h.toLocaleString()} hours`;
}

export const rateLabel = (cents: number) => `${money(cents)}/hr`;
