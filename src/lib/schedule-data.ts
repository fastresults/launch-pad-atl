import { STAGES } from "./curriculum-data";
import { getNextAvailableCohort } from "./cohorts";

export type Session = {
  time: string;
  duration: string;
  stage?: number;
  title: string;
  description: string;
  kind?: "session" | "break";
};

const EVENT_ADDRESS = "1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093";

// EVENT reflects the next-available cohort so the hero, schedule page,
// and confirmation flow auto-roll forward as monthly cohorts fill up.
const NEXT = getNextAvailableCohort();

export const EVENT = {
  dateLabel: NEXT.dateLabel,
  timeLabel: "8:00 AM – 4:30 PM ET",
  durationLabel: "8 hours 30 minutes",
  venueName: "IGNITE Center at Greater Atlanta Christian School",
  address: EVENT_ADDRESS,
  capacity: 20,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093&output=embed",
  startISO: NEXT.startISO,
  endISO: NEXT.endISO,
  googleCalendarUrl: NEXT.googleCalendarUrl,
  icsHref: NEXT.icsHref,
  icsFilename: NEXT.icsFilename,
};


// Flow strip on the home page mirrors the curriculum.
export const FLOW_STAGES = STAGES.map((s) => ({
  n: s.n,
  slug: s.slug,
  title: s.shortTitle,
  blurb: s.oneLiner,
  takeHome: s.takeHome,
  walkOut: s.walkOut,
  afterWorkshop: s.afterWorkshop,
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
    time: "8:00 AM",
    duration: "30 min",
    title: "Check-in & kickoff",
    description: "Coffee, intros, set up your laptop, share your idea in one sentence.",
    kind: "session",
  },
  stageBlock(1, "8:30 AM"),
  stageBlock(2, "9:30 AM"),
  stageBlock(3, "10:30 AM"),
  {
    time: "11:30 AM",
    duration: "30 min",
    title: "Lunch break",
    description: "Lunch provided. Working tables open for questions.",
    kind: "break",
  },
  stageBlock(4, "12:00 PM"),
  stageBlock(5, "1:00 PM"),
  {
    time: "2:15 PM",
    duration: "15 min",
    title: "Coffee reset",
    description: "Quick stretch, refill, regroup.",
    kind: "break",
  },
  stageBlock(6, "2:30 PM"),
  stageBlock(7, "3:30 PM"),
  {
    time: "4:30 PM",
    duration: "—",
    title: "Close — signed launch plan in hand",
    description: "You walk out with a formed business and a signed 90-day plan.",
    kind: "break",
  },
];
