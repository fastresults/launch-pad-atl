// Client-side types + labels for the venture operating runway. The task catalog
// itself lives server-side (supabase/functions/_shared/ops-runway.ts) and is
// seeded per venture, so this file only describes what comes back.

export type OpsStatus = "todo" | "in_progress" | "waiting_client" | "blocked" | "done";
export type OpsOwnerKind = "client" | "agency";

export interface OpsTask {
  id: string;
  snapshot_id: string;
  phase: number;
  day: number;
  task_key: string;
  title: string;
  why: string;
  done_when: string;
  category: string;
  asset_keys: string[];
  status: OpsStatus;
  owner_kind: OpsOwnerKind;
  owner_name: string | null;
  due_at: string | null;
  sort_order: number;
  completed_at: string | null;
  proof_url: string | null;
  how?: string[] | null;
  needs?: string[] | null;
  minutes?: number | null;
  snoozed_until?: string | null;
}

export interface OpsNote {
  id: string;
  task_id: string;
  author_kind: OpsOwnerKind;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface OpsState {
  snapshot_id: string;
  runway_started_at: string;
  client_can_edit: boolean;
  intro_dismissed?: boolean;
}

export interface OpsRunway {
  tasks: OpsTask[];
  notes: OpsNote[];
  state: OpsState | null;
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
}

export const OPS_PHASES: { phase: number; label: string; range: string; blurb: string }[] = [
  { phase: 1, label: "Prove it", range: "Days 1–7", blurb: "Concept, offer, buyers, demand, wedge, sales machine, voice." },
  { phase: 2, label: "Wire it", range: "Days 8–14", blurb: "Legal, money, domain, site, ops, content, launch." },
  { phase: 3, label: "Run it", range: "Days 15–30", blurb: "First proposals, first cash, first close, first proof." },
  { phase: 4, label: "Compound", range: "Days 31–90", blurb: "Rhythm, numbers, pricing, first hire, next quarter." },
];

export const STATUS_LABEL: Record<OpsStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  waiting_client: "Waiting on client",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_CLASS: Record<OpsStatus, string> = {
  todo: "border-border/60 text-muted-foreground",
  in_progress: "border-sky-400/50 text-sky-300",
  waiting_client: "border-amber-400/50 text-amber-300",
  blocked: "border-destructive/60 text-destructive",
  done: "border-emerald-400/50 text-emerald-300",
};

export const STATUS_ORDER: OpsStatus[] = ["todo", "in_progress", "waiting_client", "blocked", "done"];

/** Same dot colors as the Launch Cadence so the two views read continuously. */
export const OPS_CATEGORY_DOT: Record<string, string> = {
  Foundation: "bg-primary",
  Strategy: "bg-indigo-400",
  Operations: "bg-teal-400",
  Finance: "bg-amber-400",
  Governance: "bg-slate-400",
  Brand: "bg-fuchsia-400",
  Marketing: "bg-sky-400",
  "Social & Content": "bg-rose-400",
  Creative: "bg-violet-400",
};

/** Categories that make up the creative sign-off thread. */
export const OPS_CREATIVE_CATEGORIES = new Set(["Creative", "Brand"]);


/** Day N of the runway is N-1 days after the start; used for due dates and the "today" marker. */
export function dueForDay(startedAt: string | null | undefined, day: number): Date | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setDate(d.getDate() + Math.max(0, day - 1));
  return d;
}

export function currentRunwayDay(startedAt: string | null | undefined): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, Math.min(90, days));
}

export function isOverdue(task: OpsTask, startedAt: string | null | undefined): boolean {
  if (task.status === "done") return false;
  const due = task.due_at ? new Date(task.due_at) : dueForDay(startedAt, task.day);
  return !!due && due.getTime() < Date.now();
}

export function progressOf(tasks: OpsTask[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function nextFive(tasks: OpsTask[]): OpsTask[] {
  return tasks
    .filter((t) => t.status !== "done" && t.status !== "blocked")
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 5);
}
