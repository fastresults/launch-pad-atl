/**
 * Global reader contract: no generated asset ever prints raw markup.
 *
 * Generators occasionally echo prompt context — `<style> :root { --bg: ... }`,
 * a Google Fonts `<link>`, a stray `<meta>` — into the body of an asset.
 * react-markdown does not render raw HTML, so it lands on the page as literal
 * text. This strips head/markup fragments that sit OUTSIDE fenced code blocks;
 * fenced snippets (a website PRD showing a real `<link>` tag) survive intact.
 */

const HEAD_BLOCK = /<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
/** Unclosed `<style ...>` / `<script ...>` — take everything to end of line. */
const HEAD_BLOCK_OPEN = /<(style|script)\b[^>]*>[^\n]*/gi;
const VOID_TAGS = /<\/?(link|meta|base|head|html|body)\b[^>]*>/gi;
const DOCTYPE = /<!doctype[^>]*>/gi;
/** Orphan CSS custom-property runs left behind, e.g. `:root { --bg: #fff; }`. */
const ROOT_BLOCK = /:root\s*\{[^{}]*\}/gi;
const ORPHAN_DECLS = /(?:^|\s)--[a-z0-9-]+\s*:\s*[^;{}\n]+;?/gi;
const FONTS_URL = /https?:\/\/fonts\.(?:googleapis|gstatic)\.com\/[^\s)"'`]*/gi;

function scrubLine(line: string): string {
  let s = line;
  s = s.replace(HEAD_BLOCK, "");
  s = s.replace(HEAD_BLOCK_OPEN, "");
  s = s.replace(DOCTYPE, "");
  s = s.replace(VOID_TAGS, "");
  s = s.replace(ROOT_BLOCK, "");
  if (!/\[[^\]]*\]\([^)]*fonts\./i.test(s)) s = s.replace(FONTS_URL, "");
  // Only sweep loose custom-property declarations when nothing else remains.
  const withoutDecls = s.replace(ORPHAN_DECLS, " ");
  if (!withoutDecls.replace(/[\s{};"']/g, "")) s = withoutDecls;
  return s.replace(/[ \t]+$/g, "");
}

export function stripEmbeddedMarkup(md?: string | null): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let fence: string | null = null;

  for (const line of lines) {
    const marker = line.match(/^\s*(```|~~~)/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1] === fence) fence = null;
      out.push(line);
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }

    const original = line;
    const scrubbed = scrubLine(line);
    // A line that was markup and is now whitespace-only disappears entirely.
    if (!scrubbed.trim() && original.trim()) continue;
    out.push(scrubbed);
  }

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
