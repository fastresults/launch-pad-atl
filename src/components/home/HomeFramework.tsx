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

          <Star className="size-3.5 fill-current" /> One Saturday morning · Aug 19 · Atlanta · Coffee on us
        </p>


        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-7xl">
          Start your business.{" "}
          <span className="text-gradient-brand">Get your first paying customer in two weeks.</span>
        </h1>

        {/* Old way / New way — the epiphany beat */}
        <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">The usual path</div>
            <p className="mt-1.5 text-sm leading-snug text-white/80">
              A year of courses. A pile of tabs. Never actually starting.
            </p>
          </div>
          <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/20 to-primary/5 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary">Our way</div>
            <p className="mt-1.5 text-sm leading-snug text-white">
              One morning with us. A real plan. Money in your account in two weeks.
            </p>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-base text-white/90 md:mt-6 md:text-lg">
          Come spend one morning with us. We'll help you build the business you've been talking about — your side income, your shop, your online store — and walk you out with a plan you can actually run. Not a course. Not homework you'll never do. We sit down and do it <span className="font-medium text-white">with</span> you, in the room, for {WORKSHOP_PRICE_LABEL}.
        </p>


        <p className="mt-4 max-w-2xl text-sm text-white/80 md:text-base">
          For nurses, teachers, servers, coders, and everyone in between who's ready for a Plan B.
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
            Can't make it to Atlanta? See the other two ways.
          </button>
        </div>
        <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />

        <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70 md:text-sm">
          <span>Made in Atlanta</span>
          <span aria-hidden>·</span>
          <span>Everyday people welcome</span>
          <span aria-hidden>·</span>
          <span>Coffee on us</span>
          <span aria-hidden>·</span>
          <span>We stick around after</span>
        </p>
        <p className="mt-2 max-w-2xl text-xs text-white/60 md:text-sm">
          Two rooms in one — one for local shops, cafés, salons, trades, and neighborhood services; one for online stores, side brands, and creators. Pick the room that fits what you're building. Not sure yet? Come anyway — we'll help you figure it out.
        </p>

        <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 text-white/90 sm:grid-cols-2 lg:grid-cols-4 md:mt-12 md:gap-4">

          <Meta icon={<Calendar className="size-4" />} label={EVENT.dateLabel} />
          <Meta icon={<MapPin className="size-4" />} label={`${EVENT.venueCity}, ${EVENT.venueRegion}`} />
          <Meta icon={<Clock className="size-4" />} label="8:45–11:30 AM · Coffee included" />
          <Meta icon={<Users className="size-4" />} label="Just 20 seats" />

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
          What you'll walk out with
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          A real business ready to take money.{" "}
          <span className="text-gradient-brand">Built with you in one morning.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          A course gives you videos. A chatbot gives you a folder of documents. We sit down with you and build the business — what you're selling, who you're selling it to, and how to get your first "yes." By that afternoon you're not planning anymore. You're open. {WORKSHOP_PRICE_LABEL} once. Yours to run with.
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
    "What you're selling and what to charge for it — a price you can actually say out loud",
    "The exact person you'll sell to first — real name, not 'my target market'",
    "The one place you'll go find them this week — and the first message going out that day",
    "A simple 90-day plan from your first dollar to steady side income",
    "A seat in a small room with Adam — the guy who's actually done this, not a stand-in",
    "Coffee, snacks, and a room full of people building the same kind of business you are",
  ];

  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Here's the honest plan
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Two weeks to your first dollar.{" "}
          <span className="text-gradient-brand">A real business by month two.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Almost everyone who tries to start a business does the same thing: they spend six months and a chunk of savings on a logo, a fancy site, and ads — and never actually ask a single person for money. We flip it. In one morning we help you name your first customer, price what you're selling, and get the first "yes" going out that week. Everything pretty comes after the money starts.
        </p>



        {/* Act 1 — Why foundation first */}
        <div className="mt-12 md:mt-16">
          <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
            <AlertTriangle className="size-4 text-primary" /> Start here first
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
            <Sparkles className="size-4 text-primary" /> Once you have your first customer
          </div>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Once money's coming in, there are eight more mornings you can come back for — a real brand, a website that actually sells, a way to keep customers coming, a script for closing more of them, and simple systems that save you hours. One piece at a time, done together, done before lunch. Or just hand the list to our team and we'll build it for you.
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
            Do any of it yourself. Hire someone else. Or hand it to our team — same crew, same playbook.{" "}
            <span className="font-medium text-foreground">
              Get the basics right first. Add the rest when the money's coming in.
            </span>{" "}
            That's the cheapest, saner way to actually pull this off.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              See all 8 mornings <ArrowRight className="size-4" />
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
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">Who's in the room with you</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-white/15 backdrop-blur">
                  <img src={facilitatorPhoto} alt="Adam Anderson" className="size-full object-cover" />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">Adam Anderson</div>
                  <div className="text-xs uppercase tracking-[0.18em] opacity-80">
                    Started a lot of businesses · Been in your seat
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
              Meet Adam
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              Adam Anderson —{" "}
              <span className="text-gradient-brand">sitting at your table.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              Adam has started a bunch of his own companies and helped a lot of everyday people start theirs — cafés, online stores, home services, side brands, you name it. Along the way he's also done big work for names you know like Citigroup, Mayo Clinic, 3M, and Disney. Fancy resume, regular guy.
            </p>
            <p className="mt-3 text-muted-foreground">
              He's sat in your seat more than once. He knows what the first move looks like, and he'll help you make it.
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
          Don't want to DIY?
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          We'll just{" "}
          <span className="text-gradient-brand">build it for you.</span>
        </h2>
        <div className="mt-8 flex justify-center">
          <Link
            to="/services"
            className="group inline-flex items-center gap-3 rounded-full bg-hero-gradient px-7 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90"
          >
            See what we build
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
                Where we meet
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
              Stop thinking about it. Come start it.
            </h2>
            <p className="mt-4 text-base text-white/90 md:mt-5 md:text-lg">
              {WORKSHOP_PRICE_LABEL} gets you one morning with us and a real plan you can run with Monday. If you want us to build the brand, the site, or the whole launch after — we're right here. If not, you keep the plan either way.
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
