import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { ArrowRight, Video, Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";

const HIGHLIGHTS = [
  "One live morning inside The 14-Day Launch Method — offer priced, first customer named, first channel open",
  "Fourteen days to first revenue — the same done-with-you method we run in the room, over video",
  "Small cohort so Adam works your business, not a Zoom crowd",
  "Recording plus the assets that back the plan — yours to keep",
];

export default function WebinarPage() {
  const [modesOpen, setModesOpen] = useState(false);

  useEffect(() => {
    document.title = "The 14-Day Launch Method — live on Zoom with Adam Anderson";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Can't make Atlanta? Run The 14-Day Launch Method live on Zoom with Adam in a small cohort — the done-with-you method replacing accelerators, courses, and raw AI. Fourteen days from webinar day to your first paying customer.";
    if (meta) meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <Video className="size-3.5" /> The 14-Day Launch Method · Live on Zoom
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              The 14-Day Launch Method, live on Zoom.{" "}
              <span className="text-gradient-brand">First paying customer in two weeks.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              <span className="font-medium text-foreground">The Anderson Method</span>, run live over video in a small cohort with the founder who built it —
              the done-with-you method replacing accelerators, courses, and raw AI.
              One focused morning with Adam. You leave with your offer priced, your
              first customer named, your first channel open, and outreach going out
              that afternoon.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {HIGHLIGHTS.map((h) => (
                <div key={h} className="flex items-start gap-2 rounded-xl border border-white/10 bg-card p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-sm">{h}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-card p-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" /> Next cohort forming
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" /> 3 hours live
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" /> Limited seats
                </span>
              </div>
              <p className="mt-4 text-sm">
                We open the next webinar when we have a full cohort. Get on the
                interest list and we'll notify you as soon as the date is set.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/contact?topic=webinar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Join the interest list <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setModesOpen(true)}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Compare all three formats
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Prefer we build it for you instead?{" "}
                <Link to="/one-on-one" className="underline hover:text-foreground">
                  See the done-for-you build with Adam
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />
      <SiteFooter />
    </div>
  );
}
