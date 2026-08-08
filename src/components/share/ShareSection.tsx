import { useState } from "react";
import type { ShareItem } from "@/lib/venture-share.functions";
import { MarkdownProse } from "@/components/markdown/MarkdownProse";
import { ShareBrandBoard } from "@/components/share/ShareBrandBoard";
import { ExecutiveMetrics } from "@/components/share/ExecutiveMetrics";

import { filterShowcaseContent } from "@/lib/share-content-filter";


import { Dialog, DialogContent } from "@/components/ui/dialog";


/**
 * Typographic stand-in used when an asset has no generated header art, so no
 * section ever reads as unfinished.
 */
function CoverPlate({ title, accent }: { title: string; accent?: string | null }) {
  return (
    <div
      className="mb-10 flex h-[180px] items-end overflow-hidden rounded-2xl border border-border/60 p-6 md:h-[220px]"
      style={{
        background: `linear-gradient(135deg, ${accent ?? "hsl(var(--primary))"}22, transparent 65%), hsl(var(--muted) / 0.25)`,
      }}
    >
      <span
        className="font-serif text-[26px] leading-tight text-foreground/80 md:text-[34px]"
        style={{ borderLeft: `3px solid ${accent ?? "hsl(var(--primary))"}`, paddingLeft: 16 }}
      >
        {title}
      </span>
    </div>
  );
}

/** One asset in the reading pane: document body, hero art, or an image grid. */
export function ShareSection({ item, accent }: { item: ShareItem; accent?: string | null }) {
  const [lightbox, setLightbox] = useState<string | null>(null);


  return (
    <section id={item.key} className="min-w-0 max-w-full scroll-mt-24 overflow-x-clip border-t border-border/60 py-14 first:border-t-0">
      <header className="mb-7">
        <h2 className="font-serif text-[28px] leading-tight tracking-tight text-foreground md:text-[34px]">
          {item.title}
        </h2>
        {item.subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
        )}
      </header>

      {item.kind === "timeline" ? (
        // The cadence is its own hero — art on top of it would only compete.
        <TimelineBoundary resetKey={item.key}>
          <VentureTimeline
            timeline={item.timeline?.data}
            scenario={item.timeline?.scenario}
            metrics={item.metrics ?? null}
            readOnly
            className="mb-10"
          />
        </TimelineBoundary>
      ) : item.heroImageUrl ? (
        <div className="mb-10 flex justify-center rounded-2xl border border-border/60 bg-muted/10 p-3">
          <img
            src={item.heroImageUrl}
            alt={item.title}
            loading="lazy"
            className="max-h-[420px] w-auto max-w-full rounded-xl object-contain"
          />
        </div>
      ) : (
        // Every section still reads as designed when header art is missing.
        <CoverPlate title={item.title} accent={accent} />
      )}


      {!!item.metrics?.length && (
        <ExecutiveMetrics
          metrics={item.metrics}
          accent={accent}
          eyebrow={item.key === "overview:summary" ? "The essentials" : "By the numbers"}
          footnote={item.key === "overview:summary" ? null : undefined}
        />
      )}


      {item.brandBoard && <ShareBrandBoard board={item.brandBoard} />}




      {item.kind === "gallery" && !!item.images?.length && (
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {item.images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setLightbox(img.url)}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-muted/20 text-left transition-colors hover:border-primary/50"
            >
              <img
                src={img.url}
                alt={img.label ?? `${item.title} ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-xl object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {img.label && (
                <div className="border-t border-border/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {img.label}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {item.body && <MarkdownProse>{filterShowcaseContent(item.body)}</MarkdownProse>}


      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="theme-dark-scope max-w-5xl border-border/60 bg-background p-2">
          {lightbox && (
            <img src={lightbox} alt={item.title} className="max-h-[80vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
