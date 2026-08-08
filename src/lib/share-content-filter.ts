/**
 * Public-showcase content filter.
 *
 * Generated assets legitimately carry developer handoff blocks — brand tokens
 * as JSON, robots.txt, sitemap.xml. Those belong in the founder's hub, not in
 * a link a customer or investor reads. This strips them before render.
 */

/** Headings whose whole section is a developer artifact. */
const DEV_SECTION = /^#{2,4}\s*(brand tokens\b.*|design tokens\b.*|tokens \(json\)|machine-readable.*)$/i;

/** Fence bodies that are plainly infrastructure, not reading material. */
const DEV_FENCE = /^\s*(user-agent:|sitemap:|<\?xml|<urlset|<!doctype)/i;

function headingLevel(line: string): number | null {
  const m = line.match(/^(#{1,6})\s/);
  return m ? m[1].length : null;
}

export function filterShowcaseContent(md?: string | null): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Drop a developer section entirely, up to the next heading of the same
    // or higher level.
    if (DEV_SECTION.test(line.trim())) {
      const level = headingLevel(line.trim()) ?? 2;
      i++;
      while (i < lines.length) {
        const l = headingLevel(lines[i].trim());
        if (l !== null && l <= level) break;
        i++;
      }
      continue;
    }

    // Drop json / xml / infra fences wherever they appear.
    const open = line.match(/^\s*(```|~~~)[ \t]*(\S.*)?$/);
    if (open) {
      const marker = open[1];
      const lang = ((open[2] ?? "").trim().split(/[\s,]+/)[0] ?? "").toLowerCase();
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
      if (closed) {
        const first = body.find((b) => b.trim()) ?? "";
        const isDev =
          /^(json|xml|yaml|yml|svg|toml)$/.test(lang) ||
          DEV_FENCE.test(first) ||
          /^\s*[{[]/.test(first);
        if (isDev) {
          // Remove a lead-in line that only introduced the dropped block.
          while (out.length && !out[out.length - 1].trim()) out.pop();
          const prev = out[out.length - 1] ?? "";
          if (/^[^#\-*|>].{0,120}:\s*$/.test(prev.trim())) out.pop();
          out.push("");
          i = j + 1;
          continue;
        }
      }
    }

    out.push(line);
    i++;
  }

  return out
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
