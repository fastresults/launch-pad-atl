import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { EVENT, FLOW_STAGES } from "@/lib/schedule-data";
import { MapPin, Calendar, Users, ArrowRight, Award, FileCheck2, Target, Globe2, Rocket, X, Check } from "lucide-react";

export const FACILITATOR_NAME = "Adam Anderson";
export const FACILITATOR_TITLE =
  "Co-Founder, OPEN Interactive · 18+ years building for Fortune 500 companies, a country's government, and first-time founders.";

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
          "July 23, 2026 · Norcross, GA. Seven hours, seven stages, one real business by dinner. Led by a 30-year startup operator.",
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
      <WalkInWalkOut />
      <FlowStrip />
      <WhatYouLeaveWith />
      <ValueByTheNumbers />
      <FacilitatorSection />
      <FacilitatorProof />
      <VenueCard />
      <BottomCTA />
      <SiteFooter />
    </div>
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
          One day. One founder. One real business.
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
          Walk in with an idea. <br />
          Walk out <span className="italic">a business owner</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/90">
          Seven focused hours in Norcross, GA. By 4:30 PM you'll have a real business on
          paper, a simple way to deliver it, a website ready to publish, your full
          marketing kit, and a 90-day plan with your next ten moves already on the
          calendar.
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
          <Meta icon={<MapPin className="size-4" />} label="Norcross, GA" />
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
    <section className="border-y border-white/5 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          The day, hour by hour
        </h2>
        <p className="mb-12 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Seven stages. One working day.{" "}
          <span className="text-gradient-brand">A business that exists by dinner.</span>
        </p>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {FLOW_STAGES.map((s) => (
            <Link
              key={s.slug}
              to="/schedule"
              hash={`stage-${s.n}`}
              className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/25"
            >
              <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                {s.n}
              </div>
              <div className="text-base font-medium capitalize">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
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
                    Operator · Producer · Builder
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
              Adam has spent 18+ years building real things for real customers — websites
              and apps for big companies like Citigroup, Mayo Clinic, 3M, and Disney; full
              digital systems for a Caribbean country's government; and a five-year run
              producing one of the region's biggest business summits.
            </p>
            <p className="mt-3 text-muted-foreground">
              He's sat in your seat. He knows what it takes to go from idea to a business
              that actually opens its doors.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip>Built for Fortune 500 companies</Chip>
              <Chip>Built systems for a whole country</Chip>
              <Chip>Produced 5 major business summits</Chip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
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
    deliverable: "Your business, legally on paper.",
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


function Deliverables() {
  const items = [
    "A beachhead customer profile with named pains and dollar costs — the page that ends “I think they'll buy” forever.",
    "A filing-ready GA LLC packet, EIN in hand, and a legal kit drafted to your business.",
    "An operational V1 workflow — the exact way you'll deliver to your first paying customer next week.",
    "A domain in your cart, a brand kit folder, and a website drafted page-by-page in your builder.",
    "A complete creative kit — business card, flyer, social profiles, 6 posts, and a video script — ready for the printer and the scheduler.",
    "A 25-name announcement list with 10 personalized outreach messages already written.",
    "A signed, dated 30/60/90 plan with three weekly metrics and an accountability partner locked in.",
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          What you carry out the door
        </h2>
        <p className="mb-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Not slides. Not theory.{" "}
          <span className="text-gradient-brand">Artifacts a customer can touch.</span>
        </p>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Every stage produces something a printer can run, a calendar can hold, or a
          customer can sign. You'll leave with a stack of them.
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-card p-4"
            >
              <span className="mt-1 inline-block size-2 shrink-0 rounded-full bg-hero-gradient" />
              <span className="text-foreground">{i}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VenueCard() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-card">
          <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
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
              <p className="mt-4 text-sm text-foreground/80">
                Small cohort by design — 20 founders, one operator, no audience.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
                >
                  <MapPin className="size-4" /> Open in maps
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Reserve seat <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-hero-gradient">
              <div
                className="absolute inset-0 mix-blend-overlay opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div className="relative flex h-full flex-col justify-end p-6 text-white">
                <div className="text-sm uppercase tracking-[0.2em] opacity-80">Capacity</div>
                <div className="text-5xl font-semibold">{EVENT.capacity} seats</div>
                <div className="mt-1 text-sm opacity-80">Small cohort, high attention.</div>
              </div>
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
              If you've been waiting for the right week to start, this is the day you stop
              waiting. Bring the idea. We'll bring the operator, the room, and every
              template you need.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-foreground transition-opacity hover:opacity-90"
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
