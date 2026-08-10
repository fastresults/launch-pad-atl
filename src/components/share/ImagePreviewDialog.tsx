import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react";
import type { ShareImage } from "@/lib/venture-share.functions";
import { buildPreviewCopy } from "@/components/share/preview-copy";


/** Everything a viewer needs from one creative: the art, the copy, and the ways to take it with them. */
export function ImagePreviewDialog({
  image,
  fallbackTitle,
  onClose,
}: {
  image: ShareImage | null;
  fallbackTitle: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!image) setCopied(null);
  }, [image]);

  const meta = image?.meta ?? null;
  const preview = buildPreviewCopy(image, fallbackTitle);
  const headline = preview.headline;
  const hashtags = meta?.hashtags?.length ? meta.hashtags.join(" ") : null;


  const fullCaption = [
    meta?.hook && meta.hook !== headline ? meta.hook : null,
    meta?.body ?? null,
    meta?.cta ?? null,
    hashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard blocked — the text stays selectable on screen */
    }
  }

  async function download() {
    if (!image) return;
    const name = `${meta?.filename ?? fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const ext = blob.type.includes("svg") ? "svg" : blob.type.includes("jpeg") ? "jpg" : "png";
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      window.open(image.url, "_blank", "noopener");
    }
  }

  function print() {
    if (!image) return;
    const w = window.open("", "_blank", "noopener,width=900,height=1100");
    if (!w) return;
    w.document.write(
      `<!doctype html><title>${headline ?? fallbackTitle}</title>` +
        `<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh}img{max-width:100%;max-height:100vh}</style>` +
        `<img src="${image.url}" onload="window.focus();window.print();" />`,
    );
    w.document.close();
  }

  const CopyRow = ({ id, label, text }: { id: string; label: string; text: string }) => (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => copyText(id, text)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied === id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied === id ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{text}</p>
    </div>
  );

  return (
    <Dialog open={!!image} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="theme-dark-scope max-h-[92vh] max-w-6xl overflow-hidden border-border/60 bg-background p-0">
        <DialogTitle className="sr-only">{headline ?? fallbackTitle}</DialogTitle>
        <DialogDescription className="sr-only">Creative preview with its post copy and download options</DialogDescription>
        {image && (
          <div className="grid max-h-[92vh] grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:overflow-hidden">
            <div className="flex items-center justify-center bg-muted/10 p-4 md:max-h-[92vh]">
              <img
                src={image.url}
                alt={headline ?? fallbackTitle}
                className="max-h-[46vh] w-auto max-w-full rounded-xl object-contain md:max-h-[84vh]"
              />
            </div>

            <div className="flex min-w-0 flex-col gap-4 border-t border-border/60 p-5 md:max-h-[92vh] md:overflow-y-auto md:border-l md:border-t-0">
              <div>
                {preview.eyebrow && (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {preview.eyebrow}
                  </p>
                )}
                <h3 className="font-serif text-[22px] leading-tight text-foreground">{preview.headline}</h3>
                {preview.pillar && <p className="mt-1 text-xs text-muted-foreground">{preview.pillar}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={download}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
                <Button size="sm" variant="secondary" onClick={print}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                </Button>
                {!!preview.caption && (
                  <Button size="sm" variant="secondary" onClick={() => copyText("all", preview.caption)}>
                    {copied === "all" ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {copied === "all" ? "Copied" : "Copy caption"}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => window.open(image.url, "_blank", "noopener")}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                </Button>
              </div>

              <div className="space-y-3">
                {preview.fields.map((f) => (
                  <CopyRow key={f.id} id={f.id} label={f.label} text={f.text} />
                ))}
                {preview.artworkOnly && (
                  <p className="text-sm text-muted-foreground">
                    This asset ships as artwork only — no post copy is attached.
                  </p>
                )}
              </div>


              {(image.width || image.height) && (
                <p className="mt-auto pt-2 text-[11px] text-muted-foreground">
                  {image.width} × {image.height} px
                  {meta?.assetKind ? ` · ${meta.assetKind}` : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
