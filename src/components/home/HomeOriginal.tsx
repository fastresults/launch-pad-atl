// @ts-nocheck
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FLOW_STAGES } from "@/lib/schedule-data";
import { useEvent } from "@/lib/use-event";
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Award,
  Check,
  Clock,
  X,
  Hammer,
  Timer,
  AlertTriangle,
} from "lucide-react";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import heroBg from "@/assets/hero-bg.png";
import { ArtOfThePossible } from "@/components/home/ArtOfThePossible";

export const FACILITATOR_NAME = "Adam Anderson";
export const FACILITATOR_TITLE =
  "Serial entrepreneur · Co-Founder, OPEN Interactive · Has helped launch dozens of modern-economy businesses across tech, services, and Main Street.";

export function HomeOriginal() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <NotACourseBanner />
      <WalkInWalkOut />
      <ArtOfThePossible />
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
                Not a course, not coaching, not DIY worksheets. In one focused day you build the operational foundation of a real business — name, brand, website, offer, pricing, legal drafts, launch plan — plus a short checklist for the items only your signature can finish. You arrive with a spark. You leave with a company.{" "}
                <span className="text-white/40">
                  (Hard costs — filing fees, hosting, tech subscriptions, and anything physical like space, equipment, or inventory — aren&apos;t covered by the workshop fee.)
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-col md:items-end md:gap-2 md:shrink-0">
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
  const EVENT = useEvent();
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-background/50" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-32">
        <p className="mb-5 text-xs uppercase tracking-[0.18em] text-white/80 md:mb-6 md:text-sm md:tracking-[0.2em]">
          One day. One founder. One operationally launch-ready business.
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          Walk in with an idea. <br />
          Walk out <span className="italic">with a business built to earn</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          Seven focused hours at the IGNITE Center in Norcross, GA.{" "}
          <span className="font-medium text-white">
            You bring the idea — even a rough one. We build <em>your</em> business, not a template.
          </span>{" "}
          By 4:30 PM you&apos;ll have a business formed and filing-ready, a simple way to deliver it, a website ready to publish, your full marketing kit, and a 90-day plan with your next ten moves already on the calendar.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          The fastest path we know from idea to a viable, profit-ready business — in one focused day, with paying customers in the 90-day plan you take home.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Claim one of 10 seats <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/schedule"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            See the 7-hour flow
          </Link>
        </div>
        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 text-white/90 sm:grid-cols-2 lg:grid-cols-4 md:mt-12 md:gap-4">
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

function FacilitatorSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-card p-6 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-8 lg:p-12">
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
              Who&apos;s in the room with you
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              {FACILITATOR_NAME} —{" "}
              <span className="text-gradient-brand">at your table for the day.</span>
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">
              {FACILITATOR_TITLE}
            </p>
            <p className="mt-5 text-muted-foreground">
              Adam is a serial entrepreneur who has personally started multiple companies and helped launch dozens more — the kind of lean, modern businesses people are actually building in 2026: online services, AI-powered shops, productized expertise, and Main Street operators. Along the way he&apos;s shipped work for Citigroup, Mayo Clinic, 3M, and Disney, built full digital systems for a Caribbean country&apos;s government, and spent five years producing one of the region&apos;s biggest business summits.
            </p>
            <p className="mt-3 text-muted-foreground">
              He&apos;s sat in your seat — more than once. He knows exactly what it takes to go from a half-formed idea to a business that actually opens its doors.
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

function VenueCard() {
  const EVENT = useEvent();
  return (
    <section className="pb-16 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-card p-6 md:p-8 lg:p-12">
          <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-10">
            <div>
              <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Where it happens
              </h2>
              <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
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

const NUMBER_WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
];
function seatsWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function BottomCTA() {
  const EVENT = useEvent();
  return (
    <section className="pb-16 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero-gradient p-8 md:p-10 lg:p-16">
          <div
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative max-w-3xl text-white">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {seatsWord(EVENT.capacity)} seats. One date. One door from idea to business.
            </h2>
            <p className="mt-4 text-base text-white/90 md:mt-5 md:text-lg">
              If you&apos;ve been waiting for the right week to start earning, this is the day you stop waiting. Bring the idea. We&apos;ll bring the operator, the room, and every template you need to turn it into a business that actually brings in money.
            </p>
            <div className="mt-7 md:mt-8">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-neutral-900 transition-opacity hover:opacity-90 hover:text-neutral-900 sm:w-auto"
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

function WalkInWalkOut() {
  const walkIn = [
    "An idea you have been turning over for months (or years)",
    "A notebook full of \"someday\" notes",
    "Questions about LLCs, EINs, websites, pricing, and where to even start",
    "No clear first customer",
    "No structure, no kit, no plan you can actually follow Monday morning",
  ];
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The transformation
        </h2>
        <p className="mb-8 max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:mb-10 md:text-4xl">
          What changes between{" "}
          <span className="text-gradient-brand">8:00 AM and 4:30 PM</span>.
        </p>
        <div className="grid gap-5 md:grid-cols-[1fr_1.4fr] md:gap-6">
          <div className="rounded-3xl border border-white/10 bg-card/50 p-6 md:p-8">
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
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-card p-6 md:p-8">
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
                    className={idx === 0 ? "" : "border-t border-white/10 pt-7"}
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
      { name: "Competitive advantage brief", desc: "Your 'secret sauce' — the one defensible thing you do better, pulled from the research and competitor scan and written in a sentence you can use on the website, in pitches, and in DMs." },
    ],
  },
  {
    n: 2,
    title: "Offer & build — what you sell, how you deliver",
    intro: "By mid-afternoon, the offer is locked, priced, and rehearsed.",
    items: [
      { name: "One-sentence offer", desc: "The line you'll use on your website, in pitches, and in DMs." },
      { name: "Competitor + value-based pricing", desc: "Your price set against a 3-competitor price scan and the value to your customer, with real costs, margin, and the exact number of sales to break even." },
      { name: "Delivery map", desc: "Your business mapped sale-to-happy-customer, with the app you'll use at each step." },
      { name: "Free-app stack set up", desc: "Project hub, files, scheduling, comms — accounts created in your name." },
      { name: "First customer's deliverable", desc: "Drafted and rehearsed end-to-end with a 5-point quality checklist." },
      { name: "Operations & workflow", desc: "Three SOPs — intake, fulfillment, customer onboarding — loaded into your project hub, plus a one-page weekly operating rhythm." },
      { name: "Sourcing & staffing plan", desc: "Where to source raw goods, services, and talent — whether you sell a product or a service — with named suppliers, contractors, or hires and a first-call list." },
      { name: "Funding model & 12-month runway", desc: "Real costs, margins, break-even, and a 12-month cash picture you can defend to a lender or investor." },
      { name: "Business plan with pro formas", desc: "A short narrative plan plus a 12-month P&L, cash flow, and break-even pro forma — formatted the way banks, the SBA, and investors expect." },
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
