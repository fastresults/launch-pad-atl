// @ts-nocheck
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, Copy, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, ImageOff, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export type PreviewableAsset = {
  url?: string | null;
  title: string;
  subtitle?: string | null;
  platform?: string | null;
  assetKind?: string | null;
  width?: number | null;
  height?: number | null;
  canvasPlan?: { surface?: string; ink?: string; accent?: string; signature?: string; displaySignature?: string } | null;
  qaStatus?: string | null;
  qaNotes?: any;
  modelUsed?: string | null;
  lastFeedback?: string | null;
  updatedAt?: string | null;
};

export function AssetPreviewDialog({
  open, onOpenChange, asset, onRegenerate, onDelete, onPrev, onNext,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: PreviewableAsset | null;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onPrev, onNext]);

  if (!asset) return null;

  const copyUrl = async () => {
    if (!asset.url) return;
    try {
      await navigator.clipboard.writeText(asset.url);
      toast.success("URL copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const ratio = asset?.qaNotes?.observed?.ratio;
  const signatureCoverage = asset?.qaNotes?.observed?.signatureCoveragePct;
  const signatureVisible = asset?.qaNotes?.observed?.signatureVisible;
  const checker =
    "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 0 0 / 24px 24px";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-base">{asset.title}</DialogTitle>
          {asset.subtitle && (
            <p className="text-xs text-muted-foreground">{asset.subtitle}</p>
          )}
        </DialogHeader>

        <div className="grid gap-0 md:grid-cols-[1fr_280px]">
          <div className="relative flex items-center justify-center p-4" style={{ background: checker, minHeight: 360 }}>
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm hover:bg-background"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {asset.url ? (
              <img
                src={asset.url}
                alt={asset.title}
                className="max-h-[72vh] max-w-full object-contain rounded shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageOff className="h-8 w-8" />
                <span className="text-xs">No image yet</span>
              </div>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm hover:bg-background"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <aside className="space-y-3 border-l border-border bg-card/40 p-4 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {asset.platform && <Badge variant="outline" className="text-[10px]">{asset.platform}</Badge>}
              {asset.assetKind && <Badge variant="outline" className="text-[10px] capitalize">{String(asset.assetKind).replace(/_/g, " ")}</Badge>}
              {asset.qaStatus && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${asset.qaStatus === "pass" ? "border-status-success/40 text-status-success" : "border-status-warning/40 text-status-warning"}`}
                >
                  {asset.qaStatus === "pass" ? "QA pass" : signatureVisible === false ? "Brand color missing" : "QA fail"}{ratio ? ` · ${ratio}:1` : ""}
                </Badge>
              )}
            </div>

            {(asset.width || asset.height) && (
              <div>
                <div className="text-muted-foreground">Dimensions</div>
                <div className="font-medium">{asset.width ?? "?"} × {asset.height ?? "?"}</div>
              </div>
            )}

            {asset.canvasPlan && (() => {
              const cp = asset.canvasPlan!;
              const surface = cp.surface || "#FFFFFF";
              const ink = cp.ink || "#0B0F19";
              // Signature (brand color splash) — always show. Fallback: accent → ink → neutral.
              const sigRaw = cp.displaySignature || cp.signature;
              const signature = sigRaw || cp.accent || ink || "#6B7280";
              const signatureDerived = !sigRaw;
              // Accent — always show. Fallback: signature → ink → surface → neutral.
              const accent = cp.accent || sigRaw || ink || surface || "#6B7280";
              const accentDerived = !cp.accent;
              const rows: Array<[string, string, boolean]> = [
                ["surface", surface, !cp.surface],
                ["ink", ink, !cp.ink],
                ["signature", signature, signatureDerived],
                ["accent", accent, accentDerived],
              ];
              return (
                <div>
                  <div className="text-muted-foreground">Palette</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {rows.map(([k, hex, derived]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={onRegenerate}
                        disabled={!onRegenerate}
                        title={onRegenerate ? `Change ${k}${derived ? " (derived)" : ""} — opens Regenerate` : String(k)}
                        className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 transition hover:bg-muted hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="h-4 w-4 rounded-sm border border-border" style={{ background: hex }} />
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          {hex}{derived ? "*" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                  {rows.some(([, , d]) => d) && (
                    <div className="mt-1 text-[10px] text-muted-foreground">* derived — not in brand kit</div>
                  )}

                  {onRegenerate && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Click a swatch to change color in Regenerate.
                    </div>
                  )}
                  {signatureCoverage !== undefined && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Signature coverage: {signatureCoverage}% {signatureVisible === false ? "(not visible)" : ""}
                    </div>
                  )}
                </div>
              );
            })()}

            {asset.modelUsed && (
              <div>
                <div className="text-muted-foreground">Model</div>
                <div className="font-mono text-[10px] break-all">{asset.modelUsed}</div>
              </div>
            )}

            {asset.lastFeedback && (
              <div>
                <div className="text-muted-foreground">Last feedback</div>
                <div className="rounded border border-border bg-background/40 p-2 text-[11px] italic">
                  "{asset.lastFeedback}"
                </div>
              </div>
            )}

            {asset.updatedAt && (
              <div>
                <div className="text-muted-foreground">Updated</div>
                <div className="text-[10px]">{new Date(asset.updatedAt).toLocaleString()}</div>
              </div>
            )}

            <div className="pt-2 space-y-2 border-t border-border">
              {asset.url && (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={asset.url} download>
                      <Download className="mr-2 h-3.5 w-3.5" /> Download
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={copyUrl}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copy URL
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open in new tab
                    </a>
                  </Button>
                </>
              )}
              {onRegenerate && (
                <Button size="sm" className="w-full justify-start" onClick={onRegenerate}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Regenerate
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-status-danger/40 text-status-danger hover:bg-status-danger/10 hover:text-status-danger"
                  onClick={() => {
                    if (window.confirm("Delete this image? The tile will reset so you can generate a fresh one.")) {
                      onDelete();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete & start over
                </Button>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
