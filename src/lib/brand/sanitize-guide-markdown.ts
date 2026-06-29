// Strips ASCII-art "slider/spectrum" lines that some LLMs emit inside Brand
// Style Guides (e.g. "Direct |---|---|---|--•| Vague"). Markdown tables and
// horizontal rules are preserved.

const SLIDER_GLYPHS = "•·▮▯█░▰▱○●";
// Detects a slider segment with at least one pipe AND a slider glyph or
// repeating dash sequence between pipes — but no table-cell text content.
const SLIDER_SEGMENT = new RegExp(
  String.raw`\|[\s\-–—=*${SLIDER_GLYPHS}]{2,}\|[\s\-–—=*${SLIDER_GLYPHS}|]*`,
  "g",
);

function isMarkdownTableSeparator(line: string): boolean {
  // | --- | :---: | ---: |
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function looksLikeTableRow(line: string): boolean {
  // Has pipes AND alphanumeric content in at least two cells.
  if (!line.includes("|")) return false;
  const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
  const wordCells = cells.filter((c) => /[A-Za-z0-9]{2,}/.test(c));
  return wordCells.length >= 2;
}

export function sanitizeGuideMarkdown(md: string): string {
  if (!md) return md;
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    if (isMarkdownTableSeparator(raw)) {
      out.push(raw);
      continue;
    }
    if (looksLikeTableRow(raw)) {
      out.push(raw);
      continue;
    }
    if (SLIDER_SEGMENT.test(raw)) {
      // Remove the slider art but keep surrounding labels (e.g. "Direct" / "Vague").
      const cleaned = raw.replace(SLIDER_SEGMENT, " — ").replace(/\s{2,}/g, " ").trimEnd();
      out.push(cleaned);
      continue;
    }
    out.push(raw);
  }
  return out.join("\n");
}
