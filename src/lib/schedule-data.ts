import { STAGES } from "./curriculum-data";

export type Session = {
  time: string;
  duration: string;
  stage?: number;
  title: string;
  description: string;
  kind?: "session" | "break";
};

export const EVENT = {
  dateLabel: "Thursday, July 23, 2026",
  timeLabel: "9:00 AM – 4:30 PM ET",
  venueName: "Workshop venue",
  address: "1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093",
  capacity: 20,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093",
};

// Flow strip on the home page mirrors the curriculum.
export const FLOW_STAGES = STAGES.map((s) => ({
  n: s.n,
  slug: s.slug,
  title: s.shortTitle,
  blurb: s.oneLiner,
}));

// Schedule = check-in + 6 stages + 2 breaks, working time = 360 min.
const stageBlock = (n: number, time: string): Session => {
  const s = STAGES[n - 1];
  return {
    time,
    duration: s.duration,
    stage: s.n,
    title: `${s.title}`,
    description: s.summary,
    kind: "session",
  };
};

export const SCHEDULE: Session[] = [
  {
    time: "9:00 AM",
    duration: "30 min",
    title: "Check-in & kickoff",
    description: "Coffee, intros, set up your laptop, share your idea in one sentence.",
    kind: "session",
  },
  stageBlock(1, "9:30 AM"),
  stageBlock(2, "10:30 AM"),
  {
    time: "11:30 AM",
    duration: "45 min",
    title: "Lunch break",
    description: "Lunch provided. Working tables open for questions.",
    kind: "break",
  },
  stageBlock(3, "12:15 PM"),
  stageBlock(4, "1:15 PM"),
  {
    time: "2:30 PM",
    duration: "15 min",
    title: "Coffee reset",
    description: "Quick stretch, refill, regroup.",
    kind: "break",
  },
  stageBlock(5, "2:45 PM"),
  stageBlock(6, "3:30 PM"),
  {
    time: "4:00 PM",
    duration: "—",
    title: "Close — signed launch plan in hand",
    description: "You walk out with a formed business and a 30/60/90 plan.",
    kind: "break",
  },
];
