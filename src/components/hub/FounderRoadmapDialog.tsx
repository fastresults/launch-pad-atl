// @ts-nocheck
import { useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, FileText, Printer, X, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { toast } from "sonner";

interface RoadmapCoverage {
  per_track?: Record<string, { total: number; used: number }>;
  total_assets?: number;
  used_count?: number;
  skipped_labels?: string[];
  tag_matches?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyName?: string | null;
  content: string;
  generatedAt?: string | null;
  wordCount?: number | null;
  qualityScore?: number | null;
  documentCount?: number | null;
  coverage?: RoadmapCoverage | null;
  isStale?: boolean;
}

// Replace `[from: Asset Name]` inline tags with a compact marker the renderer
// can style. We swap for a distinct unicode wrapper so the markdown parser
// leaves it untouched, then a `p` renderer walks the text nodes.
const SRC_OPEN = "\u2308"; // ⌈
const SRC_CLOSE = "\u2309"; // ⌉
function markSourceTags(md: string): string {
  return md.replace(/\[from:\s*([^\]]+?)\]/gi, (_m, name) => `${SRC_OPEN}${name.trim()}${SRC_CLOSE}`);
}
function renderWithSourcePills(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const re = new RegExp(`${SRC_OPEN}([^${SRC_CLOSE}]+)${SRC_CLOSE}`, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span
        key={`src-${key++}`}
        className="ml-1 inline-flex items-center rounded border border-primary/30 bg-primary/10 px-1 py-[1px] text-[10px] font-medium uppercase tracking-wide text-primary align-baseline"
        title={`Source: ${m[1]}`}
      >
        {m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
function transformChildren(children: any): any {
  if (typeof children === "string") return renderWithSourcePills(children);
  if (Array.isArray(children)) {
    return children.flatMap((c, i) =>
      typeof c === "string" ? renderWithSourcePills(c).map((n, j) => (typeof n === "string" ? n : <span key={`i${i}-${j}`}>{n}</span>)) : c,
    );
  }
  return children;
}

const inlineMarkdownComponents = {
  p: ({ children }: any) => <>{transformChildren(children)}</>,
  strong: ({ children }: any) => <strong className="font-semibold text-foreground">{transformChildren(children)}</strong>,
  em: ({ children }: any) => <em className="italic text-foreground/90">{transformChildren(children)}</em>,
  code: ({ children }: any) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground">{children}</code>,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
      {children}
    </a>
  ),
};

function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineMarkdownComponents as any}>
      {children}
    </ReactMarkdown>
  );
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
    body { font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif; color: #111; max-width: 760px; margin: 32px auto; padding: 0 24px; line-height: 1.65; }
    h1 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 30px; letter-spacing: -0.02em; margin-top: 24px; page-break-after: avoid; }
    h2 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 22px; letter-spacing: -0.01em; margin-top: 36px; padding-top: 14px; border-top: 1px solid #e5e5e5; page-break-after: avoid; }
    h3 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; margin-top: 22px; color: #222; page-break-after: avoid; }
    p, li { font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    th, td { border: 1px solid #d0d0d0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f4f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    blockquote { border-left: 3px solid #6366f1; padding: 12px 18px; color: #1a1a1a; background: #f7f7fb; margin: 18px 0; font-style: italic; font-size: 15px; }
    hr { border: 0; border-top: 1px solid #ddd; margin: 24px 0; }
    @page { margin: 18mm; }
  `;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) { toast.error("Popup blocked — allow popups to print"); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>${styles}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 250);
}

// Pull "## Cover & Verdict" body and "## Stat Strip" table out of the markdown,
// return both + the remaining markdown without those two sections.
function extractCoverAndStats(md: string) {
  const lines = md.split("\n");
  const out: string[] = [];
  let cover = "";
  const stats: { label: string; value: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const heading = h2[1].toLowerCase();
      if (heading.startsWith("cover") || heading === "cover & verdict") {
        // capture body until next H2
        const body: string[] = [];
        i++;
        while (i < lines.length && !/^##\s+/.test(lines[i])) { body.push(lines[i]); i++; }
        cover = body.join("\n").trim();
        continue;
      }
      if (heading.startsWith("stat strip") || heading === "stat strip") {
        i++;
        while (i < lines.length && !/^##\s+/.test(lines[i])) {
          const row = lines[i].match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
          if (row) {
            const a = row[1].trim();
            const b = row[2].trim();
            if (a && b && !/^[-:\s]+$/.test(a) && a.toLowerCase() !== "metric") {
              stats.push({ label: a, value: b });
            }
          }
          i++;
        }
        continue;
      }
    }
    out.push(line);
    i++;
  }
  return { cover, stats, rest: out.join("\n").trim() };
}

// Map H2 heading text → chapter/part eyebrow label (or null for none)
function chapterEyebrow(text: string): string | null {
  const t = text.trim();
  const mp = t.match(/^Part\s+([IVX]+)\s*[—-]\s*(.+)$/i);
  if (mp) return `Part ${mp[1].toUpperCase()}`;
  const m = t.match(/^Chapter\s+(\d+)\s*[—-]\s*(.+)$/i);
  if (m) return `Chapter ${m[1]}`;
  if (/^the one thing$/i.test(t)) return "The takeaway";
  if (/^closing note$/i.test(t)) return "From your partner";
  if (/^read next/i.test(t)) return "What to open next";
  if (/^why this matters$/i.test(t)) return "The bigger picture";
  if (/^the road ahead/i.test(t)) return "Team Evove";
  return null;
}

function chapterTitle(text: string): string {
  const mp = text.match(/^Part\s+[IVX]+\s*[—-]\s*(.+)$/i);
  if (mp) return mp[1].trim();
  const m = text.match(/^Chapter\s+\d+\s*[—-]\s*(.+)$/i);
  return m ? m[1].trim() : text;
}

export function FounderRoadmapDialog({
  open, onOpenChange, companyName, content, generatedAt, wordCount, qualityScore, documentCount, coverage, isStale,
}: Props) {
  const title = `${companyName ?? "Your"} — Founder Roadmap`;
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const marked = useMemo(() => markSourceTags(content || ""), [content]);
  const { cover, stats, rest } = useMemo(() => extractCoverAndStats(marked), [marked]);


  // Build a section index from H2s (from the cleaned `rest`)
  const sections = useMemo(() => {
    const matches = [...rest.matchAll(/^##\s+(.+)$/gm)];
    return matches.map((m) => {
      const text = m[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const eyebrow = chapterEyebrow(text);
      const isPart = /^Part\s+/i.test(text);
      const navLabel = eyebrow && eyebrow.startsWith("Chapter")
        ? `${eyebrow.replace("Chapter ", "Ch. ")} — ${chapterTitle(text)}`
        : eyebrow && eyebrow.startsWith("Part")
          ? `${eyebrow} — ${chapterTitle(text)}`
          : text;
      return { id, text, navLabel, isPart };
    });
  }, [rest]);


  const readMin = wordCount ? Math.max(1, Math.round(wordCount / 220)) : null;

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
    h1: ({ node, ...props }: any) => (
      <h1 className="text-3xl font-bold tracking-tight" {...props} />
    ),
    h2: ({ node, children, ...props }: any) => {
      const text = String(Array.isArray(children) ? children[0] : children ?? "");
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const eyebrow = chapterEyebrow(text);
      const display = chapterTitle(text);
      return (
        <div className="mt-12 scroll-mt-24" id={id}>
          {eyebrow && (
            <div className="mb-2 flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          <h2 className="text-2xl font-semibold tracking-tight" {...props}>{display}</h2>
        </div>
      );
    },
    h3: ({ node, ...props }: any) => <h3 className="mt-7 text-base font-semibold text-foreground" {...props} />,
    table: ({ node, ...props }: any) => (
      <div className="my-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm border-collapse" {...props} />
      </div>
    ),
    th: ({ node, ...props }: any) => <th className="border-b border-border bg-muted/60 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground" {...props} />,
    td: ({ node, children, ...props }: any) => <td className="border-b border-border/60 px-3 py-2 align-top text-sm" {...props}>{transformChildren(children)}</td>,
    blockquote: ({ node, ...props }: any) => (
      <blockquote className="my-6 rounded-r-lg border-l-4 border-primary bg-primary/5 px-5 py-4 text-base italic leading-relaxed text-foreground" {...props} />
    ),
    p: ({ node, children, ...props }: any) => <p className="my-4 text-[15px] leading-[1.75] text-foreground/90" {...props}>{transformChildren(children)}</p>,
    li: ({ node, children, ...props }: any) => <li className="my-1.5 text-[15px] leading-[1.7]" {...props}>{transformChildren(children)}</li>,
    hr: () => <hr className="my-10 border-border" />,
    strong: ({ node, children, ...props }: any) => <strong className="font-semibold text-foreground" {...props}>{transformChildren(children)}</strong>,
    em: ({ node, children, ...props }: any) => <em className="italic text-foreground/90" {...props}>{transformChildren(children)}</em>,
    a: ({ node, href, children, ...props }: any) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary" {...props}>
        {transformChildren(children)}
      </a>
    ),
    code: ({ node, inline, children, ...props }: any) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12.5px] text-foreground" {...props}>{children}</code>
    ),
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[min(1100px,95vw)] flex-col overflow-hidden p-0 sm:max-w-[1100px]">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Review, export, and print the synthesized roadmap for your startup.
        </DialogDescription>

        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>{generatedAt ? new Date(generatedAt).toLocaleString() : "Just generated"}</span>
              {readMin ? <span>· ~{readMin} min read</span> : null}
              {wordCount ? <span>· {wordCount.toLocaleString()} words</span> : null}
              {coverage?.total_assets ? (
                <span>· Synthesized from {coverage.used_count ?? 0} of {coverage.total_assets} assets · 4 tracks · Day 15 → Day 365</span>
              ) : documentCount ? (
                <span>· synthesized from {documentCount} assets</span>
              ) : null}
              {typeof qualityScore === "number" ? <span>· Quality {qualityScore}/100</span> : null}
              {coverage ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="ml-1 inline-flex items-center gap-1 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide hover:text-foreground">
                      <Info className="h-3 w-3" /> Coverage
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 text-xs">
                    <div className="mb-1 font-semibold">Assets cited</div>
                    <div className="mb-2 text-[11px] text-muted-foreground">Every claim in the roadmap that could be tagged has one. Uncited assets can be folded in with a Regenerate.</div>
                    {coverage.per_track ? (
                      <div className="mb-2 grid grid-cols-2 gap-1">
                        {Object.entries(coverage.per_track).map(([t, c]: any) => (
                          <div key={t} className="rounded border border-border/60 px-2 py-1">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t}</div>
                            <div className="text-xs font-semibold">{c.used}/{c.total}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {coverage.skipped_labels?.length ? (
                      <>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Not yet cited</div>
                        <div className="mt-1 max-h-40 overflow-y-auto text-[11px] leading-relaxed">
                          {coverage.skipped_labels.slice(0, 40).join(" · ")}
                          {coverage.skipped_labels.length > 40 ? "…" : ""}
                        </div>
                      </>
                    ) : null}
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
            {isStale ? (
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                <AlertCircle className="h-3 w-3" /> Kit changed since this was written
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onCopy}><Copy className="mr-1 h-3.5 w-3.5" />Copy</Button>
            <Button size="sm" variant="ghost" onClick={onMd}><FileText className="mr-1 h-3.5 w-3.5" />.md</Button>
            <Button size="sm" variant="ghost" onClick={onDocx}><Download className="mr-1 h-3.5 w-3.5" />.docx</Button>
            <Button size="sm" variant="ghost" onClick={onPrint}><Printer className="mr-1 h-3.5 w-3.5" />Print</Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
          </div>
        </div>


        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[220px_1fr]">
          {/* Section nav */}
          <aside className="hidden min-h-0 overflow-y-auto border-r border-border bg-muted/30 p-4 md:block">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Contents</div>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                   onClick={(e) => {
                     e.preventDefault();
                     const el = document.getElementById(s.id);
                     el?.scrollIntoView({ behavior: "smooth", block: "start" });
                   }}
                   className={`block truncate rounded-md px-2 py-1 text-xs hover:bg-muted hover:text-foreground ${s.isPart ? "mt-2 font-semibold text-foreground" : "text-muted-foreground pl-4"}`}>
                  {s.navLabel}
                </a>
              ))}

            </nav>
          </aside>

          {/* Body */}
          <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-6 md:px-12 md:py-10">
            <div ref={bodyRef} className="mx-auto max-w-[72ch]">
              {/* Cover band */}
              <div className="relative mb-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden />
                <div className="relative">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Founder Roadmap</div>
                  <h1 className="mt-2 text-4xl font-bold tracking-tight leading-tight">
                    {companyName ?? "Your venture"}
                  </h1>
                  {cover ? (
                    <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground/90 [&_p]:m-0">
                      <InlineMarkdown>{cover}</InlineMarkdown>
                    </div>
                  ) : (
                    <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                      A narrative founder playbook synthesized from your entire 14-Day Sprint.
                    </p>
                  )}
                  {stats.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {stats.map((s, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-background/70 px-3 py-2.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                          <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">
                            <InlineMarkdown>{s.value}</InlineMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="prose-roadmap">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {rest}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
