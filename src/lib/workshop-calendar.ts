// One merged view of every upcoming workshop session.
//
// The eight build workshops come from the recurring generator; Foundation is a
// single hand-set date. Everything here reads the same cutoff/horizon rules as
// the workshop pages, so the calendar can never advertise a session those
// pages hide.

import {
  getUpcomingSessions,
  WORKSHOP_SCHEDULES,
  BOOKING_CUTOFF_HOURS,
  SCHEDULE_HORIZON_DAYS,
} from "@/lib/build-workshop-schedule";
import { WORKSHOP_CATALOG, FOUNDATION_SLUG, getCatalogWorkshop } from "@/lib/workshop-catalog";

export type CalendarSession = {
  slug: string;
  title: string;
  priceLabel: string;
  startISO: string;
  endISO: string;
  dateLabel: string;
  timeLabel: string;
  /** Where the reserve button sends the visitor. */
  reserveHref: string;
};

/** Foundation's fixed session (Thu, Aug 20, 2026, morning, ET). */
const FOUNDATION_SESSION = {
  startISO: "2026-08-20T09:30:00-04:00",
  endISO: "2026-08-20T12:15:00-04:00",
  dateLabel: "Thu, Aug 20, 2026",
  timeLabel: "9:30 am–12:15 pm ET",
};

/** How many upcoming dates the calendar shows per workshop. */
export const SESSIONS_PER_WORKSHOP = 3;

/**
 * The next few bookable sessions for every workshop, sorted by start time.
 */
export function getAllUpcomingSessions(
  now: Date = new Date(),
  perWorkshop: number = SESSIONS_PER_WORKSHOP,
): CalendarSession[] {
  const out: CalendarSession[] = [];
  // Look far enough ahead that every workshop can fill its quota, even the
  // ones that only run every other month.
  const lookaheadDays = 420;

  for (const slug of Object.keys(WORKSHOP_SCHEDULES)) {
    const w = getCatalogWorkshop(slug);
    for (const s of getUpcomingSessions(slug, now, perWorkshop, lookaheadDays)) {
      out.push({
        slug,
        title: w.title,
        priceLabel: w.priceLabel,
        startISO: s.startISO,
        endISO: s.endISO,
        dateLabel: s.dateLabel,
        timeLabel: s.timeLabel,
        reserveHref: `/register?workshop=${slug}&date=${encodeURIComponent(s.startISO)}`,
      });
    }
  }

  // Foundation: include it while it is still outside the booking cutoff.
  const cutoffMs = now.getTime() + BOOKING_CUTOFF_HOURS * 60 * 60 * 1000;
  const foundationMs = new Date(FOUNDATION_SESSION.startISO).getTime();
  if (foundationMs > cutoffMs) {
    const f = getCatalogWorkshop(FOUNDATION_SLUG);
    out.push({
      slug: FOUNDATION_SLUG,
      title: f.title,
      priceLabel: f.priceLabel,
      ...FOUNDATION_SESSION,
      reserveHref: "/register",
    });
  }

  return out.sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime(),
  );
}

export type CalendarDay = {
  /** "2026-08-11" — stable key. */
  key: string;
  dateLabel: string;
  sessions: CalendarSession[];
};

export type CalendarMonth = {
  /** "2026-08" */
  key: string;
  label: string;
  days: CalendarDay[];
};

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Groups a flat session list into month → day buckets, order preserved. */
export function groupSessions(sessions: CalendarSession[]): CalendarMonth[] {
  const months: CalendarMonth[] = [];

  for (const s of sessions) {
    const dayKey = s.startISO.slice(0, 10);
    const monthKey = s.startISO.slice(0, 7);
    let month = months.find((m) => m.key === monthKey);
    if (!month) {
      const [y, m] = monthKey.split("-");
      month = { key: monthKey, label: `${MONTH_FULL[Number(m) - 1]} ${y}`, days: [] };
      months.push(month);
    }
    let day = month.days.find((d) => d.key === dayKey);
    if (!day) {
      day = { key: dayKey, dateLabel: s.dateLabel, sessions: [] };
      month.days.push(day);
    }
    day.sessions.push(s);
  }

  return months;
}

/** Catalog entries that actually have a session in the window, for the chips. */
export function getFilterWorkshops(sessions: CalendarSession[]) {
  const slugs = new Set(sessions.map((s) => s.slug));
  return WORKSHOP_CATALOG.filter((w) => slugs.has(w.slug));
}
