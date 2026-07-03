import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { ArrowRight, Video, Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";

const HIGHLIGHTS = [
  "The full 4-stage StartupLabs framework, run live over video",
  "Working session — bring your idea, leave with a plan",
  "Small cohort, real-time feedback from Adam",
  "Recording + all generated assets yours to keep",
];

export default function WebinarPage() {
  const [modesOpen, setModesOpen] = useState(false);

  useEffect(() => {
    document.title = "Live Webinar — StartupLabs with Adam Anderson";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Join a live remote cohort and run the StartupLabs framework with Adam. Same four stages, done over video — walk out with a signed 90-day plan.";
    if (meta) meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <Video className="size-3.5" /> Live webinar
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              Same framework.{" "}
              <span className="text-gradient-brand">Remote. Live with Adam.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Can't make the trip to Atlanta? Run the StartupLabs framework in a
              small live webinar cohort. Same working session, same generated
              assets, same signed 90-day plan — done over video with Adam.
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
