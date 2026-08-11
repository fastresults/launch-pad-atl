// Guided-mode logic: which single step comes next, and how to describe the
// journey in words a first-time founder can act on.
import type { OpsTask } from "@/lib/ops-runway";

/** Human stage names. The catalog's phase numbers stay, the jargon doesn't. */
export const OPS_STAGES: Record<number, { name: string; when: string; promise: string }> = {
  1: { name: "Prove people want it", when: "Week 1", promise: "A clear offer, a price, and real buyer interest." },
  2: { name: "Wire the business up", when: "Week 2", promise: "Legal, money, website, CRM — the machine switched on." },
  3: { name: "Make the first money", when: "Weeks 3–4", promise: "Proposals out, first customer in, first invoice paid." },
  4: { name: "Build the habit", when: "Months 2–3", promise: "A weekly rhythm, real numbers, and your next quarter planned." },
};

export const stageOf = (phase: number) => OPS_STAGES[phase] ?? OPS_STAGES[4];

export const isSnoozed = (t: OpsTask) =>
  !!t.snoozed_until && new Date(t.snoozed_until).getTime() > Date.now();

export const OWNER_LABEL = (kind: string, viewer: string) =>
  kind === "agency" ? "Adam's team" : viewer === "agency" ? "The founder" : "You";

/** The queue a guided founder walks, in order, skipping done, stuck, and snoozed. */
export function guidedQueue(tasks: OpsTask[], viewerKind: "client" | "agency"): OpsTask[] {
  const open = tasks.filter((t) => t.status !== "done" && !isSnoozed(t));
  const mine = open.filter((t) => t.owner_kind === viewerKind && t.status !== "blocked");
  const theirs = open.filter((t) => t.owner_kind !== viewerKind && t.status !== "blocked");
  const stuck = open.filter((t) => t.status === "blocked");
  const bySort = (a: OpsTask, b: OpsTask) => a.sort_order - b.sort_order;
  return [...mine.sort(bySort), ...theirs.sort(bySort), ...stuck.sort(bySort)];
}

/** Position of a task in the whole journey, for "Step 12 of 136". */
export function stepPosition(tasks: OpsTask[], task: OpsTask) {
  const ordered = [...tasks].sort((a, b) => a.sort_order - b.sort_order);
  return { index: ordered.findIndex((t) => t.id === task.id) + 1, total: ordered.length };
}

/** True when every step inside a stage is finished. */
export function stageComplete(tasks: OpsTask[], phase: number) {
  const inStage = tasks.filter((t) => t.phase === phase);
  return inStage.length > 0 && inStage.every((t) => t.status === "done");
}

/** The stage the founder is actually working in right now. */
export function activeStage(tasks: OpsTask[]): number {
  const open = tasks.filter((t) => t.status !== "done");
  return open.length ? Math.min(...open.map((t) => t.phase)) : 4;
}

export function estimateLabel(minutes?: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `About ${minutes} minutes`;
  const h = minutes / 60;
  return h === 1 ? "About an hour" : `About ${h % 1 === 0 ? h : h.toFixed(1)} hours`;
}
