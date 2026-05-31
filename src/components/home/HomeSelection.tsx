import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { ValueGrid } from "@/components/value/ValueGrid";
import { ArtOfThePossible } from "@/components/home/ArtOfThePossible";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import heroBg from "@/assets/hero-bg.png";
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  Eye,
  Flame,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  TicketPercent,
  Users,
  Wallet,
} from "lucide-react";

const FACILITATOR_NAME = "Adam Anderson";
const INCIDENTALS_CAP = 225;

// TBD with founder — placeholders flagged for easy swap.
const FINALIST_DISCOUNT_PCT = 40; // % off next Atlanta cohort
const FINALIST_DISCOUNT_VALIDITY = "the next two scheduled Atlanta cohorts";
const PIECEMEAL_VALUE = "$10,000";

export function HomeSelection() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <WhyApplyingIsTheMove />
      <WhyDoingThis />
      <WhatYouWalkOut />
      <BringYourCard />
      <ArtOfThePossible />
      <WhoWereLookingFor />
      <Timeline />
      <FinalistOffer />
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
          <Sparkles className="size-3.5" /> Atlanta · Inaugural Cohort · 6 seats · 0 cost
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          Six founders.{" "}
          <span className="italic">One Thursday.</span>{" "}
          <span className="text-gradient-brand">A real company, not a plan.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          We&rsquo;re new to Atlanta — and we&rsquo;re betting on six of you to prove what one
          honest day can do. Apply by <span className="font-medium text-white">June 20</span>. Six
          founders get a free seat at the IGNITE Center on{" "}
          <span className="font-medium text-white">July 23, 2026</span> — tuition, materials, and
          lunch covered. Every other applicant gets a{" "}
          <span className="font-medium text-white">Founder&rsquo;s Discount</span> on the next
          cohort, sent the same day we announce the six.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          Decisions emailed <span className="font-medium text-white">July 8</span>. There is no
          version of this where applying costs you something.
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
            See what the six walk out with
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

function WhyApplyingIsTheMove() {
  const cards = [
    {
      icon: <Flame className="size-5 text-primary" />,
      title: "If you&rsquo;re chosen",
      body:
        "A free seat on July 23 — roughly " +
        PIECEMEAL_VALUE +
        " of brand, web, and launch work built with you in one day, and a signed 90-day plan in your hand before you leave.",
    },
    {
      icon: <TicketPercent className="size-5 text-primary" />,
      title: "If you&rsquo;re not",
      body:
        "A named Founder&rsquo;s Discount — " +
        FINALIST_DISCOUNT_PCT +
        "% off the next paid Atlanta cohort, sent the same day we announce the six. Watch them launch in public, then decide if you want your turn.",
    },
    {
      icon: <Target className="size-5 text-primary" />,
      title: "Either way",
      body:
        "You put your startup on paper. You said it out loud. That&rsquo;s further than 99% of people who&rsquo;ve been saying &ldquo;someday&rdquo; for years.",
    },
  ];
  return (
    <section className="border-b border-white/5 py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Why applying is the move
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Dozens will apply. Six will build.{" "}
          <span className="text-gradient-brand">Everyone who steps in gets something back.</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-card p-6">
              <div className="mb-3">{c.icon}</div>
              <div
                className="text-lg font-semibold tracking-tight"
                dangerouslySetInnerHTML={{ __html: c.title }}
              />
              <p
                className="mt-2 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: c.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyDoingThis() {
  return (
    <section className="border-b border-white/5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Why we&rsquo;re doing this
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We&rsquo;re betting on Atlanta first —{" "}
          <span className="text-gradient-brand">and we want six real launches to point to.</span>
        </h2>
        <p className="mt-5 text-base text-muted-foreground md:text-lg">
          This is our inaugural Atlanta cohort. Instead of buying ads to introduce ourselves,
          we&rsquo;re investing the full price of six seats into six founders — the workshop, the
          deliverables, and the 90-day follow-through. In return, we get six Atlanta startups we
          can point to as proof of work. You get the fastest path we know from idea to a
          revenue-ready startup, with nothing out of pocket for the workshop itself.
        </p>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          We expect dozens of applications for six seats. That&rsquo;s the point. We want to
          choose from a deep bench — and we want every founder who applied to walk away with
          something real, even if the seat goes to someone else.
        </p>
      </div>
    </section>
  );
}

function BringYourCard() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          A small heads-up
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Bring a card for the small stuff —{" "}
          <span className="text-gradient-brand">everything stays in your name.</span>
        </h2>
        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 md:p-8">
          <p className="text-base text-muted-foreground md:text-lg">
            Your seat, the build, the brand, the materials, lunch — the workshop is entirely on
            us. The only costs you&rsquo;ll see are the ordinary startup setup expenses every
            founder pays: your domain (~$12), email and hosting, a state filing fee, maybe one AI
            tool. These go straight from you to those vendors — not a cent comes to us. If
            you&rsquo;re one of the six, we&rsquo;ll email you ahead of time with exactly what we
            recommend, why, and how it fits your startup, so you can handle everything beforehand
            at your own pace. Budget around{" "}
            <span className="font-medium text-foreground">${INCIDENTALS_CAP}</span>, set it all up
            in your name on your card, and walk in ready to build.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip icon={<ShieldCheck className="size-3.5" />} label="Everything in your name" />
            <Chip icon={<Wallet className="size-3.5" />} label={`Up to ~$${INCIDENTALS_CAP} total`} />
            <Chip icon={<Sparkles className="size-3.5" />} label="Optional — skip anything you don't need" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function WhatYouWalkOut() {
  return (
    <section id="deliverables" className="py-12 md:py-20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          What you walk out with at 4:30 PM
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Not a course. Not coaching.{" "}
          <span className="text-gradient-brand">A built startup.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Every deliverable, stage by stage — the full build you carry out the door at 4:30.
        </p>
        <div className="mt-8">
          <ValueGrid showCosts={false} />
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
          Hire this out piecemeal — brand studio, dev shop, fractional CMO — and you&rsquo;re six
          weeks and north of <span className="text-foreground font-medium">{PIECEMEAL_VALUE}</span>{" "}
          in before anyone takes a payment. We&rsquo;ll have it in your hands by dinner.
        </p>
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
    title: "An idea you have been turning over",
    body: "You don&rsquo;t need revenue. You do need a real idea you can&rsquo;t stop thinking about.",
  },
  {
    title: "Coachable and decisive",
    body: "You&rsquo;ll make calls in the room — name, offer, pricing — and stick with them past the parking lot.",
  },
  {
    title: "Free on July 23",
    body: "You can commit the full day, in person, in Norcross. No half-attendance, no Zoom-in.",
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
          <span className="text-gradient-brand">leave with a real startup</span> — not a deck.
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Adam reads every application personally. Be specific — vague applications don&rsquo;t
          make the six.
        </p>
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
  { label: "Applications close", date: "June 20, 2026" },
  { label: "Selections announced — six seats emailed", date: "July 8, 2026" },
  { label: "Founder&rsquo;s Discount emailed to every other applicant", date: "July 8, 2026" },
  { label: "Workshop day", date: "July 23, 2026" },
  { label: "90-day follow-through — launches in public", date: "Through October 2026" },
];

function Timeline() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Timeline
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Six dates. <span className="text-gradient-brand">One launch.</span>
        </h2>
        <ol className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-white">
                {i + 1}
              </div>
              <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                <div
                  className="text-base font-medium"
                  dangerouslySetInnerHTML={{ __html: s.label }}
                />
                <div className="text-sm text-muted-foreground">{s.date}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalistOffer() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-8 md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-hero-gradient opacity-20 blur-3xl" />
          <div className="relative">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
              <TicketPercent className="size-3.5" /> The Founder&rsquo;s Discount
            </p>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              Not chosen?{" "}
              <span className="text-gradient-brand">You still leave with something real.</span>
            </h2>
            <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
              Every applicant we don&rsquo;t pick for the six gets a named Founder&rsquo;s
              Discount —{" "}
              <span className="font-medium text-foreground">
                {FINALIST_DISCOUNT_PCT}% off the next paid Atlanta cohort
              </span>
              , emailed July 8. The discount activates after the workshop on purpose: you get to
              watch the six launch in public — read the case studies, click the live sites, see
              the 90-day numbers — and then decide if you want your turn.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Pillar
                icon={<TicketPercent className="size-5 text-primary" />}
                title={`${FINALIST_DISCOUNT_PCT}% off`}
                body="Emailed the same day we announce the six. Single-use, transferable to one founder you recommend."
              />
              <Pillar
                icon={<Eye className="size-5 text-primary" />}
                title="A front-row seat"
                body="You see what came out of the room — websites, brands, offers, 90-day numbers — before you commit a dollar."
              />
              <Pillar
                icon={<Calendar className="size-5 text-primary" />}
                title="Valid for two cohorts"
                body={`Honored across ${FINALIST_DISCOUNT_VALIDITY} — so timing doesn&rsquo;t cost you the offer.`}
              />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Founder&rsquo;s Discount terms are simple — one applicant per email, one use per
              person, full terms emailed with the code on July 8.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/40 p-5">
      <div className="mb-2">{icon}</div>
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
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
                30 years of starting startups. One day with yours.
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
              kind of lean, modern startups people are actually building in 2026. He&rsquo;s
              shipped work for Citigroup, Mayo Clinic, 3M, and Disney, built full digital systems
              for a Caribbean country&rsquo;s government, and produced one of the region&rsquo;s
              biggest business summits for five years.
            </p>
            <p className="mt-3 text-muted-foreground">
              He&rsquo;s sat in your seat — more than once. He knows exactly what it takes to go
              from a half-formed idea to a startup that opens its doors.
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
          Six seats. Dozens will apply.{" "}
          <span className="text-gradient-brand">Yours starts with one form.</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Twelve minutes to apply. Decision by July 8. Either a free seat on July 23 — or a{" "}
          {FINALIST_DISCOUNT_PCT}% Founder&rsquo;s Discount and a front-row seat to the launches.
          There is no version of this where applying costs you.
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
