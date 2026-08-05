import { Check, Clock } from "lucide-react";
import type { WorkshopProduct } from "@/lib/workshop-products";
import {
  Panel,
  SectionEyebrow,
  SectionHeading,
  SectionShell,
} from "@/components/home/workshop/SectionChrome";

/**
 * Sections 2 and 3 — the artifacts named like real files, and one of them
 * rendered as the object it actually is. This is the proof that the morning
 * produces a thing, not notes about a thing.
 */
export function WorkshopArtifacts({ product }: { product: WorkshopProduct }) {
  const preview = product.artifactPreview;

  return (
    <SectionShell tinted>
      <SectionEyebrow icon={Check}>What you walk out with</SectionEyebrow>
      <SectionHeading lead="Finished before lunch." emphasis="Yours to keep." />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        <ul className="space-y-3 md:col-span-6">
          {product.artifacts.map((a) => (
            <li
              key={a}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-card px-5 py-4"
            >
              <Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-base font-medium tracking-tight">{a}</span>
            </li>
          ))}
        </ul>

        <div className="md:col-span-6">
          <figure className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-lg">
            <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {preview.kind}
              </span>
              <span className="flex gap-1.5" aria-hidden="true">
                <i className="size-2 rounded-full bg-muted-foreground/30" />
                <i className="size-2 rounded-full bg-muted-foreground/30" />
                <i className="size-2 rounded-full bg-muted-foreground/30" />
              </span>
            </figcaption>
            <div className="px-5 py-6">
              <p className="text-base font-semibold md:text-lg">{preview.title}</p>
              <ul className="mt-4 space-y-3">
                {preview.lines.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-primary/40 pl-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <p className="border-t border-white/10 px-5 py-3 text-xs text-muted-foreground">
              {preview.stamp}
            </p>
          </figure>
        </div>
      </div>
    </SectionShell>
  );
}

/** Section 4 — the morning, hour by hour. Input, working session, output. */
export function WorkshopMorning({ product }: { product: WorkshopProduct }) {
  return (
    <SectionShell>
      <SectionEyebrow icon={Clock} muted>
        The agenda
      </SectionEyebrow>
      <SectionHeading lead="8:45 to 11:30." emphasis="Four working blocks, no lecture." />

      <ol className="mt-10 space-y-4">
        {product.morning.map((block, i) => (
          <li key={block.time}>
            <Panel className="md:p-7">
              <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                <div className="text-xs uppercase tracking-[0.18em] text-primary md:w-40 md:text-sm">
                  {block.time}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold tracking-tight md:text-xl">
                    <span className="mr-2 text-muted-foreground">0{i + 1}.</span>
                    {block.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {block.detail}
                  </p>
                </div>
              </div>
            </Panel>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
