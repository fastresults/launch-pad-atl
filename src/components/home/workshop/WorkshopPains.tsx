import { getWorkshopPains } from "@/lib/workshop-pains";
import { getWorkshopAudit } from "@/lib/workshop-audit";
import { AlertTriangle } from "lucide-react";
import {
  Panel,
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/**
 * The ten specific problems the audit keeps finding in this lane, each answered
 * by what the morning hands back. Foundation has no audit, so it keeps the
 * shorter three-pain framing.
 */
export function WorkshopPains({ slug }: { slug: string }) {
  const audit = getWorkshopAudit(slug);
  const all = getWorkshopPains(slug);
  const pains = audit ? all : all?.slice(0, 3);
  if (!pains?.length) return null;

  if (!audit) {
    return (
      <SectionShell>
        <SectionEyebrow icon={AlertTriangle} muted>
          What this fixes
        </SectionEyebrow>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pains.map((pain) => (
            <Panel key={pain.id}>
              <h3 className="text-base font-semibold leading-snug tracking-tight md:text-lg">
                {pain.pain}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                You leave with {pain.fix}.
              </p>
            </Panel>
          ))}
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <SectionEyebrow icon={AlertTriangle} muted>
        The ten your audit grades
      </SectionEyebrow>
      <SectionHeading
        lead={`Ten problems your ${audit.name.toLowerCase()} scores —`}
        emphasis="and what the morning does about each one."
      />
      <ol className="mt-10 grid gap-4 md:grid-cols-2">
        {pains.map((pain, i) => (
          <li key={pain.id}>
            <Panel className="h-full">
              <div className="text-xs uppercase tracking-[0.18em] text-primary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight md:text-lg">
                {pain.pain}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                You leave with {pain.fix}.
              </p>
            </Panel>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
