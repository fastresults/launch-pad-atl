import { Check } from "lucide-react";
import type { WorkshopProduct } from "@/lib/workshop-products";

/**
 * Sections 2 and 3 — the artifacts named like real files, and one of them
 * rendered as the object it actually is. This is the proof that the morning
 * produces a thing, not notes about a thing.
 */
export function WorkshopArtifacts({ product }: { product: WorkshopProduct }) {
  const preview = product.artifactPreview;

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
          What you walk out with
        </p>
        <h2 className="public-heading mt-4 max-w-2xl">
          Finished before lunch. Yours to keep.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10">
          <ul className="space-y-4 md:col-span-6">
            {product.artifacts.map((a) => (
              <li key={a} className="flex gap-3 border-b border-border pb-4 last:border-0">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[color:var(--sl-quote-gold)]"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-foreground md:text-base">{a}</span>
              </li>
            ))}
          </ul>

          <div className="md:col-span-6">
            <figure className="overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              <figcaption className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--sl-quote-gold)]">
                  {preview.kind}
                </span>
                <span className="flex gap-1.5" aria-hidden="true">
                  <i className="size-2 rounded-full bg-muted-foreground/30" />
                  <i className="size-2 rounded-full bg-muted-foreground/30" />
                  <i className="size-2 rounded-full bg-muted-foreground/30" />
                </span>
              </figcaption>
              <div className="px-5 py-6">
                <p className="text-base font-semibold text-foreground md:text-lg">
                  {preview.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {preview.lines.map((line) => (
                    <li
                      key={line}
                      className="border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                {preview.stamp}
              </p>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section 4 — the morning, hour by hour. Input, working session, output. */
export function WorkshopMorning({ product }: { product: WorkshopProduct }) {
  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--sl-quote-gold)]">
          The morning, hour by hour
        </p>
        <h2 className="public-heading mt-4 max-w-2xl">
          8:45 to 11:30. Four working blocks, no lecture.
        </h2>

        <ol className="mt-10 space-y-0">
          {product.morning.map((block, i) => (
            <li
              key={block.time}
              className="grid grid-cols-1 gap-2 border-t border-border py-6 md:grid-cols-12 md:gap-8"
            >
              <div className="md:col-span-3">
                <p className="text-sm font-semibold tabular-nums text-[color:var(--sl-quote-gold)]">
                  {block.time}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Block {i + 1}
                </p>
              </div>
              <div className="md:col-span-9">
                <p className="text-base font-semibold text-foreground md:text-lg">{block.title}</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {block.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
