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
    timeLabel: "8:45 AM – 11:30 AM ET",
    durationLabel: "2 hours 45 minutes",
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

// Schedule = check-in + 5 core pillar sessions + 2 breaks + bonus preview + close.
// Mirrors FRAMEWORK_STAGES so /schedule and the dashboard tell the same story.
const stageBlock = (n: number, time: string): Session => {
  const s = STAGES[n - 1];
  return {
    time,
    duration: s.duration,
    stage: s.n,
    title: s.title,
    description: s.summary,
    kind: "session",
  };
};

export const SCHEDULE: Session[] = [
  {
    time: "8:45 AM",
    duration: "15 min",
    title: "Check-in — coffee & refreshments",
    description:
      "Coffee, light breakfast, and refreshments provided. Settle in, meet the room, share your idea in one sentence.",
    kind: "session",
  },
  stageBlock(1, "9:00 AM"),   // Foundation
  stageBlock(2, "9:25 AM"),   // Strategy
  {
    time: "9:50 AM",
    duration: "10 min",
    title: "Refreshment break",
    description: "Refill your coffee, stretch, regroup. Refreshments stay out all morning.",
    kind: "break",
  },
  stageBlock(3, "10:00 AM"),  // Operations
  stageBlock(4, "10:25 AM"),  // Finance
  {
    time: "10:50 AM",
    duration: "10 min",
    title: "Refreshment break",
    description: "Second break. Stretch, refill, regroup for Governance and the bonus preview.",
    kind: "break",
  },
  stageBlock(5, "11:00 AM"),  // Governance (includes entity/EIN/legal packet)
  {
    time: "11:25 AM",
    duration: "5 min",
    title: "Bonus tracks preview — Brand · Marketing · Social & Content",
    description:
      "Quick tour of the three bonus tracks that unlock on your dashboard the moment you leave: a full brand system, an AI-builder website PRD, and a 90-day distribution engine.",
    kind: "session",
  },
  {
    time: "11:30 AM",
    duration: "—",
    title: "Close — 5 pillars in hand, dashboard unlocked",
    description:
      "You walk out with all 5 core pillars — Foundation, Strategy, Operations, Finance, Governance — completed live, and 3 bonus tracks (Brand, Marketing, Social & Content) queued on your dashboard.",
    kind: "break",
  },
];

];

