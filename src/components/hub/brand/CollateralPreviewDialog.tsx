// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, Copy, Download, ExternalLink, FileText, Loader2, Package, RotateCcw, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type File = {
  id: string;
  name: string;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  storage_path?: string | null;
};

type Page = {
  key: string;
  label: string;
  width?: number | null;
  height?: number | null;
  /** what we actually render */
  render: File | null;
  /** every file that belongs to this page, for the download row */
  files: File[];
};

const CHECKER =
  "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 0 0 / 24px 24px";

function pretty(name: string) {
  return name.replace(/-preview$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ext(f: File) {
  const fromPath = f.storage_path?.split(".").pop();
  if (fromPath && fromPath.length <= 5) return fromPath.toUpperCase();
  if (f.mime_type === "image/svg+xml") return "SVG";
  if (f.mime_type === "image/png") return "PNG";
  if (f.mime_type === "text/html") return "HTML";
  if (f.mime_type === "text/css") return "CSS";
  if (f.mime_type === "application/json") return "JSON";
  return "FILE";
}

/** Collapse the SVG master, its `-preview` PNG and its `-mockup` scene into one page. */
function buildPages(files: File[]): Page[] {
  const groups = new Map<string, File[]>();
  for (const f of files) {
    const base = String(f.name ?? "").replace(/-(preview|mockup)$/, "");
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base)!.push(f);
  }
  return [...groups.entries()].map(([base, group]) => {
    const isMock = (f: File) => /-mockup$/.test(String(f.name ?? ""));
    const png = group.find((f) => f.mime_type === "image/png" && !isMock(f));
    const svg = group.find((f) => f.mime_type === "image/svg+xml");
    const html = group.find((f) => f.mime_type === "text/html");
    const render = png ?? svg ?? html ?? group[0] ?? null;
    return {
      key: base,
      label: pretty(base),
      width: png?.width ?? svg?.width ?? null,
      height: png?.height ?? svg?.height ?? null,
      render,
      // The mock-up scene is presentation only — it never belongs in a download row.
      files: group.filter((f) => !isMock(f)),
    };
  });
}


export function CollateralPreviewDialog({
  open, onOpenChange, kind, files, busy = false, canGenerate = true, onRegenerate, onClear,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: { kind: string; label: string; note: string } | null;
  files: File[];
  busy?: boolean;
  canGenerate?: boolean;
  onRegenerate?: () => void;
  onClear?: () => void;
}) {
  const pages = useMemo(() => buildPages(files ?? []), [files]);
  const [idx, setIdx] = useState(0);
  const [htmlSource, setHtmlSource] = useState<string | null>(null);

  useEffect(() => { setIdx(0); }, [kind?.kind, open]);
  useEffect(() => { if (idx > pages.length - 1) setIdx(0); }, [pages.length, idx]);

  const page = pages[idx] ?? null;
  const rendered = page?.render ?? null;
  const isHtml = rendered?.mime_type === "text/html";

  // The HTML signature is fetched and injected rather than iframed by URL —
  // signed storage URLs download rather than render inline.
  useEffect(() => {
    let cancelled = false;
    setHtmlSource(null);
    if (!open || !isHtml || !rendered?.url) return;
    fetch(rendered.url)
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => { if (!cancelled) setHtmlSource(t); })
      .catch(() => { if (!cancelled) setHtmlSource(null); });
    return () => { cancelled = true; };
  }, [open, isHtml, rendered?.url]);

  const go = (d: number) => setIdx((i) => (pages.length ? (i + d + pages.length) % pages.length : 0));

  useEffect(() => {
    if (!open || pages.length < 2) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, pages.length]);

  const copyUrl = async (url?: string | null) => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    catch { toast.error("Couldn't copy"); }
  };

  const copyHtml = async () => {
    if (!htmlSource) return;
    try { await navigator.clipboard.writeText(htmlSource); toast.success("HTML copied — paste into your mail client's signature editor"); }
    catch { toast.error("Couldn't copy"); }
  };

  if (!kind) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-dark-scope flex max-h-[92dvh] w-[min(1100px,96vw)] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                {kind.label}
                {pages.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">{pages.length} page{pages.length === 1 ? "" : "s"}</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">{kind.note}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {onClear && pages.length > 0 && (
                <Button size="sm" variant="ghost" onClick={onClear} disabled={busy}>
                  <RotateCcw className="mr-1 h-3 w-3" />Clear
                </Button>
              )}
              {onRegenerate && (
                <Button size="sm" variant="outline" onClick={onRegenerate} disabled={busy || !canGenerate}>
                  {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  {pages.length ? "Regenerate" : "Generate"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-5"
          style={{ background: CHECKER, minHeight: 300 }}
        >
          {pages.length > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm hover:bg-background"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {!rendered && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Package className="h-8 w-8" />}
              <span className="text-xs">{busy ? "Generating…" : "Nothing generated yet"}</span>
              {!busy && onRegenerate && (
                <Button size="sm" onClick={onRegenerate} disabled={!canGenerate}>
                  <Sparkles className="mr-1 h-3 w-3" />Generate {kind.label.toLowerCase()}
                </Button>
              )}
              {!busy && !canGenerate && (
                <span className="text-[11px]">Lock your brand kit first.</span>
              )}
            </div>
          )}

          {rendered && isHtml && (
            htmlSource
              ? <iframe
                  title={page?.label ?? "Preview"}
                  sandbox=""
                  srcDoc={htmlSource}
                  className="h-[60vh] w-full max-w-3xl rounded bg-white shadow-lg"
                />
              : <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading preview…</div>
          )}

          {rendered && !isHtml && rendered.url && (
            <img
              src={rendered.url}
              alt={page?.label ?? kind.label}
              className={`max-h-[70vh] max-w-full rounded object-contain shadow-lg transition ${busy ? "opacity-40 blur-[1px]" : ""}`}
            />
          )}

          {rendered && !isHtml && !rendered.url && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" /><span className="text-xs">No preview available</span>
            </div>
          )}

          {busy && rendered && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs font-medium">Regenerating…</span>
              </div>
            </div>
          )}

          {pages.length > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm hover:bg-background"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {pages.length > 1 && (
          <div className="shrink-0 overflow-x-auto border-t border-border bg-card/40 px-4 py-2">
            <div className="flex gap-2">
              {pages.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setIdx(i)}
                  title={p.label}
                  className={`h-12 w-16 shrink-0 overflow-hidden rounded border bg-white transition ${i === idx ? "border-primary ring-1 ring-primary" : "border-border opacity-70 hover:opacity-100"}`}
                >
                  {p.render?.url && p.render.mime_type !== "text/html"
                    ? <img src={p.render.url} alt="" className="h-full w-full object-contain" loading="lazy" />
                    : <span className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">{p.label}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-5 py-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            {page && (
              <>
                <span className="font-medium text-foreground">{page.label}</span>
                {pages.length > 1 && <> · {idx + 1} of {pages.length}</>}
                {page.width && page.height ? <> · {page.width} × {page.height}px</> : null}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isHtml && htmlSource && (
              <Button size="sm" variant="outline" onClick={copyHtml}>
                <Copy className="mr-1 h-3 w-3" />Copy HTML
              </Button>
            )}
            {rendered?.url && (
              <Button size="sm" variant="ghost" onClick={() => copyUrl(rendered.url)}>
                <Copy className="mr-1 h-3 w-3" />Copy link
              </Button>
            )}
            {(page?.files ?? []).map((f) => (
              f.url ? (
                <Button key={f.id} size="sm" variant="outline" asChild>
                  <a href={f.url} download target="_blank" rel="noreferrer">
                    <Download className="mr-1 h-3 w-3" />{ext(f)}
                  </a>
                </Button>
              ) : null
            ))}
            {rendered?.url && (
              <Button size="sm" variant="ghost" asChild>
                <a href={rendered.url} target="_blank" rel="noreferrer" aria-label="Open in new tab">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
