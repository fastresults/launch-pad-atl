import { Link } from "react-router-dom";
import { ArrowRight, Calendar, HelpCircle, Sparkles } from "lucide-react";
import { getBuildWorkshop, getWorkshopAgencyOffer } from "@/lib/build-workshops";
import { getUpcomingSessions } from "@/lib/build-workshop-schedule";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";
import {
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/** Every remaining session for this workshop, each one bookable from here. */
export function WorkshopDates({ workshop }: { workshop: CatalogWorkshop }) {
  const upcoming = getUpcomingSessions(workshop.slug, new Date(), 12);
  if (upcoming.length === 0) return null;

  return (
    <SectionShell tinted>
      <SectionEyebrow icon={Calendar}>Upcoming dates · {workshop.title}</SectionEyebrow>
      <SectionHeading lead={`${workshop.title} —`} emphasis="pick your session." />
      <p className="mt-3 text-sm text-muted-foreground md:text-base">
        <Link to="/calendar" className="text-primary hover:underline">
          See all dates across every workshop
        </Link>
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {upcoming.map((s) => (
          <li
            key={s.startISO}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card px-5 py-4"
          >
            <div>
              <div className="sl-date-eyebrow mb-1 text-xs uppercase tracking-[0.16em]">
                {workshop.title}
              </div>
              <div className="text-base font-medium tracking-tight">{s.dateLabel}</div>
              <div className="text-sm text-muted-foreground">{s.timeLabel}</div>
            </div>
            <Link
              to={`/register?workshop=${workshop.slug}&date=${encodeURIComponent(s.startISO)}`}
              className="sl-date-reserve inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors md:text-sm"
            >
              Reserve <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

/** The same escape hatch the full workshop page offers: hand it to us instead. */
export function WorkshopAgencyOffer({ workshop }: { workshop: CatalogWorkshop }) {
  const w = getBuildWorkshop(workshop.slug);
  const offer = getWorkshopAgencyOffer(workshop.slug);
  if (!w || !offer) return null;

  return (
    <SectionShell tinted>
      <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] opacity-80 md:text-sm md:tracking-[0.2em]">
          <Sparkles className="mr-1 inline size-3.5" aria-hidden="true" /> Or have us build it for you
        </p>
        <h2 className="public-heading">{offer.name}</h2>
        <p className="mt-3 text-base opacity-95 md:text-lg">{offer.tagline}</p>
        <p className="mt-6 text-sm uppercase tracking-[0.18em] opacity-80">{offer.priceLabel}</p>
        <p className="mt-3 max-w-2xl text-sm opacity-90 md:text-base">
          The morning workshop hands you everything you need to ship this piece yourself. If you'd
          rather hand it over instead, we'll credit your {w.priceLabel} back on any project over
          $1,000.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            to={offer.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90 sm:w-auto"
          >
            Book a call <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to={`/register?workshop=${w.slug}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            Workshop first — {w.priceLabel}
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}

/** The questions people actually ask before they book this one. */
export function WorkshopFaq({ workshop }: { workshop: CatalogWorkshop }) {
  const w = getBuildWorkshop(workshop.slug);
  if (!w?.faq.length) return null;

  return (
    <SectionShell>
      <SectionEyebrow icon={HelpCircle} muted>
        Before you book
      </SectionEyebrow>
      <SectionHeading lead={w.sections.faqHeadline} />
      <div className="mt-10 space-y-4">
        {w.faq.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20 md:p-6"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-medium tracking-tight md:text-lg">
              {f.q}
              <ArrowRight
                className="mt-1 size-4 shrink-0 text-primary transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{f.a}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
