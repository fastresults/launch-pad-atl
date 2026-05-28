import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { SCHEDULE, EVENT } from "@/lib/schedule-data";
import { ArrowRight, Coffee } from "lucide-react";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — Atlanta Startup Workshop" },
      {
        name: "description",
        content: "The full 9 AM – 4 PM flow: ideate, plan, develop, launch, grow, next steps.",
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
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {EVENT.dateLabel} · {EVENT.timeLabel}
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            The <span className="text-gradient-brand">six-hour</span> flow.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Every block builds on the last. By the end of the day, your business is live.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <ol className="relative space-y-4 border-l border-white/10 pl-6">
            {SCHEDULE.map((s, i) => (
              <li key={i} className="relative">
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
                  <div className="rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/25">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {s.time}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {s.duration}
                      </span>
                      {s.stage !== undefined && (
                        <span className="rounded-full bg-hero-gradient px-2.5 py-0.5 text-xs font-semibold text-white">
                          Stage {s.stage}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-muted-foreground">{s.description}</p>
                    {s.tools && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {s.tools.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
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
