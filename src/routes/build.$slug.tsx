import { Link, Navigate, useParams } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { getBuildWorkshop, BUILD_WORKSHOPS, getWorkshopAgencyOffer } from "@/lib/build-workshops";
import { getUpcomingSessions } from "@/lib/build-workshop-schedule";
import { getWorkshopPains } from "@/lib/workshop-pains";
import {
  AUDIT_STEPS,
  WORKSHOP_GUARANTEE,
  getWorkshopAudit,
} from "@/lib/workshop-audit";
import {
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Clock,
  Users,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";

export default function BuildWorkshopPage() {
  const { slug } = useParams<{ slug: string }>();
  const w = slug ? getBuildWorkshop(slug) : undefined;

  if (!w) return <Navigate to="/build" replace />;

  const Icon = w.icon;
  const offer = getWorkshopAgencyOffer(w.slug)!;
  const otherWorkshops = BUILD_WORKSHOPS.filter((x) => x.slug !== w.slug).slice(0, 3);
  const upcoming = getUpcomingSessions(w.slug, new Date(), 12);

  return (
    <div className="public-surface min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-white/5 py-16 md:py-24">
        <div className="public-container px-6">
          <Link
            to="/build"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground md:text-sm"
          >
            ← All 8 workshops
          </Link>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <Icon className="size-7 text-primary" />
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-primary md:text-sm md:tracking-[0.2em]">
                {w.capability} · Workshop · {w.priceLabel}
              </p>
              <h1 className="public-display">
                {w.oneLiner}
              </h1>
            </div>
          </div>

          <p className="ml-0 mt-6 max-w-3xl text-base text-muted-foreground md:ml-[80px] md:text-lg">
            {w.subhead}
          </p>

          <div className="ml-0 mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 md:ml-[80px]">
            <Link
              to={`/register?workshop=${w.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
            >
              Reserve your seat — {w.priceLabel} <ArrowRight className="size-4" />
            </Link>
            <Link
              to={offer.href}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/10"
            >
              Have us build it instead
            </Link>
          </div>

          <div className="ml-0 mt-8 grid max-w-2xl grid-cols-1 gap-3 text-muted-foreground sm:grid-cols-3 md:ml-[80px]">
            <Meta icon={<Clock className="size-4" />} label="Half-day · 2h 45m" />
            <Meta icon={<Users className="size-4" />} label="Small cohort" />
            <Meta icon={<Calendar className="size-4" />} label="Live online" />
          </div>
        </div>
      </section>

      {/* Upcoming dates */}
      {upcoming.length > 0 && (
        <section className="border-b border-white/5 bg-white/[0.02] py-14 md:py-16">
          <div className="public-container px-6">
            <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary md:text-sm">
              <Calendar className="size-4" /> Upcoming dates · {w.title}
            </div>
            <h2 className="public-heading max-w-3xl">
              {w.title} —{" "}
              <span className="text-gradient-brand">pick your session.</span>
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {upcoming.map((s) => (
                <li
                  key={s.startISO}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card px-5 py-4"
                >
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-[0.16em] text-primary">{w.title}</div>
                    <div className="text-base font-medium tracking-tight">{s.dateLabel}</div>
                    <div className="text-sm text-muted-foreground">{s.timeLabel}</div>
                  </div>
                  <Link
                    to={`/register?workshop=${w.slug}&date=${encodeURIComponent(s.startISO)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 md:text-sm"
                  >
                    Reserve <ArrowRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* The audit that opens the morning */}
      {audit && (
        <section className="py-16 md:py-24">
          <div className="public-container px-6">
            <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary md:text-sm">
              <ClipboardCheck className="size-4" /> Included · {audit.name}
            </div>
            <h2 className="public-heading max-w-3xl">
              Your morning starts with an audit of your own work —{" "}
              <span className="text-gradient-brand">not a lecture.</span>
            </h2>
            <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
              {audit.promise} It lands 48 hours before your session, graded, with
              the cost of every gap named.
            </p>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {AUDIT_STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="rounded-2xl border border-white/10 bg-card p-6"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-primary">
                    0{i + 1} · {step.label}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl border border-primary/30 bg-card p-6 md:p-8">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                What your audit prescribes
              </div>
              <p className="mt-3 max-w-3xl text-lg font-medium leading-snug md:text-xl">
                {audit.prescribedOutcome}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                The point of the morning: {audit.improvement}.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* The pain */}
      <section className="py-16 md:py-24">
        <div className="public-container px-6">
          <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
            <AlertTriangle className="size-4 text-primary" /> {w.sections.painEyebrow}
          </div>
          <h2 className="public-heading max-w-3xl">
            {w.sections.painHeadline}
          </h2>
          {tenPains.length > 0 ? (
            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {tenPains.map((p, i) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-card p-6"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight md:text-lg">
                    {p.pain}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    You leave with {p.fix}.
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {w.pains.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/10 bg-card p-6"
                >
                  <h3 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* The guarantee */}
      {audit && (
        <section className="border-t border-white/5 py-16 md:py-24">
          <div className="public-container px-6">
            <div className="rounded-2xl border border-primary/30 bg-card p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary md:text-sm">
                <ShieldCheck className="size-4" /> The guarantee
              </div>
              <h2 className="public-heading max-w-3xl">
                {WORKSHOP_GUARANTEE.headline}
              </h2>
              <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
                {WORKSHOP_GUARANTEE.body}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* What you walk out with */}
      <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
        <div className="public-container px-6">
          <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary md:text-sm">
            <Check className="size-4" /> What you walk out with
          </div>
          <h2 className="public-heading max-w-3xl">
            {w.sections.walkOutHeadline.lead}{" "}
            <span className="text-gradient-brand">{w.sections.walkOutHeadline.emphasis}</span>
          </h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {w.walkOuts.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-card px-5 py-4"
              >
                <Check className="mt-1 size-5 shrink-0 text-primary" />
                <span className="text-base font-medium tracking-tight">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Agenda */}
      <section className="py-16 md:py-24">
        <div className="public-container px-6">
          <div className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm">
            <Clock className="size-4 text-primary" /> The agenda
          </div>
          <h2 className="public-heading max-w-3xl">
            {w.sections.agendaHeadline.lead}{" "}
            <span className="text-gradient-brand">{w.sections.agendaHeadline.emphasis}</span>
          </h2>
          <div className="mt-10 space-y-4">
            {w.agenda.map((block, i) => (
              <div
                key={block.time}
                className="rounded-2xl border border-white/10 bg-card p-6 md:p-7"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                  <div className="text-xs uppercase tracking-[0.18em] text-primary md:w-40 md:text-sm">
                    {block.time}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold tracking-tight md:text-xl">
                      <span className="mr-2 text-muted-foreground">0{i + 1}.</span>
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {block.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fit */}
      <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
        <div className="public-container px-6">
          <h2 className="public-heading max-w-3xl">
            {w.sections.fitHeadline.lead}{" "}
            <span className="text-gradient-brand">{w.sections.fitHeadline.emphasis}</span>
          </h2>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
            {w.sections.fitLede}
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-card p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-primary">
                <Check className="size-4" /> Right fit
              </div>
              <ul className="space-y-3">
                {w.forYou.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm md:text-base">
                    <Check className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">
                <X className="size-4" /> Skip it if
              </div>
              <ul className="space-y-3">
                {w.notForYou.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-3 text-sm text-muted-foreground md:text-base"
                  >
                    <X className="mt-1 size-4 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Decision moment */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            The decision moment
          </p>
          <h2 className="public-heading">
            {w.sections.decisionHeadline.lead}{" "}
            <span className="text-gradient-brand">{w.sections.decisionHeadline.emphasis}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            {w.sections.decisionBody}
          </p>
        </div>
      </section>


      {/* Agency upsell */}
      <section className="border-t border-white/5 bg-white/[0.02] py-16 md:py-24">
        <div className="public-container px-6">
          <div className="rounded-3xl border border-white/10 bg-hero-gradient p-8 text-white md:p-12">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] opacity-80 md:text-sm md:tracking-[0.2em]">
              <Sparkles className="mr-1 inline size-3.5" /> Or have us build it for you
            </p>
            <h2 className="public-heading">
              {offer.name}
            </h2>
            <p className="mt-3 text-base opacity-95 md:text-lg">{offer.tagline}</p>
            <p className="mt-6 text-sm uppercase tracking-[0.18em] opacity-80">
              {offer.priceLabel}
            </p>
            <p className="mt-3 max-w-2xl text-sm opacity-90 md:text-base">
              The morning workshop hands you everything you need to ship this piece yourself. If you'd rather hand it over instead, we'll credit your {w.priceLabel} back on any project over $1,000.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={offer.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90 sm:w-auto"
              >
                Book a call <ArrowRight className="size-4" />
              </Link>
              <Link
                to={`/register?workshop=${w.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Workshop first — {w.priceLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="public-heading">
            {w.sections.faqHeadline}
          </h2>
          <div className="mt-10 space-y-4">
            {w.faq.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20 md:p-6"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-medium tracking-tight md:text-lg">
                  {f.q}
                  <span className="mt-1 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other workshops */}
      <section className="border-t border-white/5 py-16 md:py-24">
        <div className="public-container px-6">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
            Keep building
          </p>
          <h2 className="public-heading">
            {w.sections.otherWorkshopsHeadline}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {otherWorkshops.map((o) => {
              const OIcon = o.icon;
              return (
                <Link
                  key={o.slug}
                  to={`/build/${o.slug}`}
                  className="group rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <OIcon className="size-5 text-primary" />
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                      {o.priceLabel}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{o.capability}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{o.oneLiner}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Learn more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/build"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10"
            >
              See all 8 workshops <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}
