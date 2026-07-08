import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { BUILD_WORKSHOPS } from "@/lib/build-workshops";
import { getUpcomingSessions } from "@/lib/build-workshop-schedule";

import { ArrowRight, Sparkles, CalendarDays } from "lucide-react";

export default function BuildIndexPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            <Sparkles className="size-3.5" /> The 14-Day Launch Method · 8 Working Sessions with Adam
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Launched already?{" "}
            <span className="text-gradient-brand">Scale it with The 14-Day Pivot Method — one morning at a time.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Old way: hire a $10k/month agency, wait a quarter, hope the retainer earns its keep. New way: eight half-day working sessions with Adam — <span className="text-foreground">$197 each</span> — extending the done-with-you method behind The 14-Day Launch Method. One morning, one layer, live by lunch. Brand. A site that converts. Content engine. Sales script. Automations. Ship each one yourself with Adam in the room, or hand it to the team that would otherwise bill you $5K+ for the same work.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {BUILD_WORKSHOPS.map((w) => {
              const Icon = w.icon;
              const upcoming = getUpcomingSessions(w.slug, new Date(), 3);
              return (
                <Link
                  key={w.slug}
                  to={`/build/${w.slug}`}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-primary/40 md:p-8"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Icon className="size-6 text-primary" />
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                      Workshop · {w.priceLabel}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {w.title}
                  </h2>
                  <p className="mt-2 font-serif text-sm italic text-muted-foreground md:text-base">
                    {w.oneLiner}
                  </p>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      You'll walk out with
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      {w.walkOuts.slice(0, 3).map((d) => (
                        <li key={d} className="text-muted-foreground">
                          · {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {upcoming.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <CalendarDays className="size-3.5" /> Upcoming dates
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {upcoming.map((s) => (
                          <li key={s.startISO} className="text-muted-foreground">
                            <span className="text-foreground">{s.dateLabel}</span>
                            <span className="mx-1.5 opacity-40">·</span>
                            {s.timeLabel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Learn more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] opacity-80 md:text-sm md:tracking-[0.2em]">
              Want it all done for you instead?
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Skip the learning curve. Hand it to our team.
            </h2>
            <p className="mt-4 text-base opacity-90 md:text-lg">
              Same crew that runs The 14-Day Launch Method live, using the exact playbook and tool stack we teach in the room. We'll build the brand, the website, the systems, and the engines — so you can stay focused on customers.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/services"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90 sm:w-auto"
              >
                See agency services <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Start with the foundation workshop
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
