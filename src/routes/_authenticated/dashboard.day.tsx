import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCohort } from "@/lib/cohort.functions";
import { SCHEDULE_BLOCKS } from "@/lib/workshop-mode";
import { MapPin, Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/day")({
  component: WorkshopDayPage,
  head: () => ({ meta: [{ title: "Workshop day — Startup Labs" }] }),
});

function WorkshopDayPage() {
  const cohortFn = useServerFn(getMyCohort);
  const { data } = useQuery({ queryKey: ["my", "cohort"], queryFn: () => cohortFn(), staleTime: 60_000 });
  const cohort = data?.cohort;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Workshop day</h1>
        <p className="mt-2 text-muted-foreground">Everything you need to show up ready.</p>
      </div>

      {cohort ? (
        <div className="rounded-3xl border border-white/10 bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            <Calendar className="h-4 w-4" /> {cohort.dateLabel}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">8:00 AM – 4:30 PM ET</div>
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

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">What to bring</h2>
        <ul className="space-y-2 text-sm">
          <li className="rounded-xl border border-white/10 bg-card p-4">Your laptop (and charger).</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">A government-issued ID (for LLC filing).</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">Your startup idea — even if it's rough. We'll shape it together.</li>
          <li className="rounded-xl border border-white/10 bg-card p-4">A debit card if you'd like to pay your state filing fee on the spot (about $100 in GA).</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">The day, hour by hour</h2>
        <ol className="space-y-2">
          {SCHEDULE_BLOCKS.map((b, i) => (
            <li
              key={i}
              className={`flex items-start gap-4 rounded-xl border p-4 ${
                b.kind === "break" ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-card"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-mono tabular-nums text-muted-foreground w-20 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {minutesToClock(b.startMin)}
              </div>
              <div className="min-w-0">
                <div className="font-medium">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.subtitle}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Link to="/dashboard/brief" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90">
        Prep my brief
      </Link>
    </div>
  );
}

function minutesToClock(min: number): string {
  const totalMin = 8 * 60 + min;
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
