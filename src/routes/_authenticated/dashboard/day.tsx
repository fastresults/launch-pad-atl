import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { getMyCohort } from "@/lib/cohort.functions";
import { SCHEDULE_BLOCKS } from "@/lib/workshop-mode";
import { WORKFLOW, STAGES } from "@/lib/workflow";
import { EVENT } from "@/lib/schedule-data";
import { MapPin, Calendar, Clock, Sparkles, FileText, ArrowRight } from "lucide-react";

const PILLARS = STAGES.filter((s) => s.n >= 1);
const TOTAL_DOC_MIN = WORKFLOW.reduce((sum, d) => sum + d.estMinutes, 0);

export default function WorkshopDayPage() {
  const { data } = useQuery({ queryKey: ["my", "cohort"], queryFn: () => getMyCohort(), staleTime: 60_000 });
  const cohort = data?.cohort;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your workshop morning</h1>
        <p className="mt-2 text-muted-foreground">
          {cohort
            ? `${cohort.dateLabel} · ${EVENT.timeLabel}. Show up with an idea — leave with the ${WORKFLOW.length} documents that turn it into a real startup.`
            : `One morning. Show up with an idea — leave with the ${WORKFLOW.length} documents that turn it into a real startup.`}
        </p>
      </div>

      {/* What you walk out with — hero strip */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" /> What you walk out with
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          Walk in with an idea. Walk out ready to execute Monday.
        </h2>
        <p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
          You do the thinking out loud. Your AI cofounder writes everything down — the plan, the money math, the pitch, the boring-but-important stuff. By 11:30 AM you've got {WORKFLOW.length} documents in your Drive and a really clear head.
        </p>
      </div>

      {/* Cohort card */}
      {cohort ? (
        <div className="rounded-3xl border border-white/10 bg-card p-6 md:p-8">
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
            <a href={cohort.googleCalendarUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-card px-4 py-2 text-sm hover:bg-white/5">Add to calendar</a>
            <a href={cohort.mapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-card px-4 py-2 text-sm hover:bg-white/5">Get directions</a>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-card p-6 text-sm text-muted-foreground">
          We haven't matched you to a workshop date yet. We'll let you know.
        </div>
      )}

      {/* The 5 pillars */}
      <section>
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          The 5 things every real startup needs
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          We move through them in order. Each one feeds the next, so by the time we hit the last pillar, every document already knows your numbers, your market, and your story.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const docs = WORKFLOW.filter((d) => d.stageN === pillar.n);
            const minutes = docs.reduce((s, d) => s + d.estMinutes, 0);
            return (
              <div key={pillar.n} className="rounded-2xl border border-white/10 bg-card p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">{pillar.label}</div>
                  <span className="text-xs tabular-nums text-muted-foreground">{minutes}m</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {docs.map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-background/40 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{d.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{d.estMinutes}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
                    ? "border-white/10 bg-background/40"
                    : "border-white/10 bg-card"
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
                      Pillar {b.stageN}
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
          <li className="rounded-xl border border-white/10 bg-card p-4">Your laptop and charger. You're driving.</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">A government-issued ID — we'll use it to set up your LLC paperwork.</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">Your idea, even if it lives on a sticky note. We'll sharpen it together.</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">One question you really want answered before you leave.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing to pay on the day. Any state filings happen from home afterward — we'll walk you through exactly what to click.
        </p>
      </section>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard/brief" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90">
          Start my brief
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/dashboard/workflow" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-card px-6 py-3 text-base font-medium hover:bg-white/5">
          Peek at all {WORKFLOW.length} documents
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
