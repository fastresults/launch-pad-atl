import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

import { AGENCY_SERVICES, AGENCY_TRACKS, getAgencyService } from "@/lib/agency-services";
import { getBuildWorkshop } from "@/lib/build-workshops";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import {
  ArrowRight,
  Check,
  Sparkles,
  Clock,
  Award,
  Compass,
  FileText,
  Hammer,
  PackageCheck,
} from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <CapabilityGrid />
      <Tracks />
      <Process />
      <Proof />
      <WorkshopBand />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* ─────────────── Hero ─────────────── */

function Hero() {
  return (
    <section className="border-b border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          <Sparkles className="size-3.5" /> Done-for-you · The 8 capabilities, built by our team
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          You shouldn't have to learn eight jobs{" "}
          <span className="text-gradient-brand">to start one business.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          You took the workshop and ran the playbook yourself — or you've already decided you'd rather buy the result than build it. Either way, here's what our team ships, capability by capability, on a fixed scope and a fixed clock.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/contact?intent=discovery"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Book a discovery call <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/build"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
          >
            Start with a workshop — from $197
          </Link>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted-foreground md:text-sm">
          Work shipped for Citigroup · Mayo Clinic · 3M · Disney · government, Main Street, and online brands alike
        </p>
      </div>
    </section>
  );
}

/* ─────────────── Capability ↔ Service grid ─────────────── */

function CapabilityGrid() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The eight capabilities, built for you
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Same eight capabilities as the workshops.{" "}
          <span className="text-gradient-brand">Shipped — not taught.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Every card below is the same scope a workshop hands you the strategy, frameworks, and tool stack to build yourself (from $197). Hire us when you'd rather own the result than the learning curve.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {AGENCY_SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.slug}
                className="group flex flex-col rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-primary/40 md:p-7"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                      {s.capability}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock className="mr-1 inline size-3" />
                    {s.timelineLabel}
                  </span>
                </div>

                <p className="text-base text-muted-foreground">{s.oneLiner}</p>

                <ul className="mt-5 space-y-2 text-sm">
                  {s.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-primary">
                      {s.priceLabel}
                    </div>
                    <Link
                      to={s.workshopHref}
                      className="mt-1 inline-block text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Or DIY it — {getBuildWorkshop(s.slug)?.priceLabel ?? "$197"} workshop (strategy + tools + process) →
                    </Link>
                  </div>
                  <Link
                    to={s.ctaHref}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
                  >
                    Scope it
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Productized tracks ─────────────── */

function Tracks() {
  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Bundles that map to where you are
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
          Three tracks.{" "}
          <span className="text-gradient-brand">Pick the one that matches the stage you're in.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          You don't buy eight things at once. You buy the right three. Each track bundles the capabilities that compound together — scoped honestly to what your startup actually needs, priced after a short discovery call.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {AGENCY_TRACKS.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.slug}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-colors md:p-7 ${
                  t.featured
                    ? "border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most chosen
                  </div>
                )}
                <Icon className="mb-4 size-6 text-primary" />
                <h3 className="text-2xl font-semibold tracking-tight">{t.name}</h3>
                <p className="mt-2 text-base text-muted-foreground">{t.tagline}</p>

                <div className="mt-5 rounded-xl border border-white/10 bg-background/40 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Includes
                  </div>
                  <ul className="space-y-1.5">
                    {t.includedSlugs.map((slug) => {
                      const svc = getAgencyService(slug);
                      if (!svc) return null;
                      const SIcon = svc.icon;
                      return (
                        <li key={slug} className="flex items-center gap-2 text-sm">
                          <SIcon className="size-4 text-primary" />
                          <span>{svc.capability}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t.outcome}</p>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs uppercase tracking-[0.18em] text-primary">
                      {t.priceLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.timelineLabel}</div>
                  </div>
                  <Link
                    to={t.ctaHref}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                      t.featured
                        ? "bg-hero-gradient text-white hover:opacity-90"
                        : "border border-white/20 hover:bg-white/10"
                    }`}
                  >
                    Book a scoping call <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How we engage ─────────────── */

const PROCESS_STEPS = [
  {
    icon: Compass,
    title: "Diagnose",
    detail: "A 30-minute call. We tell you what to buy, what to skip, and what to do yourself.",
  },
  {
    icon: FileText,
    title: "Scope",
    detail: "Fixed scope, fixed startup assets, fixed clock — set together in discovery. Flat fee, no T&M, no surprise invoices.",
  },
  {
    icon: Hammer,
    title: "Build",
    detail: "Weekly demos, shared workspace, your team copied on every decision in real time.",
  },
  {
    icon: PackageCheck,
    title: "Hand off",
    detail: "Documented systems, Loom walkthroughs, 30-day support — and you own everything.",
  },
];

function Process() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          How we engage
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Four steps.{" "}
          <span className="text-gradient-brand">No mystery, no project drift.</span>
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {PROCESS_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-card p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Icon className="size-5 text-primary" />
                  <span className="text-3xl font-semibold leading-none text-gradient-brand">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Proof ─────────────── */

function Proof() {
  return (
    <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-8 rounded-3xl border border-white/10 bg-card p-6 md:grid-cols-[1fr_1.4fr] md:gap-10 md:p-8 lg:p-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-hero-gradient">
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <Award className="mb-3 size-6 opacity-80" />
              <div className="text-sm uppercase tracking-[0.2em] opacity-80">Who's building</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full bg-white/15 backdrop-blur">
                  <img
                    src={facilitatorPhoto}
                    alt="Adam Anderson"
                    className="size-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-2xl font-semibold leading-tight">Adam Anderson</div>
                  <div className="text-xs uppercase tracking-[0.18em] opacity-80">
                    Co-Founder · OPEN Interactive
                  </div>
                </div>
              </div>
              <div className="mt-4 text-base leading-snug opacity-95">
                30 years of starting and shipping. The same team in the room runs the build.
              </div>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              No handoffs to a junior team
            </h2>
            <p className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">
              The same operators who'd charge $50K elsewhere —{" "}
              <span className="text-gradient-brand">working on your business this month.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              We've shipped work for Citigroup, Mayo Clinic, 3M, and Disney. Built full digital systems for a Caribbean nation's government. Produced one of the region's biggest business summits for five years running. And we've started enough of our own companies to know which corners cost you later.
            </p>
            <p className="mt-3 text-muted-foreground">
              When you hire us, you get the operators who've sat in your seat. Not a sales rep, not an offshore team you'll never meet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Workshop ↔ Service band ─────────────── */

function WorkshopBand() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border border-primary/30 bg-card p-8 md:p-12">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-primary md:text-sm md:tracking-[0.2em]">
            <Sparkles className="mr-1 inline size-3.5" /> The math you should hear
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Try us for as little as $197.{" "}
            <span className="text-gradient-brand">Hire us if it's a fit.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
            Take any of the eight workshops — $197, $297, or $397 depending on the capability. You leave with the strategy, the frameworks, and the exact tool stack to ship it yourself. Decide in the room whether to DIY, hire someone else, or hand it to our team. If you hire us for any engagement over $1,000, your workshop fee is credited back.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              See all 8 workshops <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact?intent=discovery"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
            >
              Book a discovery call
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FAQ ─────────────── */

const FAQS = [
  {
    q: "Do I have to take the workshop first?",
    a: "No. But it's the cheapest insurance against hiring the wrong thing — and it hands you the strategy, the frameworks, and the tool stack to actually ship it yourself if you want to. Most founders who take it come back with a sharper scope and save more than they spend.",
  },
  {
    q: "Can I bundle just two capabilities instead of a whole track?",
    a: "Yes. The tracks are smart defaults, not gates. A discovery call sets the actual scope — we'd rather sell you less and win the next engagement than oversell once.",
  },
  {
    q: "Who owns the work?",
    a: "You do. Source files, accounts, domains, content, prompts — everything. We hand over keys at the end of every engagement. No vendor lock-in, ever.",
  },
  {
    q: "How fast do you start?",
    a: "Within 7 days of a signed scope. Most engagements kick off the Monday after we agree.",
  },
  {
    q: "What if I already have a brand, site, or CRM in place?",
    a: "We audit first. Then you choose — tune what's there or rebuild from scratch. We won't pretend something is broken just to bill for new work.",
  },
  {
    q: "Do you take equity or revenue share?",
    a: "No. Fixed fees, clean books, clean exit. The relationship is healthier — and so is your cap table.",
  },
];

function FAQ() {
  return (
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Questions, answered straight.
        </h2>
        <div className="mt-10 space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20 md:p-6"
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-medium tracking-tight md:text-lg">
                {f.q}
                <span className="mt-1 text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Final CTA ─────────────── */

function FinalCTA() {
  return (
    <section className="pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Strategy is the foundation.{" "}
            <span className="opacity-80">Execution is what makes it real.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base opacity-90 md:text-lg">
            Two doors, same outcome: a business that attracts customers, converts them, and keeps them. Pick the one that fits how you want to spend the next 30 days.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/contact?intent=discovery"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90 sm:w-auto"
            >
              Book a discovery call <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Start with a workshop — from $197
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
