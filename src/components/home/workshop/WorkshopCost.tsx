import type { WorkshopProduct } from "@/lib/workshop-products";

/**
 * Section 1 — the cost of not having this. The number first, then the story in
 * the founder's own words. No offer yet.
 */
export function WorkshopCost({ product }: { product: WorkshopProduct }) {
  const Icon = product.icon;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
              <Icon className="size-4" aria-hidden="true" />
              {product.costEyebrow}
            </div>
            <h2 className="public-heading mt-4">{product.painHeadline}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {product.costBody}
            </p>
          </div>

          <div className="md:col-span-5">
            <div className="flex h-full flex-col justify-center border-l-2 border-[color:var(--sl-quote-gold)] pl-6 md:pl-8">
              <p className="text-4xl font-semibold leading-none tracking-tight text-foreground md:text-5xl">
                {product.costStat}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {product.costStatCaption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
