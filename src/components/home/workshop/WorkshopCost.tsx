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
          <div className="flex h-full flex-col justify-center rounded-2xl border border-primary/30 bg-card p-6 md:p-8">
            <p className="text-4xl font-semibold leading-none tracking-tight md:text-5xl">
              {product.costStat}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {product.costStatCaption}
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
