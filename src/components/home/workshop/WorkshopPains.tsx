import { getWorkshopPains } from "@/lib/workshop-pains";

/**
 * The three sharpest pains for the selected workshop, each answered by what the
 * morning hands back. Ten pains exist per workshop and all ten rotate through
 * the hero — the page only argues the top three so it stays readable.
 */
export function WorkshopPains({ slug }: { slug: string }) {
  const pains = getWorkshopPains(slug)?.slice(0, 3);
  if (!pains?.length) return null;

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
