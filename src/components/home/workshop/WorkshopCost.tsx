import type { WorkshopProduct } from "@/lib/workshop-products";
import { SectionEyebrow, SectionHeading, SectionShell } from "@/components/home/workshop/SectionChrome";

/**
 * Section 1 — the cost of not having this. The number first, then the story in
 * the founder's own words. No offer yet.
 */
export function WorkshopCost({ product }: { product: WorkshopProduct }) {
  const Icon = product.icon;

  return (
    <SectionShell>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <SectionEyebrow icon={Icon}>{product.costEyebrow}</SectionEyebrow>
          <SectionHeading lead={product.painHeadline} />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {product.costBody}
          </p>
        </div>

        <div className="md:col-span-5">
          <figure className="relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-primary/30 bg-card p-8 md:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,hsl(var(--primary)/0.14),transparent_60%)]"
            />
            <div className="relative">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
                The cost of waiting
              </span>
              <p className="mt-4 font-serif text-6xl font-semibold leading-[0.9] tracking-tight text-foreground md:text-7xl lg:text-8xl">
                {product.costStat}
              </p>
              <span aria-hidden="true" className="mt-6 block h-px w-16 bg-primary/60" />
              <figcaption className="mt-5 max-w-sm text-base font-medium leading-snug text-foreground/85 md:text-lg">
                {product.costStatCaption}
              </figcaption>
            </div>
          </figure>
        </div>

      </div>
    </SectionShell>
  );
}
