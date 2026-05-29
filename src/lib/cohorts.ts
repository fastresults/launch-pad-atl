// Recurring workshop cohorts — third Wednesday of every month, Jun 2026 → May 2027.
// Times: 8:00 AM – 4:30 PM ET. June - August are EDT (UTC-4); Nov - Mar are EST (UTC-5).

export type CohortStatus = "sold_out" | "filling" | "open";

export type Cohort = {
  id: string;            // "2026-06-17"
  startISO: string;
  endISO: string;
  dateLabel: string;     // "Wed, Jun 17, 2026"
  shortLabel: string;    // "Jun 17"
  monthLabel: string;    // "June 2026"
  status: CohortStatus;
  seatsLeft?: number;
  googleCalendarUrl: string;
  icsHref: string;
  icsFilename: string;
};

const EVENT_TITLE = "Ignite Business Launch Workshop";
const EVENT_DETAILS =
  "One-day, build-your-business workshop with Adam Anderson. You walk in with an idea, you walk out with a real, revenue-ready business: LLC packet, EIN, offer, website draft, full marketing kit, and a signed 90-day plan.";
const EVENT_ADDRESS = "1500 Indian Trail Lilburn Rd NW, Norcross, GA 30093";
const EVENT_VENUE_LINE = `IGNITE Center at Greater Atlanta Christian School, ${EVENT_ADDRESS}`;

const toCalStamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const buildGoogleUrl = (startISO: string, endISO: string) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE` +
  `&text=${encodeURIComponent(EVENT_TITLE)}` +
  `&dates=${toCalStamp(startISO)}/${toCalStamp(endISO)}` +
  `&details=${encodeURIComponent(EVENT_DETAILS)}` +
  `&location=${encodeURIComponent(EVENT_VENUE_LINE)}`;

const buildIcs = (id: string, startISO: string, endISO: string) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ignite Business Launch//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ignite-business-launch-${id}@greateratlantachristian`,
    `DTSTAMP:${toCalStamp(new Date().toISOString())}`,
    `DTSTART:${toCalStamp(startISO)}`,
    `DTEND:${toCalStamp(endISO)}`,
    `SUMMARY:${EVENT_TITLE}`,
    `LOCATION:${EVENT_VENUE_LINE}`,
    `DESCRIPTION:${EVENT_DETAILS.replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

// Seed data: third Wednesday of each month, Jun 2026 → May 2027.
// `tz` selects offset for EDT vs EST.
type Seed = {
  id: string;
  date: string;            // YYYY-MM-DD
  tz: "EDT" | "EST";
  status: CohortStatus;
  seatsLeft?: number;
};

const SEED: Seed[] = [
  { id: "2026-06-17", date: "2026-06-17", tz: "EDT", status: "sold_out" },
  { id: "2026-07-15", date: "2026-07-15", tz: "EDT", status: "filling", seatsLeft: 6 },
  { id: "2026-08-19", date: "2026-08-19", tz: "EDT", status: "open" },
  { id: "2026-09-16", date: "2026-09-16", tz: "EDT", status: "open" },
  { id: "2026-10-21", date: "2026-10-21", tz: "EDT", status: "open" },
  { id: "2026-11-18", date: "2026-11-18", tz: "EST", status: "open" },
  { id: "2026-12-16", date: "2026-12-16", tz: "EST", status: "open" },
  { id: "2027-01-20", date: "2027-01-20", tz: "EST", status: "open" },
  { id: "2027-02-17", date: "2027-02-17", tz: "EST", status: "open" },
  { id: "2027-03-17", date: "2027-03-17", tz: "EDT", status: "open" },
  { id: "2027-04-21", date: "2027-04-21", tz: "EDT", status: "open" },
  { id: "2027-05-19", date: "2027-05-19", tz: "EDT", status: "open" },
];

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildCohort = (s: Seed): Cohort => {
  const [y, m, d] = s.date.split("-").map(Number);
  const offset = s.tz === "EDT" ? "-04:00" : "-05:00";
  const startISO = `${s.date}T08:00:00${offset}`;
  const endISO = `${s.date}T16:30:00${offset}`;

  // Use a UTC anchor at 12:00 to safely derive the local weekday name.
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = DAY_SHORT[anchor.getUTCDay()];
  const shortMonth = MONTH_SHORT[m - 1];
  const longMonth = MONTH_LONG[m - 1];

  return {
    id: s.id,
    startISO,
    endISO,
    dateLabel: `${dow}, ${shortMonth} ${d}, ${y}`,
    shortLabel: `${shortMonth} ${d}`,
    monthLabel: `${longMonth} ${y}`,
    status: s.status,
    seatsLeft: s.seatsLeft,
    googleCalendarUrl: buildGoogleUrl(startISO, endISO),
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcs(s.id, startISO, endISO))}`,
    icsFilename: `ignite-business-launch-${s.id}.ics`,
  };
};

export const COHORTS: Cohort[] = SEED.map(buildCohort);

export function getCohortById(id: string | undefined | null): Cohort | undefined {
  if (!id) return undefined;
  return COHORTS.find((c) => c.id === id);
}

export function getNextAvailableCohort(): Cohort {
  return (
    COHORTS.find((c) => c.status === "filling") ??
    COHORTS.find((c) => c.status === "open") ??
    COHORTS[0]
  );
}

export const FIRST_SOLD_OUT = COHORTS.find((c) => c.status === "sold_out");
