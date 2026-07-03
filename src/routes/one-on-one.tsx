import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { ArrowRight, User, CheckCircle2, Sparkles } from "lucide-react";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";

const FITS = [
  "You have one bottleneck you want unblocked (positioning, pricing, GTM, offer)",
  "You want Adam's undivided attention, not a group room",
  "You'd rather compress six weeks of thinking into one focused working session",
  "You want the framework tailored specifically to your startup",
];

export default function OneOnOnePage() {
  const [modesOpen, setModesOpen] = useState(false);

  useEffect(() => {
    document.title = "1:1 with Adam — Private Founder Session";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Book a private working session with Adam Anderson. Just you, your startup, and Adam — end-to-end.";
    if (meta) meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-white/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
              <User className="size-3.5" /> 1:1 with Adam
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              Just you and Adam.{" "}
              <span className="text-gradient-brand">Your startup, end-to-end.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              A private working session for founders who want focused, senior
              attention — not a group. We map your bottleneck, work it live, and
              you walk out with the same generated assets and a signed plan for
              what's next.
            </p>

            <div className="mt-8">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Best fit if…
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {FITS.map((f) => (
                  <div key={f} className="flex items-start gap-2 rounded-xl border border-white/10 bg-card p-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/0 p-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Booked directly</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Private session pricing</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                1:1s are custom-scoped to your startup and current stage. Reach
                out and Adam will personally review fit, timing, and pricing
                before anything is booked.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/contact?topic=one-on-one"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Request a 1:1 with Adam <ArrowRight className="size-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setModesOpen(true)}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Compare all three formats
                </button>
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
