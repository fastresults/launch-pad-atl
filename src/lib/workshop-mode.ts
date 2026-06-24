// Pure, time-aware workshop mode resolver. Drives the entire mode-aware dashboard.
// No React, no DB — just (now, cohort) → state.

import type { Cohort } from "./cohorts";

export type WorkshopMode = "before" | "during" | "after" | "none";

export type ScheduleBlock = {
  // Minutes from workshop start (cohort.startISO).
  startMin: number;
  endMin: number;
  kind: "checkin" | "stage" | "break" | "close";
  stageN?: number; // 1..7 for stage blocks
  title: string;
  subtitle: string; // plain-language
};

// Minute offsets from cohort.startISO (8:45 AM = 0). Mirrors the published
// SCHEDULE in src/lib/schedule-data.ts and the 5-pillar / 20-document framework.
export const SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { startMin: 0, endMin: 15, kind: "checkin", title: "Check-in", subtitle: "Grab coffee, settle in, and get the idea out of your head in one sentence. We take it from there." },
  { startMin: 15, endMin: 40, kind: "stage", stageN: 1, title: "Foundation", subtitle: "Turn the idea into a clear offer for a specific person — and know exactly why they should care." },
  { startMin: 40, endMin: 75, kind: "stage", stageN: 2, title: "Strategy", subtitle: "Make your first path to customers and revenue feel believable — pricing, positioning, and where the early demand comes from." },
  { startMin: 75, endMin: 85, kind: "break", title: "Refreshment break", subtitle: "Stretch, refill, step outside. Your AI cofounder keeps working in the background." },
  { startMin: 85, endMin: 110, kind: "stage", stageN: 3, title: "Operations", subtitle: "See how your startup actually runs Monday morning — the tools, the workflow, and what gets done first." },
  { startMin: 110, endMin: 140, kind: "stage", stageN: 4, title: "Finance", subtitle: "Get honest with the numbers — pricing, costs, runway, and what you'd ask for if you ever raised." },
  { startMin: 140, endMin: 155, kind: "stage", stageN: 5, title: "Governance", subtitle: "Know what to protect, what to decide, and what to bring to advisors, partners, or early supporters." },
  { startMin: 155, endMin: 165, kind: "close", title: "You did it", subtitle: "Walk out knowing what you're building, who it's for, how it makes money, and what to do first." },
];

export const WORKSHOP_END_MIN = 170; // small buffer past 11:30 AM close
export const POST_WORKSHOP_DAYS = 90;

export type WorkshopState = {
  mode: WorkshopMode;
  cohort: Cohort | null;
  // Mode A
  daysUntil?: number;
  // Mode B
  currentBlock?: ScheduleBlock;
  nextBlock?: ScheduleBlock;
  minutesIntoBlock?: number;
  minutesLeftInBlock?: number;
  minutesUntilNextBlock?: number;
  // Mode C
  dayOfNinety?: number;
};

export function getWorkshopMode(now: Date, cohort: Cohort | null): WorkshopState {
  if (!cohort) return { mode: "none", cohort: null };

  const start = new Date(cohort.startISO).getTime();
  const nowMs = now.getTime();
  const minutesFromStart = Math.floor((nowMs - start) / 60_000);

  if (minutesFromStart < 0) {
    const daysUntil = Math.ceil(-minutesFromStart / 60 / 24);
    return { mode: "before", cohort, daysUntil };
  }

  if (minutesFromStart > WORKSHOP_END_MIN) {
    const dayOfNinety = Math.min(
      POST_WORKSHOP_DAYS,
      Math.floor(minutesFromStart / 60 / 24) + 1,
    );
    return { mode: "after", cohort, dayOfNinety };
  }

  // During — find current block
  const currentIdx = SCHEDULE_BLOCKS.findIndex(
    (b) => minutesFromStart >= b.startMin && minutesFromStart < b.endMin,
  );
  const currentBlock = currentIdx >= 0 ? SCHEDULE_BLOCKS[currentIdx] : SCHEDULE_BLOCKS[0];
  const nextBlock = currentIdx >= 0 ? SCHEDULE_BLOCKS[currentIdx + 1] : SCHEDULE_BLOCKS[1];
  const minutesIntoBlock = minutesFromStart - currentBlock.startMin;
  const minutesLeftInBlock = currentBlock.endMin - minutesFromStart;
  const minutesUntilNextBlock = nextBlock ? nextBlock.startMin - minutesFromStart : 0;

  return {
    mode: "during",
    cohort,
    currentBlock,
    nextBlock,
    minutesIntoBlock,
    minutesLeftInBlock,
    minutesUntilNextBlock,
  };
}

export function formatMinutesLeft(mins: number): string {
  if (mins <= 0) return "wrapping up";
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m left`;
}

// Friendly labels for the 5 pillars in the workshop framework.
export const FRIENDLY_STAGE: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Foundation", subtitle: "Say who it's for and why it matters." },
  2: { title: "Strategy", subtitle: "Know how you'll reach people and make money." },
  3: { title: "Operations", subtitle: "See how the startup actually runs." },
  4: { title: "Finance", subtitle: "Understand the numbers without pretending to be a CFO." },
  5: { title: "Governance", subtitle: "Know what to protect, decide, and ask for help with." },
};
