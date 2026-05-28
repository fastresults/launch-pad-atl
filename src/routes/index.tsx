import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { EVENT, FLOW_STAGES } from "@/lib/schedule-data";
import { BUSINESS_IDEAS, BUSINESS_CATEGORIES, type BusinessCategory, type BusinessIdea } from "@/lib/business-ideas";
import { MapPin, Calendar, Users, ArrowRight, Award, FileCheck2, Target, Globe2, Rocket, X, Check, Laptop, Store, Wrench, ChefHat, Sun, Home as HomeIcon, Sparkles, DollarSign, UserPlus } from "lucide-react";

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
          "July 23, 2026 · IGNITE Center at Greater Atlanta Christian School, Norcross, GA. Seven hours, seven stages, one real business by dinner. Led by a 30-year startup operator.",
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
      <TheArtOfThePossible />
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
          Seven focused hours at the IGNITE Center in Norcross, GA.{" "}
          <span className="font-medium text-white">
            You bring the idea — even a rough one. We build <em>your</em> business, not a template.
          </span>{" "}
          By 4:30 PM you'll have a real business on paper, a simple way to deliver it,
          a website ready to publish, your full marketing kit, and a 90-day plan with
          your next ten moves already on the calendar.
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


function WalkInWalkOut() {
  const walkIn = [
    "An idea you've been turning over for months (or years)",
    "A notebook full of \"someday\" notes",
    "Questions about LLCs, EINs, websites, pricing, and where to even start",
    "No clear first customer",
    "No structure, no kit, no plan you can actually follow Monday morning",
  ];
  const walkOut = [
    "A real business on paper — name, structure, EIN in hand, Georgia LLC packet ready to file",
    "A one-page profile of your first paying customer, in their words, with the dollar cost of their problem",
    "An offer written in one sentence that a buyer can say yes or no to",
    "The step-by-step way you'll deliver to that first customer next week",
    "A brand kit folder (logo, colors, fonts) and a website drafted page by page in your builder",
    "Your full marketing kit — business card, flyer, social profiles, 6 posts, and a 60-second video script",
    "A 25-name list of people to tell first, plus 10 personal messages already written for you to send",
    "A signed, dated 90-day plan with your first 3 customers → 10 → repeatable channel mapped out",
    "An accountability partner and a weekly check-in already on the calendar",
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
              <ul className="mt-6 space-y-3">
                {walkOut.map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-hero-gradient">
                      <Check className="size-3 text-white" />
                    </span>
                    <span className="text-foreground">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Bucket = {
  icon: React.ReactNode;
  title: string;
  subhead: string;
  items: string[];
};

function WhatYouLeaveWith() {
  const buckets: Bucket[] = [
    {
      icon: <FileCheck2 className="size-5 text-white" />,
      title: "The Business",
      subhead: "Filed, registered, legal — not a wish list.",
      items: [
        "Georgia LLC packet ready to file + EIN in hand",
        "Terms of service, privacy policy, and a 1-page service agreement drafted to your business",
        "Business bank application checklist completed",
      ],
    },
    {
      icon: <Target className="size-5 text-white" />,
      title: "The Customer & The Offer",
      subhead: "Someone real, ready to buy something specific.",
      items: [
        "One-page profile of your first paying customer with the dollar cost of their problem",
        "Your offer written in one clear sentence",
        "Pricing sheet + how many sales it takes to cover your costs",
      ],
    },
    {
      icon: <Globe2 className="size-5 text-white" />,
      title: "The Brand & The Website",
      subhead: "A business people can find, recognize, and trust.",
      items: [
        "Domain in your cart + brand kit folder (logo, colors, fonts)",
        "Home and Offer pages drafted in your website builder, About and Contact outlined",
        "Payments, business email, and analytics setup checklists ready to finish at home",
      ],
    },
    {
      icon: <Rocket className="size-5 text-white" />,
      title: "The Launch Plan",
      subhead: "Monday morning, you know exactly what to do.",
      items: [
        "Your full marketing kit (card, flyer, social profiles, 6 posts, 60-second video script)",
        "25-name announcement list + 10 personal outreach messages already written",
        "Signed, dated 90-day plan with 3 weekly numbers and an accountability partner locked in",
      ],
    },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          What you take home
        </h2>
        <p className="mb-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Not slides. Not theory.{" "}
          <span className="text-gradient-brand">
            A complete starter kit you can hold, send, and sign.
          </span>
        </p>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Every stage makes something a printer can print, a calendar can hold, or a
          customer can sign. You'll leave with a stack of them, organized into four
          packs.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          {buckets.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-white/25 md:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-hero-gradient">
                  {b.icon}
                </span>
                <div>
                  <div className="text-lg font-semibold tracking-tight">{b.title}</div>
                  <div className="text-sm text-muted-foreground">{b.subhead}</div>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {b.items.map((it) => (
                  <li
                    key={it}
                    className="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-hero-gradient" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-base text-muted-foreground md:text-lg">
          Print this list. Cross items off Monday. By Friday, you have a business.
        </p>
      </div>
    </section>
  );
}

function ValueByTheNumbers() {
  const stats: { n: string; label: string }[] = [
    { n: "1", label: "real business formed" },
    { n: "9", label: "concrete take-home pieces" },
    { n: "25", label: "prospects on your launch list" },
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
            <a
              href="#flow-stages"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium transition-colors hover:border-white/40"
            >
              See the seven stages <ArrowRight className="size-4" />
            </a>
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
