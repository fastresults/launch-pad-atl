import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, MapPin, Minus, Layers, MessageCircleQuestion } from "lucide-react";
import { getWorkshopFormats, type WorkshopProduct } from "@/lib/workshop-products";
import { nextDateLabel } from "@/lib/workshop-catalog";
import { WaitlistForm } from "@/components/home/workshop/WaitlistForm";
import {
  Panel,
  PrimaryCta,
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/** Section 5 — two ways to get it. The room is dominant; the course is honest. */
export function WorkshopFormats({ product }: { product: WorkshopProduct }) {
  const { live, course } = getWorkshopFormats(product);
  const isOpen = product.status === "open";
  const date = nextDateLabel(product.slug);

  return (
    <SectionShell tinted>
      <SectionEyebrow icon={Layers}>Two ways to get it</SectionEyebrow>
      <SectionHeading lead="In the room," emphasis="or on your own clock." />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* The room */}
        <div className="md:col-span-7">
          <Panel accent className="h-full md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">{live.name}</h3>
              <span className="text-2xl font-semibold">{live.priceLabel}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{live.summary}</p>
            <ul className="mt-5 space-y-2.5">
              {live.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {isOpen && date ? date : `Opens ${product.opensLabel}`}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                IGNITE Center · Greater Atlanta Christian School
              </span>
            </div>
            <div className="mt-6">
              {isOpen ? (
                <PrimaryCta to={product.href}>
                  {live.ctaLabel} <ArrowRight className="size-4" aria-hidden="true" />
                </PrimaryCta>
              ) : (
                <WaitlistForm
                  slug={product.slug}
                  format="workshop"
                  tone="card"
                  label={live.ctaLabel}
                  doneMessage="You'll get the date first."
                />
              )}
            </div>
          </Panel>
        </div>

        {/* The course */}
        <div className="md:col-span-5">
          <Panel className="h-full bg-card/50 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">{course.name}</h3>
              <span className="text-xl font-semibold text-muted-foreground">
                {course.priceLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{course.summary}</p>
            <ul className="mt-5 space-y-2.5">
              {course.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0 opacity-50" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <WaitlistForm
                slug={product.slug}
                format="course"
                tone="card"
                label={course.ctaLabel}
                doneMessage="We'll email you when the course opens."
              />
            </div>
          </Panel>
        </div>
      </div>
    </SectionShell>
  );
}

/** Section 6 — the honest qualifier. */
export function WorkshopFit({ product }: { product: WorkshopProduct }) {
  return (
    <SectionShell>
      <SectionEyebrow icon={Check} muted>
        Read both columns honestly
      </SectionEyebrow>
      <SectionHeading lead="The wrong morning costs you a Thursday." emphasis="Be sure." />

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel accent className="md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-primary">
            <Check className="size-4" aria-hidden="true" /> This is you if…
          </div>
          <ul className="space-y-3">
            {product.forYou.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm leading-relaxed md:text-base">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-muted-foreground">
            <Minus className="size-4" aria-hidden="true" /> Skip it if…
          </div>
          <ul className="space-y-3">
            {product.notForYou.map((f) => (
              <li
                key={f}
                className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground md:text-base"
              >
                <Minus className="mt-1 size-4 shrink-0 opacity-50" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </SectionShell>
  );
}

/** Section 7 — the three objections that actually kill this sale. */
export function WorkshopObjections({ product }: { product: WorkshopProduct }) {
  return (
    <SectionShell tinted>
      <SectionEyebrow icon={MessageCircleQuestion} muted>
        What you're probably thinking
      </SectionEyebrow>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {product.objections.map((o) => (
          <Panel key={o.q}>
            <p className="text-base font-semibold leading-snug">“{o.q}”</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.a}</p>
          </Panel>
        ))}
      </div>
    </SectionShell>
  );
}

/** Section 8 — one decision. */
export function WorkshopDecision({ product }: { product: WorkshopProduct }) {
  const isOpen = product.status === "open";
  const date = nextDateLabel(product.slug);

  return (
    <SectionShell className="py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The decision moment
        </p>
        <h2 className="public-heading">{product.decisionHeadline}</h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          {product.decisionBody}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          {isOpen ? (
            <>
              <PrimaryCta to={product.href} className="px-7 py-3.5">
                Reserve your seat — {product.priceLabel}{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </PrimaryCta>
              {date && (
                <p className="text-xs text-muted-foreground">
                  Next session {date} · 8:45–11:30am · IGNITE Center
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-full max-w-md">
                <WaitlistForm
                  slug={product.slug}
                  format="workshop"
                  tone="card"
                  label="Get the date"
                  doneMessage="You'll hear from us first."
                />
              </div>
              <Link
                to={product.href}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                See the full morning <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <p className="text-xs text-muted-foreground">
                Opens {product.opensLabel}. Foundation runs now — it comes first anyway.
              </p>
            </>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
