import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { BUILD_WORKSHOPS } from "@/lib/build-workshops";
import { getUpcomingSessions } from "@/lib/build-workshop-schedule";
import { useDocumentTitle } from "@/lib/use-document-title";

import { ArrowRight, Sparkles, CalendarDays } from "lucide-react";

export default function BuildIndexPage() {
  useDocumentTitle(
    "Build workshops — eight focused mornings, one real piece of your startup each",
    "Come spend one focused morning with us and walk out with one real piece of your startup actually built — brand live, site live, follow-ups running. Sessions from $197."
  );
  return (
    <div className="public-surface min-h-screen">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="public-container px-6 py-10 md:py-14">
          <div className="mb-10 flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Issue No. 02 &mdash; The Workshops
            </div>
            <div className="text-sm italic text-muted-foreground">
              Eight focused mornings · from $197
            </div>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
            <div className="md:col-span-7 lg:col-span-8">
              <h1 className="public-display">
                Actually built. <span className="italic text-primary">Live by lunch.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                One focused morning. One real piece of your startup &mdash; your brand shipped, your website live, your sales copy in the page, your follow-up emails sending, your tools running &mdash; built with you and live before lunch. Not notes about it. The thing itself. No retainer. No waiting on an agency.
              </p>
              <Link
                to="/calendar"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline md:text-base"
              >
                <CalendarDays className="size-4" aria-hidden="true" /> See all dates across every workshop
              </Link>
            </div>
            <div className="md:col-span-5 lg:col-span-4">
              <div className="border border-border bg-card p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  How it goes
                </p>
                <ul className="mt-4 space-y-3 text-sm text-foreground">
                  <li>&bull; Show up with your idea</li>
                  <li>&bull; We build the real thing together</li>
                  <li>&bull; You walk out with it live</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="py-16 md:py-24">
        <div className="public-container px-6">
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
                  <h2 className="public-heading">
                    {w.title}
                  </h2>
                  <p className="mt-2 font-serif text-sm italic text-muted-foreground md:text-base">
                    {w.oneLiner}
                  </p>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      What actually gets built
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
              Rather we implement it?
            </p>
            <h2 className="public-heading">
              Same team. We'll implement it for you.
            </h2>
            <p className="mt-4 text-base opacity-90 md:text-lg">
              If your mornings are full — or you'd rather hand the whole thing over — Adam's team will implement the brand, website, follow-ups, and tools from the foundation. Real assets, live. Same crew that runs the workshops. Same care.
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
