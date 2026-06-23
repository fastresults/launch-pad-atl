import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { SERVICE_PACKAGES, WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            <Sparkles className="size-3.5" /> Consulting + creative services
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            When you're ready to{" "}
            <span className="text-gradient-brand">actually build it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Productized engagements for founders who have the strategic framework and need execution. Pick a package, or scope a custom engagement. Every project is run by the same team behind the {WORKSHOP_PRICE_LABEL} workshop.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {SERVICE_PACKAGES.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border bg-card p-6 transition-colors md:p-8 ${
                  p.featured ? "border-primary/40" : "border-white/10 hover:border-white/20"
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}
                <div className="text-xs uppercase tracking-[0.18em] text-primary">{p.priceLabel}</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{p.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.ctaHref}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                    p.featured
                      ? "bg-hero-gradient text-white hover:opacity-90"
                      : "border border-white/20 hover:bg-white/10"
                  }`}
                >
                  {p.ctaLabel} <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] opacity-80 md:text-sm md:tracking-[0.2em]">
              Not sure yet?
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Start with the {WORKSHOP_PRICE_LABEL} framework workshop.
            </h2>
            <p className="mt-4 text-base opacity-90 md:text-lg">
              Get the strategic foundation first. If you decide our team is the right fit to build it, we'll credit the workshop fee toward any engagement above $1,500.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-neutral-900 transition-opacity hover:opacity-90 sm:w-auto"
              >
                Reserve a workshop seat <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
