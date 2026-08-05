import { getWorkshopPains } from "@/lib/workshop-pains";
import { getWorkshopAudit } from "@/lib/workshop-audit";

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
      <section className="border-t border-border py-14">
        <div className="public-container px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            What this fixes
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {pains.map((pain) => (
              <div key={pain.id} className="border-t border-border pt-4">
                <h3 className="text-base font-medium text-foreground">{pain.pain}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  You leave with {pain.fix}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border py-14">
      <div className="public-container px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          The ten your audit grades
        </p>
        <h2 className="mt-4 max-w-3xl text-2xl font-medium leading-tight text-foreground sm:text-3xl">
          Ten problems your {audit.name.toLowerCase()} scores — and what the
          morning does about each one.
        </h2>
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {pains.map((pain, i) => (
            <li key={pain.id} className="border-t border-border pt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--sl-quote-gold)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-base font-medium text-foreground">{pain.pain}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You leave with {pain.fix}.
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

