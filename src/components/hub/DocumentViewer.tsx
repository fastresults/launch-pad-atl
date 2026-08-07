// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { normalizeMarkdown } from "@/lib/markdown-normalize";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Copy,
  Download,
  Printer,
  FileText,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  List,
  Sparkles,
  RefreshCw,
  Loader2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createDocumentUploadUrl, finalizeDocument } from "@/lib/attendee.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { getSignedStorageUrl, invalidateSignedStorageUrl, primeSignedStorageUrl } from "@/lib/storageSignedUrl";
import { invokeEdge } from "@/lib/edge-invoke";

const HERO_BUCKET = "venture-doc-images";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadImage(url: string, timeoutMs = 15_000) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const img = new Image();
    const timer = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error("Saved visual took too long to load"));
    }, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Saved visual file could not be displayed"));
    };
    img.decoding = "async";
    img.src = url;
  });
}

function titleCase(s: string) {
  return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function textOf(children: any): string {
  if (children == null) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (children?.props?.children) return textOf(children.props.children);
  return "";
}

const NUMERIC_RE = /^[\$£€]?\s*-?[\d,]+(?:\.\d+)?%?$/;

function CodeBlock({ inline, className, children }: any) {
  const txt = String(children ?? "").replace(/\n$/, "");
  if (inline) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
        {children}
      </code>
    );
  }
  const lang = (className || "").replace("language-", "") || "text";
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-white/10 bg-background/60">
      <div className="flex items-center justify-between border-b border-white/10 bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(txt);
            toast.success("Code copied");
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words p-3 font-mono text-[12.5px] leading-6 text-foreground/90">
        <code>{txt}</code>
      </pre>
    </div>
  );
}

function Callout({ kind, children }: { kind: "info" | "warn" | "tip" | "success"; children: any }) {
  const cfg = {
    info: { icon: Info, cls: "border-status-info/30 bg-status-info/5 text-status-info", iconCls: "text-status-info" },
    warn: { icon: AlertTriangle, cls: "border-status-warning/30 bg-status-warning/5 text-status-warning", iconCls: "text-status-warning" },
    tip: { icon: Lightbulb, cls: "border-status-tip/30 bg-status-tip/5 text-status-tip", iconCls: "text-status-tip" },
    success: { icon: CheckCircle2, cls: "border-status-success/30 bg-status-success/5 text-status-success", iconCls: "text-status-success" },
  }[kind];
  const Icon = cfg.icon;
  return (
    <div className={cn("my-4 flex gap-3 rounded-lg border p-3", cfg.cls)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconCls)} />
      <div className="min-w-0 flex-1 text-sm [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}

function Blockquote({ children }: any) {
  const txt = textOf(children).toLowerCase();
  if (/^\s*(note|info)[:\s]/i.test(txt)) return <Callout kind="info">{children}</Callout>;
  if (/^\s*(warning|caution|important)[:\s]/i.test(txt)) return <Callout kind="warn">{children}</Callout>;
  if (/^\s*tip[:\s]/i.test(txt)) return <Callout kind="tip">{children}</Callout>;
  if (/^\s*(success|done)[:\s]/i.test(txt)) return <Callout kind="success">{children}</Callout>;
  return (
    <blockquote className="my-4 rounded-r-md border-l-2 border-primary/60 bg-muted/30 px-4 py-2 italic text-foreground/80">
      {children}
    </blockquote>
  );
}

function makeComponents(
  setHeadings: (h: { id: string; text: string }[]) => void,
  assetTitle?: string,
) {
  const headings: { id: string; text: string }[] = [];

  const relabel = (text: string): string => {
    if (!assetTitle) return text;
    if (/^\s*executive\s+summary\s*$/i.test(text)) return `${assetTitle} Summary`;
    if (/^\s*mckinsey[-\s]*grade\s*assessment\s*$/i.test(text)) return `${assetTitle} Deep Dive`;
    if (/^\s*deep\s+dive\s*$/i.test(text)) return `${assetTitle} Deep Dive`;
    return text;
  };

  const heading = (level: 1 | 2 | 3 | 4) => ({ children }: any) => {
    const rawText = textOf(children);
    const text = relabel(rawText);
    const relabeled = text !== rawText;
    const id = slugify(text);
    if (level === 2) headings.push({ id, text });
    const Tag: any = `h${level}`;
    const cls = {
      1: "mt-2 mb-3 border-b border-primary/30 pb-2 text-2xl font-bold tracking-tight text-foreground",
      2: "mt-7 mb-3 text-xl font-semibold tracking-tight text-foreground",
      3: "mt-5 mb-2 text-base font-semibold text-foreground",
      4: "mt-4 mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground",
    }[level];
    const isDeepDive =
      (level === 1 || level === 2) &&
      /(mckinsey[-\s]*grade\s*assessment|deep\s+dive)/i.test(rawText);
    return (
      <Tag id={id} className={cls}>
        {relabeled ? text : children}
        {isDeepDive && (
          <span className="ml-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-primary">
            Deep dive
          </span>
        )}
      </Tag>
    );
  };


  // Defer setHeadings to next tick to avoid setState-in-render warnings
  queueMicrotask(() => setHeadings(headings));

  return {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    p: ({ children }: any) => (
      <p className="my-5 text-[14.5px] leading-[1.85] text-foreground/85">{children}</p>
    ),
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic text-foreground/90">{children}</em>,
    ul: ({ children }: any) => (
      <ul className="my-3 list-disc space-y-1 pl-6 marker:text-primary/70">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-primary/70">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[14.5px] leading-7 text-foreground/85">{children}</li>
    ),
    hr: () => (
      <hr className="my-6 h-px border-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    ),
    blockquote: Blockquote,
    code: CodeBlock,
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-sm sm:min-w-[520px]">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-muted/40 [&_th]:border-b [&_th]:border-white/10">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="[&_tr:nth-child(even)]:bg-muted/15 [&_tr]:border-b [&_tr]:border-white/5 [&_tr:last-child]:border-0">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => <tr>{children}</tr>,
    th: ({ children, align }: any) => (
      <th
        className={cn(
          "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        )}
      >
        {children}
      </th>
    ),
    td: ({ children, align }: any) => {
      const txt = textOf(children).trim();
      const numeric = NUMERIC_RE.test(txt);
      return (
        <td
          className={cn(
            "px-3 py-2 align-top text-[13.5px] text-foreground/90",
            numeric && "text-right font-mono tabular-nums",
            align === "right" && "text-right",
            align === "center" && "text-center",
          )}
        >
          {children}
        </td>
      );
    },
    img: ({ src, alt }: any) => (
      <img src={src} alt={alt} className="my-6 max-w-full rounded-xl border border-white/10" />
    ),
  };
}

function renderToPrint(title: string, html: string) {
  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 760px; margin: 32px auto; padding: 0 24px; line-height: 1.6; }
    h1 { font-size: 28px; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 24px; page-break-after: avoid; }
    h2 { font-size: 20px; margin-top: 28px; page-break-after: avoid; }
    h3 { font-size: 16px; margin-top: 20px; page-break-after: avoid; }
    p, li { font-size: 13.5px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #d0d0d0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f4f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    tr:nth-child(even) td { background: #fafafa; }
    code { background: #f1f1f3; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
    pre code { background: transparent; color: inherit; }
    blockquote { border-left: 3px solid #6366f1; padding: 6px 14px; color: #444; background: #f7f7fb; margin: 12px 0; }
    a { color: #4f46e5; }
    hr { border: 0; border-top: 1px solid #ddd; margin: 24px 0; }
    @page { margin: 18mm; }
  `;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    toast.error("Popup blocked — allow popups to print");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>${styles}</style></head><body><h1>${title}</h1>${html}</body></html>`);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 250);
}

export function DocumentViewer({
  doc,
  open,
  onOpenChange,
  autoGenerateHero = true,
}: {
  doc:
    | {
        document_type: string;
        content: string;
        snapshot_id?: string;
        hero_image_path?: string | null;
        hero_image_status?: string | null;
        deep_assessment?: string | null;
        deep_assessment_status?: string | null;
        deep_assessment_quality_score?: number | null;
        deep_assessment_generated_at?: string | null;
      }
    | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  autoGenerateHero?: boolean;
}) {
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [heroPath, setHeroPath] = useState<string | null>(doc?.hero_image_path ?? null);
  const [heroStatus, setHeroStatus] = useState<string | null>(doc?.hero_image_status ?? null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroSigning, setHeroSigning] = useState(false);
  const [heroImageLoading, setHeroImageLoading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [heroRetryNonce, setHeroRetryNonce] = useState(0);
  const heroDocKeyRef = useRef<string | null>(null);
  const heroImgErrorOnceRef = useRef(false);
  const heroUrlRef = useRef<string | null>(null);

  // Deep assessment (on-demand McKinsey-grade analysis)
  const [assessment, setAssessment] = useState<string | null>(doc?.deep_assessment ?? null);
  const [assessmentStatus, setAssessmentStatus] = useState<string | null>(
    doc?.deep_assessment_status ?? null,
  );
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  // Save-to-My-Files state
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [prdPreviewExpanded, setPrdPreviewExpanded] = useState(false);
  const [prdRepairing, setPrdRepairing] = useState(false);
  const [contentOverride, setContentOverride] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const title = titleCase(doc?.document_type ?? "");
  const components = useMemo(() => makeComponents(setHeadings, title), [doc?.content, title]);
  const assessmentComponents = useMemo(() => makeComponents(() => {}, title), [assessment, title]);
  const content = contentOverride ?? doc?.content ?? "";
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    heroUrlRef.current = heroUrl;
  }, [heroUrl]);

  const exportContent = useMemo(() => {
    const hasAssessment =
      assessment && assessment.trim().length > 0 && assessmentStatus === "complete";
    if (!hasAssessment) return content;
    const body = (content ?? "").trimEnd();
    let extra = assessment!.trim();
    // Avoid duplicating the canonical H2 heading (either legacy or new label)
    extra = extra.replace(/^#{1,6}\s*(McKinsey[-\s]*Grade\s*Assessment|Deep\s+Dive)\s*\n+/i, "");
    return `${body}\n\n---\n\n## ${title} Deep Dive\n\n${extra}\n`;
  }, [content, assessment, assessmentStatus, title]);


  // Extract the Section 8 "Paste-Ready Master Prompt" for the PRD viewer.
  // Resolution order: BEGIN/END delimiters → Section 8 slice → largest fenced block.
  const prdMasterPrompt = useMemo<string | null>(() => {
    if (doc?.document_type !== "website_prd" || !content) return null;
    const stripOuterFence = (s: string) => {
      const m = s.match(/^\s*```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```\s*$/);
      return (m ? m[1] : s).trim();
    };

    // 1. Delimiter pair (preferred — new prompts emit this).
    const delim = content.match(/<!--\s*BEGIN_MASTER_PROMPT\s*-->([\s\S]*?)<!--\s*END_MASTER_PROMPT\s*-->/i);
    if (delim && delim[1].trim()) return stripOuterFence(delim[1]);

    // 2. Slice from "## 8 … Paste-Ready" heading to next H2 (or EOF).
    const h8 = content.match(/^#{1,6}\s*(?:section\s*)?8[\.\)]?\s*[^\n]*paste[- ]ready[^\n]*$/im);
    if (h8 && h8.index !== undefined) {
      const start = h8.index + h8[0].length;
      const rest = content.slice(start);
      const nextH = rest.match(/\n#{1,6}\s+\S/);
      const slice = (nextH ? rest.slice(0, nextH.index) : rest).trim();
      if (slice.length > 200) return stripOuterFence(slice);
    }

    // 3. Last resort: largest text-ish fenced block.
    const blocks: Array<{ lang: string; body: string }> = [];
    const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      blocks.push({ lang: (m[1] || "").toLowerCase(), body: m[2].trim() });
    }
    if (blocks.length === 0) return null;
    const skip = new Set(["xml", "json", "yaml", "yml", "robots", "html", "css", "js", "ts", "tsx", "jsx", "bash", "sh"]);
    const textish = blocks.filter((b) => !skip.has(b.lang));
    const pool = textish.length > 0 ? textish : blocks;
    return pool.reduce((a, b) => (b.body.length > a.body.length ? b : a)).body;
  }, [doc?.document_type, content]);

  const prdPromptIncomplete = useMemo(() => {
    if (!prdMasterPrompt) return false;
    const words = prdMasterPrompt.split(/\s+/).filter(Boolean).length;
    const missingSections = Array.from({ length: 11 }, (_, i) => i + 1).filter(
      (n) => !new RegExp(`(?:^|\\n)\\s*${n}\\)\\s+`, "i").test(prdMasterPrompt),
    );
    const hasDelimiters = /<!--\s*BEGIN_MASTER_PROMPT\s*-->/i.test(content) && /<!--\s*END_MASTER_PROMPT\s*-->/i.test(content);
    const hasClosingInstruction = /Begin scaffolding now\.\s*Generate all images on first run\.\s*Do not ask clarifying questions\./i.test(prdMasterPrompt);
    if (content?.includes("<!-- TRUNCATED -->")) return true;
    if (!hasDelimiters) return true;
    if (words < 1800) return true;
    if (missingSections.length > 0) return true;
    if (!hasClosingInstruction) return true;
    return false;
  }, [prdMasterPrompt, content]);

  const prdPromptMeta = useMemo(() => {
    if (!prdMasterPrompt) {
      return { words: 0, sectionsFound: 0, missingSections: Array.from({ length: 11 }, (_, i) => i + 1), hasDelimiters: false, hasClosingInstruction: false };
    }
    const missingSections = Array.from({ length: 11 }, (_, i) => i + 1).filter(
      (n) => !new RegExp(`(?:^|\\n)\\s*${n}\\)\\s+`, "i").test(prdMasterPrompt),
    );
    return {
      words: prdMasterPrompt.split(/\s+/).filter(Boolean).length,
      sectionsFound: 11 - missingSections.length,
      missingSections,
      hasDelimiters: /<!--\s*BEGIN_MASTER_PROMPT\s*-->/i.test(content) && /<!--\s*END_MASTER_PROMPT\s*-->/i.test(content),
      hasClosingInstruction: /Begin scaffolding now\.\s*Generate all images on first run\.\s*Do not ask clarifying questions\./i.test(prdMasterPrompt),
    };
  }, [prdMasterPrompt, content]);



  // Re-hydrate assessment state when the document changes
  useEffect(() => {
    setAssessment(doc?.deep_assessment ?? null);
    setAssessmentStatus(doc?.deep_assessment_status ?? null);
    setAssessmentError(null);
    setSavedCount(0);
    setContentOverride(null);
  }, [doc?.snapshot_id, doc?.document_type, doc?.deep_assessment, doc?.deep_assessment_status]);

  const regenerateWebsitePrd = async () => {
    if (!doc?.snapshot_id) return;
    setPrdRepairing(true);
    try {
      const { data, error } = await invokeEdge("venture-generate-document", {
        body: {
          snapshotId: doc.snapshot_id,
          documentType: "website_prd",
          rewriteFeedback: "The paste-ready master prompt shown in the viewer is incomplete or truncated. Regenerate the entire Website PRD and make Section 8 complete, self-contained, delimiter-wrapped, 1,800-2,400 words, with numbered sections 1 through 11 and the exact closing instruction.",
          rewriteTags: ["Fix incomplete Website PRD builder prompt", "Regenerate full sections 1-11"],
        },
      });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error ?? "Website PRD regeneration failed");

      const { data: row, error: rowError } = await supabase
        .from("venture_documents")
        .select("content")
        .eq("snapshot_id", doc.snapshot_id)
        .eq("document_type", "website_prd")
        .maybeSingle();
      if (rowError) throw new Error(rowError.message);
      setContentOverride(row?.content ?? null);
      setPrdPreviewExpanded(true);
      qc.invalidateQueries({ queryKey: ["hub"] });
      toast.success("Full Website PRD regenerated");
    } catch (e) {
      toast.error(edgeErrorMessage(e, "Website PRD regeneration failed"));
    } finally {
      setPrdRepairing(false);
    }
  };

  const runAssessment = async () => {
    if (!doc?.snapshot_id || !doc?.document_type) return;
    setAssessmentStatus("generating");
    setAssessmentError(null);
    try {
      const { data, error } = await invokeEdge("venture-generate-assessment", {
        body: { snapshotId: doc.snapshot_id, documentType: doc.document_type },
      });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error ?? "Deep dive failed");
      // Fetch the freshly stored assessment
      const { data: row } = await supabase
        .from("venture_documents")
        .select("deep_assessment, deep_assessment_status")
        .eq("snapshot_id", doc.snapshot_id)
        .eq("document_type", doc.document_type)
        .maybeSingle();
      setAssessment(row?.deep_assessment ?? null);
      setAssessmentStatus(row?.deep_assessment_status ?? "complete");
      toast.success("Deep dive ready");
    } catch (e) {
      const msg = edgeErrorMessage(e, "Deep dive failed");

      setAssessmentError(msg);
      setAssessmentStatus("failed");
      toast.error(msg);
    }
  };

  const onCopyAssessment = () => {
    if (!assessment) return;
    navigator.clipboard.writeText(assessment);
    toast.success("Assessment copied");
  };
  const onDownloadAssessment = () => {
    if (!assessment) return;
    const blob = new Blob([assessment], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc?.document_type}-deep-assessment.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset hero state when the document changes
  useEffect(() => {
    const nextKey = doc?.snapshot_id && doc?.document_type ? `${doc.snapshot_id}:${doc.document_type}` : null;
    const nextPath = doc?.hero_image_path ?? null;
    const docChanged = heroDocKeyRef.current !== nextKey;
    heroDocKeyRef.current = nextKey;
    setHeroPath((prev) => {
      if (prev !== nextPath) heroImgErrorOnceRef.current = false;
      return nextPath;
    });
    setHeroStatus(doc?.hero_image_status ?? null);
      if (docChanged || !nextPath) {
        setHeroUrl(null);
        heroUrlRef.current = null;
      }
    setHeroError(null);
    if (docChanged) heroImgErrorOnceRef.current = false;
  }, [doc?.snapshot_id, doc?.document_type, doc?.hero_image_path, doc?.hero_image_status]);

  // Realtime + polling: keep heroPath/heroStatus in sync with the DB row while
  // the modal is open. Batch pipelines and prior modal sessions can leave the
  // row in `generating` state; without this the modal would sit forever with
  // no image.
  useEffect(() => {
    if (!open || !doc?.snapshot_id || !doc?.document_type) return;
    const snapshotId = doc.snapshot_id;
    const documentType = doc.document_type;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;

    const applyRow = (row: { hero_image_path?: string | null; hero_image_status?: string | null } | null) => {
      if (!row || cancelled) return;
      const newPath = row.hero_image_path ?? null;
      const newStatus = row.hero_image_status ?? null;
      setHeroStatus((prev) => (prev === newStatus ? prev : newStatus));
      setHeroPath((prev) => {
        if (prev === newPath) return prev;
        // Path changed (or first arrival) — force re-sign, but keep any
        // currently displayed image visible until the replacement preloads.
        heroImgErrorOnceRef.current = false;
        return newPath;
      });
    };

    const fetchOnce = async () => {
      const { data } = await supabase
        .from("venture_documents")
        .select("hero_image_path, hero_image_status")
        .eq("snapshot_id", snapshotId)
        .eq("document_type", documentType)
        .maybeSingle();
      applyRow(data as any);
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        pollCount += 1;
        if (pollCount > 45) {
          if (pollTimer) clearInterval(pollTimer);
          pollTimer = null;
          return;
        }
        fetchOnce();
      }, 4000);
    };

    // Immediate reconciliation on open
    fetchOnce();

    const channel = supabase
      .channel(`hero:${snapshotId}:${documentType}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "venture_documents", filter: `snapshot_id=eq.${snapshotId}` },
        (payload: any) => {
          const row = payload?.new;
          if (row?.document_type && row.document_type !== documentType) return;
          applyRow(row);
        },
      )
      .subscribe((status) => {
        // If realtime doesn't connect quickly, fall back to polling.
        if (status !== "SUBSCRIBED") {
          startPolling();
        }
      });

    // Belt-and-suspenders: also start polling after 2s if the channel is
    // slow to attach, and continue only while we don't yet have a ready image.
    const startupTimer = setTimeout(() => {
      if (!cancelled && !heroPath) startPolling();
    }, 2000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      clearTimeout(startupTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.snapshot_id, doc?.document_type]);

  // Mint a signed URL when we have a path
  useEffect(() => {
    let cancelled = false;
    if (!heroPath) {
      setHeroSigning(false);
      setHeroImageLoading(false);
      return;
    }
    setHeroSigning(true);
    setHeroImageLoading(true);
    setHeroError(null);
    (async () => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (attempt > 0) invalidateSignedStorageUrl(HERO_BUCKET, heroPath);
          let url: string;
          try {
            url = await getSignedStorageUrl(HERO_BUCKET, heroPath, 3600);
          } catch (signError) {
            // Admin impersonation and some private-storage RLS paths cannot be
            // signed by the browser client. Ask the image edge function to
            // return a service-signed URL for already-ready visuals instead of
            // dropping the modal back to "Generate visual".
            if (heroStatus !== "ready" || !doc?.snapshot_id || !doc?.document_type) throw signError;
            const { data, error } = await invokeEdge("venture-document-image", {
              body: { snapshotId: doc.snapshot_id, documentType: doc.document_type, force: false },
            });
            if (error || !data?.signedUrl) throw signError;
            url = primeSignedStorageUrl(HERO_BUCKET, data.path ?? heroPath, data.signedUrl, 3600);
          }
          if (cancelled) return;
          setHeroSigning(false);
          await loadImage(url, attempt > 0 ? 20_000 : 15_000);
          if (cancelled) return;
          setHeroUrl(url);
          heroUrlRef.current = url;
          setHeroError(null);
          setHeroStatus((prev) => prev ?? "ready");
          return;
        } catch (e) {
          lastError = e;
          if (attempt < 2) await wait(650 * (attempt + 1));
        }
      }
      if (!cancelled) {
        if (!heroUrlRef.current) {
          setHeroUrl(null);
          setHeroError(lastError instanceof Error ? lastError.message : "Saved visual could not be loaded");
        }
      }
    })().finally(() => {
      if (!cancelled) {
        setHeroSigning(false);
        setHeroImageLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [doc?.snapshot_id, doc?.document_type, heroPath, heroRetryNonce, heroStatus]);

  const retryHeroLoad = () => {
    if (heroPath) invalidateSignedStorageUrl(HERO_BUCKET, heroPath);
    heroImgErrorOnceRef.current = false;
    setHeroError(null);
    setHeroRetryNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!heroPath || heroStatus !== "ready") return;
    getSignedStorageUrl(HERO_BUCKET, heroPath, 3600).catch(() => {});
  }, [heroPath, heroStatus]);

  // Lazy hero image: auto-generate only once per (snapshot, document) when
  // there's no image AND no prior attempt. If status is already `generating`
  // (batch pipeline in flight), the realtime/poll effect above will pick up
  // the finished path — don't call the function. `failed` shows a Retry.
  const autoFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    if (!autoGenerateHero) return;
    if (heroPath || heroLoading) return;
    if (!doc?.snapshot_id || !doc?.document_type) return;
    if (!doc?.content) return;
    if (heroStatus === "generating" || heroStatus === "failed") return;
    const key = `${doc.snapshot_id}:${doc.document_type}`;
    if (autoFiredRef.current === key) return;
    autoFiredRef.current = key;
    generateHero(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.snapshot_id, doc?.document_type, doc?.content, heroPath, heroStatus, autoGenerateHero]);

  const generateHero = async (force = false, quality?: "fast" | "hq") => {
    if (!doc?.snapshot_id || !doc?.document_type) return;
    setHeroLoading(true);
    setHeroError(null);
    try {
      const { data, error } = await invokeEdge("venture-document-image", {
        body: { snapshotId: doc.snapshot_id, documentType: doc.document_type, force, quality },
      });
      if (error) throw new Error(error.message);
      if (data?.path) {
        const nextStatus = data.status ?? "ready";
        const signedUrl = typeof data.signedUrl === "string" ? data.signedUrl : null;
        setHeroStatus(nextStatus);
        heroImgErrorOnceRef.current = false;
        if (signedUrl) {
          try {
            const url = primeSignedStorageUrl(HERO_BUCKET, data.path, signedUrl, 3600);
            setHeroImageLoading(true);
            await loadImage(url, 20_000);
            setHeroUrl(url);
            heroUrlRef.current = url;
          } catch {
            // The normal heroPath effect will retry with a freshly minted URL.
            setHeroRetryNonce((n) => n + 1);
          }
        }
        setHeroPath(data.path);
        setHeroError(null);
        qc.invalidateQueries({ queryKey: ["hub", "docs", doc.snapshot_id] });
        toast.success(quality === "hq" ? "HQ visual generated" : force ? "New visual generated" : "Visual generated");
      } else if (data?.skipped && data?.reason === "in_flight") {
        // Server-side job already running — don't error; the realtime/poll
        // effect will pick up the finished path. Show painting state instead.
        setHeroStatus("generating");
      }
    } catch (e) {
      const msg = edgeErrorMessage(e, "Image generation failed");
      setHeroError(msg);
      toast.error(msg);
    } finally {
      setHeroLoading(false);
      setHeroImageLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(exportContent);
    toast.success("Copied");
  };

  const hasStoredHero = Boolean(heroPath);
  const heroBusy = heroLoading || heroSigning || heroImageLoading || heroStatus === "generating";
  const heroLoadingLabel = heroStatus === "generating" && !heroLoading
    ? "Painting visual… this usually takes 20–40 seconds"
    : heroLoading
      ? "Generating visual…"
      : heroSigning
        ? "Preparing saved visual…"
        : "Loading saved visual…";
  const onDownloadMd = () => {
    const blob = new Blob([exportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc?.document_type}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onDownloadDocx = async () => {
    try {
      const blob = await markdownToDocxBlob(title, exportContent, {
        heroUrl: heroUrl ?? undefined,
        subtitle: doc?.document_type,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc?.document_type}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Word export failed");
    }
  };
  const onPrint = () => {
    const node = printRef.current ?? document.getElementById("doc-viewer-article");
    if (!node) return;
    renderToPrint(title, node.innerHTML);
  };
  const onCopyPrdPrompt = async () => {
    if (!prdMasterPrompt) {
      toast.error("Couldn't find the builder prompt — regenerate this PRD.");
      return;
    }
    if (prdPromptIncomplete) {
      toast.error("This builder prompt is incomplete — regenerate the full Website PRD first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(prdMasterPrompt);
      const words = prdMasterPrompt.split(/\s+/).filter(Boolean).length;
      toast.success(`Builder prompt copied (~${words.toLocaleString()} words)`);
    } catch {
      toast.error("Clipboard blocked — select & copy from the panel.");
    }
  };

  const onOpenPrdPromptInTab = () => {
    if (!prdMasterPrompt) return;
    if (prdPromptIncomplete) {
      toast.error("This builder prompt is incomplete — regenerate the full Website PRD first.");
      return;
    }
    const blob = new Blob([prdMasterPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };


  const onSaveToFiles = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const blob = await markdownToDocxBlob(title, exportContent, {
        heroUrl: heroUrl ?? undefined,
        subtitle: doc?.document_type,
      });
      const versionLabel = savedCount > 0 ? ` (v${savedCount + 1})` : "";
      const filename = `${title}${versionLabel}.docx`;
      const contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const { uploadUrl, path } = await createDocumentUploadUrl({
        filename,
        contentType,
        snapshotId: doc?.snapshot_id ?? null,
      });
      const up = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": contentType },
      });
      if (!up.ok) throw new Error("Upload failed");
      await finalizeDocument({
        path,
        label: filename,
        contentType,
        size: blob.size,
        kind: "deliverable",
        sourceVentureDocumentId: doc?.id ?? null,
        snapshotId: doc?.snapshot_id ?? null,
      });
      setSavedCount((n) => n + 1);
      qc.invalidateQueries({ queryKey: ["my", "documents"] });
      toast.success("Saved to My Files", {
        description: "Find it any time under Dashboard → Documents.",
        action: {
          label: "View",
          onClick: () => navigate("/dashboard/documents"),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <div className="z-10 flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-card/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <DialogTitle className="truncate text-base font-semibold">{title}</DialogTitle>
              <DialogDescription className="sr-only">
                Review, export, save, and generate the visual header for this startup document.
              </DialogDescription>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono lowercase">
                {doc?.document_type}
              </Badge>
              {headings.length >= 4 && (
                <button
                  type="button"
                  onClick={() => setTocOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-white/5"
                >
                  <List className="h-3 w-3" />
                  {tocOpen ? "Hide" : "Show"} contents ({headings.length})
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={onCopy}>
              <Copy className="mr-1 h-3 w-3" />Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={onDownloadMd}>
              <Download className="mr-1 h-3 w-3" />.md
            </Button>
            <Button size="sm" variant="ghost" onClick={onDownloadDocx}>
              <FileText className="mr-1 h-3 w-3" />.docx
            </Button>
            <Button size="sm" variant="ghost" onClick={onPrint}>
              <Printer className="mr-1 h-3 w-3" />Print / PDF
            </Button>
            <Button
              size="sm"
              variant={savedCount > 0 ? "outline" : "default"}
              onClick={onSaveToFiles}
              disabled={saving}
              title={
                savedCount > 0
                  ? "Save a new version to your assets vault"
                  : "Save this startup asset to Dashboard → My files"
              }
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : savedCount > 0 ? (
                <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
              )}
              {saving
                ? "Saving…"
                : savedCount > 0
                  ? "Saved ✓ · Update"
                  : "Save to My Files"}
            </Button>
            {doc?.document_type === "website_prd" && (
              <Button size="sm" onClick={onCopyPrdPrompt}>
                Copy prompt only
              </Button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/40 to-transparent">
          <div className="mx-auto mt-4 max-w-[72ch] px-6">
            <div className="group relative overflow-hidden rounded-lg ring-1 ring-white/10">
              <AspectRatio ratio={16 / 9}>
                {heroUrl && !heroError ? (
                  <img
                    src={heroUrl}
                    alt={title}
                    loading="eager"
                    decoding="async"
                    // @ts-expect-error — fetchpriority is a valid HTML attribute not yet in React's DOM types
                    fetchpriority="high"
                    className="h-full w-full rounded-lg object-cover"
                    onError={() => {
                      // Signed URLs expire after 1h and can also 404 briefly
                      // during a regenerate swap. Retry once with a fresh URL
                      // before giving up.
                      if (!heroImgErrorOnceRef.current && heroPath) {
                        heroImgErrorOnceRef.current = true;
                        invalidateSignedStorageUrl(HERO_BUCKET, heroPath);
                        setHeroImageLoading(true);
                        setHeroRetryNonce((n) => n + 1);
                        return;
                      }
                      setHeroUrl(null);
                      heroUrlRef.current = null;
                      setHeroError("Saved visual file could not be displayed.");
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-6 text-center">
                    {heroError ? (
                      <div className="max-w-sm space-y-3">
                        <p className="text-sm font-medium text-foreground">Visual unavailable</p>
                        <p className="text-xs text-muted-foreground">{heroError}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {heroPath && (
                            <Button size="sm" variant="secondary" onClick={retryHeroLoad}>
                              Retry load
                            </Button>
                          )}
                          <Button size="sm" onClick={() => generateHero(true)} disabled={heroLoading}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Regenerate visual
                          </Button>
                        </div>
                      </div>
                    ) : heroBusy || hasStoredHero ? (
                      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{heroLoadingLabel}</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => generateHero(false)}
                        disabled={heroLoading}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Generate visual
                      </Button>
                    )}
                  </div>
                )}
              </AspectRatio>
              {heroUrl && (
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => generateHero(true)}
                    disabled={heroLoading}
                    title="Regenerate visual (fast)"
                    className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur disabled:opacity-50"
                  >
                    {heroLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => generateHero(true, "hq")}
                    disabled={heroLoading}
                    title="Regenerate in HQ (slower, higher quality)"
                    className="inline-flex items-center gap-1 rounded-md bg-primary/80 px-2 py-1 text-[11px] text-primary-foreground backdrop-blur disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    HQ
                  </button>
                </div>
              )}
            </div>
          </div>

          {tocOpen && headings.length >= 4 && (
            <nav className="mx-auto mt-4 max-w-[72ch] rounded-lg border border-white/10 bg-card/60 px-4 py-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contents
              </div>
              <ol className="space-y-1 text-sm">
                {headings.map((h, i) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="text-foreground/80 hover:text-primary"
                    >
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {doc?.document_type === "website_prd" && (
            <div className="mx-auto mt-6 max-w-[72ch] px-6">
              {prdMasterPrompt ? (
                <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">
                          Paste-Ready Builder Prompt
                        </h3>
                        <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                          Award-grade
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Paste this into Lovable, v0, Bolt or Cursor to scaffold the full multi-page site — brand tokens, components, motion, imagery and SEO all included.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-md border border-white/10 bg-background/60 px-2 py-0.5">
                          ~{prdMasterPrompt.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                        </span>
                        <span className="rounded-md border border-white/10 bg-background/60 px-2 py-0.5">
                          ~{Math.max(1, Math.round(prdMasterPrompt.split(/\s+/).filter(Boolean).length / 220))} min read
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button size="sm" onClick={onCopyPrdPrompt}>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy builder prompt
                      </Button>
                      <Button size="sm" variant="outline" onClick={onOpenPrdPromptInTab}>
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Open in new tab
                      </Button>
                    </div>
                  </div>
                  {prdPromptIncomplete && (
                    <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <div>
                            <p>
                              This builder prompt looks incomplete. Regenerate the full PRD here to get the 1,800–2,400-word brief covering sections 1–11 before copying.
                            </p>
                            <p className="mt-1 opacity-90">
                              Found {prdPromptMeta.sectionsFound}/11 sections · {prdPromptMeta.words.toLocaleString()} words · delimiters {prdPromptMeta.hasDelimiters ? "present" : "missing"}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" onClick={regenerateWebsitePrd} disabled={prdRepairing}>
                          {prdRepairing ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Regenerating…
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Regenerate full PRD
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Preview prompt</span>
                      <button
                        type="button"
                        onClick={() => setPrdPreviewExpanded((v) => !v)}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        {prdPreviewExpanded ? "Collapse" : "View full prompt"}
                      </button>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      <span className="rounded-md border border-border bg-background/70 px-2 py-0.5">
                        Sections {prdPromptMeta.sectionsFound}/11
                      </span>
                      <span className="rounded-md border border-border bg-background/70 px-2 py-0.5">
                        Delimiters {prdPromptMeta.hasDelimiters ? "found" : "missing"}
                      </span>
                      <span className="rounded-md border border-border bg-background/70 px-2 py-0.5">
                        Closing instruction {prdPromptMeta.hasClosingInstruction ? "found" : "missing"}
                      </span>
                    </div>
                    <pre
                      className={`overflow-auto rounded-md border border-white/10 bg-background/80 p-3 text-[11.5px] leading-relaxed text-foreground/90 whitespace-pre-wrap ${prdPreviewExpanded ? "max-h-[80vh]" : "max-h-[420px]"}`}
                    >
                      {prdMasterPrompt}
                    </pre>
                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">Builder prompt missing</p>
                      <p className="mt-1 text-xs opacity-90">
                        This PRD was generated before the award-grade builder-prompt upgrade. Regenerate to get a paste-ready, image-rich, multi-page site prompt.
                      </p>
                    </div>
                    </div>
                    <Button size="sm" onClick={regenerateWebsitePrd} disabled={prdRepairing || !doc?.snapshot_id}>
                      {prdRepairing ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Regenerating…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Regenerate full PRD
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <article id="doc-viewer-article" className="mx-auto min-w-0 max-w-[72ch] px-6 py-6 [overflow-wrap:anywhere]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {normalizeMarkdown(content)}
            </ReactMarkdown>
          </article>

          <div className="mx-auto mb-8 max-w-[72ch] px-6">
            <div className="rounded-xl border border-primary/20 bg-card/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">{title} Deep Dive</h3>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      Extended analysis
                    </span>

                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Partner-grade pressure test: assumptions, sensitivities, risks, and 30/60/90-day actions.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {assessment && assessmentStatus !== "generating" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={onCopyAssessment}>
                        <Copy className="mr-1 h-3 w-3" />Copy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={onDownloadAssessment}>
                        <Download className="mr-1 h-3 w-3" />.md
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    onClick={runAssessment}
                    disabled={assessmentStatus === "generating"}
                  >
                    {assessmentStatus === "generating" ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Analyzing…
                      </>
                    ) : assessment ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Run deep dive
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {assessmentStatus === "generating" && !assessment && (
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <p className="pt-2 text-xs text-muted-foreground">
                    Usually takes 20–40 seconds. The document above stays readable.
                  </p>
                </div>
              )}

              {assessmentError && assessmentStatus === "failed" && (
                <div className="mt-4 rounded-md border border-status-danger/30 bg-status-danger/5 p-3 text-sm text-status-danger">
                  {assessmentError}
                </div>
              )}

              {assessment && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={assessmentComponents}>
                    {normalizeMarkdown(assessment)}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Offscreen, fully-rendered version used for Print/PDF so the deep
            assessment is included whenever it's present. */}
        <div
          ref={printRef}
          aria-hidden="true"
          style={{ position: "absolute", left: "-99999px", top: 0, width: "72ch", pointerEvents: "none" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={assessmentComponents}>
            {normalizeMarkdown(exportContent)}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
