import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ShareItem } from "@/lib/venture-share.functions";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/** One asset in the reading pane: document body, hero art, or an image grid. */
export function ShareSection({ item }: { item: ShareItem }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <section id={item.key} className="scroll-mt-24 border-t border-border/60 py-14 first:border-t-0">
      <header className="mb-7">
        <h2 className="font-serif text-[28px] leading-tight tracking-tight text-foreground md:text-[34px]">
          {item.title}
        </h2>
        {item.subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
        )}
      </header>

      {item.heroImageUrl && (
        <div className="mb-10 flex justify-center rounded-2xl border border-border/60 bg-muted/10 p-3">
          <img
            src={item.heroImageUrl}
            alt={item.title}
            loading="lazy"
            className="max-h-[420px] w-auto max-w-full rounded-xl object-contain"
          />
        </div>
      )}

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

      {item.body && (
        <div className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:mt-10 prose-headings:mb-3 prose-p:text-[15px] prose-p:leading-[1.85] prose-p:mb-6 prose-ul:my-6 prose-ol:my-6 prose-li:my-2 prose-li:text-[15px] prose-li:leading-[1.8] prose-a:text-primary prose-strong:text-foreground prose-hr:my-10 prose-hr:border-border/60 prose-table:text-sm prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeParagraphs(item.body)}</ReactMarkdown>
        </div>
      )}


      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="theme-dark-scope max-w-5xl border-border/60 bg-background p-2">
          {lightbox && (
            <img src={lightbox} alt={item.title} className="max-h-[80vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
