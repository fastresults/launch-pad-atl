import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { VideoTestimonials } from "@/components/home/VideoTestimonials";
import { HomeBusinessIdeasScroller } from "@/components/home/HomeBusinessIdeasScroller";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import { useEvent } from "@/lib/use-event";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BUILD_LAYER,
  FOUNDATION_FIRST_REASONS,
  FRAMEWORK_STAGES,
  WORKSHOP_PRICE_LABEL,
} from "@/lib/framework-deliverables";
import { BUILD_WORKSHOPS } from "@/lib/build-workshops";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import heroBg from "@/assets/hero-bg.png";
import atlSeal from "@/assets/atl-founder-friendly-seal.svg";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  Award,
  Sparkles,
  Star,
  AlertTriangle,
} from "lucide-react";

export function HomeFramework() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000,
  });
  const showScroller = settings?.show_business_ideas_scroller !== false;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <VideoTestimonials />
      <Framework />
      {showScroller && <HomeBusinessIdeasScroller />}
      <HonestRoadmap />
      <Facilitator />
      <ServicesTeaser />
      <Venue />
      <BottomCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const EVENT = useEvent();
  const [modesOpen, setModesOpen] = useState(false);
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-background/65" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24 lg:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white md:text-sm md:tracking-[0.2em]">

          <Star className="size-3.5 fill-current" /> The 14-Day Launch Method · Wed, Aug 19, 2026 · Norcross, GA
        </p>


        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          The 14-Day Launch Method.{" "}
          <span className="text-gradient-brand">First paying customer in two weeks.</span>
        </h1>

        {/* Old way / New way — the epiphany beat */}
        <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">The old way</div>
            <p className="mt-1.5 text-sm leading-snug text-white/80">
              An accelerator seat. A year of courses. A raw-AI rabbit hole.
            </p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 to-primary/5 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary">The new way</div>
            <p className="mt-1.5 text-sm leading-snug text-white">
              One live morning inside The 14-Day Launch Method. Revenue in two weeks.
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          The 14-Day Launch Method is the operator-led method quietly replacing accelerators, courses, and raw AI — the playbook modern founders are using to skip the year of guessing and land their first paying customer in two weeks. Run live by Adam, the operator who built it, in one focused morning. {WORKSHOP_PRICE_LABEL} once, yours forever.{" "}
          <span className="font-medium text-white">Full support during and after</span>, if you want it.
        </p>


        <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
          Not another course. Not raw AI. The operator-led method replacing both.
        </p>



        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:mt-10">
          <Link
            to="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Reserve your seat — {WORKSHOP_PRICE_LABEL} <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setModesOpen(true)}
            className="text-sm text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white sm:text-base"
          >
            Prefer to do it live — or have Adam's team build it for you?
          </button>
        </div>
        <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />

        <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70 md:text-sm">
          <span>Atlanta-built</span>
          <span aria-hidden>·</span>
          <span>Founder-first</span>
          <span aria-hidden>·</span>
          <span>Coffee on us</span>
          <span aria-hidden>·</span>
          <span>Full support available</span>
        </p>
        <p className="mt-2 max-w-2xl text-xs text-white/60 md:text-sm">
          Two equal tracks — Main Street and Online. Cafés, salons, trades, local services and indie brands on one side; DTC and e-commerce brands, creators, digital services, agencies and small SaaS on the other. Pick the track that fits your startup. Marketplace and deep tech supported too.
        </p>

        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 text-white/90 sm:grid-cols-2 lg:grid-cols-4 md:mt-12 md:gap-4">

          <Meta icon={<Calendar className="size-4" />} label={EVENT.dateLabel} />
          <Meta icon={<MapPin className="size-4" />} label={`${EVENT.venueCity}, ${EVENT.venueRegion}`} />
          <Meta icon={<Clock className="size-4" />} label="8:45–11:30 AM · Coffee included" />
          <Meta icon={<Users className="size-4" />} label="20 seats, one cohort" />
        </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <img
              src={atlSeal}
              alt="ATL Founder-Friendly Accelerator seal"
              loading="eager"
              decoding="async"
              className="w-[340px] xl:w-[400px] opacity-30 drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            />
          </div>
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

function Framework() {
  return (
    <TooltipProvider delayDuration={150}>
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Inside The 14-Day Launch Method
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          A business ready to take money.{" "}
          <span className="text-gradient-brand">Built with Adam in one morning.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Raw AI hands you a folder of documents and no customers. An accelerator hands you a year of homework. The 14-Day Launch Method — run in the room by the operator who built it — hands you a business: offer priced, first customer named, first channel open, outreach going out that afternoon. {WORKSHOP_PRICE_LABEL} once, yours to run with.
        </p>


        <div className="mt-14 space-y-14 md:space-y-20">
          {FRAMEWORK_STAGES.map((stage) => (
            <div key={stage.number}>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-semibold leading-none text-gradient-brand md:text-6xl">
                  {stage.number}
                </span>
                <div>
                  <h3 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xl font-semibold leading-tight tracking-tight md:text-2xl">
                    <span>{stage.name}</span>
                    {stage.bonus && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white md:text-xs">
                        <Sparkles className="size-3" /> Bonus
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    {stage.intro}
                  </p>
                </div>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {stage.items.map((d) => {
                  const Icon = d.icon;
                  return (
                    <Tooltip key={d.title} delayDuration={150}>
                      <TooltipTrigger asChild>
                        <li
                          tabIndex={0}
                          className="flex cursor-help items-center gap-3 rounded-2xl border border-white/10 bg-card px-5 py-4 transition-colors hover:border-white/20 focus:outline-none focus-visible:border-primary/40"
                        >
                          <Icon className="size-5 shrink-0 text-primary" />
                          <span className="text-base font-medium tracking-tight">{d.title}</span>
                        </li>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="max-w-[320px] text-sm leading-relaxed">
                        {d.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
    </TooltipProvider>
  );
}

function HonestRoadmap() {
  const included = [
    "A priced offer and the first customer you'll sell it to — named, not hypothetical",
    "The one channel you open week one — and the first outreach going out that day",
    "A 90-day roadmap from first dollar to steady income, built with Adam for your business",
    "Working time in a 20-seat room with Adam himself — not a moderator, not a TA",
    "Coffee, refreshments, and a room built for founders who came to work",
  ];

  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The honest roadmap
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Two weeks to first revenue.{" "}
          <span className="text-gradient-brand">A real business by month two.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Every founder we've watched fail did the same thing: they burned six months and $30K on a logo, a site, and ads that told nobody a coherent story — and never asked a single customer for money. The workshop flips it. Adam sits with you, prices your offer, opens your first channel, and gets you selling in the next 14 days. Everything else — the polish, the systems, the scale — comes after the money starts.
        </p>


        {/* Act 1 — Why foundation first */}
        <div className="mt-12 md:mt-16">
          <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
            <AlertTriangle className="size-4 text-primary" /> Why foundation first
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FOUNDATION_FIRST_REASONS.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-white/10 bg-card p-5 md:p-6"
              >
                <h3 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Act 2 — What $197 gets you */}
        <div className="mt-12 md:mt-16">
          <div className="rounded-2xl border border-primary/40 bg-card p-6 md:p-8">
            <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-primary">
              What {WORKSHOP_PRICE_LABEL} gets you — 14 days from now
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 md:gap-4">
              {included.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm md:text-base">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Act 3 — The modern build layer */}
        <div className="mt-12 md:mt-16">
          <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
            <Sparkles className="size-4 text-primary" /> What comes after your first customer
          </div>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Once you're live and taking money, eight more capabilities turn a launched business into a growing one — the brand, the site that converts, the content engine, the sales script, the automations. Each is a half-day working session with Adam. Or hand the whole thing to his team.
          </p>


          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {BUILD_LAYER.map((b) => {
              const Icon = b.icon;
              const workshop = BUILD_WORKSHOPS.find((w) => w.capability === b.capability);
              const href = workshop ? `/build/${workshop.slug}` : "/build";
              return (
                <Link
                  key={b.title}
                  to={href}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-primary/40 md:p-6"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Icon className="size-5 text-primary" />
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                      Workshop · {workshop?.priceLabel ?? "$197"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-snug tracking-tight">
                    {b.title}
                  </h3>
                  <p className="mt-1 font-serif text-sm italic leading-snug text-foreground/80">
                    {b.subtitle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    Learn more
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-base text-muted-foreground md:text-lg">
            DIY any of it. Hire anyone. Or hand it to our team. Either way, each half-day is the same playbook Adam's team runs from — the working sessions that extend The 14-Day Launch Method after your first customer.{" "}
            <span className="font-medium text-foreground">
              Foundation first. Build when ready.
            </span>{" "}
            That's not a slogan — it's the cheapest path to a real business.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              See all 8 workshops <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
            >
              Or have us build it for you
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Facilitator() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-card p-6 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-8 lg:p-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-hero-gradient">
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <Award className="mb-3 size-6 opacity-80" />
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">Your facilitator</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-white/15 backdrop-blur">
                  <img src={facilitatorPhoto} alt="Adam Anderson" className="size-full object-cover" />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">Adam Anderson</div>
                  <div className="text-xs uppercase tracking-[0.18em] opacity-80">
                    Serial Entrepreneur · Operator
                  </div>
                </div>
              </div>
              <div className="mt-4 text-base leading-snug opacity-95">
                30 years of starting businesses. A few hours with yours.
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Who's in the room with you
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              Adam Anderson —{" "}
              <span className="text-gradient-brand">at your table for the session.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              Co-Founder of OPEN Interactive and a serial entrepreneur who has personally started multiple companies and helped launch dozens more across tech, services, online brands, and Main Street. Along the way he's shipped work for Citigroup, Mayo Clinic, 3M, and Disney, built full digital systems for a Caribbean country's government, and produced one of the region's biggest business summits for five years running.
            </p>
            <p className="mt-3 text-muted-foreground">
              He's sat in your seat — more than once. He knows what the first move looks like, and what it takes to get from "good idea" to "running business."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesTeaser() {
  return (
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          When you're ready to build it
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          When you're ready,{" "}
          <span className="text-gradient-brand">we'll build it for you.</span>
        </h2>
        <div className="mt-8 flex justify-center">
          <Link
            to="/services"
            className="group inline-flex items-center gap-3 rounded-full bg-hero-gradient px-7 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90"
          >
            See all services
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}


function Venue() {
  const EVENT = useEvent();
  return (
    <section className="py-16 md:py-24">
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
              <p className="mt-1 text-muted-foreground">{EVENT.dateLabel}</p>
              <div className="mt-7 flex flex-wrap items-start gap-3">
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:bg-white/10"
                >
                  <MapPin className="size-4" /> Get directions
                </a>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Reserve seat <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:aspect-auto md:min-h-[280px]">
              <iframe
                title={`Map of ${EVENT.venueName}`}
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
    <section className="pb-16 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero-gradient p-8 md:p-12 lg:p-16">
          <div className="relative max-w-3xl text-white">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
              Stop turning the startup over in your head.
            </h2>
            <p className="mt-4 text-base text-white/90 md:mt-5 md:text-lg">
              {WORKSHOP_PRICE_LABEL} gets you in the room with Adam and a real plan your startup can run with Monday. If you want our team to build the brand, the site, or the launch after — we're a click away. If not, you keep the plan either way.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-8">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-neutral-900 transition-opacity hover:opacity-90 sm:w-auto"
              >
                Reserve a seat — {WORKSHOP_PRICE_LABEL} <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                See our services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
