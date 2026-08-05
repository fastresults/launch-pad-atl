// Recurring 2026 workshop schedule generator.
// Pure client-side: getUpcomingSessions() re-filters against `new Date()` on every
// render so past dates disappear automatically. No DB, no cron.

export type ScheduledSession = {
  /** ISO timestamp of session start (with ET offset applied). */
  startISO: string;
  /** ISO timestamp of session end. */
  endISO: string;
  /** e.g. "Tue, Feb 10, 2026" */
  dateLabel: string;
  /** e.g. "9:30–11:30 am ET" */
  timeLabel: string;
};

type ScheduleRule = {
  /** 0 = Sunday, 2 = Tue, 3 = Wed */
  weekday: number;
  /** Nth occurrence in the month (2 = 2nd) */
  nth: number;
  /** 1-indexed months to include (Jan = 1). Empty/undefined = all. */
  months?: number[];
  /** 24h "HH:MM" ET */
  startTime: string;
  endTime: string;
  /** Display time label */
  timeLabel: string;
};

export const WORKSHOP_SCHEDULES: Record<string, ScheduleRule> = {
  "brand-identity": {
    weekday: 2, // Tue
    nth: 2,
    startTime: "09:30",
    endTime: "11:30",
    timeLabel: "9:30–11:30 am ET",
  },
  "website-that-converts": {
    weekday: 3, // Wed
    nth: 2,
    startTime: "09:30",
    endTime: "11:30",
    timeLabel: "9:30–11:30 am ET",
  },
  "social-presence": {
    weekday: 2,
    nth: 2,
    months: [2, 4, 6, 8, 10, 12], // even months
    startTime: "13:30",
    endTime: "16:00",
    timeLabel: "1:30–4:00 pm ET",
  },
  "content-engine": {
    weekday: 2,
    nth: 2,
    months: [1, 3, 5, 7, 9, 11], // odd months
    startTime: "13:30",
    endTime: "16:00",
    timeLabel: "1:30–4:00 pm ET",
  },
  "ai-operating-system": {
    weekday: 4, // Thu
    nth: 2,
    startTime: "09:30",
    endTime: "11:30",
    timeLabel: "9:30–11:30 am ET",
  },
  "email-crm-automation": {
    weekday: 4, // Thu
    nth: 2,
    startTime: "13:30",
    endTime: "16:00",
    timeLabel: "1:30–4:00 pm ET",
  },
  "sales-systems": {
    weekday: 5, // Fri
    nth: 2,
    startTime: "09:30",
    endTime: "11:30",
    timeLabel: "9:30–11:30 am ET",
  },
  "legal-financial-ops": {
    weekday: 5, // Fri
    nth: 2,
    startTime: "13:30",
    endTime: "16:00",
    timeLabel: "1:30–4:00 pm ET",
  },
};

/** Date of the nth weekday in a given month (year, 1-indexed month). */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Second Sunday of March through first Sunday of November = EDT (-4), else EST (-5). */
function etOffsetHours(year: number, month: number, day: number): number {
  const dstStart = nthWeekdayOfMonth(year, 3, 0, 2); // 2nd Sun Mar
  const dstEnd = nthWeekdayOfMonth(year, 11, 0, 1); // 1st Sun Nov
  const d = Date.UTC(year, month - 1, day);
  return d >= dstStart.getTime() && d < dstEnd.getTime() ? 4 : 5;
}

function toEtIso(year: number, month: number, day: number, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const off = etOffsetHours(year, month, day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(h)}:${pad(m)}:00-${pad(off)}:00`;
}

const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLabel(year: number, month: number, day: number, weekday: number): string {
  return `${WEEKDAY_LABEL[weekday]}, ${MONTH_LABEL[month - 1]} ${day}, ${year}`;
}

/** Sessions stop being bookable this many hours before they start. */
export const BOOKING_CUTOFF_HOURS = 48;

/** How far ahead the rolling schedule is generated. */
export const SCHEDULE_HORIZON_MONTHS = 14;

/**
 * Returns upcoming sessions for a workshop across a rolling window from today,
 * dropping any session inside the booking cutoff. Empty array = nothing to show.
 */
export function getUpcomingSessions(
  slug: string,
  now: Date = new Date(),
  limit = 12,
): ScheduledSession[] {
  const rule = WORKSHOP_SCHEDULES[slug];
  if (!rule) return [];

  const cutoffMs = now.getTime() + BOOKING_CUTOFF_HOURS * 60 * 60 * 1000;
  const sessions: ScheduledSession[] = [];
  // Rolling window: current month through SCHEDULE_HORIZON_MONTHS ahead.
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth() + 1; // 1-indexed
  const totalMonths = SCHEDULE_HORIZON_MONTHS + 1;
  for (let i = 0; i < totalMonths; i++) {
    const absolute = startMonth - 1 + i;
    const year = startYear + Math.floor(absolute / 12);
    const month = (absolute % 12) + 1;
    {
      if (rule.months && !rule.months.includes(month)) continue;
      const d = nthWeekdayOfMonth(year, month, rule.weekday, rule.nth);
      const day = d.getUTCDate();
      const startISO = toEtIso(year, month, day, rule.startTime);
      const endISO = toEtIso(year, month, day, rule.endTime);
      // Drop sessions that start within the booking cutoff window.
      if (new Date(startISO).getTime() <= cutoffMs) continue;

      sessions.push({
        startISO,
        endISO,
        dateLabel: formatDateLabel(year, month, day, rule.weekday),
        timeLabel: rule.timeLabel,
      });
    }
  }
  return sessions.slice(0, limit);
}
