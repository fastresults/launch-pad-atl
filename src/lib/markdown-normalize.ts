/**
 * Generated venture copy often separates paragraphs with a single newline,
 * which markdown collapses into one run-on block. This inserts blank lines
 * between consecutive prose lines so each paragraph renders as its own <p>,
 * while leaving structural markdown (lists, tables, code, headings, quotes)
 * untouched.
 */

const STRUCTURAL = /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|\||```|~~~|---|===|\s*$)/;

function isProse(line: string) {
  return !!line.trim() && !STRUCTURAL.test(line);
}

export function normalizeParagraphs(md?: string | null): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    out.push(line);
    if (inFence) continue;

    const next = lines[i + 1];
    if (next === undefined) continue;
    // Two adjacent prose lines with no blank line between them → force a break.
    if (isProse(line) && isProse(next)) out.push("");
  }

  return out.join("\n");
}
