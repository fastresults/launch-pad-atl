import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ShareItem } from "@/lib/venture-share.functions";
import { normalizeParagraphs } from "@/lib/markdown-normalize";

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
        <div className="max-w-none text-foreground/90 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:font-serif [&_h1]:text-[26px] [&_h1]:leading-tight [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:leading-tight [&_h3]:mb-3 [&_h3]:mt-10 [&_h3]:font-serif [&_h3]:text-[18px] [&_hr]:my-10 [&_hr]:border-border/60 [&_img]:my-8 [&_img]:rounded-xl [&_li]:my-2.5 [&_li]:text-[15px] [&_li]:leading-[1.8] [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-6 [&_p]:text-[15px] [&_p]:leading-[1.85] [&_strong]:font-semibold [&_strong]:text-foreground [&_table]:my-8 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-border/50 [&_td]:py-2 [&_td]:pr-4 [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&>*:first-child]:mt-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeParagraphs(item.body)}</ReactMarkdown>
        </div>
      )}


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
