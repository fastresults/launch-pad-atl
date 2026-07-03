import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import {
  ArrowRight,
  Wand2,
  CheckCircle2,
  Sparkles,
  MapPin,
  Video,
  Palette,
  Globe,
  Share2,
  Target,
  ClipboardCheck,
  ScrollText,
  FolderKanban,
} from "lucide-react";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";

const INCLUDES = [
  { icon: Palette, title: "Brand identity", body: "Logo, palette, typography, and a written brand guide." },
  { icon: Globe, title: "Website", body: "Designed, written, and launched — ready to send traffic to." },
  { icon: Share2, title: "Social channels", body: "Set up and branded across the platforms that fit your startup." },
  { icon: Target, title: "Positioning & offer", body: "Your first customer, message, and price — locked." },
  { icon: ClipboardCheck, title: "Legal & ops setup", body: "Guided setup so the boring stuff is done right, once." },
  { icon: ScrollText, title: "90-day founder plan", body: "The plan you actually run after we hand it off." },
  { icon: FolderKanban, title: "Founders Hub delivery", body: "Every asset organized inside your Hub — yours forever." },
];

const FITS = [
  "You'd rather pay to skip three months of setup",
  "You want a launch-ready brand and site, not another to-do list",
  "You want Adam personally leading the work",
  "You're ready to focus on customers, not Canva",
];

export default function OneOnOnePage() {
  const [modesOpen, setModesOpen] = useState(false);

  useEffect(() => {
    document.title = "Done-For-You Startup Build with Adam — $1,997";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Adam and his creative team build your startup for you — brand, website, social channels, and setup — end-to-end for $1,997.";
    if (meta) meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <Wand2 className="size-3.5" /> Done-for-you · with Adam & team
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              Skip the build.{" "}
              <span className="text-gradient-brand">Get the business.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              You're a founder, not an agency. Adam and his creative team set
              up your startup end-to-end — brand, website, social channels,
              positioning, and systems — so you can spend day one talking to
              customers instead of buying domains.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card px-3 py-1">
                <MapPin className="size-3.5" /> In-person at IGNITE offices
              </span>
              <span className="text-white/30">or</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card px-3 py-1">
                <Video className="size-3.5" /> Live over Google Meet
              </span>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="border-b border-white/5 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-primary">What we build for you</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              A launch-ready startup. Delivered.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Every asset below is produced by Adam and his creative team, then
              handed off inside your Founders Hub.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex flex-col rounded-2xl border border-white/10 bg-card p-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="size-4" />
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contrast */}
        <section className="border-b border-white/5 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">How the three formats differ</p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Same framework. Different amount of you.
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Workshop</p>
                <p className="mt-2 text-sm">You build it, in the room with Adam.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Webinar</p>
                <p className="mt-2 text-sm">You build it, live on video with Adam.</p>
              </div>
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-primary">Done-for-you</p>
                <p className="mt-2 text-sm">Adam and his team build it <em>for</em> you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Best fit */}
        <section className="border-b border-white/5 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Best fit if…</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {FITS.map((f) => (
                <div key={f} className="flex items-start gap-2 rounded-xl border border-white/10 bg-card p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Price / CTA */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/0 p-8 md:p-10">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" />
                <span className="text-xs uppercase tracking-[0.18em]">White-glove · limited builds per month</span>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <span className="text-5xl font-semibold tracking-tight md:text-6xl">$1,997</span>
                <span className="pb-2 text-sm text-muted-foreground">everything included</span>
              </div>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                A full startup build, delivered by Adam and his creative team.
                Choose in-person at the IGNITE offices or live over Google Meet
                — same team, same deliverables, same launch.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/contact?topic=one-on-one"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Book your build with Adam <ArrowRight className="size-4" />
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
                Adam only takes on a handful of builds each month so the work
                stays hands-on. Availability is confirmed after a short intake.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/5 py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Common questions</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <h3 className="font-medium">How long does the build take?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Most builds are delivered inside 2–3 weeks from kickoff,
                  depending on how quickly we get what we need from you.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <h3 className="font-medium">What do I need to bring?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your idea and a willingness to make decisions fast. We handle
                  the design, copy, tech, and setup.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <h3 className="font-medium">What if I already have a brand or site?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Perfect — we'll audit what you have, keep what works, and
                  rebuild only what's holding the launch back.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />
      <SiteFooter />
    </div>
  );
}
