import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import heroBg from "@/assets/hero-bg.png";
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const FACILITATOR_NAME = "Adam Anderson";

export function HomeSelection() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <WhyDoingThis />
      <WhatYouWalkOut />
      <WhoWereLookingFor />
      <Timeline />
      <Facilitator />
      <BottomCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-background/60" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-32">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/85 md:text-sm md:tracking-[0.2em]">
          <Sparkles className="size-3.5" /> Atlanta · Inaugural Cohort · Invitation Only
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          Six Atlanta founders.{" "}
          <span className="italic">One day.</span>{" "}
          <span className="text-gradient-brand">Zero cost.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          We&rsquo;re new to Atlanta — and to launch right, we&rsquo;re hand-picking{" "}
          <span className="font-medium text-white">six startup founders</span> to attend a full-day
          build workshop on <span className="font-medium text-white">July 23, 2026</span> at the
          IGNITE Center in Norcross, GA. Tuition, materials, and lunch — fully covered. Selected
          founders walk out by 4:30 PM with a formed business, a website ready to publish, a full
          marketing kit, and a signed 90-day launch plan.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          Applications close <span className="font-medium text-white">July 8</span>. Selections
          announced <span className="font-medium text-white">July 15</span>.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Apply for a seat <ArrowRight className="size-4" />
          </Link>
          <a
            href="#deliverables"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            See what we&rsquo;ll build
          </a>
        </div>

        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 text-white/90 sm:grid-cols-2 lg:grid-cols-4 md:mt-12 md:gap-4">
          <Meta icon={<Calendar className="size-4" />} label="Thursday, July 23, 2026" />
          <Meta icon={<MapPin className="size-4" />} label="IGNITE Center · Norcross, GA" />
          <Meta icon={<Users className="size-4" />} label="6 founders selected" />
          <Meta icon={<Award className="size-4" />} label="Tuition fully covered" />
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

function WhyDoingThis() {
  return (
    <section className="border-y border-white/5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Why we&rsquo;re doing this
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We want six real Atlanta launches as our{" "}
          <span className="text-gradient-brand">proof of work</span>.
        </h2>
        <p className="mt-5 text-base text-muted-foreground md:text-lg">
          This is our inaugural Atlanta cohort. Instead of selling seats to introduce ourselves,
          we&rsquo;re investing in six founders directly — covering the full workshop, the
          deliverables, and the 90-day follow-through. In return, we get six real businesses we
          can point to. You get the fastest path we know from idea to a viable, profit-ready
          business, with nothing out of pocket for the workshop itself.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Hard costs after the day — state filing fees, hosting, subscriptions, and anything
          physical like space, equipment, or inventory — aren&rsquo;t covered. Everything we
          build together inside the room is.
        </p>
      </div>
    </section>
  );
}

const DELIVERABLES = [
  "Your business, formed and filing-ready",
  "An offer real people will pay for, with pricing",
  "A clear story of who you help and why you&rsquo;re different",
  "A simple, working way to deliver to your first customer",
  "A brand kit and a website ready to publish",
  "Business card, flyer, social profiles, 6 posts, video script",
  "A signed 90-day plan with your next 10 moves on the calendar",
];

function WhatYouWalkOut() {
  return (
    <section id="deliverables" className="py-12 md:py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          What you walk out with at 4:30 PM
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Not a course. Not coaching.{" "}
          <span className="text-gradient-brand">A built business.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {DELIVERABLES.map((d) => (
            <div key={d} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-card p-5">
              <Check className="mt-1 size-5 shrink-0 text-primary" />
              <p className="text-base text-foreground" dangerouslySetInnerHTML={{ __html: d }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CRITERIA = [
  {
    title: "Atlanta-based or relocating",
    body: "You&rsquo;re building in metro Atlanta — or moving here in the next 90 days.",
  },
  {
    title: "An idea or early traction",
    body: "You don&rsquo;t need revenue. You do need a real idea you&rsquo;ve been turning over.",
  },
  {
    title: "Coachable and decisive",
    body: "You&rsquo;ll make calls in the room — name, offer, pricing — and stick with them.",
  },
  {
    title: "Free on July 23",
    body: "You can commit the full day, in person, in Norcross. No half-attendance.",
  },
];

function WhoWereLookingFor() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Who we&rsquo;re looking for
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Six founders ready to{" "}
          <span className="text-gradient-brand">leave with a real business</span> — not a deck.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CRITERIA.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-card p-6">
              <Target className="mb-3 size-5 text-primary" />
              <div className="text-lg font-semibold tracking-tight">{c.title}</div>
              <p className="mt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: c.body }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { label: "Applications open", date: "Now" },
  { label: "Applications close", date: "July 8, 2026" },
  { label: "Selections announced", date: "July 15, 2026" },
  { label: "Workshop day", date: "July 23, 2026" },
  { label: "90-day follow-through", date: "Through October 2026" },
];

function Timeline() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Timeline
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Five dates. <span className="text-gradient-brand">One launch.</span>
        </h2>
        <ol className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                {i + 1}
              </div>
              <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                <div className="text-base font-medium">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.date}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Facilitator() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-card p-6 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-8 lg:p-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-hero-gradient">
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <Award className="mb-3 size-6 opacity-80" />
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">Your facilitator</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-white/15 backdrop-blur">
                  <img src={facilitatorPhoto} alt={FACILITATOR_NAME} className="size-full object-cover" />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">{FACILITATOR_NAME}</div>
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
              Who&rsquo;s in the room with you
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              {FACILITATOR_NAME} — <span className="text-gradient-brand">at your table for the day.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              Adam has personally started multiple companies and helped launch dozens more — the
              kind of lean, modern businesses people are actually building in 2026. He&rsquo;s
              shipped work for Citigroup, Mayo Clinic, 3M, and Disney, built full digital systems
              for a Caribbean country&rsquo;s government, and produced one of the region&rsquo;s
              biggest business summits for five years.
            </p>
            <p className="mt-3 text-muted-foreground">
              He&rsquo;s sat in your seat — more than once. He knows exactly what it takes to go
              from a half-formed idea to a business that opens its doors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          Six seats.{" "}
          <span className="text-gradient-brand">Apply by July 8.</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Tell us about you and your startup. We&rsquo;ll email a decision by July 15.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply for a seat <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
