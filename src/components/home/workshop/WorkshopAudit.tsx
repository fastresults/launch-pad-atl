import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { AUDIT_STEPS, WORKSHOP_GUARANTEE, getWorkshopAudit } from "@/lib/workshop-audit";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";
import {
  Panel,
  PrimaryCta,
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/**
 * Every build workshop opens with an expert audit of the attendee's real
 * material. This is that promise, stated before anything else on the page.
 */
export function WorkshopAuditSection({ workshop }: { workshop: CatalogWorkshop }) {
  const audit = getWorkshopAudit(workshop.slug);
  if (!audit) return null;

  return (
    <SectionShell>
      <SectionEyebrow icon={ClipboardCheck}>Included · {audit.name}</SectionEyebrow>
      <SectionHeading
        lead="Your morning starts with an audit of your own work —"
        emphasis="not a lecture."
      />
      <p className="mt-5 max-w-3xl text-base text-muted-foreground md:text-lg">
        {audit.promise} It lands 48 hours before the session, graded, with the cost of every gap
        named and the one thing we build together to close it.
      </p>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {AUDIT_STEPS.map((step, i) => (
          <li key={step.label}>
            <Panel className="h-full">
              <div className="text-xs uppercase tracking-[0.18em] text-primary">
                0{i + 1} · {step.label}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Panel>
          </li>
        ))}
      </ol>

      <Panel accent className="mt-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          What your audit prescribes
        </div>
        <p className="mt-3 max-w-3xl text-lg font-medium leading-snug md:text-xl">
          {audit.prescribedOutcome}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The point of the morning: {audit.improvement}.
        </p>
        <PrimaryCta to={`/register?workshop=${workshop.slug}`} className="mt-6">
          Reserve a seat and start your audit
          <ArrowRight className="size-4" aria-hidden="true" />
        </PrimaryCta>
      </Panel>
    </SectionShell>
  );
}

/** One artifact, or we keep working. Same words on every build workshop. */
export function WorkshopGuarantee({ workshop }: { workshop: CatalogWorkshop }) {
  const audit = getWorkshopAudit(workshop.slug);
  if (!audit) return null;

  return (
    <SectionShell>
      <Panel accent className="md:p-8">
        <SectionEyebrow icon={ShieldCheck}>The guarantee</SectionEyebrow>
        <SectionHeading lead={WORKSHOP_GUARANTEE.headline} className="max-w-2xl" />
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {WORKSHOP_GUARANTEE.body}
        </p>
      </Panel>
    </SectionShell>
  );
}
