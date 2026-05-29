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

// Mirrors src/lib/schedule-data.ts but in minute offsets so we don't
// hard-code dates. 8:00 AM = 0.
export const SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { startMin: 0, endMin: 30, kind: "checkin", title: "Check-in", subtitle: "Settle in, coffee, set up your laptop." },
  { startMin: 30, endMin: 90, kind: "stage", stageN: 1, title: "Stage 1 · Make it legal", subtitle: "LLC, EIN, the legal stuff handled." },
  { startMin: 90, endMin: 150, kind: "stage", stageN: 2, title: "Stage 2 · Find your customer", subtitle: "Who buys, where they hang out, why now." },
  { startMin: 150, endMin: 210, kind: "stage", stageN: 3, title: "Stage 3 · Decide what you sell", subtitle: "Your first offer and what to charge." },
  { startMin: 210, endMin: 240, kind: "break", title: "Lunch break", subtitle: "Lunch is provided. Eat together. Your AI keeps working." },
  { startMin: 240, endMin: 300, kind: "stage", stageN: 4, title: "Stage 4 · Set up delivery", subtitle: "How you fulfill what you sell." },
  { startMin: 300, endMin: 375, kind: "stage", stageN: 5, title: "Stage 5 · Look the part", subtitle: "Brand, website, payments, email." },
  { startMin: 375, endMin: 390, kind: "break", title: "Coffee reset", subtitle: "Quick stretch, refill, regroup." },
  { startMin: 390, endMin: 450, kind: "stage", stageN: 6, title: "Stage 6 · Get the word out", subtitle: "Messaging, social, collateral." },
  { startMin: 450, endMin: 510, kind: "stage", stageN: 7, title: "Stage 7 · Open for business", subtitle: "Your signed 90-day launch plan." },
  { startMin: 510, endMin: 525, kind: "close", title: "You did it", subtitle: "Walk out with a launched business." },
];

export const WORKSHOP_END_MIN = 525; // 4:45 PM safety buffer past 4:30 close
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

// Friendly stage labels for the 7 workshop stages.
export const FRIENDLY_STAGE: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Make it legal", subtitle: "LLC, EIN, the legal stuff handled." },
  2: { title: "Find your customer", subtitle: "Who buys, where they hang out, why now." },
  3: { title: "Decide what you sell", subtitle: "Your first offer and what to charge." },
  4: { title: "Set up delivery", subtitle: "How you fulfill what you sell." },
  5: { title: "Look the part", subtitle: "Brand, website, payments, email." },
  6: { title: "Get the word out", subtitle: "Messaging, social, collateral." },
  7: { title: "Open for business", subtitle: "Your signed 90-day launch plan." },
};
