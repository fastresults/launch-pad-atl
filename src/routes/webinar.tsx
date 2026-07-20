import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { ArrowRight, Video, Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";
import { useDocumentTitle } from "@/lib/use-document-title";

const HIGHLIGHTS = [
  "One live morning inside The 14-Day Pivot Method — offer priced, first customer named, first channel open",
  "Fourteen days to first revenue — the same done-with-you method we run in the room, over video",
  "Small cohort so the method gets applied to your startup, not a Zoom crowd",
  "Recording plus the assets that back the plan — yours to keep",
];

const WEBINAR_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "The 14-Day Pivot Method — Live on Zoom",
  description:
    "One focused morning of The 14-Day Pivot Method, run live over video in a small cohort with Adam Anderson.",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  url: "https://startuplabs.online/webinar",
  organizer: {
    "@type": "Organization",
    name: "Startuplabs",
    url: "https://startuplabs.online",
  },
  performer: {
    "@type": "Person",
    name: "Adam Anderson",
  },
  location: {
    "@type": "VirtualLocation",
    url: "https://startuplabs.online/webinar",
  },
};

export default function WebinarPage() {
  const [modesOpen, setModesOpen] = useState(false);

  useDocumentTitle(
    "The 14-Day Pivot Method — live on Zoom with Adam Anderson",
    "Can't make Atlanta? Run The 14-Day Pivot Method live on Zoom with Adam in a small cohort — fourteen days from webinar day to your first paying customer.",
    WEBINAR_JSON_LD,
  );


  return (
    <div className="marketing-surface min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <Video className="size-3.5" /> The 14-Day Pivot Method · Live on Zoom
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              The 14-Day Pivot Method, live on Zoom.{" "}
              <span className="text-gradient-brand">First paying customer in two weeks.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              The same method, run live over video in a small cohort —
              the done-with-you playbook replacing accelerators, courses, and raw AI.
              One focused morning of the Pivot Method. You leave with your offer priced, your
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
