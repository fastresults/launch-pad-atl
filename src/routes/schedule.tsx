import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { SCHEDULE, buildEvent } from "@/lib/schedule-data";
import { listCohorts } from "@/lib/cohorts.functions";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { STAGES } from "@/lib/curriculum-data";
import { ArrowRight, Coffee, Clock } from "lucide-react";


export default function SchedulePage() {
  
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: listCohorts,
    initialData: [],
    staleTime: 60_000,
  });
  const EVENT = useMemo(
    () => buildEvent(getNextAvailable(cohorts) ?? FALLBACK_COHORT),
    [cohorts],
  );

  // Scroll to #stage-N anchors when navigating from the home flow strip
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prevTitle = document.title;
    document.title = "Schedule — Strategic Foundation Workshop";
    const id = window.location.hash.replace("#", "");
    if (id) {
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-white/5 py-12 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gradient-brand md:text-sm md:tracking-[0.2em]">
            Strategic Foundation Workshop · Agenda
          </p>
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            {EVENT.dateLabel} · {EVENT.timeLabel}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Idea in. <span className="text-gradient-brand">Launch assets out.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
            This is what a modern launch morning looks like. Foundation is the
            drafting stage — you write the one-page story of your startup.
            Every stage after Foundation is a{" "}
            <strong className="text-foreground">mentored working session</strong>: you bring a
            working attempt, an operator applies a CFO, brand-lead, or
            distribution lens to your specific startup, and you leave with
            sharper thinking plus reviewed drafts on your dashboard you keep refining.
          </p>

          {/* Stat ribbon */}
          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 md:mt-10 md:pt-8">
            {[
              { stat: "2h 45m", label: "working time" },
              { stat: "1 drafting", label: "+ 7 mentored review stages" },
              { stat: "~30 drafts", label: "reviewed working docs on your dashboard" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
              >
                <div className="text-2xl font-semibold tracking-tight">{s.stat}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day at a glance rail */}
      <section className="border-b border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Day at a glance
          </div>
          <div className="-mx-6 overflow-x-auto px-6">
            <div className="flex min-w-max gap-2 snap-x">
              {SCHEDULE.map((s, i) => {
                const stage = s.stage ? STAGES[s.stage - 1] : null;
                const href = stage ? `#stage-${stage.n}` : undefined;
                const label = stage ? stage.shortTitle : s.title.split(" ")[0].toLowerCase();
                const Tag = href ? "a" : "div";
                return (
                  <Tag
                    key={i}
                    href={href as string | undefined}
                    className={`group flex snap-start items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs transition-colors ${
                      href ? "hover:border-white/25 hover:bg-white/[0.05]" : ""
                    }`}
                  >
                    <span
                      className={`inline-block size-2 rounded-full ${
                        s.kind === "break" ? "bg-white/30" : "bg-hero-gradient"
                      }`}
                    />
                    <span className="font-medium text-foreground/90">{s.time}</span>
                    <span className="capitalize text-muted-foreground">{label}</span>
                  </Tag>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-5 md:p-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              How the sessions work
            </div>
            <p className="text-sm text-foreground/90 md:text-base">
              <strong>Foundation</strong> is the one drafting stage — you write the core story of
              your startup with worksheet support. Every session after Foundation is a{" "}
              <strong>mentored working session</strong>: you arrive with a working attempt, staff
              apply an expert lens (operator, CFO, brand lead, distribution lead) to your specific
              startup, and you leave with reviewed working drafts you continue to sharpen on your
              dashboard.
            </p>
          </div>
          <ol className="relative space-y-6 border-l border-white/15 pl-6">
            {SCHEDULE.map((s, i) => {
              const stage = s.stage ? STAGES[s.stage - 1] : null;
              return (
                <li
                  key={i}
                  id={stage ? `stage-${stage.n}` : undefined}
                  className="relative scroll-mt-24"
                >
                  <span
                    className={`absolute -left-[34px] top-3 inline-flex size-5 items-center justify-center rounded-full ring-2 ring-background ${
                      s.kind === "break" ? "bg-white/25" : "bg-hero-gradient"
                    }`}
                  />
                  {s.kind === "break" ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-transparent p-6">
                      <Coffee className="size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-sm text-muted-foreground">{s.description}</div>
                      </div>
                      <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                        {s.time} · {s.duration}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/25 md:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm font-semibold text-foreground/90">
                            {s.time}
                          </span>
                          <span className="h-3 w-px bg-white/15" />
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            {s.duration}
                          </span>
                        </div>
                        {stage && (
                          <span className="rounded-full bg-hero-gradient px-2.5 py-0.5 text-xs font-semibold text-white">
                            Stage {stage.n}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight md:text-3xl">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground md:text-base">{s.description}</p>


                      {stage && (
                        <>

                          <div className="mt-5 rounded-xl border border-white/10 bg-background/40 p-4 md:p-5">
                            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {stage.tasks.length} essential tasks
                            </div>
                            <ul className="space-y-5">
                              {stage.tasks.map((t, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-[11px] font-semibold text-white">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-foreground">{t.title}</div>
                                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">

                                      {t.details.map((d, di) => (
                                        <li key={di} className="flex items-start gap-2">
                                          <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-foreground/40" />
                                          <span>{d}</span>
                                        </li>
                                      ))}
                                    </ul>
                                    {t.takeaway && (
                                      <div className="mt-3 rounded-md border-l-2 border-primary bg-white/[0.04] px-3 py-2">
                                        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                          Take-home
                                        </div>
                                        <div className="mt-1 text-[13px] font-medium leading-snug text-foreground">
                                          {t.takeaway}
                                        </div>
                                      </div>
                                    )}
                                    {t.followUp && (
                                      <div className="mt-2 flex items-start gap-1.5 border-l-2 border-white/15 bg-white/[0.02] py-1.5 pl-3 pr-2 text-[12px] italic text-muted-foreground">
                                        <Clock className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
                                        <span>
                                          <span className="font-medium not-italic text-foreground/80">
                                            After the workshop:
                                          </span>{" "}
                                          {t.followUp}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                            {stage.covers?.length ? (
                              <div className="mt-4">
                                <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                  Also covered
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {stage.covers.map((c) => (
                                    <span
                                      key={c}
                                      className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-foreground/80"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Footer CTA tile */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-card p-6 text-center md:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gradient-brand md:tracking-[0.2em]">
              Strategic Foundation Workshop
            </p>
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
              One morning in. Business out.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Idea in at 8:45 AM. By 11:30 you leave with your offer priced, your first customer named, your first channel open, and outreach ready to send that afternoon — worked out with Adam, not generated by a bot.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                Reserve your seat <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
