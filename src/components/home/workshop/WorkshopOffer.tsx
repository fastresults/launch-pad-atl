import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Minus,
  Layers,
  MessageCircleQuestion,
  Video,
} from "lucide-react";
import { getWorkshopFormats, REMOTE_SETUP, type WorkshopProduct } from "@/lib/workshop-products";
import { nextDateLabel } from "@/lib/workshop-catalog";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/home/workshop/WaitlistForm";
import { RemoteSetupDialog } from "@/components/home/workshop/RemoteSetupDialog";
import {
  Panel,
  PrimaryCta,
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/** Section 5 — two ways to get it. The room is dominant; the course is honest. */
export function WorkshopFormats({ product }: { product: WorkshopProduct }) {
  const { live, included } = getWorkshopFormats(product);
  const isOpen = product.status === "open";
  const date = nextDateLabel(product.slug);

  return (
    <SectionShell tinted>
      <SectionEyebrow icon={Layers}>What the seat includes</SectionEyebrow>
      <SectionHeading lead="The morning," emphasis="and everything that outlives it." />

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

        {/* What comes home with the seat */}
        <div className="md:col-span-5">
          <Panel className="h-full md:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary">
              <Check className="size-3.5" aria-hidden="true" />
              {included.label}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{included.heading}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{included.summary}</p>
            <ul className="mt-6 space-y-5">
              {included.items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border/60 pt-4 text-sm text-foreground/80">
              {included.footnote}
            </p>
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
  const [remoteOpen, setRemoteOpen] = useState(false);

  // Only Foundation offers the remote, done-for-you path.
  if (product.slug !== REMOTE_SETUP.slug) {
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

  const room = (
    <Panel accent={isOpen} className="flex h-full flex-col md:p-8">
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" />
        In the room · Atlanta · {product.priceLabel}
      </p>
      <h3 className="mt-3 text-xl font-semibold leading-snug">
        If you can get to Norcross, get in the room.
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        One morning. Twenty chairs. We build it with you while you sit there.
      </p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {product.walkOuts.slice(0, 4).map((w) => (
          <li key={w} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{w}</span>
          </li>
        ))}
      </ul>

      {isOpen ? (
        <div className="mt-6">
          <PrimaryCta to={product.href} className="w-full justify-center px-6 py-3.5">
            Take a seat — {product.priceLabel}{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </PrimaryCta>

          {date && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {date} · 8:45–11:30am · IGNITE Center, Norcross GA
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <WaitlistForm
            slug={product.slug}
            format="workshop"
            tone="card"
            label="Get the date"
            doneMessage="You'll hear from us first."
          />
          <p className="text-center text-xs text-muted-foreground">
            Next seats open {product.opensLabel}. If that's too long to wait, take the other door.
          </p>
        </div>


      )}
    </Panel>
  );

  const remote = (
    <Panel accent={!isOpen} className="flex h-full flex-col md:p-8">
      <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Video className="size-3.5" aria-hidden="true" />
        {REMOTE_SETUP.label}
      </p>
      <h3 className="mt-3 text-xl font-semibold leading-snug">{REMOTE_SETUP.headline}</h3>
      <ol className="mt-5 flex-1 space-y-4">
        {REMOTE_SETUP.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/40 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed">
              <span className="font-semibold text-foreground">{s.title}.</span>{" "}
              <span className="text-muted-foreground">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{REMOTE_SETUP.reassurance}</p>
      <div className="mt-6">
        <Button
          type="button"
          size="lg"
          className="h-auto w-full whitespace-normal px-6 py-3.5 text-base"
          onClick={() => setRemoteOpen(true)}
        >
          {REMOTE_SETUP.cta}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{REMOTE_SETUP.fineprint}</p>
      </div>
    </Panel>
  );

  return (
    <SectionShell className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          Choose your seat
        </p>
        <h2 className="public-heading">Come sit with us, or join us over Zoom.</h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          Both lead to the same place. Pick the one that fits your life — a morning in the room, or a
          one-on-one call from wherever you are. Either way, you end up named, priced, online, and talking to a real customer.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {isOpen ? (
          <>
            {room}
            {remote}
          </>
        ) : (
          <>
            {remote}
            {room}
          </>
        )}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
        Nobody walks away holding a plan. You walk away holding the thing.
      </p>


      <RemoteSetupDialog open={remoteOpen} onOpenChange={setRemoteOpen} />
    </SectionShell>
  );
}

