import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";

import { AGENCY_TRACKS, getAgencyService } from "@/lib/agency-services";
import { useDocumentTitle } from "@/lib/use-document-title";
import facilitatorPhoto from "@/assets/facilitator.jpg";
import {
  ArrowRight,
  Sparkles,
  Award,
  Compass,
  FileText,
  Hammer,
  PackageCheck,
} from "lucide-react";

export default function ServicesPage() {
  useDocumentTitle(
    "Services — we'll build the rest for you",
    "Once you've launched, our team keeps building — brand, website, content, and everything that brings customers in. Same crew, done for you."
  );
  return (
    <div className="public-surface min-h-screen">
      <SiteHeader />
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




/* ─────────────── Productized tracks ─────────────── */

function Tracks() {
  return (
    <section className="border-b border-white/5 py-16 md:py-24">
      <div className="public-container px-6">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          <Sparkles className="size-3.5" /> After your launch · our team builds what comes next
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          You launched.{" "}
          <span className="text-gradient-brand">We'll scale it.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
          The old way to grow: hire a big agency, sign a year-long contract, and wait months to see results. The new way: our team builds the next piece with you — three plainly-priced options, no surprise invoices, no year-long lock-in. Buy what you need, when you need it.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/contact?intent=discovery"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Book a free 30-minute call <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/build"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
          >
            Start with a morning workshop — from $197
          </Link>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted-foreground md:text-sm">
          We've built for Citigroup · Mayo Clinic · 3M · Disney — and for Main Street shops and online brands just like yours
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
    title: "Talk it through",
    detail: "A free 30-minute call. We'll tell you what to buy, what to skip, and what you can do yourself.",
  },
  {
    icon: FileText,
    title: "Agree on the plan",
    detail: "One page, one price, one timeline — set together. No hourly billing, no surprise invoices.",
  },
  {
    icon: Hammer,
    title: "We build",
    detail: "You see progress every week. Shared workspace. Your team on every decision as it happens.",
  },
  {
    icon: PackageCheck,
    title: "You own it",
    detail: "Everything handed over — files, accounts, passwords. Short videos walking you through how it all works. 30 days of help after.",
  },
];

function Process() {
  return (
    <section className="py-16 md:py-24">
      <div className="public-container px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          How it works
        </p>
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Four steps.{" "}
          <span className="text-gradient-brand">No mystery. No creep.</span>
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
      <div className="public-container px-6">
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
              The same people who'd cost a fortune at a big agency —{" "}
              <span className="text-gradient-brand">priced honestly for what your business actually needs.</span>
            </p>
            <p className="mt-5 text-muted-foreground">
              We've built for Citigroup, Mayo Clinic, 3M, and Disney. Built a full digital system for a Caribbean nation's government. Ran one of the region's biggest business summits five years running. And we've started enough of our own businesses to know which shortcuts cost you later.
            </p>
            <p className="mt-3 text-muted-foreground">
              When you hire us, you get the people who've been where you are. Not a sales rep. Not an offshore team you'll never meet.
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
      <div className="public-container px-6">
        <div className="rounded-3xl border border-primary/30 bg-card p-8 md:p-12">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-primary md:text-sm md:tracking-[0.2em]">
            <Sparkles className="mr-1 inline size-3.5" /> Try before you buy
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Come to a morning workshop first.{" "}
            <span className="text-gradient-brand">Hire us only if it fits.</span>
          </h2>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
            Pick any of our eight morning workshops — $197, $297, or $397. Spend one morning with us and walk out with the piece done. Decide in the room whether to keep going yourself, hire someone else, or hand it to our team. If you hire us after, we credit your workshop fee back on the project.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              See all 8 morning workshops <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact?intent=discovery"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10 sm:w-auto"
            >
              Book a free 30-min call
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
    q: "Do I have to come to a workshop first?",
    a: "No — but it's the cheapest way to make sure you're hiring the right thing. One focused morning with us and you'll know exactly what you need built (and what you can skip). Most folks save more than they spend just from that clarity.",
  },
  {
    q: "Can I just buy one piece instead of a whole package?",
    a: "Yes. The three options are starting points, not rules. On our free call we'll build a plan that fits what you actually need — we'd rather sell you less and earn the next project than oversell once.",
  },
  {
    q: "Who owns everything when we're done?",
    a: "You do. Files, accounts, passwords, domains, content — all yours. We hand over the keys at the end. Nothing locked up on our side, ever.",
  },
  {
    q: "How fast can we start?",
    a: "Within a week of the plan being signed. Most projects start the Monday after we agree.",
  },
  {
    q: "What if I already have a brand or a website?",
    a: "We take a look first. Then you decide — tune what's there or start fresh. We won't tell you something's broken just to bill for new work.",
  },
  {
    q: "Do you take equity or a cut of my sales?",
    a: "No. Flat fees. Clean books. Clean goodbye. It's healthier for you — and for your business.",
  },
];

function FAQ() {
  return (
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          Straight answers.
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
      <div className="public-container px-6">
        <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Idea to open.{" "}
            <span className="opacity-80">Built, not written up.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base opacity-90 md:text-lg">
            Two doors, same finish: a real startup that's live, taking money, and bringing customers back. Pick the door that fits your next 30 days.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/contact?intent=discovery"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90 sm:w-auto"
            >
              Book a free 30-min call <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/build"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Start with a morning workshop — from $197
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
