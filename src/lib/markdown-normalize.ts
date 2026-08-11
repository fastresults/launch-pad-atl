/**
 * Normalizers for generated venture copy before it hits react-markdown.
 *
 * Two problems recur in generated assets:
 *  1. Paragraphs separated by a single newline collapse into one run-on block.
 *  2. Plain prose/checklists get wrapped in triple-backtick fences, which
 *     render as an unwrappable monospace slab that runs off the page.
 */

import { stripEmbeddedMarkup } from "@/lib/strip-embedded-markup";

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

/** Languages that are genuinely code and must keep their fence. */
const REAL_CODE = /^(json|js|jsx|ts|tsx|html|css|scss|xml|yaml|yml|sql|sh|bash|zsh|py|python|rb|go|rust|java|php|c|cpp|csharp|swift|kotlin|toml|ini|diff|graphql|svg)$/i;

/** Heuristic: does this fenced body look like actual code rather than prose? */
function looksLikeCode(body: string): boolean {
  const codey = /[{};]\s*$|^\s*[<{[]|=>|function\s|const\s|import\s|SELECT\s|<\/?[a-z]+>/im;
  const hits = body.split("\n").filter((l) => codey.test(l)).length;
  return hits >= Math.max(2, body.split("\n").length * 0.3);
}

/**
 * Convert `Day 0 — Foo :: Bar :: DONE WHEN baz` style pseudo-columns into a
 * readable list item so the line can wrap instead of running off-screen.
 */
function unpackColumns(line: string): string {
  const parts = line.split("::").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return line;
  const [head, ...rest] = parts;
  return `- **${head}** — ${rest.join(" · ")}`;
}

/**
 * Unwrap fences that hold ordinary prose/checklists (no language, or a
 * text/markdown/plain language) so the content renders as real markdown.
 * Real code fences are left untouched.
 */
export function unwrapProseFences(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    // Accept any info-string, not just a clean language token. Generators
    // routinely emit ```markdown labeled `# Landing / DM copy` — the extra
    // words are an authoring label, never content.
    const open = lines[i].match(/^\s*(```|~~~)[ \t]*(\S.*)?$/);
    if (!open) {
      out.push(lines[i++]);
      continue;
    }
    const marker = open[1];
    const info = (open[2] ?? "").trim();
    const lang = (info.split(/[\s,]+/)[0] ?? "").replace(/[^A-Za-z0-9+#-]/g, "");
    const rest = info.slice((info.split(/[\s,]+/)[0] ?? "").length).trim();
    // A trailing label like: labeled `# Checkout CTA copy` / titled "X"
    const labelMatch = rest.match(/[`"'“]?\s*#*\s*([^`"'”]+?)\s*[`"'”]?$/);
    const label =
      rest && labelMatch
        ? labelMatch[1].replace(/^(labeled|labelled|titled|named|called)\s*/i, "").trim()
        : "";

    const body: string[] = [];
    let j = i + 1;
    let closed = false;
    while (j < lines.length) {
      if (new RegExp(`^\\s*${marker}\\s*$`).test(lines[j])) {
        closed = true;
        break;
      }
      body.push(lines[j++]);
    }
    if (!closed) {
      out.push(lines[i++]);
      continue;
    }

    const text = body.join("\n");
    const keepFence =
      REAL_CODE.test(lang) ||
      (!/^(text|txt|plain|plaintext|markdown|md)$/i.test(lang) && lang !== "") ||
      looksLikeCode(text);

    // The label becomes a real heading so the reader keeps the section name
    // without ever seeing the fence syntax.
    if (label && label.length <= 80) {
      out.push("", `### ${label}`, "");
    }

    if (keepFence) {
      out.push(`${marker}${lang}`, ...body, lines[j]);
    } else {

      for (const raw of body) {
        if (!raw.trim()) {
          out.push("");
          continue;
        }
        out.push(raw.includes("::") ? unpackColumns(raw) : raw);
      }
      out.push("");
    }
    i = j + 1;
  }

  return out.join("\n");
}

/**
 * Cleanups for generated files that leak authoring artifacts into the reader
 * view: a filename used as the first heading, a stray unmatched fence marker,
 * and bold-only lines that are really section headings.
 */
function stripAuthoringArtifacts(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  // Drop a leading `# some-file.md` / `filename.md` title.
  while (lines.length && !lines[0].trim()) lines.shift();
  if (lines.length && /^\s*#{0,6}\s*[\w.-]+\.(md|txt|docx?|csv|json)\s*$/i.test(lines[0])) {
    lines.shift();
  }

  // A single unmatched fence marker renders everything after it as code.
  const fenceIdx: number[] = [];
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) fenceIdx.push(i);
  });
  if (fenceIdx.length % 2 === 1) lines[fenceIdx[fenceIdx.length - 1]] = "";

  return lines
    .map((l) => {
      const bold = l.match(/^\s*\*\*(.+?)\*\*\s*:?\s*$/);
      // A bold-only line is a heading, not a paragraph.
      return bold && bold[1].length <= 80 ? `### ${bold[1]}` : l;
    })
    .join("\n");
}

/** Full pipeline: strip leaked markup, unwrap fake fences, tidy artifacts, then split run-on paragraphs. */
export function normalizeMarkdown(md?: string | null): string {
  if (!md) return "";
  return normalizeParagraphs(
    stripAuthoringArtifacts(unwrapProseFences(stripEmbeddedMarkup(md))),
  );
}

