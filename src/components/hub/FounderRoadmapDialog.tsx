// @ts-nocheck
import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, FileText, Loader2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyName?: string | null;
  content: string;
  generatedAt?: string | null;
  wordCount?: number | null;
  qualityScore?: number | null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printMarkdownHtml(title: string, html: string) {
  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 760px; margin: 32px auto; padding: 0 24px; line-height: 1.6; }
    h1 { font-size: 28px; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 24px; page-break-after: avoid; }
    h2 { font-size: 20px; margin-top: 28px; page-break-after: avoid; }
    h3 { font-size: 16px; margin-top: 20px; page-break-after: avoid; }
    p, li { font-size: 13.5px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #d0d0d0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f4f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    blockquote { border-left: 3px solid #6366f1; padding: 6px 14px; color: #444; background: #f7f7fb; margin: 12px 0; }
    hr { border: 0; border-top: 1px solid #ddd; margin: 24px 0; }
    @page { margin: 18mm; }
  `;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) { toast.error("Popup blocked — allow popups to print"); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>${styles}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 250);
}

export function FounderRoadmapDialog({ open, onOpenChange, companyName, content, generatedAt, wordCount, qualityScore }: Props) {
  const title = `${companyName ?? "Your"} — Founder Roadmap`;
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Build a section index from H2s for jump-to nav
  const sections = useMemo(() => {
    const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
    return matches.map((m) => {
      const text = m[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return { id, text };
    });
  }, [content]);

  const onCopy = async () => {
    try { await navigator.clipboard.writeText(content); toast.success("Roadmap copied"); }
    catch { toast.error("Couldn't copy"); }
  };
  const onMd = () => downloadBlob(new Blob([content], { type: "text/markdown" }), `${title}.md`);
  const onDocx = async () => {
    try {
      const blob = await markdownToDocxBlob(title, content, {});
      downloadBlob(blob, `${title}.docx`);
    } catch (e) { toast.error("Couldn't build .docx"); }
  };
  const onPrint = () => {
    const node = bodyRef.current;
    if (!node) return;
    printMarkdownHtml(title, node.innerHTML);
  };

  const components = useMemo(() => ({
    h2: ({ node, ...props }: any) => {
      const text = String(props.children?.[0] ?? "");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return <h2 id={id} className="mt-10 text-2xl font-semibold tracking-tight scroll-mt-24" {...props} />;
    },
    h3: ({ node, ...props }: any) => <h3 className="mt-6 text-lg font-semibold" {...props} />,
    h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold tracking-tight" {...props} />,
    table: ({ node, ...props }: any) => <div className="my-4 overflow-x-auto"><table className="w-full text-sm border-collapse" {...props} /></div>,
    th: ({ node, ...props }: any) => <th className="border border-border bg-muted px-3 py-2 text-left text-xs uppercase tracking-wide" {...props} />,
    td: ({ node, ...props }: any) => <td className="border border-border px-3 py-2 align-top text-sm" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="my-4 border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm italic" {...props} />,
    p: ({ node, ...props }: any) => <p className="my-3 text-sm leading-relaxed" {...props} />,
    li: ({ node, ...props }: any) => <li className="my-1 text-sm leading-relaxed" {...props} />,
    hr: () => <hr className="my-8 border-border" />,
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(1100px,95vw)] overflow-hidden p-0 sm:max-w-[1100px]">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">
              {generatedAt ? new Date(generatedAt).toLocaleString() : "Just generated"}
              {wordCount ? ` · ${wordCount.toLocaleString()} words` : ""}
              {typeof qualityScore === "number" ? ` · Quality ${qualityScore}/100` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onCopy}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
            <Button size="sm" variant="ghost" onClick={onMd}><FileText className="mr-1 h-3.5 w-3.5" />.md</Button>
            <Button size="sm" variant="ghost" onClick={onDocx}><Download className="mr-1 h-3.5 w-3.5" />.docx</Button>
            <Button size="sm" variant="ghost" onClick={onPrint}><Printer className="mr-1 h-3.5 w-3.5" />Print</Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid h-[calc(92vh-56px)] grid-cols-[220px_1fr] overflow-hidden">
          {/* Section nav */}
          <aside className="hidden overflow-y-auto border-r border-border bg-muted/30 p-4 md:block">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Jump to</div>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                   onClick={(e) => {
                     e.preventDefault();
                     const el = document.getElementById(s.id);
                     el?.scrollIntoView({ behavior: "smooth", block: "start" });
                   }}
                   className="block truncate rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                  {s.text}
                </a>
              ))}
            </nav>
          </aside>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-6 md:px-10 md:py-8">
            <div ref={bodyRef} className="prose prose-sm max-w-[72ch] dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
