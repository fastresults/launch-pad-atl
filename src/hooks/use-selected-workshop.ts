import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FOUNDATION_SLUG,
  WORKSHOP_CATALOG,
  getCatalogWorkshop,
  type CatalogWorkshop,
} from "@/lib/workshop-catalog";

/**
 * The selected workshop lives in the URL (`?w=slug`) so a selection is
 * shareable and the back button behaves. Hero and sampler both read it.
 */
export function useSelectedWorkshop(): {
  workshop: CatalogWorkshop;
  select: (slug: string) => void;
} {
  const [params, setParams] = useSearchParams();
  const raw = params.get("w");
  const known = WORKSHOP_CATALOG.some((w) => w.slug === raw);
  const workshop = getCatalogWorkshop(known ? raw : FOUNDATION_SLUG);

  const select = useCallback(
    (slug: string) => {
      const next = new URLSearchParams(params);
      if (slug === FOUNDATION_SLUG) next.delete("w");
      else next.set("w", slug);
      setParams(next, { replace: false });
    },
    [params, setParams],
  );

  return { workshop, select };
}
