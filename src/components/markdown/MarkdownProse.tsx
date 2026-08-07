import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { normalizeMarkdown } from "@/lib/markdown-normalize";

/**
 * Single source of truth for rendering generated venture prose.
 *
 * Every generated asset flows through here, so overflow rules live in one
 * place: code fences wrap instead of running off the page, tables scroll
 * inside a bounded shell, and no single long token (URL, handle, id) can
 * stretch the reading column.
 */

const components = {
  pre: ({ children }: any) => (
    <pre className="my-6 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-[12.5px] leading-[1.7] text-foreground/90">
      {children}
    </pre>
  ),
  code: ({ inline, children, className }: any) => {
    if (inline) {
      return (
        <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[12.5px] [overflow-wrap:anywhere]">
          {children}
        </code>
      );
    }
    return <code className={cn("whitespace-pre-wrap break-words", className)}>{children}</code>;
  },
  table: ({ children }: any) => (
    <div className="my-8 max-w-full overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm sm:min-w-[520px]">{children}</table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border-b border-border/60 bg-muted/30 px-3 py-2 text-left align-top text-[13px] font-semibold [overflow-wrap:anywhere]">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border-t border-border/40 px-3 py-2 align-top text-[13px] leading-relaxed [overflow-wrap:anywhere]">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline [overflow-wrap:anywhere]"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: any) => (
    <img src={src} alt={alt ?? ""} loading="lazy" className="my-8 h-auto max-w-full rounded-xl" />
  ),
};

const PROSE =
  "max-w-none min-w-0 [overflow-wrap:anywhere] text-foreground/90 " +
  "[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic " +
  "[&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:font-serif [&_h1]:text-[26px] [&_h1]:leading-tight " +
  "[&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:leading-tight " +
  "[&_h3]:mb-3 [&_h3]:mt-10 [&_h3]:font-serif [&_h3]:text-[18px] " +
  "[&_hr]:my-10 [&_hr]:border-border/60 " +
  "[&_li]:my-2.5 [&_li]:text-[15px] [&_li]:leading-[1.8] " +
  "[&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 " +
  "[&_p]:mb-6 [&_p]:text-[15px] [&_p]:leading-[1.85] " +
  "[&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 " +
  "[&>*:first-child]:mt-0";

export function MarkdownProse({
  children,
  className,
}: {
  children?: string | null;
  className?: string;
}) {
  return (
    <div className={cn(PROSE, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
        {normalizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
