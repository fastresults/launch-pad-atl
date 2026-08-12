import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { VideoTestimonials } from "@/components/home/VideoTestimonials";
import { CinematicHero } from "@/components/home/CinematicHero";
import { FounderVideoWall } from "@/components/home/FounderVideoWall";
import { HomeBusinessIdeasScroller } from "@/components/home/HomeBusinessIdeasScroller";
import { StageSketch, OverviewSketch } from "@/components/home/StageSketch";
import { WorkshopStack } from "@/components/home/workshop/WorkshopStack";
import { useSelectedWorkshop } from "@/hooks/use-selected-workshop";
import { FOUNDATION_SLUG } from "@/lib/workshop-catalog";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import { useEvent } from "@/lib/use-event";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BUILD_LAYER,
  FOUNDATION_FIRST_REASONS,
  FRAMEWORK_STAGES,
  WORKSHOP_PRICE_LABEL,
} from "@/lib/framework-deliverables";
import { DeliverableCheck } from "@/components/home/DeliverableCheck";
import { BuildLayerCard } from "@/components/home/BuildLayerCard";


import { BUILD_WORKSHOPS } from "@/lib/build-workshops";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import heroBg from "@/assets/hero-bg.png";
import heroCoffee from "@/assets/hero-coffee-nosteam.png";
import heroCoffeeLoop from "@/assets/hero-coffee-loop.mp4.asset.json";

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
  const { workshop } = useSelectedWorkshop();
  // The copy block, the four foundations, the honest roadmap and the ideas
  // scroller are all Foundation's story. On a build workshop the stack above
  // already tells that workshop's story, so they'd only contradict it.
  const isFoundation = workshop.slug === FOUNDATION_SLUG;
  return (
    <div className="public-surface min-h-screen">
      <SiteHeader />
      <Hero />
      <FounderVideoWall />
      <WorkshopStack workshop={workshop} />
      {isFoundation && <HeroCopy />}
      <VideoTestimonials />
      {isFoundation && <Framework />}
      {isFoundation && showScroller && <HomeBusinessIdeasScroller />}
      {isFoundation && <HonestRoadmap />}
      <Facilitator />
      <ServicesTeaser />
      <Venue />
      <BottomCTA />
      <SiteFooter />
    </div>
  );
}

/** Cinematic founder hero — see components/home/CinematicHero.tsx */
function Hero() {
  return <CinematicHero />;
}

function HeroCopy() {
  const EVENT = useEvent();
  const [modesOpen, setModesOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <section
      id="the-morning"
      className="public-story relative isolate scroll-mt-24 overflow-hidden border-b border-[#E4D9C4]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 88% 18%, oklch(0.5 0.13 272 / 26%), transparent 62%)",
      }}
    >
      <div className="public-container px-6 py-10 md:py-12">
        {/* Magazine masthead */}
        <div className="mb-8 flex flex-col gap-2 border-b border-[#C9B99A] pb-4 md:flex-row md:items-end md:justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B7355]">
            Issue No. 01 &mdash; The Pivot
          </div>
          <div className="font-serif text-sm italic text-[#8B7355]">
            Pull up a chair
          </div>
        </div>

        {/* Hero — 7/5 editorial grid, shared bottom baseline */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10 lg:gap-14">
          {/* LEFT COLUMN — kicker, headline, deck, pull quote, designed-for */}
          <div className="flex flex-col md:col-span-7 lg:col-span-8">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B7355] md:text-sm">
              <Star className="size-3.5 fill-current" />
              Atlanta&rsquo;s strongest startup foundation · IGNITE Center
            </p>

            <h1 className="public-display font-serif text-[#3D3025]">

              Pull up a chair.
              <br />
              Let&rsquo;s start your business{" "}
              <span className="italic text-[#8B7355]">together, over coffee.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5C4A38] md:text-xl">
              One quiet morning. A good cup of coffee. Someone who&rsquo;s done this before, sitting next to you while you lay the foundation your business will stand on. You leave with the four foundations written, not outlined: your brand, your priced offer, your page copy, and the way the business runs. Not a summary of what to write &mdash; the actual words, ready to build on the same week.
            </p>

            <p className="mt-3 max-w-2xl text-base text-[#7A6650]">
              For nurses, teachers, servers, coders, couples on Main Street &mdash; anyone who&rsquo;s been meaning to start something. Come sit with us. We&rsquo;ll figure it out together.
            </p>

            {/* Editorial pull quote — horizontal callout */}
            <figure className="mt-8 max-w-2xl border-l-4 border-[#C9B99A] pl-5">
              <blockquote className="sl-quote font-serif text-xl font-light leading-snug md:text-2xl">
                No accelerator, incubator, or startup bootcamp in Atlanta hands you a stronger foundation than you&rsquo;ll walk out with here &mdash; brand, offer, page copy, and operations, all written before lunch.
              </blockquote>
            </figure>


            <p className="mt-8 max-w-2xl text-xs font-semibold uppercase leading-relaxed tracking-[0.18em] text-[#8B7355]">
              Accelerators work on your pitch. Incubators work on your idea. We work on the four things a business stands on &mdash; and you leave holding all four in writing.
            </p>


            {/* Designed for — anchors the bottom of the left column */}
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

          {/* RIGHT COLUMN — one composed object: cameo cup + price card */}
          <div className="flex flex-col md:col-span-5 lg:col-span-4">
            {/* Cameo — cup grounded in a soft cream vignette */}
            <div
              className="relative mx-auto flex w-full max-w-[380px] items-end justify-center"
              style={{
                height: 320,
                backgroundImage:
                  "radial-gradient(ellipse at 50% 62%, oklch(0.55 0.13 285 / 30%), transparent 66%)",
              }}
            >
              {/* Steam wisps — scoped inside the cameo, below header */}
              <svg
                aria-hidden="true"
                viewBox="0 0 120 90"
                className="pointer-events-none absolute left-1/2 top-2 z-0 h-[52%] w-[52%] -translate-x-1/2"
                fill="none"
                stroke="#8B7355"
                strokeWidth={3}
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
                    initial={{ opacity: 0.2 }}
                    animate={
                      reduceMotion
                        ? { opacity: 0.35 }
                        : {
                            opacity: [0.15, 0.45, 0.15],
                            y: [0, -10, 0],
                            x: [0, i === 1 ? 3 : -3, 0],
                          }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0.5 }
                        : { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: w.delay }
                    }
                    style={{ filter: "blur(0.6px)" }}
                  />
                ))}
              </svg>

              <motion.div
                className="relative z-10 mx-auto h-[300px] w-full max-w-[300px] overflow-hidden rounded-2xl border border-[#E4D9C4] bg-[#FBF7F1]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <video
                  src={heroCoffeeLoop.url}
                  poster={heroCoffee}
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
                {/* Theme wash — ties the clip to the page palette */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 62%, oklch(0.55 0.13 285 / 22%), transparent 70%), linear-gradient(to bottom, rgba(251,247,241,0.10), rgba(61,48,37,0.16))",
                  }}
                />
              </motion.div>

            </div>

            {/* Price card — cream on cream, hairline only, no shadow */}
            <div className="mx-auto mt-2 w-full max-w-[380px] rounded-2xl border border-[#E4D9C4] bg-[#FBF7F1] px-7 py-7">
              <div className="border-b border-[#E4D9C4] pb-5">
                <span className="font-serif text-6xl leading-none text-[#3D3025]">
                  {WORKSHOP_PRICE_LABEL}
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
                  Just one morning. Come as you are.
                </p>
              </div>

              <p className="mt-5 text-base leading-snug text-[#3D3025]">
                You bring the idea. We&rsquo;ll bring the coffee &mdash; and write the foundation with you.
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

              <div className="mt-5 border-t border-dashed border-[#C9B99A] pt-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B7355]">
                  Prefer just you &amp; Adam?
                </p>
                <Link
                  to="/private-tuesday"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#3D3025] underline decoration-[#C9B99A] decoration-2 underline-offset-4 hover:text-[#8B7355]"
                >
                  Private Tuesday at IGNITE &mdash; $397 <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom spacer to align baseline with left column's designed-for */}
            <div className="mt-auto" />
          </div>
        </div>

        <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />

        {/* Magazine footnote — the four foundations */}
        <p className="mt-16 border-t border-[#C9B99A] pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B7355]">
          Four foundations get written with you this morning. Not outlined. Written.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">01</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">Brand.</strong> Your name, your positioning, and the way you sound. Locked in the room, in the words you&rsquo;ll use everywhere.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">02</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">Product.</strong> One offer, priced, with the reason someone pays that number written in plain English.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">03</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">Marketing.</strong> The real copy and structure for your page, plus fifty named prospects and the exact message to send each one.
            </p>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-3xl text-[#8B7355]">04</span>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3025]">
              <strong className="font-semibold">Operations.</strong> How money comes in, what happens after the yes, and the working assets a banker or first hire reads in 60 seconds.
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
      <div className="public-container px-6">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
              Not an accelerator. Not an incubator. Not a course.
            </p>
            <h2 className="public-heading max-w-3xl">
              A foundation that can take money.{" "}
              <span className="text-gradient-brand">Laid with you in one morning.</span>
            </h2>
          </div>
          <OverviewSketch className="hidden size-24 shrink-0 text-foreground/70 lg:block" />
        </div>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          A course gives you videos. A chatbot gives you a folder of files. We sit down and write the four foundations your startup can build on — brand, product, marketing, operations. By that afternoon you're not planning anymore. You're holding the actual words, website PRD, and operating foundation your startup builds from next. {WORKSHOP_PRICE_LABEL} once. Yours to keep building.
        </p>

        <p className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Check className="size-3.5 text-primary" strokeWidth={3} />
          Every item below is checked off with you, in the room — not homework.
        </p>


        <div className="mt-14 space-y-14 md:space-y-20">
          {FRAMEWORK_STAGES.map((stage) => (
            <div key={stage.number}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold leading-none text-gradient-brand opacity-100 md:text-6xl">
                    {stage.number}
                  </span>
                  <div>
                    <h3 className="public-subheading flex flex-wrap items-center gap-x-3 gap-y-2">
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
                <StageSketch
                  stage={stage.number}
                  className="hidden size-20 shrink-0 text-foreground/80 md:block md:size-24"
                />
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {stage.items.map((d) => (
                  <Tooltip key={d.title} delayDuration={150}>
                    <TooltipTrigger asChild>
                      <DeliverableCheck title={d.title} icon={d.icon} />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-[320px] border border-[#C9B99A] bg-[#F0EBE3] px-4 py-3 text-sm leading-relaxed text-[#3D3025] shadow-md rounded-none">
                      {d.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ))}
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
    "Your brand written — name, voice, and the words you lead with",
    "Your one offer, priced — what it is, who it's for, what it costs",
    "Your page copy, written line by line — headline, proof, and call to action, ready to build",
    "Your Foundation on the dashboard — positioning, ICP, and wedge, sharpened with staff",
    "Your first outreach written — the message and the named person it goes to",
    "A seat next to Adam and 19 other founders — coffee, snacks, and a room building alongside you",
  ];



  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="public-container px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Here's the honest promise
        </p>
        <h2 className="public-heading max-w-3xl">
          One morning of writing.{" "}
          <span className="text-gradient-brand">The four foundations your startup runs on.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Almost everyone who tries to start a business does the same thing: they spend six months and a chunk of savings on a logo, a fancy site, and ads — and never actually ask a single person for money. We flip it. In one morning we write the foundation underneath it: the brand, the priced offer, the page copy, and the way the money comes in — plus the exact first message and the named person it goes to. The building happens that same week, on top of what we wrote — not instead of it.
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
              What {WORKSHOP_PRICE_LABEL} gets you — written in the room
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
            The foundation holds the weight — here's what you stack on it. Once money's coming in, there are eight more mornings you can come back for: a real brand, a website that actually sells, a way to keep customers coming, a script for closing more of them, and simple systems that save you hours. One piece at a time, done together, with our team building it out after. Or just hand the list to our team and we'll build it for you.
          </p>



          <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Eight mornings — pick the one you need next
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {BUILD_LAYER.map((b) => {
              const workshop = BUILD_WORKSHOPS.find((w) => w.capability === b.capability);
              return (
                <BuildLayerCard
                  key={b.title}
                  item={b}
                  href={workshop ? `/build/${workshop.slug}` : "/build"}
                  priceLabel={workshop?.priceLabel ?? "$197"}
                />
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
      <div className="public-container px-6">
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
        <h2 className="public-heading">
          We'll build on the foundation{" "}
          <span className="text-gradient-brand">for you.</span>
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
      <div className="public-container px-6">
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
      <div className="public-container px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero-gradient p-8 md:p-12 lg:p-16">
          <div className="relative max-w-3xl text-white">
            <h2 className="public-heading">
              Stop thinking about it. Come start it.
            </h2>
            <p className="mt-4 text-base text-white/90 md:mt-5 md:text-lg">
              {WORKSHOP_PRICE_LABEL} gets you one morning with us and a real foundation in writing — brand, priced offer, page copy, operations — that you can start building on Monday. If you want us to build the brand, the site, or the whole launch on top of it after, we're right here. If not, the foundation is yours either way.
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
