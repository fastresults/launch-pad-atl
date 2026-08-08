// Venture Timeline — the data model behind the sliding launch cadence.
//
// A timeline is stored as *effort* (person-hours) plus a dependency graph, never
// as fixed dates. Dates are derived at render time by the pure scheduler in
// `timeline-schedule.ts` from whatever scenario the founder has dialled in
// (hours available, who's on the team, start date, blackouts, budget).
//
// Everything here is plain data so the same shapes travel from the edge
// generator → the hub → the public showcase payload without translation.

export type LaneId = "founder" | "builder" | "marketer";

export const LANE_IDS: LaneId[] = ["founder", "builder", "marketer"];

export interface TimelineLane {
  id: LaneId;
  /** Editable by the founder — "me", "my wife", "Ray". */
  name: string;
  /** What this seat actually does, shown as the lane subtitle. */
  role: string;
  hoursPerWeek: number;
  enabled: boolean;
}

export type PhaseId =
  | "idea"
  | "validate"
  | "foundation"
  | "offer"
  | "presell"
  | "launch"
  | "prove"
  | "cashflow";

export interface TimelinePhase {
  id: PhaseId | string;
  label: string;
  blurb?: string | null;
}

export interface TimelineStep {
  id: string;
  title: string;
  lane: LaneId;
  phase: string;
  /** Person-hours of real work. The scheduler turns this into calendar days. */
  effortHours: number;
  why?: string | null;
  doneWhen?: string | null;
  dependsOn?: string[];
  /** Venture asset that powers this step, e.g. "pricing_offer_sheet". */
  assetKey?: string | null;
  /**
   * Can money make this go faster? A contractor can build the site; nobody can
   * pay to skip twenty customer conversations or a licensing queue.
   */
  moneyCanAccelerate?: boolean;
  /** Unavoidable calendar wait after the work is done (filings, approvals). */
  waitDays?: number;
}

export type MilestoneKind = "proof" | "launch" | "cash" | "ops";

export interface TimelineMilestone {
  id: string;
  label: string;
  /** Fires when this step completes. */
  afterStep: string;
  kind: MilestoneKind;
  note?: string | null;
}

/** How money shows up under the lanes. All figures come from the venture's own assets. */
export interface TimelineRevenueModel {
  /** Milestone id that marks the first dollar in. */
  firstCashMilestone?: string | null;
  /** Steady-state monthly revenue the venture's own model projects. */
  monthlyTargetUsd?: number | null;
  /** Months from first cash to that steady state. */
  rampMonths?: number | null;
  /** Monthly fixed cost, when the finance assets state one. */
  monthlyCostUsd?: number | null;
  currency?: string | null;
  source?: string | null;
}

export interface VentureTimeline {
  version: 1;
  phases: TimelinePhase[];
  steps: TimelineStep[];
  milestones: TimelineMilestone[];
  revenue?: TimelineRevenueModel | null;
  /** Free-text note about how this cadence was reasoned, shown in the panel. */
  rationale?: string | null;
  generatedAt?: string | null;
}

export interface TimelineBlackout {
  /** Days from start, inclusive. */
  startDay: number;
  endDay: number;
  label: string;
}

export interface TimelineScenario {
  lanes: TimelineLane[];
  /** ISO date the founder actually begins. */
  startDate: string;
  blackouts: TimelineBlackout[];
  /** 0 = bootstrapped, 3 = funded. Only accelerates steps money can buy. */
  budgetLevel: 0 | 1 | 2 | 3;
  /** Monthly income needed to walk away from the day job. */
  freedomLineMonthly: number | null;
  /** Founder-applied nudges: step id → extra days pushed later. */
  nudges?: Record<string, number>;
  label?: string | null;
}

export const DEFAULT_LANES: TimelineLane[] = [
  { id: "founder", name: "Founder", role: "Talks to customers, prices, closes", hoursPerWeek: 40, enabled: true },
  { id: "builder", name: "Builder", role: "Sets it up so it actually runs", hoursPerWeek: 40, enabled: true },
  { id: "marketer", name: "Marketer", role: "Fills the top of the funnel", hoursPerWeek: 40, enabled: true },
];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultScenario(): TimelineScenario {
  return {
    lanes: DEFAULT_LANES.map((l) => ({ ...l })),
    startDate: todayISO(),
    blackouts: [],
    budgetLevel: 0,
    freedomLineMonthly: null,
    nudges: {},
    label: "All in",
  };
}

export interface ScenarioPreset {
  id: string;
  label: string;
  blurb: string;
  apply: (base: TimelineScenario) => TimelineScenario;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "nights",
    label: "Nights & weekends",
    blurb: "Just me, 10 hrs a week, still in the job",
    apply: (base) => ({
      ...base,
      label: "Nights & weekends",
      lanes: base.lanes.map((l) => ({ ...l, enabled: l.id === "founder", hoursPerWeek: 10 })),
    }),
  },
  {
    id: "two",
    label: "Two of us, evenings",
    blurb: "A partner or spouse, 15 hrs each",
    apply: (base) => ({
      ...base,
      label: "Two of us, evenings",
      lanes: base.lanes.map((l) => ({
        ...l,
        enabled: l.id !== "marketer",
        hoursPerWeek: 15,
      })),
    }),
  },
  {
    id: "allin",
    label: "All in",
    blurb: "Three people, full time",
    apply: (base) => ({
      ...base,
      label: "All in",
      lanes: base.lanes.map((l) => ({ ...l, enabled: true, hoursPerWeek: 40 })),
    }),
  },
];

export const PHASE_LIBRARY: TimelinePhase[] = [
  { id: "idea", label: "Idea", blurb: "One sentence, one customer, one price hypothesis" },
  { id: "validate", label: "Validate", blurb: "Real conversations before anything gets built" },
  { id: "foundation", label: "Foundation", blurb: "Entity, bank, brand, domain, payments" },
  { id: "offer", label: "Build the offer", blurb: "Priced, deliverable, and visible" },
  { id: "presell", label: "Pre-sell", blurb: "Warm list worked, first money committed" },
  { id: "launch", label: "Launch", blurb: "Open publicly, first paying customers" },
  { id: "prove", label: "Prove & repeat", blurb: "A sales motion that runs twice" },
  { id: "cashflow", label: "Cash-flow quarter", blurb: "Breakeven, then scale the one channel that worked" },
];

/**
 * The deterministic fallback cadence. Rendered whenever a venture has no
 * generated timeline yet, so the feature is never an empty box. Effort figures
 * are the honest median for a first-time founder building a small operating
 * business — not a software startup.
 */
export function fallbackTimeline(): VentureTimeline {
  const s = (
    id: string,
    title: string,
    lane: LaneId,
    phase: PhaseId,
    effortHours: number,
    extra: Partial<TimelineStep> = {},
  ): TimelineStep => ({ id, title, lane, phase, effortHours, dependsOn: [], ...extra });

  const steps: TimelineStep[] = [
    s("sharpen", "Sharpen the concept to one sentence", "founder", "idea", 6, {
      why: "Everything downstream — pricing, page, pitch — inherits this sentence.",
      doneWhen: "One customer, one problem, one price, written down.",
      assetKey: "problem_solution",
    }),
    s("icp", "Name the exact customer", "founder", "idea", 5, {
      dependsOn: ["sharpen"],
      why: "A named customer is the difference between marketing and guessing.",
      doneWhen: "A one-page persona you could point at in a room.",
      assetKey: "customer_personas",
    }),
    s("warmlist", "Build the first 50 warm list", "marketer", "idea", 8, {
      dependsOn: ["icp"],
      why: "Your first customers are already in your phone.",
      doneWhen: "50 named people with a reason to talk to you.",
      assetKey: "first_50_warm_list",
    }),
    s("convos", "20 customer conversations", "founder", "validate", 24, {
      dependsOn: ["warmlist"],
      why: "The only evidence that matters before you spend money.",
      doneWhen: "20 real conversations logged, problem confirmed in their words.",
      assetKey: "customer_personas",
    }),
    s("pricetest", "Test the price out loud", "founder", "validate", 8, {
      dependsOn: ["convos"],
      why: "A price nobody has flinched at is not a price.",
      doneWhen: "Three people have heard the number and reacted.",
      assetKey: "pricing_offer_sheet",
    }),
    s("competitors", "Position against the alternatives", "marketer", "validate", 8, {
      dependsOn: ["icp"],
      doneWhen: "You can say in one line why you, not them.",
      assetKey: "competitive_positioning",
    }),
    s("entity", "Register the entity", "builder", "foundation", 4, {
      waitDays: 7,
      doneWhen: "Filed, with the state confirmation in hand.",
      assetKey: "legal_structure_brief",
      moneyCanAccelerate: true,
    }),
    s("bank", "Business bank + books", "builder", "foundation", 5, {
      dependsOn: ["entity"],
      doneWhen: "Account open, bookkeeping connected.",
      assetKey: "business_bank_books_starter",
    }),
    s("brand", "Lock the brand and logo", "builder", "foundation", 10, {
      dependsOn: ["sharpen"],
      doneWhen: "Logo, palette and type locked; files exported.",
      assetKey: "logo_brand_asset_pack",
      moneyCanAccelerate: true,
    }),
    s("domain", "Domain, email and DNS", "builder", "foundation", 4, {
      dependsOn: ["brand"],
      doneWhen: "Branded email sending and receiving.",
      assetKey: "domain_email_dns_checklist",
    }),
    s("payments", "Payments and checkout", "builder", "foundation", 6, {
      dependsOn: ["bank"],
      doneWhen: "You can take a card today.",
      assetKey: "payments_checkout_setup",
    }),
    s("offer", "Write the priced offer", "founder", "offer", 10, {
      dependsOn: ["pricetest"],
      why: "The offer is the product until the product exists.",
      doneWhen: "One page: what they get, what it costs, what happens next.",
      assetKey: "pricing_offer_sheet",
    }),
    s("sop", "Fulfilment SOP", "builder", "offer", 12, {
      dependsOn: ["offer"],
      doneWhen: "A checklist someone else could follow to deliver once.",
      assetKey: "fulfillment_sop",
    }),
    s("page", "Landing page live", "builder", "offer", 16, {
      dependsOn: ["offer", "domain"],
      doneWhen: "A public URL that takes an enquiry or a deposit.",
      assetKey: "presell_landing_prd",
      moneyCanAccelerate: true,
    }),
    s("scripts", "Outreach scripts", "marketer", "offer", 6, {
      dependsOn: ["offer"],
      doneWhen: "DM, email and follow-up written and saved.",
      assetKey: "outbound_dm_email_scripts",
    }),
    s("outreach", "Work the warm list", "founder", "presell", 20, {
      dependsOn: ["scripts", "page"],
      why: "This is the step people skip, and the reason they never launch.",
      doneWhen: "Every one of the 50 has heard from you personally.",
      assetKey: "first_50_warm_list",
    }),
    s("deposits", "Take the first deposits", "founder", "presell", 10, {
      dependsOn: ["outreach", "payments"],
      why: "Money in hand before launch de-risks everything after it.",
      doneWhen: "At least one customer has paid something.",
      assetKey: "pre_sell_offer_test",
    }),
    s("content", "Launch content kit", "marketer", "presell", 14, {
      dependsOn: ["brand", "offer"],
      doneWhen: "Two weeks of posts scheduled and ready.",
      assetKey: "launch_content_kit",
      moneyCanAccelerate: true,
    }),
    s("open", "Open publicly", "founder", "launch", 8, {
      dependsOn: ["deposits", "content"],
      doneWhen: "Announced, live, and taking orders.",
      assetKey: "go_to_market_plan",
    }),
    s("deliver", "Deliver the first customers", "builder", "launch", 24, {
      dependsOn: ["open", "sop"],
      doneWhen: "First customers served and asked what they thought.",
      assetKey: "fulfillment_sop",
    }),
    s("reviews", "Collect reviews and proof", "marketer", "launch", 8, {
      dependsOn: ["deliver"],
      doneWhen: "Three reviews you'd put on the page.",
      assetKey: "reviews_testimonials_kit",
    }),
    s("pipeline", "Run the pipeline weekly", "founder", "prove", 30, {
      dependsOn: ["open"],
      why: "One repeated motion beats five clever ones.",
      doneWhen: "Four consecutive weeks of the same sales loop.",
      assetKey: "crm_pipeline_starter",
    }),
    s("channel", "Double down on the one channel that worked", "marketer", "prove", 26, {
      dependsOn: ["reviews"],
      doneWhen: "One channel producing enquiries without you pushing.",
      assetKey: "content_calendar_90day",
      moneyCanAccelerate: true,
    }),
    s("unit", "Confirm the unit economics", "founder", "prove", 10, {
      dependsOn: ["deliver"],
      doneWhen: "Real numbers replacing the projected ones.",
      assetKey: "financial_model",
    }),
    s("cadence", "Lock the operating cadence", "builder", "cashflow", 12, {
      dependsOn: ["pipeline"],
      doneWhen: "A weekly rhythm the business runs on without heroics.",
      assetKey: "founder_operating_cadence",
    }),
    s("breakeven", "Drive to breakeven", "founder", "cashflow", 40, {
      dependsOn: ["unit", "channel"],
      why: "The month costs stop outrunning revenue is the month this is real.",
      doneWhen: "Revenue covers monthly cost.",
      assetKey: "financial_model",
    }),
    s("scale", "First hire or first system", "builder", "cashflow", 20, {
      dependsOn: ["cadence"],
      doneWhen: "Something you used to do personally now runs without you.",
      assetKey: "operating_plan",
    }),
  ];

  const milestones: TimelineMilestone[] = [
    { id: "m-problem", label: "Problem confirmed", afterStep: "convos", kind: "proof" },
    { id: "m-price", label: "Offer priced", afterStep: "offer", kind: "proof" },
    { id: "m-page", label: "Page live", afterStep: "page", kind: "proof" },
    { id: "m-firstdollar", label: "First dollar in", afterStep: "deposits", kind: "cash" },
    { id: "m-open", label: "Open for business", afterStep: "open", kind: "launch" },
    { id: "m-repeat", label: "Repeatable sales motion", afterStep: "pipeline", kind: "ops" },
    { id: "m-breakeven", label: "Breakeven", afterStep: "breakeven", kind: "cash" },
  ];

  return {
    version: 1,
    phases: PHASE_LIBRARY,
    steps,
    milestones,
    revenue: { firstCashMilestone: "m-firstdollar", rampMonths: 6 },
    rationale: null,
    generatedAt: null,
  };
}

/** Guard anything arriving from the database or the share payload. */
export function normalizeTimeline(raw: any): VentureTimeline | null {
  if (!raw || !Array.isArray(raw.steps) || !raw.steps.length) return null;
  const phases: TimelinePhase[] = Array.isArray(raw.phases) && raw.phases.length
    ? raw.phases.map((p: any) => ({ id: String(p.id), label: String(p.label ?? p.id), blurb: p.blurb ?? null }))
    : PHASE_LIBRARY;
  const phaseIds = new Set(phases.map((p) => p.id));

  const seen = new Set<string>();
  const steps: TimelineStep[] = [];
  for (const r of raw.steps) {
    const id = String(r?.id ?? "").trim();
    const title = String(r?.title ?? "").trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    const lane: LaneId = LANE_IDS.includes(r?.lane) ? r.lane : "founder";
    steps.push({
      id,
      title: title.slice(0, 90),
      lane,
      phase: phaseIds.has(String(r?.phase)) ? String(r.phase) : phases[0].id,
      effortHours: clamp(Number(r?.effortHours) || 8, 1, 400),
      why: r?.why ? String(r.why).slice(0, 320) : null,
      doneWhen: r?.doneWhen ? String(r.doneWhen).slice(0, 240) : null,
      dependsOn: Array.isArray(r?.dependsOn) ? r.dependsOn.map(String) : [],
      assetKey: r?.assetKey ? String(r.assetKey) : null,
      moneyCanAccelerate: r?.moneyCanAccelerate === true,
      waitDays: clamp(Number(r?.waitDays) || 0, 0, 120),
    });
  }
  if (!steps.length) return null;

  // Drop dangling and self dependencies, then break any cycles.
  const ids = new Set(steps.map((s) => s.id));
  for (const s of steps) s.dependsOn = (s.dependsOn ?? []).filter((d) => d !== s.id && ids.has(d));
  breakCycles(steps);

  const milestones: TimelineMilestone[] = (Array.isArray(raw.milestones) ? raw.milestones : [])
    .map((m: any) => ({
      id: String(m?.id ?? ""),
      label: String(m?.label ?? "").slice(0, 60),
      afterStep: String(m?.afterStep ?? ""),
      kind: (["proof", "launch", "cash", "ops"].includes(m?.kind) ? m.kind : "proof") as MilestoneKind,
      note: m?.note ? String(m.note).slice(0, 160) : null,
    }))
    .filter((m: TimelineMilestone) => m.id && m.label && ids.has(m.afterStep));

  const rev = raw.revenue ?? null;
  return {
    version: 1,
    phases: phases.filter((p) => steps.some((s) => s.phase === p.id)),
    steps,
    milestones,
    revenue: rev
      ? {
          firstCashMilestone: rev.firstCashMilestone ? String(rev.firstCashMilestone) : null,
          monthlyTargetUsd: numOrNull(rev.monthlyTargetUsd),
          rampMonths: clamp(Number(rev.rampMonths) || 6, 1, 24),
          monthlyCostUsd: numOrNull(rev.monthlyCostUsd),
          currency: rev.currency ? String(rev.currency) : "USD",
          source: rev.source ? String(rev.source) : null,
        }
      : null,
    rationale: raw.rationale ? String(raw.rationale).slice(0, 800) : null,
    generatedAt: raw.generatedAt ?? null,
  };
}

export function normalizeScenario(raw: any): TimelineScenario {
  const base = defaultScenario();
  if (!raw || typeof raw !== "object") return base;
  const lanes = LANE_IDS.map((id) => {
    const found = Array.isArray(raw.lanes) ? raw.lanes.find((l: any) => l?.id === id) : null;
    const fallback = base.lanes.find((l) => l.id === id)!;
    return {
      id,
      name: String(found?.name ?? fallback.name).slice(0, 32) || fallback.name,
      role: fallback.role,
      hoursPerWeek: clamp(Number(found?.hoursPerWeek ?? fallback.hoursPerWeek), 1, 80),
      enabled: found ? found.enabled !== false : fallback.enabled,
    } as TimelineLane;
  });
  return {
    lanes: lanes.some((l) => l.enabled) ? lanes : lanes.map((l, i) => ({ ...l, enabled: i === 0 })),
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.startDate)) ? raw.startDate : base.startDate,
    blackouts: Array.isArray(raw.blackouts)
      ? raw.blackouts
          .map((b: any) => ({
            startDay: clamp(Number(b?.startDay) || 0, 0, 720),
            endDay: clamp(Number(b?.endDay) || 0, 0, 720),
            label: String(b?.label ?? "Away").slice(0, 40),
          }))
          .filter((b: TimelineBlackout) => b.endDay >= b.startDay)
          .slice(0, 8)
      : [],
    budgetLevel: ([0, 1, 2, 3].includes(Number(raw.budgetLevel)) ? Number(raw.budgetLevel) : 0) as 0 | 1 | 2 | 3,
    freedomLineMonthly: numOrNull(raw.freedomLineMonthly),
    nudges: raw.nudges && typeof raw.nudges === "object" ? raw.nudges : {},
    label: raw.label ? String(raw.label).slice(0, 40) : null,
  };
}

export function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function numOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Depth-first cycle removal — keeps the graph schedulable no matter what the model returned. */
function breakCycles(steps: TimelineStep[]) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string) => {
    const s = byId.get(id);
    if (!s) return;
    if (state.get(id) === 2) return;
    state.set(id, 1);
    s.dependsOn = (s.dependsOn ?? []).filter((d) => {
      if (state.get(d) === 1) return false; // back edge — drop it
      visit(d);
      return true;
    });
    state.set(id, 2);
  };
  for (const s of steps) visit(s.id);
}

export const BUDGET_LABELS = ["Bootstrapped", "A little to spend", "Funded start", "Well funded"];

export function laneLabel(lanes: TimelineLane[], id: LaneId) {
  return lanes.find((l) => l.id === id)?.name ?? id;
}

/**
 * Compact URL encoding for a scenario, so a reader on a shared showcase can
 * pass their own what-if back to the founder as a plain link.
 */
export function encodeScenario(s: TimelineScenario): string {
  const compact = {
    l: s.lanes.map((l) => [l.id, Math.round(l.hoursPerWeek), l.enabled ? 1 : 0]),
    d: s.startDate,
    b: (s.blackouts ?? []).map((x) => [Math.round(x.startDay), Math.round(x.endDay), x.label]),
    u: s.budgetLevel,
    f: s.freedomLineMonthly,
    n: s.nudges ?? {},
    t: s.label ?? null,
  };
  const json = JSON.stringify(compact);
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : "";
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Inverse of encodeScenario. Returns null when the string isn't ours. */
export function decodeScenario(raw: string | null | undefined): TimelineScenario | null {
  if (!raw) return null;
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))));
    const c = JSON.parse(json);
    if (!c || typeof c !== "object") return null;
    return normalizeScenario({
      lanes: Array.isArray(c.l)
        ? c.l.map((l: any) => ({ id: l[0], hoursPerWeek: l[1], enabled: l[2] !== 0 }))
        : undefined,
      startDate: c.d,
      blackouts: Array.isArray(c.b)
        ? c.b.map((x: any) => ({ startDay: x[0], endDay: x[1], label: x[2] }))
        : [],
      budgetLevel: c.u,
      freedomLineMonthly: c.f,
      nudges: c.n,
      label: c.t,
    });
  } catch {
    return null;
  }
}
