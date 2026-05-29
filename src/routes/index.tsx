import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { EVENT, FLOW_STAGES } from "@/lib/schedule-data";
import { BUSINESS_IDEAS, BUSINESS_CATEGORIES, type BusinessCategory, type BusinessIdea } from "@/lib/business-ideas";
import { MapPin, Calendar, Users, ArrowRight, Award, FileCheck2, Target, Globe2, Rocket, X, Check, Clock, Laptop, Store, Wrench, ChefHat, Sun, Home as HomeIcon, Sparkles, DollarSign, UserPlus, Zap, Hammer, Timer, AlertTriangle } from "lucide-react";

export const FACILITATOR_NAME = "Adam Anderson";
export const FACILITATOR_TITLE =
  "Serial entrepreneur · Co-Founder, OPEN Interactive · Has helped launch dozens of modern-economy businesses across tech, services, and Main Street.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlanta Startup Workshop — Walk in with an idea. Walk out a business owner." },
      {
        name: "description",
        content:
          "One working day in Norcross, GA. 20 seats. Led by a 30-year startup operator. By 4:30 PM you'll have a formed business, a website ready to publish, a complete creative kit, and a signed 30/60/90 launch plan.",
      },
      { property: "og:title", content: "Atlanta Startup Workshop — One day. One business." },
      {
        property: "og:description",
        content:
          "July 23, 2026 · IGNITE Center at Greater Atlanta Christian School, Norcross, GA. Seven hours, seven stages, one filing-ready business by dinner. Led by a 30-year startup operator.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <NotACourseBanner />
      <WalkInWalkOut />
      <TheArtOfThePossible />
      
      
      
      
      <FacilitatorSection />
      
      <VenueCard />
      <BottomCTA />
      <SiteFooter />
    </div>
  );
}

function NotACourseBanner() {
  return (
    <section className="relative bg-neutral-900">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-black/30" />

      <div className="relative container mx-auto px-6 py-8 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 md:max-w-3xl">
            <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <AlertTriangle className="size-5 text-white" />
            </span>
            <div>
              <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] font-semibold text-gradient-brand">
                Most workshops teach. This one builds.
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white/70 leading-tight md:text-xl">
                Walk in with an idea. Walk out with a built business.
              </h2>
              <p className="mt-2 text-sm text-white/55 leading-relaxed md:text-sm">
                Not a course, not a coaching session, and not DIY worksheets. In one focused day, you build the actual business — name, brand, website, offer, pricing, legal drafts, and launch plan — plus a short checklist for the few items only your signature can finish. You arrive with a spark. You leave with a company.
              </p>

            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end md:gap-2 md:shrink-0">
            <BannerChip icon={<Hammer className="size-3.5" />} label="Built in the room, not assigned as homework" />
            <BannerChip icon={<Timer className="size-3.5" />} label="Seven hours. One founder. One business." />
            <BannerChip icon={<Check className="size-3.5" />} label="Real deliverables + a one-page finish list" />

          </div>
        </div>
      </div>
    </section>
  );
}

function BannerChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur">
      {icon}
      {label}
    </span>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-90" />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-white/80">
          One day. One founder. One real, revenue-ready business.
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
          Walk in with an idea. <br />
          Walk out <span className="italic">with a business built to earn</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/90">
          Seven focused hours at the IGNITE Center in Norcross, GA.{" "}
          <span className="font-medium text-white">
            You bring the idea — even a rough one. We build <em>your</em> business, not a template.
          </span>{" "}
          By 4:30 PM you'll have a business formed and filing-ready, a simple way to deliver it,
          a website ready to publish, your full marketing kit, and a 90-day plan with
          your next ten moves already on the calendar.
        </p>
        <p className="mt-4 max-w-2xl text-base text-white/85">
          The fastest path we know from idea to a viable, profit-ready business — in one
          focused day, with paying customers in the 90-day plan you take home.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Claim one of 20 seats <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            See the 7-hour flow
          </Link>
        </div>
        <div className="mt-12 grid max-w-3xl grid-cols-1 gap-4 text-white/90 sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={<Calendar className="size-4" />} label={EVENT.dateLabel} />
          <Meta icon={<MapPin className="size-4" />} label="IGNITE Center · Greater Atlanta Christian School" />
          <Meta icon={<Users className="size-4" />} label={`${EVENT.capacity} seats`} />
          <Meta icon={<Award className="size-4" />} label="30-year startup operator" />
        </div>
      </div>
    </section>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm backdrop-blur">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function FlowStrip() {
  return (
    <section id="flow-stages" className="border-y border-white/5 py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          The day, hour by hour
        </h2>
        <p className="mb-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Seven stages. One working day.{" "}
          <span className="text-gradient-brand">A business built to make money — not just one that exists.</span>
        </p>
        <p className="mb-12 max-w-2xl text-base text-muted-foreground md:text-lg">
          What's finished in the room — and the exact handful of things you'll file, host, or configure after.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FLOW_STAGES.map((s) => (
            <Link
              key={s.slug}
              to="/schedule"
              hash={`stage-${s.n}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/25"
            >
              <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                {s.n}
              </div>
              <div className="text-lg font-semibold capitalize tracking-tight">{s.title}</div>

              <div className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Done in the room
              </div>
              <ul className="mt-2 space-y-1.5">
                {s.walkOut.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-foreground/90">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {s.afterWorkshop.length > 0 ? (
                <>
                  <div className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    You finish at home
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {s.afterWorkshop.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] italic leading-snug text-muted-foreground">
                        <Clock className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="mt-5 text-[11px] uppercase tracking-[0.18em] text-foreground/70">
                  Nothing left for home — this stage is done.
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FacilitatorSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-10 rounded-3xl border border-white/10 bg-card p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-hero-gradient">
            <div
              className="absolute inset-0 mix-blend-overlay opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <Award className="mb-3 size-6 opacity-80" />
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">
                Your facilitator
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-white/15 text-lg font-semibold backdrop-blur">
                  AA
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">
                    {FACILITATOR_NAME}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] opacity-80">
                    Serial Entrepreneur · Operator · Builder
                  </div>
                </div>
              </div>
              <div className="mt-4 text-base leading-snug opacity-95">
                30 years of starting businesses. One day with yours.
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Who's in the room with you
            </h2>
            <p className="text-3xl font-semibold tracking-tight md:text-4xl">
              {FACILITATOR_NAME} —{" "}
              <span className="text-gradient-brand">at your table for the day.</span>
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">
              {FACILITATOR_TITLE}
            </p>
            <p className="mt-5 text-muted-foreground">
              Adam is a serial entrepreneur who has personally started multiple companies
              and helped launch dozens more — the kind of lean, modern businesses people
              are actually building in 2026: online services, AI-powered shops,
              productized expertise, and Main Street operators. Along the way he's
              shipped work for Citigroup, Mayo Clinic, 3M, and Disney, built full
              digital systems for a Caribbean country's government, and spent five years
              producing one of the region's biggest business summits.
            </p>
            <p className="mt-3 text-muted-foreground">
              He's sat in your seat — more than once. He knows exactly what it takes to
              go from a half-formed idea to a business that actually opens its doors.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <TagChip>Helped launch dozens of modern businesses</TagChip>
              <TagChip>Built for Fortune 500 companies</TagChip>
              <TagChip>Built systems for a whole country</TagChip>
              <TagChip>Produced 5 major business summits</TagChip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/85">
      {children}
    </span>
  );
}

const PROOF_ROWS = [
  {
    n: 1,
    stage: "Form",
    deliverable: "Your business, formed and filing-ready.",
    proof:
      "Started two of his own companies (Florida in 2009, Caribbean in 2014). Knows the paperwork inside out.",
  },
  {
    n: 2,
    stage: "Customer & offer",
    deliverable: "An offer real people will pay for.",
    proof:
      "18 years selling work to Fortune 500 buyers and government teams. Knows what makes a buyer say yes.",
  },
  {
    n: 3,
    stage: "Market & positioning",
    deliverable: "A clear story of who you help and why you're different.",
    proof:
      "Wrote the national story for a Caribbean country's investor program. Advised on its pavilion at Expo 2020 Dubai.",
  },
  {
    n: 4,
    stage: "Build your first version",
    deliverable: "A simple, working way to deliver to your first customer.",
    proof:
      "Built a whole country's government websites, tax portal, and case-management system from scratch.",
  },
  {
    n: 5,
    stage: "Brand & website",
    deliverable: "A brand kit and a website ready to publish.",
    proof:
      "Designed Mayo Clinic and 3M brand experiences seen by thousands of visitors. Published a national magazine.",
  },
  {
    n: 6,
    stage: "Marketing plan & creatives",
    deliverable:
      "Your business card, flyer, social profiles, 6 posts, and a video script — ready to print and post.",
    proof:
      "Ran PR, ads, and crisis messaging — including COVID-19 public-service campaigns for a national Ministry of Health.",
  },
  {
    n: 7,
    stage: "Launch plan",
    deliverable: "A signed 90-day plan with your next 10 moves already on the calendar.",
    proof:
      "Ran five major investor summits start-to-finish. Knows how to take a plan from paper to launch day.",
  },
];

function FacilitatorProof() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Proof, not promises
        </h2>
        <p className="mb-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Your facilitator has{" "}
          <span className="text-gradient-brand">actually built every stage</span> you'll
          work through.
        </p>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Every stage of your day matches something Adam has actually built and shipped.
          You'll be coached on the real moves — by someone who's made them.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {PROOF_ROWS.map((r) => (
            <div
              key={r.n}
              className="rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                  {r.n}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Stage {r.n} · {r.stage}
                </div>
              </div>
              <div className="mt-4 text-lg font-semibold leading-snug">
                {r.deliverable}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.proof}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-lg text-foreground/90 md:text-xl">
          You're not getting a coach with a slideshow. You're getting someone who's
          <span className="text-gradient-brand">
            {" "}built the business, shipped the website, designed the brand, and run
            the launch
          </span>{" "}
          — sitting at your table, helping you do the same.
        </p>
      </div>
    </section>
  );
}


function WalkInWalkOut() {
  const walkIn = [
    "An idea you've been turning over for months (or years)",
    "A notebook full of \"someday\" notes",
    "Questions about LLCs, EINs, websites, pricing, and where to even start",
    "No clear first customer",
    "No structure, no kit, no plan you can actually follow Monday morning",
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          The transformation
        </h2>
        <p className="mb-10 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          What changes between{" "}
          <span className="text-gradient-brand">8:00 AM and 4:30 PM</span>.
        </p>
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-white/10 bg-card/50 p-7 md:p-8">
            <div className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              8:00 AM
            </div>
            <div className="text-2xl font-semibold tracking-tight text-foreground/80">
              What you walk in with
            </div>
            <ul className="mt-6 space-y-3">
              {walkIn.map((i) => (
                <li key={i} className="flex items-start gap-3 text-foreground/70">
                  <X className="mt-1 size-4 shrink-0 text-foreground/40" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-card p-7 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-[0.08]" />
            <div className="relative">
              <div className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                4:30 PM
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                <span className="text-gradient-brand">What you walk out with</span>
              </div>
              <div className="mt-6 space-y-7">
                {WALKOUT_PHASES.map((p, idx) => (
                  <div
                    key={p.n}
                    className={
                      idx === 0
                        ? ""
                        : "border-t border-white/10 pt-7"
                    }
                  >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Phase {p.n}
                    </div>
                    <h3 className="mt-1 text-base font-semibold tracking-tight">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      {p.intro}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {p.items.map((g) => (
                        <li key={g.name} className="flex items-start gap-3">
                          <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">
                              {g.name}
                            </div>
                            <div className="text-[12px] leading-snug text-muted-foreground">
                              {g.desc}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function ValueByTheNumbers() {
  const stats: { n: string; label: string }[] = [
    { n: "1", label: "filing-ready business" },
    { n: "9", label: "concrete take-home pieces" },
    { n: "25", label: "revenue prospects on your launch list" },
    { n: "90", label: "days mapped, signed, and dated" },
  ];
  return (
    <section className="pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-card p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-start gap-1 rounded-2xl px-4 py-4"
            >
              <div className="text-5xl font-semibold leading-none tracking-tight md:text-6xl">
                <span className="text-gradient-brand">{s.n}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



function VenueCard() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-card p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.05fr_1fr]">
            <div>
              <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Where it happens
              </h2>
              <p className="text-3xl font-semibold tracking-tight md:text-4xl">
                {EVENT.venueName}
              </p>
              <p className="mt-3 text-muted-foreground">{EVENT.address}</p>
              <p className="mt-1 text-muted-foreground">
                {EVENT.dateLabel} · {EVENT.timeLabel}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <TagChip>Free on-site parking</TagChip>
                <TagChip>{EVENT.capacity} seats</TagChip>
                <TagChip>Small cohort · no audience</TagChip>
              </div>

              <div className="mt-7 flex flex-wrap items-start gap-3">
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
                >
                  <MapPin className="size-4" /> Get directions
                </a>

                <details className="group relative">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                    <Calendar className="size-4" /> Add to calendar
                    <ArrowRight className="size-3 rotate-90 transition-transform group-open:-rotate-90" />
                  </summary>
                  <div className="absolute left-0 z-10 mt-2 w-60 overflow-hidden rounded-2xl border border-white/15 bg-card shadow-xl">
                    <a
                      href={EVENT.googleCalendarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-3 text-sm transition-colors hover:bg-white/5"
                    >
                      Google Calendar
                    </a>
                    <a
                      href={EVENT.icsHref}
                      download={EVENT.icsFilename}
                      className="block border-t border-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/5"
                    >
                      Apple Calendar (.ics)
                    </a>
                    <a
                      href={EVENT.icsHref}
                      download={EVENT.icsFilename}
                      className="block border-t border-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/5"
                    >
                      Outlook (.ics)
                    </a>
                  </div>
                </details>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Reserve seat <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:aspect-auto md:min-h-[320px]">
              <iframe
                title={`Map of ${EVENT.venueName}`}
                aria-label={`Map of ${EVENT.venueName}`}
                src={EVENT.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero-gradient p-10 md:p-16">
          <div
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative max-w-3xl text-white">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Twenty seats. One date. One door from idea to business.
            </h2>
            <p className="mt-5 text-lg text-white/90">
              If you've been waiting for the right week to start earning, this is the day
              you stop waiting. Bring the idea. We'll bring the operator, the room, and
              every template you need to turn it into a business that actually brings in money.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-neutral-900 transition-opacity hover:opacity-90 hover:text-neutral-900"
              >
                Reserve your seat for July 23 <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORY_ICON: Record<BusinessCategory, typeof Laptop> = {
  online: Laptop,
  "main-street": Store,
  service: Wrench,
  food: ChefHat,
  side: Sun,
  family: HomeIcon,
};

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  online: "Online",
  "main-street": "Main Street",
  service: "Service",
  food: "Food & Hands",
  side: "Side hustle",
  family: "Family-run",
};

function IdeaCard({ idea }: { idea: BusinessIdea }) {
  const Icon = CATEGORY_ICON[idea.category];
  return (
    <article className="group relative flex w-[320px] shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_10px_40px_-15px_rgba(255,80,180,0.35)] md:w-[360px]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em]">
          <Icon className="size-3 text-foreground/70" />
          <span className="text-gradient-brand font-semibold">{CATEGORY_LABEL[idea.category]}</span>
        </span>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Monthly income potential
        </div>
        <div className="mt-0.5 text-2xl font-bold leading-tight tracking-tight">
          <span className="text-gradient-brand">{idea.incomePotential}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <DollarSign className="size-3" />
          {idea.startupCost}
        </div>
      </div>
      <h3 className="text-lg font-semibold leading-tight tracking-tight">{idea.name}</h3>
      <p className="text-sm text-foreground/80">{idea.offer}</p>
      <div className="mt-auto space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <UserPlus className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
          <span>
            <span className="text-foreground/80">First 10 from:</span> {idea.firstCustomers}
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-foreground/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" />
          <span className="text-gradient-brand font-medium">{idea.stageHint}</span>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ ideas, direction }: { ideas: BusinessIdea[]; direction: "left" | "right" }) {
  if (ideas.length === 0) return null;
  // Duplicate the row so the loop seams seamlessly.
  const doubled = [...ideas, ...ideas];
  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div
        className={`marquee-track flex w-max gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
      >
        {doubled.map((idea, i) => (
          <IdeaCard key={`${idea.name}-${i}`} idea={idea} />
        ))}
      </div>
    </div>
  );
}

function MobileScroller({ ideas }: { ideas: BusinessIdea[] }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-4 snap-x snap-mandatory">
        {ideas.map((idea) => (
          <div key={idea.name} className="snap-start">
            <IdeaCard idea={idea} />
          </div>
        ))}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TheArtOfThePossible() {
  const [active, setActive] = useState<BusinessCategory | "all">("all");
  // Client-only seed bumps on mount + filter change so SSR/CSR markup matches first,
  // then we reshuffle in the browser (no hydration mismatch).
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed((s) => s + 1);
  }, [active]);

  const filtered = useMemo(() => {
    const base = active === "all" ? BUSINESS_IDEAS : BUSINESS_IDEAS.filter((i) => i.category === active);
    return seed === 0 ? base : shuffle(base);
  }, [active, seed]);

  const rowA = filtered.filter((_, i) => i % 2 === 0);
  const rowB = filtered.filter((_, i) => i % 2 === 1);

  return (
    <section className="border-y border-white/5 py-20">
      <div className="mx-auto mb-10 max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          What others are starting in 2026
        </h2>
        <p className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
          Proof, not a menu.{" "}
          <span className="text-gradient-brand">
            These are the kinds of businesses real people are launching in 2026 —
            online, on a street corner, out of a kitchen, off a phone, or built around AI.
          </span>
        </p>
        <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
          Scroll through for inspiration.{" "}
          <span className="font-medium text-foreground">
            Yours doesn't have to be on this list — it shouldn't be.
          </span>{" "}
          You walk in with your idea, and we build the business around it using the
          same seven stages — so you leave with a formed business and a 90-day plan
          you can run on Monday.
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground/80 md:text-sm">
          Income ranges are realistic year-one numbers for a solo operator who works
          the seven-stage plan. What you make will depend on your hours, your prices,
          and how many customers you keep.
        </p>
        <div className="mt-8 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {BUSINESS_CATEGORIES.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${
                  isActive
                    ? "border-transparent bg-hero-gradient text-white shadow-[0_8px_24px_-12px_rgba(255,80,180,0.6)]"
                    : "border-white/15 bg-white/[0.02] text-foreground/80 hover:border-white/30 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop / tablet: two auto-scrolling rows */}
      <div className="hidden space-y-4 md:block">
        <MarqueeRow ideas={rowA} direction="left" />
        <MarqueeRow ideas={rowB} direction="right" />
      </div>

      {/* Mobile: swipe rail */}
      <div className="md:hidden">
        <MobileScroller ideas={filtered} />
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-6">
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 md:p-8">
          <p className="text-lg md:text-xl">
            Whether your idea looks like one of these or nothing like them,{" "}
            <span className="text-gradient-brand font-semibold">it gets built the same way</span> —
            the same seven stages, in one day, in this room.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-hero-gradient px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Save your seat — only {EVENT.capacity} spots <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type WalkoutItem = { name: string; desc: string };
type WalkoutPhase = { n: number; title: string; intro: string; items: WalkoutItem[] };

const WALKOUT_PHASES: WalkoutPhase[] = [
  {
    n: 1,
    title: "Foundation — legally yours, ready to sell",
    intro: "By lunch, your business legally exists and has a buyer in mind.",
    items: [
      { name: "Georgia LLC filing packet", desc: "Articles pre-filled, registered agent set, EIN application ready — submit Monday." },
      { name: "Signed legal kit", desc: "Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business." },
      { name: "Your first customer profile", desc: "One named buyer, their problems priced in dollars, and where to find them." },
      { name: "25-name prospect list + outreach script", desc: "A CSV you can start messaging tonight." },
      { name: "Competitive research pack", desc: "Three competitors compared on offer, price, and positioning, with sourced customer quotes and a one-page 'what makes you different' summary." },
    ],
  },
  {
    n: 2,
    title: "Offer & build — what you sell, how you deliver",
    intro: "By mid-afternoon, the offer is locked, priced, and rehearsed.",
    items: [
      { name: "One-sentence offer", desc: "The line you'll use on your website, in pitches, and in DMs." },
      { name: "Pricing sheet + break-even number", desc: "Real costs, real margin, and the exact number of sales to break even." },
      { name: "Delivery map", desc: "Your business mapped sale-to-happy-customer, with the app you'll use at each step." },
      { name: "Free-app stack set up", desc: "Project hub, files, scheduling, comms — accounts created in your name." },
      { name: "First customer's deliverable", desc: "Drafted and rehearsed end-to-end with a 5-point quality checklist." },
      { name: "Operations & workflow", desc: "Three SOPs — intake, fulfillment, customer onboarding — loaded into your project hub, plus a one-page weekly operating rhythm." },
      { name: "Funding model & 12-month runway", desc: "Real costs, margins, break-even, and a 12-month cash picture you can defend to a lender or investor." },
    ],
  },
  {
    n: 3,
    title: "Brand, marketing & launch — everything ready to go live",
    intro: "By the end of the day, you have a bespoke website, a printable brand kit, and a 90-day plan.",
    items: [
      { name: "Brand identity", desc: "Logo, color palette, and font pairing generated from your business name." },
      { name: "A bespoke website", desc: "Home, Offer, About, and Contact pages built in your brand kit, written in your voice, SEO-configured — ready to host." },
      { name: "Payments, business email & analytics", desc: "Stripe, email-on-domain, and GA4 set up and queued for one-click activation." },
      { name: "Printable business card + flyer", desc: "Designed in your brand and ready to send to a printer." },
      { name: "Social channels claimed and branded", desc: "Profile copy, link-in-bio, banner — ready to configure on Instagram, LinkedIn, and one more." },
      { name: "6 on-brand posts + 60-second video script", desc: "Ready to publish and record this week." },
      { name: "Marketing & communications", desc: "Audience, channels, messaging pillars, and a 30-day content calendar mapped to the posts and video script you're leaving with." },
      { name: "Go-to-market", desc: "Launch sequence with target segment, offer, pricing, channel mix, week-by-week tactics, and the KPIs that prove it's working." },
      { name: "Investor-ready pitch deck", desc: "10-slide deck — problem, solution, market, offer, traction, model, GTM, team, ask, use of funds — in your brand." },
      { name: "Fundraising kit", desc: "One-page raise summary, funder outreach plan with email template, and a path picked across grants, microloans, SBA, and friends-and-family." },
      { name: "Signed 90-day plan + launch-day kit", desc: "Dated 30/60/90 plan, personal outreach drafts, starter CRM, accountability partner on the calendar." },
    ],
  },
];



