// Server-side guard for a generated timeline. Mirrors the client normalizer in
// src/lib/venture-timeline.ts — kept as its own file because edge functions
// cannot import from src/. If a payload can't be made valid we return null and
// the caller refuses to save, so the client keeps its deterministic fallback
// rather than storing a broken schedule.

export type LaneId = "founder" | "builder" | "marketer";
const LANE_IDS: LaneId[] = ["founder", "builder", "marketer"];

export const PHASE_LIBRARY = [
  { id: "idea", label: "Idea", blurb: "One sentence, one customer, one price hypothesis" },
  { id: "validate", label: "Validate", blurb: "Real conversations before anything gets built" },
  { id: "foundation", label: "Foundation", blurb: "Entity, bank, brand, domain, payments" },
  { id: "offer", label: "Build the offer", blurb: "Priced, deliverable, and visible" },
  { id: "presell", label: "Pre-sell", blurb: "Warm list worked, first money committed" },
  { id: "launch", label: "Launch", blurb: "Open publicly, first paying customers" },
  { id: "prove", label: "Prove & repeat", blurb: "A sales motion that runs twice" },
  { id: "cashflow", label: "Cash-flow quarter", blurb: "Breakeven, then scale the one channel that worked" },
];

export interface Step {
  id: string;
  title: string;
  lane: LaneId;
  phase: string;
  effortHours: number;
  why: string | null;
  doneWhen: string | null;
  dependsOn: string[];
  assetKey: string | null;
  moneyCanAccelerate: boolean;
  waitDays: number;
}

export interface Timeline {
  version: 1;
  phases: typeof PHASE_LIBRARY;
  steps: Step[];
  milestones: { id: string; label: string; afterStep: string; kind: string; note: string | null }[];
  revenue: Record<string, unknown> | null;
  rationale: string | null;
  generatedAt: string | null;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const numOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Depth-first cycle break: drop the back edge, never the step. */
function breakCycles(steps: Step[]) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string) => {
    const step = byId.get(id);
    if (!step) return;
    if (state.get(id) === 2) return;
    state.set(id, 1);
    step.dependsOn = step.dependsOn.filter((dep) => {
      if (state.get(dep) === 1) return false; // back edge
      visit(dep);
      return true;
    });
    state.set(id, 2);
  };
  for (const s of steps) visit(s.id);
}

export function normalizeTimeline(raw: any, allowedAssetKeys?: Set<string>): Timeline | null {
  if (!raw || !Array.isArray(raw.steps)) return null;

  const phaseIds = new Set(PHASE_LIBRARY.map((p) => p.id));
  const seen = new Set<string>();
  const steps: Step[] = [];

  for (const r of raw.steps) {
    const id = String(r?.id ?? "").trim();
    const title = String(r?.title ?? "").trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    const assetKey = r?.assetKey ? String(r.assetKey) : null;
    steps.push({
      id,
      title: title.slice(0, 90),
      lane: LANE_IDS.includes(r?.lane) ? r.lane : "founder",
      phase: phaseIds.has(String(r?.phase)) ? String(r.phase) : "idea",
      effortHours: clamp(Math.round(Number(r?.effortHours) || 8), 1, 400),
      why: r?.why ? String(r.why).slice(0, 320) : null,
      doneWhen: r?.doneWhen ? String(r.doneWhen).slice(0, 240) : null,
      dependsOn: Array.isArray(r?.dependsOn) ? r.dependsOn.map(String) : [],
      // A hallucinated asset key becomes a dead link in the UI — drop it.
      assetKey: assetKey && (!allowedAssetKeys || allowedAssetKeys.has(assetKey)) ? assetKey : null,
      moneyCanAccelerate: r?.moneyCanAccelerate === true,
      waitDays: clamp(Math.round(Number(r?.waitDays) || 0), 0, 120),
    });
  }

  // Too thin to be a credible cadence — treat as a failed generation.
  if (steps.length < 10) return null;

  const ids = new Set(steps.map((s) => s.id));
  for (const s of steps) s.dependsOn = s.dependsOn.filter((d) => d !== s.id && ids.has(d));
  breakCycles(steps);

  const milestones = (Array.isArray(raw.milestones) ? raw.milestones : [])
    .map((m: any) => ({
      id: String(m?.id ?? "").trim(),
      label: String(m?.label ?? "").slice(0, 60),
      afterStep: String(m?.afterStep ?? ""),
      kind: ["proof", "launch", "cash", "ops"].includes(m?.kind) ? m.kind : "proof",
      note: m?.note ? String(m.note).slice(0, 160) : null,
    }))
    .filter((m: any) => m.id && m.label && ids.has(m.afterStep));

  const rev = raw.revenue ?? null;
  const milestoneIds = new Set(milestones.map((m: any) => m.id));

  return {
    version: 1,
    phases: PHASE_LIBRARY.filter((p) => steps.some((s) => s.phase === p.id)),
    steps,
    milestones,
    revenue: rev
      ? {
          firstCashMilestone:
            rev.firstCashMilestone && milestoneIds.has(String(rev.firstCashMilestone))
              ? String(rev.firstCashMilestone)
              : (milestones.find((m: any) => m.kind === "cash")?.id ?? null),
          monthlyTargetUsd: numOrNull(rev.monthlyTargetUsd),
          rampMonths: clamp(Math.round(Number(rev.rampMonths) || 6), 1, 24),
          monthlyCostUsd: numOrNull(rev.monthlyCostUsd),
          currency: rev.currency ? String(rev.currency).slice(0, 6) : "USD",
          source: rev.source ? String(rev.source).slice(0, 120) : null,
        }
      : null,
    rationale: raw.rationale ? String(raw.rationale).slice(0, 800) : null,
    generatedAt: null,
  };
}
