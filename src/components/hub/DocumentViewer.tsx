// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createDocumentUploadUrl, finalizeDocument } from "@/lib/attendee.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { getSignedStorageUrl } from "@/lib/storageSignedUrl";

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
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-6 text-foreground/90">
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

function makeComponents(setHeadings: (h: { id: string; text: string }[]) => void) {
  const headings: { id: string; text: string }[] = [];

  const heading = (level: 1 | 2 | 3 | 4) => ({ children }: any) => {
    const text = textOf(children);
    const id = slugify(text);
    if (level === 2) headings.push({ id, text });
    const Tag: any = `h${level}`;
    const cls = {
      1: "mt-2 mb-3 border-b border-primary/30 pb-2 text-2xl font-bold tracking-tight text-foreground",
      2: "mt-7 mb-3 text-xl font-semibold tracking-tight text-foreground",
      3: "mt-5 mb-2 text-base font-semibold text-foreground",
      4: "mt-4 mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground",
    }[level];
    const isDeepDive = level === 2 && /mckinsey[-\s]*grade\s*assessment/i.test(text);
    return (
      <Tag id={id} className={cls}>
        {children}
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
      <p className="my-3 text-[14.5px] leading-7 text-foreground/85">{children}</p>
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
        <table className="w-full border-collapse text-sm">{children}</table>
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
      <img src={src} alt={alt} className="my-4 max-w-full rounded-lg border border-white/10" />
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
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroSigning, setHeroSigning] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [heroRetryNonce, setHeroRetryNonce] = useState(0);

  // Deep assessment (on-demand McKinsey-grade analysis)
  const [assessment, setAssessment] = useState<string | null>(doc?.deep_assessment ?? null);
  const [assessmentStatus, setAssessmentStatus] = useState<string | null>(
    doc?.deep_assessment_status ?? null,
  );
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  // Save-to-My-Files state
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const components = useMemo(() => makeComponents(setHeadings), [doc?.content]);
  const assessmentComponents = useMemo(() => makeComponents(() => {}), [assessment]);
  const title = titleCase(doc?.document_type ?? "");
  const content = doc?.content ?? "";
  const printRef = useRef<HTMLDivElement | null>(null);

  const exportContent = useMemo(() => {
    const hasAssessment =
      assessment && assessment.trim().length > 0 && assessmentStatus === "complete";
    if (!hasAssessment) return content;
    const body = (content ?? "").trimEnd();
    let extra = assessment!.trim();
    // Avoid duplicating the canonical H2 heading
    extra = extra.replace(/^#{1,6}\s*McKinsey[-\s]*Grade\s*Assessment\s*\n+/i, "");
    return `${body}\n\n---\n\n## McKinsey-Grade Assessment\n\n${extra}\n`;
  }, [content, assessment, assessmentStatus]);

  // Re-hydrate assessment state when the document changes
  useEffect(() => {
    setAssessment(doc?.deep_assessment ?? null);
    setAssessmentStatus(doc?.deep_assessment_status ?? null);
    setAssessmentError(null);
    setSavedCount(0);
  }, [doc?.snapshot_id, doc?.document_type, doc?.deep_assessment, doc?.deep_assessment_status]);

  const runAssessment = async () => {
    if (!doc?.snapshot_id || !doc?.document_type) return;
    setAssessmentStatus("generating");
    setAssessmentError(null);
    try {
      const { data, error } = await supabase.functions.invoke("venture-generate-assessment", {
        body: { snapshotId: doc.snapshot_id, documentType: doc.document_type },
      });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error ?? "Deep assessment failed");
      // Fetch the freshly stored assessment
      const { data: row } = await supabase
        .from("venture_documents")
        .select("deep_assessment, deep_assessment_status")
        .eq("snapshot_id", doc.snapshot_id)
        .eq("document_type", doc.document_type)
        .maybeSingle();
      setAssessment(row?.deep_assessment ?? null);
      setAssessmentStatus(row?.deep_assessment_status ?? "complete");
      toast.success("Deep assessment ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Deep assessment failed";
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
    setHeroPath(doc?.hero_image_path ?? null);
    setHeroUrl(null);
    setHeroError(null);
  }, [doc?.snapshot_id, doc?.document_type, doc?.hero_image_path]);

  // Mint a signed URL when we have a path
  useEffect(() => {
    let cancelled = false;
    if (!heroPath) {
      setHeroSigning(false);
      return;
    }
    setHeroSigning(true);
    setHeroError(null);
    (async () => {
      try {
        const url = await getSignedStorageUrl("venture-doc-images", heroPath, 3600);
        if (!cancelled) setHeroUrl(url);
      } catch (e) {
        if (!cancelled) {
          setHeroUrl(null);
          setHeroError(e instanceof Error ? e.message : "Saved visual could not be loaded");
        }
      } finally {
        if (!cancelled) setHeroSigning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heroPath, heroRetryNonce]);

  // Lazy hero image: auto-generate only once per (snapshot, document) when
  // there's no image AND no prior attempt. Status === 'failed' shows a Retry
  // button instead. A ref guard prevents a second invocation if the user
  // reopens before the first call finishes (race-free; server also locks).
  const autoFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    if (!autoGenerateHero) return;
    if (heroPath || heroLoading) return;
    if (!doc?.snapshot_id || !doc?.document_type) return;
    if (!doc?.content) return;
    const status = doc?.hero_image_status ?? null;
    if (status === "generating" || status === "failed") return;
    const key = `${doc.snapshot_id}:${doc.document_type}`;
    if (autoFiredRef.current === key) return;
    autoFiredRef.current = key;
    generateHero(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.snapshot_id, doc?.document_type, doc?.content, heroPath, doc?.hero_image_status, autoGenerateHero]);

  const generateHero = async (force = false, quality?: "fast" | "hq") => {
    if (!doc?.snapshot_id || !doc?.document_type) return;
    setHeroLoading(true);
    setHeroError(null);
    try {
      const { data, error } = await supabase.functions.invoke("venture-document-image", {
        body: { snapshotId: doc.snapshot_id, documentType: doc.document_type, force, quality },
      });
      if (error) throw new Error(error.message);
      if (data?.path) {
        setHeroPath(data.path);
        setHeroUrl(null); // force re-sign
        toast.success(quality === "hq" ? "HQ visual generated" : force ? "New visual generated" : "Visual generated");
      } else if (data?.skipped && data?.reason === "in_flight") {
        setHeroError("Visual is already being generated. Reopen this document in a moment.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setHeroError(msg);
      toast.error(msg);
    } finally {
      setHeroLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(exportContent);
    toast.success("Copied");
  };
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
  const onCopyPrdPrompt = () => {
    const m = content.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    if (!m) {
      toast.error("Couldn't find the prompt block");
      return;
    }
    navigator.clipboard.writeText(m[1].trim());
    toast.success("AI-builder prompt copied");
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
      <DialogContent className="max-h-[88vh] max-w-4xl gap-0 overflow-hidden p-0">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-card/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <DialogTitle className="truncate text-base font-semibold">{title}</DialogTitle>
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
                  ? "Save a new version to your Documents library"
                  : "Save this deliverable to Dashboard → Documents"
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

        <div className="max-h-[calc(88vh-72px)] overflow-y-auto bg-gradient-to-b from-background/40 to-transparent">
          <div className="mx-auto mt-4 max-w-[72ch] px-6">
            <div className="group relative overflow-hidden rounded-lg ring-1 ring-white/10">
              <AspectRatio ratio={16 / 9}>
                {heroUrl && !heroError ? (
                  <img
                    src={heroUrl}
                    alt={title}
                    loading="eager"
                    className="h-full w-full object-cover"
                    onError={() => {
                      setHeroUrl(null);
                      setHeroError("Saved visual file could not be displayed.");
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-6 text-center">
                    {heroLoading || heroSigning ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {heroLoading ? "Generating visual…" : "Loading saved visual…"}
                      </div>
                    ) : heroError ? (
                      <div className="max-w-sm space-y-3">
                        <p className="text-sm font-medium text-foreground">Visual unavailable</p>
                        <p className="text-xs text-muted-foreground">{heroError}</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {heroPath && (
                            <Button size="sm" variant="secondary" onClick={() => setHeroRetryNonce((n) => n + 1)}>
                              Retry load
                            </Button>
                          )}
                          <Button size="sm" onClick={() => generateHero(true)} disabled={heroLoading}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Regenerate visual
                          </Button>
                        </div>
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
          <article id="doc-viewer-article" className="mx-auto max-w-[72ch] px-6 py-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {content}
            </ReactMarkdown>
          </article>

          <div className="mx-auto mb-8 max-w-[72ch] px-6">
            <div className="rounded-xl border border-primary/20 bg-card/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Deep assessment</h3>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      McKinsey-grade
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
                        Run deep assessment
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
                    {assessment}
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
            {exportContent}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
