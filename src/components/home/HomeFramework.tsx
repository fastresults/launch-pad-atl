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
import heroCoffee from "@/assets/hero-coffee-nosteam.png";
import { motion, useReducedMotion } from "framer-motion";
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
    <div className="marketing-surface min-h-screen">
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
  const reduceMotion = useReducedMotion();
  return (
    <section
      className="relative overflow-hidden border-b border-[#E4D9C4]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 88% 22%, rgba(201,185,154,0.20), transparent 60%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {/* Magazine masthead */}
        <div className="mb-10 flex flex-col gap-2 border-b border-[#C9B99A] pb-4 md:flex-row md:items-end md:justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B7355]">
            Issue No. 01 &mdash; The Pivot
          </div>
          <div className="font-serif text-sm italic text-[#8B7355]">
            Pull up a chair
          </div>
        </div>

        {/* Hero — 9/3 asymmetric editorial grid, shared top + bottom baselines */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* LEFT COLUMN — kicker, headline, deck, secondary, designed-for */}
          <div className="flex flex-col lg:col-span-8">
            <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B7355] md:text-sm">
              <Star className="size-3.5 fill-current" />
              One focused morning · IGNITE Center · Coffee&rsquo;s on us
            </p>

            <h1 className="font-serif text-5xl leading-[1.02] text-[#3D3025] md:text-6xl">
              Pull up a chair.
              <br />
              Let&rsquo;s start your business{" "}
              <span className="italic text-[#8B7355]">together, over coffee.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#5C4A38] md:text-xl">
              One quiet morning. A good cup of coffee. Someone who&rsquo;s done this before, sitting next to you while you actually build the thing. You&rsquo;ll leave with a real page, a real price, and your first customer already knowing your name.
            </p>

            <p className="mt-4 max-w-xl text-base text-[#7A6650]">
              For nurses, teachers, servers, coders, couples on Main Street &mdash; anyone who&rsquo;s been meaning to start something. Come sit with us. We&rsquo;ll figure it out together.
            </p>

            {/* Designed for — closes the left column and balances the right card */}
            <div className="mt-auto pt-10">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8B7355]">
                Designed for
              </p>
              <ul className="grid gap-x-8 gap-y-2 text-sm text-[#3D3025] sm:grid-cols-2">
                <li className="flex gap-2"><span className="text-[#C9B99A]">&bull;</span> Plan-B seekers ready to stop guessing</li>
                <li className="flex gap-2"><span className="text-[#C9B99A]">&bull;</span> Professionals whose jobs are changing</li>
                <li className="flex gap-2"><span className="text-[#C9B99A]">&bull;</span> Main Street operators &mdash; shops, trades, cafés</li>
                <li className="flex gap-2"><span className="text-[#C9B99A]">&bull;</span> Families and couples building together</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN — cup on page (no frame), price card below */}
          <div className="flex flex-col lg:col-span-4">
            {/* Coffee cup sits directly on the cream page with animated steam */}
            <div className="relative mx-auto w-full max-w-[280px] lg:max-w-none">
              {/* Animated steam wisps */}
              <svg
                aria-hidden="true"
                viewBox="0 0 120 90"
                className="pointer-events-none absolute left-1/2 top-0 h-[28%] w-[46%] -translate-x-1/2 -translate-y-4"
                fill="none"
                stroke="#8B7355"
                strokeWidth={2.2}
                strokeLinecap="round"
              >
                {[
                  { d: "M40 82 C 32 62, 52 52, 40 32 C 32 18, 46 8, 40 0", delay: 0 },
                  { d: "M60 82 C 52 60, 72 50, 60 30 C 52 16, 66 6, 60 0", delay: 0.9 },
                  { d: "M80 82 C 72 62, 92 52, 80 32 C 72 18, 86 8, 80 0", delay: 1.7 },
                ].map((w, i) => (
                  <motion.path
                    key={i}
                    d={w.d}
                    initial={{ opacity: 0.2, y: 0, x: 0 }}
                    animate={
                      reduceMotion
                        ? { opacity: 0.35 }
                        : {
                            opacity: [0.15, 0.45, 0.15],
                            y: [0, -6, 0],
                            x: [0, i === 1 ? 2 : -2, 0],
                          }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0.5 }
                        : {
                            duration: 4.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: w.delay,
                          }
                    }
                    style={{ filter: "blur(0.6px)" }}
                  />
                ))}
              </svg>

              <motion.img
                src={heroCoffee}
                alt=""
                width={912}
                height={1024}
                className="pointer-events-none relative mx-auto h-auto w-[86%] select-none"
                draggable={false}
                initial={{ opacity: 0, y: 8 }}
                animate={
                  reduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 1, y: [0, -3, 0] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.5 }
                    : { opacity: { duration: 0.6 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
                }
              />
            </div>

            {/* Price + CTA card — snaps to bottom baseline with the designed-for list */}
            <div className="mt-8 flex flex-1 flex-col rounded-2xl border border-[#E4D9C4] bg-[#FBF7F1] p-7 shadow-[0_20px_60px_-30px_rgba(61,48,37,0.35)]">
              <div className="border-b border-[#E4D9C4] pb-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-6xl leading-none text-[#3D3025]">
                    {WORKSHOP_PRICE_LABEL}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
                  Just one morning. Come as you are.
                </p>
              </div>

              <p className="mt-5 text-base leading-snug text-[#3D3025]">
                You bring the idea. We&rsquo;ll bring the coffee &mdash; and build it with you.
              </p>

              <Link
                to="/register"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#8B7355] px-6 py-4 text-base font-semibold text-[#FAF8F5] transition-colors hover:bg-[#6E5B42]"
              >
                Reserve your seat <ArrowRight className="size-4" />
              </Link>

              <button
                type="button"
                onClick={() => setModesOpen(true)}
                className="mt-3 block w-full text-center text-sm text-[#8B7355] underline decoration-[#C9B99A] decoration-2 underline-offset-4 transition-colors hover:text-[#3D3025]"
              >
                Can&rsquo;t make it? See the other two ways.
              </button>
            </div>
          </div>
        </div>

        <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />

        {/* Magazine footnote — 3 promises */}
        <div className="mt-16 grid grid-cols-1 gap-8 border-t border-[#C9B99A] pt-8 md:grid-cols-3">
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">01</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">A live page at your domain.</strong> Not a mockup. A real URL a stranger can open.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">02</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">A priced offer that takes money.</strong> Set before lunch. Named first customer on it.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">03</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">Your first outreach written in the room.</strong> Message, list, and send button — ready before you leave.
            </p>
          </div>
        </div>

        {/* Event meta strip */}
        <div className="mt-10 grid grid-cols-1 gap-3 text-sm text-[#5C4A38] sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={<Calendar className="size-4" />} label={EVENT.dateLabel} />
          <Meta icon={<MapPin className="size-4" />} label={`${EVENT.venueCity}, ${EVENT.venueRegion}`} />
          <Meta icon={<Clock className="size-4" />} label="8:45–11:30 AM · Coffee included" />
          <Meta icon={<Users className="size-4" />} label="Just 20 seats" />
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
          What we actually build with you
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          A real startup that takes money.{" "}
          <span className="text-gradient-brand">Built with you in one morning.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          A course gives you videos. A chatbot gives you a folder of files. We sit down and actually build the startup — the live page, the priced offer, the first message sent. By that afternoon you're not planning anymore. You're open. {WORKSHOP_PRICE_LABEL} once. Yours to run with.
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
                      <TooltipContent side="top" sideOffset={6} className="max-w-[320px] border border-[#C9B99A] bg-[#F0EBE3] px-4 py-3 text-sm leading-relaxed text-[#3D3025] shadow-md rounded-none">
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
    "A live landing page at your domain — real URL, up before lunch, not a mockup",
    "A priced offer on the page — ready to accept your first customer",
    "Your Foundation on the dashboard — positioning, ICP, and wedge, sharpened with staff",
    "A 90-day go-to-market plan — personas + outreach sequence you can send this week",
    "Brand v0 — name, mark, and voice you can actually use Monday morning",
    "A seat next to Adam and 19 other founders — coffee, snacks, and a room building alongside you",
  ];


  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Here's the honest promise
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Two weeks to your first dollar.{" "}
          <span className="text-gradient-brand">A real startup by month two.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Almost everyone who tries to start a business does the same thing: they spend six months and a chunk of savings on a logo, a fancy site, and ads — and never actually ask a single person for money. We flip it. In one morning we actually build your page, price the offer, and send the first message — from the room, to a real person. Everything pretty comes after the money starts.
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
