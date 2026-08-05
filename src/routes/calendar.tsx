import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import {
  SectionShell,
  SectionEyebrow,
  SectionHeading,
} from "@/components/home/workshop/SectionChrome";
import {
  getAllUpcomingSessions,
  groupSessions,
  getFilterWorkshops,
} from "@/lib/workshop-calendar";
import { SESSIONS_PER_WORKSHOP } from "@/lib/workshop-calendar";
import { useDocumentTitle } from "@/lib/use-document-title";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get("w");

  const all = useMemo(() => getAllUpcomingSessions(new Date()), []);
  const workshops = useMemo(() => getFilterWorkshops(all), [all]);
  const filtered = useMemo(
    () => (active ? all.filter((s) => s.slug === active) : all),
    [all, active],
  );
  const months = useMemo(() => groupSessions(filtered), [filtered]);

  useDocumentTitle(
    "Workshop calendar — every upcoming Startup Labs session",
    `The next ${SESSIONS_PER_WORKSHOP} dates for every Startup Labs workshop, in one place. Pick a morning, reserve your seat, walk out with the real thing built.`,
    all.slice(0, 20).map((s) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: s.title,
      startDate: s.startISO,
      endDate: s.endISO,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: "IGNITE Center at Greater Atlanta Christian School",
        address: "Norcross, GA",
      },
    })),
  );

  const setFilter = (slug: string | null) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("w", slug);
    else next.delete("w");
    setParams(next, { replace: true });
  };

  return (
    <div className="public-surface min-h-screen">
      <SiteHeader />

      <SectionShell>
        <SectionEyebrow icon={CalendarDays}>
          Upcoming sessions · next {SESSIONS_PER_WORKSHOP} dates per workshop
        </SectionEyebrow>
        <SectionHeading lead="Every date we're open —" emphasis="pick your morning." />
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Sessions run in the same week, mornings and afternoons, so you can stack two in one
          trip to Atlanta. Show up with your idea; leave with the real thing built.
        </p>

        {/* Filter chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors md:text-sm",
              !active
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-white/10 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            All workshops
          </button>
          {workshops.map((w) => (
            <button
              key={w.slug}
              type="button"
              onClick={() => setFilter(w.slug)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors md:text-sm",
                active === w.slug
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/10 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {w.chipLabel}
            </button>
          ))}
        </div>
      </SectionShell>

      {months.length === 0 ? (
        <SectionShell tinted>
          <p className="text-base text-muted-foreground">
            Nothing on the books for that workshop right now.{" "}
            <Link to="/build" className="text-primary hover:underline">
              See every workshop
            </Link>{" "}
            or{" "}
            <Link to="/contact" className="text-primary hover:underline">
              ask us to schedule one
            </Link>
            .
          </p>
        </SectionShell>
      ) : (
        <SectionShell tinted>
          <div className="space-y-8">
            {months.map((month) => (
              <div key={month.key}>
                <SectionEyebrow muted>{month.label}</SectionEyebrow>
                <div className="mt-3 space-y-3">
                  {month.days.map((day) => (
                    <div
                      key={day.key}
                      className="rounded-2xl border border-white/10 bg-card p-4 md:p-5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
                        <h2 className="text-base font-medium tracking-tight md:text-lg">
                          {day.dateLabel}
                        </h2>
                        {day.sessions.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            Two sessions this day — you can do both.
                          </p>
                        )}
                      </div>
                      <ul className="mt-3 grid gap-2">
                        {day.sessions.map((s) => (
                          <li
                            key={`${s.slug}-${s.startISO}`}
                            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-baseline gap-x-3">
                                <span className="text-base font-medium tracking-tight">
                                  {s.title}
                                </span>
                                <span className="text-xs uppercase tracking-[0.16em] text-primary">
                                  {s.priceLabel}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {s.timeLabel}
                              </div>
                            </div>
                            <Link
                              to={s.reserveHref}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 md:text-sm"
                            >
                              Reserve <ArrowRight className="size-3.5" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionShell>
      )}

      <SiteFooter />
    </div>
  );
}
