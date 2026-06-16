import { Link } from "react-router-dom";
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
  Eye,
  Flame,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  TicketPercent,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const FACILITATOR_NAME = "Adam Anderson";
const INCIDENTALS_CAP = 225;

const FINALIST_DISCOUNT_PCT = 40;
const FINALIST_DISCOUNT_VALIDITY = "the next two scheduled Atlanta cohorts";
const PIECEMEAL_VALUE = "$10,000";

export function HomeSelection() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <NoLosingScenario />
      <WhyItsFree />
      <Facilitator />
      <WhatYouWalkOut />
      <BringYourCard />
      <ArtOfThePossible />
      <WhoGetsIn />
      <Timeline />
      <FinalistOffer />
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
          <Sparkles className="size-3.5" /> Atlanta · July 23 · 6 free seats · closes June 20
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          Your idea has been{" "}
          <span className="italic">sitting in your notes app</span>{" "}
          <span className="text-gradient-brand">long enough.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          We&rsquo;re handing 6 Atlanta founders a complete startup — brand, website, launch offer,
          90-day plan — built in one day. <span className="font-semibold text-white">$0. No pitch. No upsell.</span>{" "}
          Apply by <span className="font-medium text-white">June 20</span>, hear back{" "}
          <span className="font-medium text-white">July 8</span>, build on{" "}
          <span className="font-medium text-white">July 23</span>.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          Don&rsquo;t get one of the 6 seats? You get{" "}
          <span className="font-medium text-white">{FINALIST_DISCOUNT_PCT}% off the next cohort</span>,
          emailed the same day. There is literally no downside to applying.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Apply free — takes 12 min <ArrowRight className="size-4" />
          </Link>
          <a
            href="#deliverables"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            What you walk out with &darr;
          </a>
        </div>

        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 text-white/90 sm:grid-cols-2 lg:grid-cols-4 md:mt-12 md:gap-4">
          <Meta icon={<Calendar className="size-4" />} label="Thursday, July 23, 2026" />
          <Meta icon={<MapPin className="size-4" />} label="IGNITE Center · Norcross, GA" />
          <Meta icon={<Users className="size-4" />} label="6 founders. That's it." />
          <Meta icon={<Award className="size-4" />} label="Seat, lunch, build — all free" />
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

function NoLosingScenario() {
  const cards = [
    {
      icon: <Flame className="size-5 text-primary" />,
      title: "You get in",
      body:
        "Free seat July 23. Brand, website, offer, and 90-day plan built with you in one day. " +
        PIECEMEAL_VALUE +
        " of work. $0 to you. Walk in with an idea. Walk out with a business.",
    },
    {
      icon: <TicketPercent className="size-5 text-primary" />,
      title: "You don&rsquo;t get in",
      body:
        FINALIST_DISCOUNT_PCT +
        "% off the next paid Atlanta cohort — emailed July 8, the same day we announce the 6. Watch those founders launch live. Then decide if you want your turn.",
    },
    {
      icon: <Target className="size-5 text-primary" />,
      title: "Either way",
      body:
        "You put your startup on paper and said it out loud. That alone puts you ahead of everyone still saying &ldquo;someday.&rdquo; Most people never even get this far.",
    },
  ];
  return (
    <section className="border-b border-white/5 py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          You literally cannot lose
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Get in, get a built startup.{" "}
          <span className="text-gradient-brand">Don&rsquo;t get in, get 40% off. Pick your outcome.</span>
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

function WhyItsFree() {
  return (
    <section className="border-b border-white/5 py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Why it&rsquo;s free (real answer)
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We don&rsquo;t buy ads.{" "}
          <span className="text-gradient-brand">We prove ourselves.</span>
        </h2>
        <p className="mt-5 text-base text-muted-foreground md:text-lg">
          This is our first Atlanta cohort. Instead of running ads, we&rsquo;re investing
          the full value of six seats into six founders — the build, the brand, the 90-day
          follow-through. You get a launched startup. We get six public case studies we can
          point to. Clean trade.
        </p>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          We want the best six founders in the room, not just the first six who signed up.
          That&rsquo;s why there&rsquo;s an application — and why every applicant walks away
          with something real, whether they get a seat or not.
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
          One thing to know upfront
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          The workshop is free.{" "}
          <span className="text-gradient-brand">Startup setup costs ~${INCIDENTALS_CAP}. Here&rsquo;s exactly what that is.</span>
        </h2>
        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 md:p-8">
          <p className="text-base text-muted-foreground md:text-lg">
            Your seat, the build, the brand, materials, lunch — all on us. The only costs are
            the ordinary startup basics every founder pays anyway: your domain (~$12), email
            and hosting, a state filing fee, maybe one AI tool. These go straight from you to
            those vendors — not a cent comes to us. If you&rsquo;re one of the 6, we&rsquo;ll
            email you exactly what to set up, why, and how — before July 23, at your own pace.
            Budget around{" "}
            <span className="font-medium text-foreground">${INCIDENTALS_CAP} max</span>. Set it
            up in your name. Walk in ready to build.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip icon={<ShieldCheck className="size-3.5" />} label="Everything in your name" />
            <Chip icon={<Wallet className="size-3.5" />} label={`~$${INCIDENTALS_CAP} max`} />
            <Chip icon={<Sparkles className="size-3.5" />} label="Skip anything you already have" />
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
          In your hands at 4:30 PM
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Not a course. Not coaching.{" "}
          <span className="text-gradient-brand">A built startup.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Brand identity. Website. An offer people can actually pay for. A 90-day launch plan
          you can run starting Monday. Stage by stage — here&rsquo;s what comes out of the room.
        </p>
        <div className="mt-8">
          <ValueGrid showCosts={false} />
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted-foreground md:text-base">
          Hire this out piecemeal — brand studio, dev shop, fractional CMO — and you&rsquo;re
          six weeks and{" "}
          <span className="text-foreground font-medium">{PIECEMEAL_VALUE}</span> deep before
          anyone takes a payment. We do it in a day. For free.
        </p>
      </div>
    </section>
  );
}

const CRITERIA = [
  {
    title: "Atlanta-based",
    body: "You&rsquo;re in metro Atlanta — or relocating here in the next 90 days. This is an in-person build.",
  },
  {
    title: "An idea you can&rsquo;t drop",
    body: "No revenue needed. You do need a real idea that&rsquo;s been living rent-free in your head.",
  },
  {
    title: "Ready to decide",
    body: "You&rsquo;ll make real calls in the room — name, offer, price — and own them past the parking lot. No fence-sitting.",
  },
  {
    title: "Free July 23, full day",
    body: "8 AM to 4:30 PM, in person, Norcross. Full commitment. No Zoom-in. No half-days.",
  },
];

function WhoGetsIn() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Who gets a seat
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We pick{" "}
          <span className="text-gradient-brand">people, not ideas.</span>{" "}
          Here&rsquo;s what Adam looks for.
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Adam reads every application himself. Vague answers don&rsquo;t make the 6.
          Write like you&rsquo;re talking to one person who&rsquo;s genuinely rooting for you.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CRITERIA.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-card p-6">
              <Zap className="mb-3 size-5 text-primary" />
              <div
                className="text-lg font-semibold tracking-tight"
                dangerouslySetInnerHTML={{ __html: c.title }}
              />
              <p className="mt-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: c.body }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { label: "Apply — free, 12 minutes", date: "Open now" },
  { label: "Applications close", date: "June 20, 2026" },
  { label: "6 seats announced — every applicant hears back", date: "July 8, 2026" },
  { label: "Founder&rsquo;s Discount emailed to everyone else", date: "July 8, 2026" },
  { label: "Build day — you walk in with an idea, walk out with a startup", date: "July 23, 2026" },
  { label: "90 days of public launches — case studies, live sites, real numbers", date: "Through Oct 2026" },
];

function Timeline() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The dates
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Mark these.{" "}
          <span className="text-gradient-brand">All six.</span>
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
              <TicketPercent className="size-3.5" /> If you don&rsquo;t get a seat
            </p>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              Didn&rsquo;t make the 6?{" "}
              <span className="text-gradient-brand">You still leave with something.</span>
            </h2>
            <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
              Every applicant who doesn&rsquo;t get a seat gets a{" "}
              <span className="font-medium text-foreground">
                {FINALIST_DISCOUNT_PCT}% Founder&rsquo;s Discount
              </span>{" "}
              on the next paid cohort — emailed July 8, same day we announce the 6. It activates
              after the workshop on purpose: watch those 6 founders launch in public, see the
              actual sites and 90-day numbers, then decide if you want your turn.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Pillar
                icon={<TicketPercent className="size-5 text-primary" />}
                title={`${FINALIST_DISCOUNT_PCT}% off`}
                body="Single-use, transferable to one founder you refer. Emailed July 8 — no waiting."
              />
              <Pillar
                icon={<Eye className="size-5 text-primary" />}
                title="Front-row to the launches"
                body="Watch the 6 go live — websites, brands, offers, real 90-day revenue numbers. Proof before you pay."
              />
              <Pillar
                icon={<Calendar className="size-5 text-primary" />}
                title="Valid for two cohorts"
                body={`Honored across ${FINALIST_DISCOUNT_VALIDITY} — timing doesn&rsquo;t cost you the offer.`}
              />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              One use per person. Full terms emailed with the code on July 8.
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
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">In the room with you</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-white/15 backdrop-blur">
                  <img src={facilitatorPhoto} alt={FACILITATOR_NAME} className="size-full object-cover" />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">{FACILITATOR_NAME}</div>
                  <div className="text-xs uppercase tracking-[0.18em] opacity-80">
                    Founder · Operator · Builder
                  </div>
                </div>
              </div>
              <div className="mt-4 text-base leading-snug opacity-95">
                He&rsquo;s been in your seat. Multiple times.
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Who&rsquo;s building with you
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              {FACILITATOR_NAME} —{" "}
              <span className="text-gradient-brand">not a coach. An operator who&rsquo;s done it.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              Adam has personally started and launched multiple companies — lean, modern startups
              like the ones people are actually building in 2026. He&rsquo;s shipped products for
              Citigroup, Mayo Clinic, 3M, and Disney, built the digital infrastructure for a
              national government, and built live AI products on the same tools you&rsquo;re going
              to use in this room.
            </p>
            <p className="mt-3 text-muted-foreground">
              He knows what it feels like to sit where you&rsquo;re sitting right now —
              with an idea and no clear next move. That&rsquo;s exactly what this day is built to fix.
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
          6 seats. $0.{" "}
          <span className="text-gradient-brand">June 20 is the cutoff.</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          12 minutes to apply. Decision July 8. Either a free build on July 23 — or{" "}
          {FINALIST_DISCOUNT_PCT}% off and a front-row seat to watch the launches.
          No bad outcome. No silent rejections. Everyone hears back.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply now — it&rsquo;s free <ArrowRight className="size-4" />
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          No fee. No follow-up sales call. Just an application.
        </p>
      </div>
    </section>
  );
}
