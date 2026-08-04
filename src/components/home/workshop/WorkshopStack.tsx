import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getWorkshopProduct } from "@/lib/workshop-products";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";
import { WorkshopCost } from "@/components/home/workshop/WorkshopCost";
import { WorkshopArtifacts, WorkshopMorning } from "@/components/home/workshop/WorkshopBuild";
import {
  WorkshopDecision,
  WorkshopFit,
  WorkshopFormats,
  WorkshopObjections,
} from "@/components/home/workshop/WorkshopOffer";

/**
 * The whole page below the hero, rendered for one workshop. Change the chip in
 * the hero and this entire stack becomes that product's sales page — same
 * template, nine different products, one decision at the end.
 */
export function WorkshopStack({ workshop }: { workshop: CatalogWorkshop }) {
  const product = getWorkshopProduct(workshop.slug);

  return (
    <div id="learn-more" className="scroll-mt-16">
      <WorkshopStickyBar workshop={workshop} />
      {/* Keyed so the swap cross-fades instead of snapping; scroll stays put. */}
      <div key={workshop.slug} className="animate-in fade-in duration-500">
        <WorkshopCost product={product} />
        <WorkshopPains slug={workshop.slug} />
        <WorkshopArtifacts product={product} />
        <WorkshopMorning product={product} />
        <WorkshopFormats product={product} />
        <WorkshopFit product={product} />
        <WorkshopObjections product={product} />
        <WorkshopDecision product={product} />
      </div>
    </div>
  );
}

/** Keeps the selected workshop and its price on screen through a long page. */
function WorkshopStickyBar({ workshop }: { workshop: CatalogWorkshop }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const isOpen = workshop.status === "open";
  const Icon = workshop.icon;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      <div
        data-visible={stuck || undefined}
        className="pointer-events-none fixed inset-x-0 top-14 z-40 -translate-y-3 opacity-0 transition-[opacity,transform] duration-300 data-[visible]:pointer-events-auto data-[visible]:translate-y-0 data-[visible]:opacity-100"
      >
        <div className="public-container px-6">
          <div className="flex items-center justify-between gap-4 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
              <Icon
                className="size-4 shrink-0 text-[color:var(--sl-quote-gold)]"
                aria-hidden="true"
              />
              <span className="truncate">{workshop.title}</span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                · {workshop.priceLabel}
              </span>
            </span>
            <Link
              to={workshop.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--sl-quote-gold)] px-4 py-1.5 text-sm font-medium text-black"
            >
              {isOpen ? "Reserve" : "See the morning"}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
