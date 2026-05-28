import { STAGES } from "./curriculum-data";

export type Session = {
  time: string;
  duration: string;
  stage?: number;
  title: string;
  description: string;
  kind?: "session" | "break";
};

const EVENT_TITLE = "Ignite Business Launch Workshop";
const EVENT_DETAILS =
  "One-day, build-your-business workshop with Adam Anderson. You walk in with an idea, you walk out with a real, revenue-ready business: LLC packet, EIN, offer, website draft, full marketing kit, and a signed 90-day plan.";
const EVENT_ADDRESS = "1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093";
const EVENT_VENUE_LINE = `IGNITE Center at Greater Atlanta Christian School, ${EVENT_ADDRESS}`;

// 8:00 AM ET → 4:30 PM ET on Thursday, July 23, 2026.
// ET is UTC-4 in July (EDT).
const EVENT_START_ISO = "2026-07-23T08:00:00-04:00";
const EVENT_END_ISO = "2026-07-23T16:30:00-04:00";

// YYYYMMDDTHHmmssZ for Google Calendar + ICS.
const toCalStamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const GOOGLE_CALENDAR_URL =
  `https://calendar.google.com/calendar/render?action=TEMPLATE` +
  `&text=${encodeURIComponent(EVENT_TITLE)}` +
  `&dates=${toCalStamp(EVENT_START_ISO)}/${toCalStamp(EVENT_END_ISO)}` +
  `&details=${encodeURIComponent(EVENT_DETAILS)}` +
  `&location=${encodeURIComponent(EVENT_VENUE_LINE)}`;

const ICS_PAYLOAD = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Ignite Business Launch//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "BEGIN:VEVENT",
  `UID:ignite-business-launch-2026-07-23@greateratlantachristian`,
  `DTSTAMP:${toCalStamp(new Date().toISOString())}`,
  `DTSTART:${toCalStamp(EVENT_START_ISO)}`,
  `DTEND:${toCalStamp(EVENT_END_ISO)}`,
  `SUMMARY:${EVENT_TITLE}`,
  `LOCATION:${EVENT_VENUE_LINE}`,
  `DESCRIPTION:${EVENT_DETAILS.replace(/,/g, "\\,")}`,
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

export const EVENT = {
  dateLabel: "Thursday, July 23, 2026",
  timeLabel: "8:00 AM – 4:30 PM ET",
  durationLabel: "8 hours 30 minutes",
  venueName: "IGNITE Center at Greater Atlanta Christian School",
  address: EVENT_ADDRESS,
  capacity: 20,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=1500+Indian+Trail+Lilburn+Rd+NW%2C+Norcross%2C+GA+30093&output=embed",
  startISO: EVENT_START_ISO,
  endISO: EVENT_END_ISO,
  googleCalendarUrl: GOOGLE_CALENDAR_URL,
  icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(ICS_PAYLOAD)}`,
  icsFilename: "ignite-business-launch-2026.ics",
};

// Flow strip on the home page mirrors the curriculum.
export const FLOW_STAGES = STAGES.map((s) => ({
  n: s.n,
  slug: s.slug,
  title: s.shortTitle,
  blurb: s.oneLiner,
  takeHome: s.takeHome,
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
