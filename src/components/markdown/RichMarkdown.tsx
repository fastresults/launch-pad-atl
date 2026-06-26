// Shared rich-markdown renderer used by document viewers across the app.
// Mirrors the components map used by Founders Hub DocumentViewer so every
// document surface (Hub, Workflow detail, Roadmap, etc.) renders identically.
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function textOf(children: any): string {
  if (children == null) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (children?.props?.children) return textOf(children.props.children);
  return "";
}

function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    <div className="my-4 overflow-hidden rounded-lg border border-border/60 bg-background/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lang}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(txt);
            toast.success("Code copied");
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
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

type Variant = "document" | "assessment" | "compact";

function makeComponents(variant: Variant) {
  const dense = variant !== "document";
  const heading = (level: 1 | 2 | 3 | 4) => ({ children }: any) => {
    const text = textOf(children);
    const id = slugify(text);
    const Tag: any = `h${level}`;
    const cls = dense
      ? {
          1: "mt-2 mb-2 text-xl font-semibold tracking-tight text-foreground",
          2: "mt-5 mb-2 text-lg font-semibold tracking-tight text-foreground",
          3: "mt-4 mb-1.5 text-base font-semibold text-foreground",
          4: "mt-3 mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground",
        }[level]
      : {
          1: "mt-2 mb-3 border-b border-primary/30 pb-2 text-2xl font-bold tracking-tight text-foreground",
          2: "mt-7 mb-3 text-xl font-semibold tracking-tight text-foreground",
          3: "mt-5 mb-2 text-base font-semibold text-foreground",
          4: "mt-4 mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground",
        }[level];
    return <Tag id={id} className={cls}>{children}</Tag>;
  };

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
    strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
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
      <div className="my-4 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-muted/40 [&_th]:border-b [&_th]:border-border/60">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="[&_tr:nth-child(even)]:bg-muted/15 [&_tr]:border-b [&_tr]:border-border/40 [&_tr:last-child]:border-0">
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
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        className="my-4 max-w-full rounded-lg border border-border/60"
      />
    ),
    input: (props: any) =>
      props.type === "checkbox" ? (
        <input
          {...props}
          disabled
          className="mr-2 h-3.5 w-3.5 translate-y-[2px] accent-primary"
        />
      ) : (
        <input {...props} />
      ),
  };
}

export interface RichMarkdownProps {
  children: string | null | undefined;
  variant?: Variant;
  className?: string;
}

export function RichMarkdown({ children, variant = "document", className }: RichMarkdownProps) {
  const components = useMemo(() => makeComponents(variant), [variant]);
  const text = (children ?? "").toString();
  if (!text.trim()) return null;
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none text-foreground", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default RichMarkdown;
