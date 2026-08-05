import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { AUDIT_STEPS, WORKSHOP_GUARANTEE, getWorkshopAudit } from "@/lib/workshop-audit";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";

/**
 * Every build workshop opens with an expert audit of the attendee's real
 * material. This is that promise, stated before anything else on the page.
 */
export function WorkshopAuditSection({ workshop }: { workshop: CatalogWorkshop }) {
  const audit = getWorkshopAudit(workshop.slug);
  if (!audit) return null;

  return (
    <section className="border-t border-border py-14">
      <div className="public-container px-6">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--sl-quote-gold)]">
          <ClipboardCheck className="size-3.5" aria-hidden="true" />
          Included · {audit.name}
        </p>
        <h2 className="mt-4 max-w-3xl text-2xl font-medium leading-tight text-foreground sm:text-3xl">
          Your morning starts with an audit of your own work — not a lecture.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {audit.promise} It lands 48 hours before the session, graded, with the
          cost of every gap named and the one thing we build together to close it.
        </p>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {AUDIT_STEPS.map((step, i) => (
            <li key={step.label} className="border-t border-border pt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                0{i + 1} · {step.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            What your audit prescribes
          </p>
          <p className="mt-3 max-w-3xl text-lg font-medium leading-snug text-foreground">
            {audit.prescribedOutcome}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The point of the morning: {audit.improvement}.
          </p>
          <Link
            to={`/register?workshop=${workshop.slug}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--sl-quote-gold)]"
          >
            Reserve a seat and start your audit
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** One artifact, or we keep working. Same words on every build workshop. */
export function WorkshopGuarantee({ workshop }: { workshop: CatalogWorkshop }) {
  const audit = getWorkshopAudit(workshop.slug);
  if (!audit) return null;

  return (
    <section className="border-t border-border py-14">
      <div className="public-container px-6">
        <div className="rounded-2xl border border-[color:var(--sl-quote-gold)]/40 bg-card p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--sl-quote-gold)]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            The guarantee
          </p>
          <h2 className="mt-4 max-w-2xl text-2xl font-medium leading-tight text-foreground sm:text-3xl">
            {WORKSHOP_GUARANTEE.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {WORKSHOP_GUARANTEE.body}
          </p>
        </div>
      </div>
    </section>
  );
}
