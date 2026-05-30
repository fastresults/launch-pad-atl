import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyBrief } from "@/lib/brief.functions";
import { getMyFiling } from "@/lib/filing.functions";
import { getMyWorkflow } from "@/lib/userPipeline.functions";
import { getMyCohort } from "@/lib/cohort.functions";
import { getWorkshopMode, formatMinutesLeft, FRIENDLY_STAGE, type WorkshopState } from "@/lib/workshop-mode";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { NextActionCard } from "@/components/dashboard/NextActionCard";
import { BriefCompleteCard } from "@/components/brief/BriefCompleteCard";
import { Calendar, MapPin, Coffee, Sparkles, CheckCircle2, Hand } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: TodayPage,
});

function TodayPage() {
  const briefFn = useServerFn(getMyBrief);
  const filingFn = useServerFn(getMyFiling);
  const wfFn = useServerFn(getMyWorkflow);
  const cohortFn = useServerFn(getMyCohort);

  const brief = useQuery({ queryKey: ["my", "brief"], queryFn: () => briefFn() });
  const filing = useQuery({ queryKey: ["my", "filing"], queryFn: () => filingFn() });
  const wf = useQuery({ queryKey: ["my", "workflow"], queryFn: () => wfFn() });
  const cohort = useQuery({ queryKey: ["my", "cohort"], queryFn: () => cohortFn(), staleTime: 60_000 });

  // Re-render once a minute so the mode and clock stay live
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const state = getWorkshopMode(new Date(), cohort.data?.cohort ?? null);
  const briefScore = brief.data?.brief?.completeness_score ?? 0;
  const briefTotal = 10;
  const briefReady = briefScore >= 6;
  const filingReady = !!filing.data?.filing?.llc_name;
  const items = wf.data?.items ?? [];
  const generated = items.filter((i) => i.generated).length;
  const total = items.length;
  const firstName = (brief.data?.brief?.one_line_pitch || "").split(" ")[0] || null;

  const pitch = brief.data?.brief?.one_line_pitch ?? null;

  return (
    <div className="space-y-8">
      {state.mode === "before" && (
        <BeforeMode
          state={state}
          briefScore={briefScore}
          briefTotal={briefTotal}
          firstName={firstName}
          pitch={pitch}
        />
      )}
      {state.mode === "during" && (
        <DuringMode state={state} generated={generated} total={total} />
      )}
      {state.mode === "after" && (
        <AfterMode state={state} generated={generated} total={total} briefReady={briefReady} filingReady={filingReady} />
      )}
      {state.mode === "none" && (
        <NoCohortMode briefScore={briefScore} briefTotal={briefTotal} pitch={pitch} />
      )}
    </div>
  );
}

// ============ MODE A — BEFORE the workshop ============

function BeforeMode({
  state,
  briefScore,
  briefTotal,
  firstName,
  pitch,
}: {
  state: WorkshopState;
  briefScore: number;
  briefTotal: number;
  firstName: string | null;
  pitch: string | null;
}) {
  const cohort = state.cohort!;
  const briefDone = briefScore >= briefTotal;
  const pct = briefScore / briefTotal;

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {firstName ? `Welcome` : `Welcome`}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your workshop is in <strong className="text-foreground">{state.daysUntil} {state.daysUntil === 1 ? "day" : "days"}</strong>. Let's get you ready.
          </p>
        </div>
        <ProgressRing value={pct} label={`${briefScore}/${briefTotal}`} sublabel="ready" size={96} stroke={8} />
      </div>

      {/* Workshop countdown card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Calendar className="h-4 w-4" /> Your workshop
        </div>
        <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">{cohort.dateLabel}</div>
        <div className="mt-1 text-sm text-muted-foreground">8:00 AM – 4:30 PM ET</div>
        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{cohort.venueName} · {cohort.venueAddress}, {cohort.venueCity}, {cohort.venueRegion}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={cohort.googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-white/10 bg-card px-4 py-2 text-sm hover:bg-white/5"
          >
            Add to calendar
          </a>
          <a
            href={cohort.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-white/10 bg-card px-4 py-2 text-sm hover:bg-white/5"
          >
            Get directions
          </a>
        </div>
      </div>

      {/* The one next thing */}
      {briefDone ? (
        <BriefCompleteCard
          pitch={pitch}
          secondary={{ to: "/dashboard/day", label: "What to bring →" }}
          footnote="You're all set for Saturday. Just show up."
        />
      ) : (
        <NextActionCard
          eyebrow="Pre-work"
          title={briefScore === 0 ? "Answer 10 quick questions about your startup." : "Pick up where you left off."}
          description={
            <>
              You can talk instead of type. Your AI assistant uses these answers all day Saturday to build your 25 deliverables.
              You're <strong className="text-foreground">{briefScore} of {briefTotal}</strong> done.
            </>
          }
          primary={{ to: "/dashboard/brief", label: briefScore === 0 ? "Start" : "Keep going" }}
        />
      )}

      <WalkOutPreview />
    </>
  );
}

// ============ MODE B — DURING the workshop ============

function DuringMode({ state, generated, total }: { state: WorkshopState; generated: number; total: number }) {
  const block = state.currentBlock!;

  if (block.kind === "break") {
    return (
      <>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{block.title}</h1>
        <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 md:p-10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Coffee className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wide">On break</span>
          </div>
          <p className="mt-3 text-xl md:text-2xl font-medium leading-snug">{block.subtitle}</p>
          <p className="mt-2 text-muted-foreground">
            Back at {minutesToClock(block.endMin)} ET. Your AI assistant keeps working while you take a breather.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-emerald-500/20 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pctOfBlock(state)}%` }}
              />
            </div>
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              {formatMinutesLeft(state.minutesLeftInBlock ?? 0)}
            </span>
          </div>
        </div>
        <RecentlyFinished />
      </>
    );
  }

  if (block.kind === "close") {
    return <WalkOutMoment />;
  }

  if (block.kind === "checkin") {
    return (
      <>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Good morning</h1>
        <p className="mt-2 text-muted-foreground">{block.subtitle}</p>
        <NextActionCard
          eyebrow="Starting soon"
          title="We start at 8:30 AM."
          description="Grab coffee, get comfortable, and review your brief if you'd like."
          primary={{ to: "/dashboard/brief", label: "Open my brief" }}
        />
      </>
    );
  }

  // Stage block
  const stageN = block.stageN!;
  const friendly = FRIENDLY_STAGE[stageN];

  return (
    <>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-primary">Stage {stageN} of 7 · we're live</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">{friendly.title}</h1>
        <p className="mt-2 text-muted-foreground">{friendly.subtitle}</p>
      </div>

      {/* The current stage card */}
      <div className="rounded-3xl border border-primary/30 bg-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            Your AI assistant is generating {Math.max(0, total - generated)} more deliverables in the background.
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{generated}</span>
          <span className="text-muted-foreground">/ {total} ready</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${total ? (generated / total) * 100 : 0}%` }} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/dashboard/workflow"
            className="rounded-xl border border-white/10 bg-card p-4 hover:border-primary/30 transition"
          >
            <div className="text-sm font-medium">Open this stage's questions</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Answer them with your voice — the AI uses them right away.
            </div>
          </Link>
          <button
            className="rounded-xl border border-white/10 bg-card p-4 hover:border-amber-500/40 transition text-left"
            onClick={() => alert("Instructor notified. They'll be right over.")}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Hand className="h-4 w-4 text-amber-500" /> Raise hand
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Stuck or need a hand? We'll come to you.
            </div>
          </button>
        </div>
      </div>

      {state.nextBlock && (
        <p className="text-sm text-muted-foreground">
          Up next at {minutesToClock(state.nextBlock.startMin)}: <span className="text-foreground">{state.nextBlock.title}</span>
        </p>
      )}

      <RecentlyFinished />
    </>
  );
}

function RecentlyFinished() {
  // Pulled lazily — uses the workflow query already cached
  const wfFn = useServerFn(getMyWorkflow);
  const { data } = useQuery({ queryKey: ["my", "workflow"], queryFn: () => wfFn(), refetchInterval: 8000 });
  const done = (data?.items ?? []).filter((i) => i.generated).slice(-3).reverse();
  if (done.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Just finished by your AI</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {done.map((d) => (
          <Link
            key={d.key}
            to="/dashboard/workflow/$key"
            params={{ key: d.key }}
            className="rounded-xl border border-white/10 bg-card p-4 hover:border-primary/30 transition"
          >
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Ready</span>
            </div>
            <div className="mt-1 font-medium">{d.label}</div>
            <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{d.description}</div>
            <div className="mt-3 text-sm text-primary">Take a look →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============ MODE C — AFTER the workshop ============

function AfterMode({
  state,
  generated,
  total,
  briefReady,
  filingReady,
}: {
  state: WorkshopState;
  generated: number;
  total: number;
  briefReady: boolean;
  filingReady: boolean;
}) {
  const day = state.dayOfNinety ?? 1;
  const pct = day / 90;
  const next = !filingReady
    ? { to: "/dashboard/brief", label: "Finish your filing info", hint: "Your LLC needs a couple more details." }
    : !briefReady
      ? { to: "/dashboard/brief", label: "Polish your brief", hint: "More detail = better deliverables." }
      : { to: "/dashboard/workflow", label: "Open your 90-day plan", hint: `${generated} of ${total} deliverables ready.` };

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Day {day} of 90</h1>
          <p className="mt-2 text-muted-foreground">Keep going. Small steps, every day.</p>
        </div>
        <ProgressRing value={pct} label={`${day}`} sublabel="of 90" size={96} stroke={8} />
      </div>

      <NextActionCard
        eyebrow="This week"
        title={next.label}
        description={next.hint}
        primary={{ to: next.to, label: "Let's go" }}
      />

      <RecentlyFinished />
    </>
  );
}

// ============ Fallback — no cohort assigned ============

function NoCohortMode({ briefScore, briefTotal, pitch }: { briefScore: number; briefTotal: number; pitch: string | null }) {
  const done = briefScore >= briefTotal;
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Welcome</h1>
      <p className="mt-2 text-muted-foreground">
        {done
          ? "Your brief is locked in. We'll email you the moment your workshop date is set."
          : "We haven't matched you to a workshop date yet. While you wait, start your brief."}
      </p>
      {done ? (
        <BriefCompleteCard
          pitch={pitch}
          secondary={{ to: "/dashboard/workflow", label: "Browse the 25 deliverables →" }}
          footnote="No workshop date yet — we'll be in touch soon."
        />
      ) : (
        <NextActionCard
          eyebrow="Start here"
          title={briefScore === 0 ? "Answer 10 quick questions about your startup." : "Pick up where you left off."}
          description={`You're ${briefScore} of ${briefTotal} done.`}
          primary={{ to: "/dashboard/brief", label: briefScore === 0 ? "Start" : "Keep going" }}
        />
      )}
    </>
  );
}

// ============ Walk-out moment ============

function WalkOutMoment() {
  return (
    <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-8 md:p-12 text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-primary">4:30 PM</div>
      <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">You did it 🎉</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
        You walked in with an idea. You're walking out with a launched startup and a signed 90-day plan.
      </p>
      <Link
        to="/dashboard/workflow"
        className="mt-8 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
      >
        Take me to my 90-day plan
      </Link>
    </div>
  );
}

// ============ Walk-out preview (Mode A) ============

function WalkOutPreview() {
  const stages = [1, 2, 3, 4, 5, 6, 7];
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        By 4:30 PM on workshop day, you'll have all of this
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((n) => (
          <div key={n} className="rounded-xl border border-white/10 bg-card p-4 opacity-80">
            <div className="text-xs text-muted-foreground">Stage {n}</div>
            <div className="mt-1 font-medium">{FRIENDLY_STAGE[n].title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{FRIENDLY_STAGE[n].subtitle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============ Utils ============

function minutesToClock(min: number): string {
  // 0 = 8:00 AM
  const totalMin = 8 * 60 + min;
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function pctOfBlock(state: WorkshopState): number {
  if (!state.currentBlock) return 0;
  const b = state.currentBlock;
  const total = b.endMin - b.startMin;
  const into = state.minutesIntoBlock ?? 0;
  return Math.max(0, Math.min(100, (into / total) * 100));
}
