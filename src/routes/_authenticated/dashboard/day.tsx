import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { getMyCohort } from "@/lib/cohort.functions";
import { listSnapshots } from "@/lib/foundersHub.functions";
import { SCHEDULE_BLOCKS } from "@/lib/workshop-mode";
import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables";
import { EVENT } from "@/lib/schedule-data";
import { MapPin, Calendar, Clock, Sparkles, ArrowRight, Mic, Wand2, Play, Lock, Presentation } from "lucide-react";
import { STAGE_DECKS } from "@/components/workshop-slides/registry";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TOTAL_DELIVERABLES = FRAMEWORK_STAGES.reduce((n, s) => n + s.items.length, 0);
const TOTAL_CATEGORIES = FRAMEWORK_STAGES.length;
const CORE_CATEGORIES = FRAMEWORK_STAGES.filter((s) => !s.bonus).length;
const BONUS_CATEGORIES = FRAMEWORK_STAGES.filter((s) => s.bonus).length;

export default function WorkshopDayPage() {
  const { data } = useQuery({ queryKey: ["my", "cohort"], queryFn: () => getMyCohort(), staleTime: 60_000 });
  const cohort = data?.cohort;
  const { data: snapshots = [] } = useQuery({ queryKey: ["hub", "snapshots"], queryFn: listSnapshots, staleTime: 60_000, retry: false });
  const hasVentures = snapshots.length > 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your 14-Day Sprint</h1>
        <p className="mt-2 text-muted-foreground">
          {cohort
            ? `${cohort.dateLabel} · ${EVENT.timeLabel}. One focused morning with a founder coach — you walk out clear on what you're building, who it's for, how it makes money, and what to ship first.`
            : `One focused morning with a founder coach. You walk out clear on what you're building, who it's for, how it makes money, and what to ship first.`}
        </p>
      </div>

      {/* Walk-out value — hero strip */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" /> What you walk out able to do
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          Walk in with an idea. Walk out knowing what to do with it.
        </h2>
        <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground">
          You do the thinking out loud. Your coach guides you through it — who you serve, why people should care, how you price, where your first customers come from, and what the money really looks like. You leave with clear answers, a Monday-morning action plan, and {TOTAL_DELIVERABLES} founder-ready startup assets built for your startup across {TOTAL_CATEGORIES} categories — Foundation, Strategy, Operations, Finance, Governance, plus bonus Brand, Marketing, and Social &amp; Content tracks — waiting in your dashboard to refine and ship.
        </p>
      </div>

      {/* Workshop decks — one per stage */}
      <WorkshopDecksSection />



      {/* Two ways to build it */}
      <section>
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">Two ways to build it</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Same {TOTAL_CATEGORIES} categories, same {TOTAL_DELIVERABLES} founder-ready startup assets. Pick the path that fits where you are right now.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card A — Guided in the room */}
          <div className="flex flex-col rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Mic className="h-3.5 w-3.5" /> Guided workshop path · recommended
            </div>
            <h3 className="mt-2 text-lg font-semibold">Build it out loud with your coach</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We move through the {TOTAL_CATEGORIES} categories together, one at a time. You talk it out, your coach keeps you moving, and your answers turn into your brief and your startup assets as you go. Best if it's your first time putting the idea into words.
            </p>
            <div className="mt-4">
              <Link to="/dashboard/brief" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Start my founder brief <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card B — Fast venture path */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" /> Fast venture path · head start
            </div>
            <h3 className="mt-2 text-lg font-semibold">Drop in a link or a paragraph, get all {TOTAL_DELIVERABLES} back</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste your site or describe your startup. We enrich it, generate every startup asset in order, and hand it back so you can walk in with something to react to — not a blank page.
            </p>
            <div className="mt-4">
              <Link to="/dashboard/hub/new" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-medium hover:bg-muted/40">
                Spin up a venture <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cohort card */}
      {cohort ? (
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="text-xs text-muted-foreground">You're in. Here's the where and when.</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            <Calendar className="h-4 w-4" /> {cohort.dateLabel}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{EVENT.timeLabel} · {EVENT.durationLabel}</div>
          <div className="mt-3 flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <span>{cohort.venueName} · {cohort.venueAddress}, {cohort.venueCity}, {cohort.venueRegion} {cohort.venuePostal}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={cohort.googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted/40">Add to calendar</a>
            <a href={cohort.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted/40">Get directions</a>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          We haven't set your 14-Day Sprint start date yet. We'll let you know.
        </div>
      )}

      {/* The categories */}
      <section>
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          The {TOTAL_CATEGORIES} categories we build for your startup
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {CORE_CATEGORIES} core categories every startup needs, plus {BONUS_CATEGORIES} bonus tracks for brand, marketing, and social. We move through them in order so each answer feeds the next — by the end, your story, your numbers, and your launch moves all line up.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FRAMEWORK_STAGES.map((stage) => (
            <div key={stage.number} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {stage.number} · {stage.name}
                </div>
                {stage.bonus && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Bonus
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{stage.intro}</p>
              <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground/80">
                Deliverables you'll walk out with
              </div>
              <ul className="mt-2 space-y-1.5">
                {stage.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* The morning, block by block */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">How the morning goes</h2>
        <ol className="space-y-2">
          {SCHEDULE_BLOCKS.map((b, i) => (
            <li
              key={i}
              className={`flex items-start gap-4 rounded-xl border p-4 ${
                b.kind === "break"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : b.kind === "checkin" || b.kind === "close"
                    ? "border-border bg-background/40"
                    : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-mono tabular-nums text-muted-foreground w-24 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {minutesToClock(b.startMin)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  {b.stageN && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Category {b.stageN}
                    </span>
                  )}
                  <span className="font-medium">{b.title}</span>
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{b.subtitle}</div>
              </div>
              <span className="shrink-0 self-center text-xs tabular-nums text-muted-foreground">
                {b.endMin - b.startMin}m
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* What to bring */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Bring four things</h2>
        <ul className="space-y-2 text-sm">
          <li className="rounded-xl border border-border bg-card p-4">Your laptop and charger — you drive the thinking, your coach keeps you moving.</li>
          <li className="rounded-xl border border-border bg-card p-4">A government-issued ID, so the legal setup for your startup is ready to file when you are.</li>
          <li className="rounded-xl border border-border bg-card p-4">A rough idea we can sharpen into a real offer — sticky-note energy is welcome.</li>
          <li className="rounded-xl border border-border bg-card p-4">The one question you most want answered before you walk out.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing to pay on the day. Any state filings happen from home afterward — we'll walk you through exactly what to click.
        </p>
      </section>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard/hub" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90">
          See all {TOTAL_DELIVERABLES} startup assets we build together
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// 0 = 8:45 AM (matches SCHEDULE_BLOCKS and EVENT.timeLabel)
function minutesToClock(min: number): string {
  const totalMin = 8 * 60 + 45 + min;
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function WorkshopDecksSection() {
  return (
    <section>
      <Accordion type="single" collapsible className="rounded-2xl border bg-card">
        <AccordionItem value="decks" className="border-b-0">
          <AccordionTrigger className="px-5 hover:no-underline">
            <div className="text-left">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary mb-1">
                <Presentation className="h-4 w-4" /> Stage decks · set the stage before each block
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Workshop decks</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5">
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              One presentation per stage — what you're about to build, why it matters, and what you'll walk out with. Open one before the block, present it fullscreen, then dive in.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STAGE_DECKS.map((d) => {
                const slideCount = d.slides.length;
                if (d.available) {
                  return (
                    <Link
                      key={d.slug}
                      to={`/workshop/${d.slug}`}
                      className="group flex flex-col rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 hover:border-primary/60 transition"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-primary">
                        <span>Stage {d.stageNumber}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5">
                          <Play className="h-3 w-3" /> {slideCount} slides
                        </span>
                      </div>
                      <div className="mt-2 text-base font-semibold tracking-tight">{d.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Open deck →</div>
                    </Link>
                  );
                }
                return (
                  <div
                    key={d.slug}
                    className="flex flex-col rounded-2xl border bg-muted/30 p-4 opacity-70"
                    aria-disabled
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Stage {d.stageNumber}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Lock className="h-3 w-3" /> Soon
                      </span>
                    </div>
                    <div className="mt-2 text-base font-semibold tracking-tight">{d.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Coming next</div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );

}

