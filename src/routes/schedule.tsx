import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { SCHEDULE, EVENT } from "@/lib/schedule-data";
import { STAGES } from "@/lib/curriculum-data";
import { ArrowRight, Coffee, Check, Clock } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — Atlanta Startup Workshop" },
      {
        name: "description",
        content:
          "The full 8 AM – 4:30 PM curriculum: form, customer, offer, build, brand, marketing, launch plan.",
      },
      { property: "og:title", content: "Schedule — Atlanta Startup Workshop" },
      {
        property: "og:description",
        content: "Hour-by-hour breakdown of the one-day workshop in Norcross, GA.",
      },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  // Scroll to #stage-N anchors when navigating from the home flow strip
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.location.hash.replace("#", "");
    if (id) {
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {EVENT.dateLabel} · {EVENT.timeLabel}
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            Idea in. <span className="text-gradient-brand">Launch plan out.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Six working hours. Each hour produces an asset the next one builds on. By 4 PM
            you have a formed business and a dated 30/60/90 launch plan.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <ol className="relative space-y-4 border-l border-white/10 pl-6">
            {SCHEDULE.map((s, i) => {
              const stage = s.stage ? STAGES[s.stage - 1] : null;
              return (
                <li
                  key={i}
                  id={stage ? `stage-${stage.n}` : undefined}
                  className="relative scroll-mt-24"
                >
                  <span
                    className={`absolute -left-[31px] top-3 inline-flex size-4 items-center justify-center rounded-full ${
                      s.kind === "break" ? "bg-white/20" : "bg-hero-gradient"
                    }`}
                  />
                  {s.kind === "break" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-transparent p-5">
                      <Coffee className="size-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {s.time} · {s.duration}
                        </div>
                        <div className="font-medium">{s.title}</div>
                        <div className="text-sm text-muted-foreground">{s.description}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/25 md:p-7">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {s.time}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {s.duration}
                        </span>
                        {stage && (
                          <span className="rounded-full bg-hero-gradient px-2.5 py-0.5 text-xs font-semibold text-white">
                            Stage {stage.n}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-2 text-muted-foreground">{s.description}</p>

                      {stage && (
                        <div className="mt-5 rounded-xl border border-white/10 bg-background/40 p-5">
                          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            3 essential tasks
                          </div>
                          <ul className="space-y-5">
                            {stage.tasks.map((t, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-[11px] font-semibold text-white">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-foreground">{t.title}</div>
                                  <div className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                                    <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
                                    <span>{t.deliverable}</span>
                                  </div>
                                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                    {t.details.map((d, di) => (
                                      <li key={di} className="flex items-start gap-2">
                                        <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-foreground/40" />
                                        <span>{d}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-block rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                      {t.tool}
                                    </span>
                                  </div>
                                  {t.followUp && (
                                    <div className="mt-2 flex items-start gap-1.5 rounded-md border border-dashed border-white/15 bg-white/[0.02] p-2.5 text-[12px] italic text-muted-foreground">
                                      <Clock className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
                                      <span>
                                        <span className="font-medium not-italic text-foreground/80">
                                          Take home:
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
                            <div className="mt-5 border-t border-white/10 pt-4">
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
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-16 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reserve your seat <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
