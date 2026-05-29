import { STAGES } from "./curriculum-data";
import { FALLBACK_COHORT, toPublicSeats, type Cohort } from "./cohorts";

export type Session = {
  time: string;
  duration: string;
  stage?: number;
  title: string;
  description: string;
  kind?: "session" | "break";
};

// Build an EVENT-shape object from a cohort. Used by hero/schedule/confirmation.
export function buildEvent(cohort: Cohort) {
  const venueAddress = `${cohort.venueAddress}, ${cohort.venueCity}, ${cohort.venueRegion} ${cohort.venuePostal}`;
  return {
    dateLabel: cohort.dateLabel,
    timeLabel: "8:00 AM – 4:30 PM ET",
    durationLabel: "8 hours 30 minutes",
    venueName: cohort.venueName,
    address: venueAddress,
    venueCity: cohort.venueCity,
    venueRegion: cohort.venueRegion,
    isDefaultVenue: cohort.isDefaultVenue,
    // Public-facing seat count = half of real internal capacity (see toPublicSeats).
    capacity: toPublicSeats(cohort.foundersSeats + cohort.cohortSeats),
    mapsUrl: cohort.mapsUrl,
    mapsEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(venueAddress)}&output=embed`,
    startISO: cohort.startISO,
    endISO: cohort.endISO,
    googleCalendarUrl: cohort.googleCalendarUrl,
    icsHref: cohort.icsHref,
    icsFilename: cohort.icsFilename,
  };
}

// Static fallback so existing static `EVENT` imports keep working at build time.
// Pages that need live data should call `buildEvent(cohort)` with loader data.
export const EVENT = buildEvent(FALLBACK_COHORT);

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
    title: "Catered lunch & discussion",
    description: "Lunch is provided. Eat together, swap notes, and talk through what you're building with the group and instructors.",
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
