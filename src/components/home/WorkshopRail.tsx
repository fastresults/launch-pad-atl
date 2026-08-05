import { WORKSHOP_CATALOG } from "@/lib/workshop-catalog";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";

type Props = {
  selected: CatalogWorkshop;
  onSelect: (slug: string) => void;
  onOpenGateway: () => void;
};

/**
 * The hero's quiet workshop rail: one chip per workshop, the open one ringed in
 * gold, the rest carrying the month they open. Selecting a chip re-tunes the
 * hero question and the sections below.
 */
export function WorkshopRail({ selected, onSelect, onOpenGateway }: Props) {
  return (
    <div className="sl-rail">
      <div className="sl-rail__scroller" role="tablist" aria-label="Choose a workshop">
        {WORKSHOP_CATALOG.map((w) => (
          <button
            key={w.slug}
            type="button"
            role="tab"
            aria-selected={w.slug === selected.slug}
            onClick={() => onSelect(w.slug)}
            data-active={w.slug === selected.slug || undefined}
            data-open={w.status === "open" || undefined}
            className="sl-rail__chip"
          >
            <span>{w.chipLabel}</span>
            {w.status === "open" ? <span className="sl-rail__tag">Open</span> : null}

          </button>
        ))}
      </div>
      <button type="button" onClick={onOpenGateway} className="sl-rail__all">
        See all 9 workshops
      </button>
    </div>
  );
}
