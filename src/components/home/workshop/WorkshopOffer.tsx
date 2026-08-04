import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, MapPin, Minus } from "lucide-react";
import { getWorkshopFormats, type WorkshopProduct } from "@/lib/workshop-products";
import { nextDateLabel } from "@/lib/workshop-catalog";
import { WaitlistForm } from "@/components/home/workshop/WaitlistForm";

/** Section 5 — two ways to get it. The room is dominant; the course is honest. */
export function WorkshopFormats({ product }: { product: WorkshopProduct }) {
  const { live, course } = getWorkshopFormats(product);
  const isOpen = product.status === "open";
  const date = nextDateLabel(product.slug);

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
          Two ways to get it
        </p>
        <h2 className="public-heading mt-4 max-w-2xl">
          In the room, or on your own clock.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* The room */}
          <div className="md:col-span-7">
            <div className="h-full rounded-lg border-2 border-[color:var(--sl-quote-gold)] bg-card p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{live.name}</h3>
                <span className="text-2xl font-semibold text-foreground">{live.priceLabel}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{live.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {live.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-foreground">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[color:var(--sl-quote-gold)]"
                      aria-hidden="true"
                    />
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
                  <Link
                    to={product.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--sl-quote-gold)] px-6 py-3 text-base font-medium text-black transition-opacity hover:opacity-90"
                  >
                    {live.ctaLabel} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
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
            </div>
          </div>

          {/* The course */}
          <div className="md:col-span-5">
            <div className="h-full rounded-lg border border-border bg-card/50 p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section 6 — the honest qualifier. */
export function WorkshopFit({ product }: { product: WorkshopProduct }) {
  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
          Read both columns honestly
        </p>
        <h2 className="public-heading mt-4 max-w-2xl">
          The wrong morning costs you a Thursday. Be sure.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-7">
            <p className="text-sm font-semibold text-foreground">This is you if…</p>
            <ul className="mt-4 space-y-3">
              {product.forYou.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-[color:var(--sl-quote-gold)]"
                    aria-hidden="true"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-transparent p-7">
            <p className="text-sm font-semibold text-foreground">Skip it if…</p>
            <ul className="mt-4 space-y-3">
              {product.notForYou.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0 opacity-50" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section 7 — the three objections that actually kill this sale. */
export function WorkshopObjections({ product }: { product: WorkshopProduct }) {
  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
          What you're probably thinking
        </p>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {product.objections.map((o) => (
            <div key={o.q} className="border-t border-border pt-5">
              <p className="text-base font-semibold leading-snug text-foreground">“{o.q}”</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 8 — one decision. */
export function WorkshopDecision({ product }: { product: WorkshopProduct }) {
  const isOpen = product.status === "open";
  const date = nextDateLabel(product.slug);

  return (
    <section className="border-b border-border py-16 md:py-24">
      <div className="public-container px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="public-heading">{product.decisionHeadline}</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {product.decisionBody}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            {isOpen ? (
              <>
                <Link
                  to={product.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--sl-quote-gold)] px-7 py-3.5 text-base font-medium text-black transition-opacity hover:opacity-90"
                >
                  Reserve your seat — {product.priceLabel}{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
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
      </div>
    </section>
  );
}
