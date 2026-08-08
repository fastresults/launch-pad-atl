// Client-side export of showcase sections to Word (.docx) and PDF, with every
// image embedded in the file so the document keeps working after the share
// link expires. Also handles the optional "Save to Google Drive" upload.
import type { ShareItem, SharePayload } from "@/lib/venture-share.functions";
import { filterShowcaseContent } from "@/lib/share-content-filter";

export type ExportFormat = "docx" | "pdf";

/** One picture, already fetched into the browser. */
export interface FetchedImage {
  dataUrl: string;
  bytes: Uint8Array;
  /** docx needs an explicit type token. */
  type: "png" | "jpg" | "gif" | "bmp";
  width: number;
  height: number;
  label?: string | null;
}

export interface ExportBlock {
  title: string;
  subtitle?: string | null;
  /** Section category, printed as a small accent eyebrow above the title. */
  eyebrow?: string | null;
  metrics?: { label: string; value: string; note?: string | null }[];
  markdown?: string | null;
  images: FetchedImage[];
}

export interface ExportDoc {
  fileBase: string;
  ventureName: string;
  oneLiner?: string | null;
  /** Cover line — the share title or the section being exported. */
  docTitle?: string | null;
  dateLabel?: string | null;
  theme?: ExportTheme;
  logo?: FetchedImage | null;
  blocks: ExportBlock[];
}

/* ------------------------------------------------------------------ images */

const imageCache = new Map<string, FetchedImage | null>();

function mimeToType(mime: string): FetchedImage["type"] {
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  return "jpg";
}

/** Rasterizes SVG (and anything else) to PNG so docx/jsPDF can embed it. */
async function rasterize(blob: Blob): Promise<{ dataUrl: string; w: number; h: number } | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = url;
    });
    if (!img) return null;
    const w = img.naturalWidth || 1200;
    const h = img.naturalHeight || 800;
    const scale = Math.min(1, 1600 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function fetchImage(url: string, label?: string | null): Promise<FetchedImage | null> {
  if (imageCache.has(url)) {
    const hit = imageCache.get(url) ?? null;
    return hit ? { ...hit, label: label ?? hit.label } : null;
  }
  let result: FetchedImage | null = null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const raster = await rasterize(blob);
      if (raster) {
        result = {
          dataUrl: raster.dataUrl,
          bytes: dataUrlToBytes(raster.dataUrl),
          type: blob.type.includes("svg") ? "png" : mimeToType(blob.type),
          width: raster.w,
          height: raster.h,
          label,
        };
        // Everything is re-encoded as PNG by the canvas pass.
        result.type = "png";
      }
    }
  } catch {
    result = null;
  }
  imageCache.set(url, result);
  return result;
}

/* ------------------------------------------------------------- model build */

/** Grabs the timeline canvas as an image when it is on screen. */
async function captureTimeline(): Promise<FetchedImage | null> {
  const svg = document.querySelector<SVGSVGElement>("[data-timeline-canvas] svg, svg[data-timeline]");
  if (!svg) return null;
  try {
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const raster = await rasterize(blob);
    if (!raster) return null;
    return {
      dataUrl: raster.dataUrl,
      bytes: dataUrlToBytes(raster.dataUrl),
      type: "png",
      width: raster.w,
      height: raster.h,
      label: "Launch timeline",
    };
  } catch {
    return null;
  }
}

function brandBoardMarkdown(item: ShareItem): string {
  const b = item.brandBoard;
  if (!b) return "";
  const lines: string[] = [];
  if (b.swatches?.length) {
    lines.push("### Palette", "");
    lines.push("| Colour | Hex |", "| --- | --- |");
    b.swatches.forEach((s) => lines.push(`| ${s.label} | ${s.hex} |`));
    lines.push("");
  }
  if (b.fonts?.length) {
    lines.push("### Typography", "");
    b.fonts.forEach((f) => lines.push(`- ${f.role}: ${f.family}${f.weight ? ` ${f.weight}` : ""}`));
    lines.push("");
  }
  if (b.voice?.principles?.length) {
    lines.push("### Voice", "");
    b.voice.principles.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  return lines.join("\n");
}

async function blockFromItem(item: ShareItem, eyebrow?: string | null): Promise<ExportBlock> {
  const urls: { url: string; label?: string | null }[] = [];
  if (item.heroImageUrl) urls.push({ url: item.heroImageUrl, label: item.title });
  (item.images ?? []).forEach((i) => urls.push({ url: i.url, label: i.label }));
  (item.brandBoard?.logos ?? []).forEach((l) => urls.push({ url: l.url, label: l.label }));
  (item.brandBoard?.moodboard ?? []).forEach((m) => urls.push({ url: m.url, label: m.caption }));

  const fetched = (await Promise.all(urls.map((u) => fetchImage(u.url, u.label)))).filter(
    Boolean,
  ) as FetchedImage[];

  if (item.kind === "timeline") {
    const shot = await captureTimeline();
    if (shot) fetched.unshift(shot);
  }

  const body = [item.body ? filterShowcaseContent(item.body) : "", brandBoardMarkdown(item)]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: item.title,
    subtitle: item.subtitle,
    eyebrow: eyebrow ?? null,
    metrics: item.metrics ?? [],
    markdown: body || null,
    images: fetched,
  };
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "export"
  );
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function buildSectionDoc(
  payload: SharePayload,
  item: ShareItem,
): Promise<ExportDoc> {
  const logo = payload.venture.logoUrl ? await fetchImage(payload.venture.logoUrl) : null;
  const eyebrow = payload.sections.find((s) => s.items.some((i) => i.key === item.key))?.label;
  return {
    fileBase: `${slug(payload.venture.name)}-${slug(item.title)}`,
    ventureName: payload.venture.name,
    oneLiner: payload.venture.oneLiner,
    docTitle: item.title,
    dateLabel: todayLabel(),
    theme: themeFromColors(payload.venture.colors),
    logo,
    blocks: [await blockFromItem(item, eyebrow)],
  };
}

export async function buildFullDoc(
  payload: SharePayload,
  onProgress?: (done: number, total: number) => void,
): Promise<ExportDoc> {
  const logo = payload.venture.logoUrl ? await fetchImage(payload.venture.logoUrl) : null;
  const items = payload.sections.flatMap((s) =>
    s.items.map((item) => ({ item, label: s.label })),
  );
  const blocks: ExportBlock[] = [];

  if (payload.executiveSummary) {
    blocks.push({
      title: "Executive summary",
      eyebrow: "Overview",
      metrics: payload.executiveMetrics ?? [],
      markdown: filterShowcaseContent(payload.executiveSummary),
      images: [],
    });
  }

  for (let i = 0; i < items.length; i += 1) {
    blocks.push(await blockFromItem(items[i].item, items[i].label));
    onProgress?.(i + 1, items.length);
  }

  return {
    fileBase: `${slug(payload.venture.name)}-showcase`,
    ventureName: payload.venture.name,
    oneLiner: payload.venture.oneLiner,
    docTitle: payload.share.title || "Venture showcase",
    dateLabel: todayLabel(),
    theme: themeFromColors(payload.venture.colors),
    logo,
    blocks,
  };
}
/* ------------------------------------------------------------- markdown IR */


type MdBlock =
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "p"; text: string }
  | { t: "li"; text: string; ordered: boolean }
  | { t: "quote"; text: string }
  | { t: "table"; rows: string[][] };

/** Small, forgiving markdown reader — enough for generated venture content. */
export function parseMarkdown(md: string): MdBlock[] {
  const out: MdBlock[] = [];
  const lines = md.replace(/\r/g, "").split("\n");
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      out.push({ t: "p", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      continue;
    }
    if (/^\|.*\|$/.test(trimmed)) {
      flush();
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => stripInline(c.trim()));
        if (!cells.every((c) => /^-{2,}:?$|^:?-{2,}:?$/.test(c) || c === "")) rows.push(cells);
        i += 1;
      }
      i -= 1;
      if (rows.length) out.push({ t: "table", rows });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const level = Math.min(3, heading[1].length) as 1 | 2 | 3;
      out.push({ t: "h", level, text: stripInline(heading[2]) });
      continue;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flush();
      out.push({ t: "li", text: cleanInline(bullet[1]), ordered: false });
      continue;
    }
    const num = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (num) {
      flush();
      out.push({ t: "li", text: cleanInline(num[1]), ordered: true });
      continue;
    }
    if (trimmed.startsWith(">")) {
      flush();
      out.push({ t: "quote", text: cleanInline(trimmed.replace(/^>\s?/, "")) });
      continue;
    }
    paragraph.push(cleanInline(trimmed));
  }
  flush();
  return out;
}

/** Removes markdown that can't be rendered (links, images) but keeps emphasis. */
function cleanInline(s: string) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

/** Fully flattens to plain text — used where rich runs aren't practical. */
function stripInline(s: string) {
  return cleanInline(s)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/** Splits a line into bold / italic / code runs so emphasis survives export. */
export function inlineRuns(input: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const re = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) runs.push({ text: input.slice(last, m.index) });
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) runs.push({ text: m[4], italic: true });
    else runs.push({ text: m[5], code: true });
    last = re.lastIndex;
  }
  if (last < input.length) runs.push({ text: input.slice(last) });
  return runs.filter((r) => r.text !== "");
}

/* ------------------------------------------------------------------- theme */

export interface ExportTheme {
  /** 6-digit hex, no leading hash. */
  accent: string;
  ink: string;
  muted: string;
  rule: string;
  tint: string;
}

function hex6(value?: string | null, fallback = "1F2937"): string {
  const raw = (value ?? "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(raw)) return raw.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return raw
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  return fallback;
}

function rgb(h: string): [number, number, number] {
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Pulls the venture's own colour into the documents, with a neutral fallback. */
export function themeFromColors(colors?: {
  primary?: string | null;
  accent?: string | null;
  secondary?: string | null;
}): ExportTheme {
  const accent = hex6(colors?.primary ?? colors?.accent ?? null, "1F2937");
  // Keep the accent legible on white: darken anything very light.
  const [r, g, b] = rgb(accent);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const safe =
    luminance > 0.72
      ? [r, g, b]
          .map((c) => Math.round(c * 0.55).toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
      : accent;
  return { accent: safe, ink: "1A1A1E", muted: "6B7280", rule: "DCDCE1", tint: "F5F5F7" };
}

const DEFAULT_THEME = themeFromColors();

/* -------------------------------------------------------------------- docx */

export async function generateDocx(doc: ExportDoc): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ShadingType,
    BorderStyle,
    AlignmentType,
    LevelFormat,
    Header,
    Footer,
    PageNumber,
    InternalHyperlink,
    Bookmark,
    SectionType,

  } = await import("docx");

  const theme = doc.theme ?? DEFAULT_THEME;
  const CONTENT = 9360; // US Letter with 1" margins, in DXA.
  const SERIF = "Georgia";
  const SANS = "Arial";
  const hair = { style: BorderStyle.SINGLE, size: 1, color: theme.rule };
  const borders = { top: hair, bottom: hair, left: hair, right: hair };
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const runs = (text: string, opts: { size?: number; color?: string; bold?: boolean } = {}) =>
    inlineRuns(text).map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold || opts.bold,
          italics: r.italic,
          font: r.code ? "Consolas" : undefined,
          size: opts.size ?? 21,
          color: opts.color ?? theme.ink,
        }),
    );

  const spacer = (after = 120) =>
    new Paragraph({ spacing: { after }, children: [new TextRun("")] });

  const rulePara = (color: string, size = 12) =>
    new Paragraph({
      spacing: { before: 60, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
      children: [new TextRun("")],
    });

  const image = (img: FetchedImage, maxW = 600, maxH = 620) => {
    const ratio = img.height / Math.max(1, img.width);
    let width = Math.min(maxW, img.width);
    let height = Math.round(width * ratio);
    if (height > maxH) {
      height = maxH;
      width = Math.round(height / Math.max(0.01, ratio));
    }
    return new ImageRun({
      type: "png",
      data: img.bytes,
      transformation: { width, height },
      altText: {
        title: img.label ?? doc.ventureName,
        description: img.label ?? doc.ventureName,
        name: img.label ?? doc.ventureName,
      },
    });
  };

  /* ------------------------------------------------------------ cover page */

  const cover: any[] = [];
  cover.push(spacer(1200));
  if (doc.logo) {
    cover.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [image(doc.logo, 200, 200)],
      }),
    );
  }
  cover.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: doc.ventureName, font: SERIF, size: 60, color: theme.ink }),
      ],
    }),
  );
  if (doc.oneLiner) {
    cover.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({ text: doc.oneLiner, font: SANS, size: 22, italics: true, color: theme.muted }),
        ],
      }),
    );
  }
  cover.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: theme.accent, space: 6 } },
      children: [new TextRun("")],
    }),
  );
  cover.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: [doc.docTitle, doc.dateLabel].filter(Boolean).join("  ·  "),
          font: SANS,
          size: 18,
          color: theme.muted,
          allCaps: true,
        }),
      ],
    }),
  );

  /* ---------------------------------------------------------------- body */

  const children: any[] = [];

  if (doc.blocks.length > 1) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Contents", font: SERIF, size: 36, color: theme.ink }),
        ],
      }),
      rulePara(theme.accent, 8),
      // A live TOC field renders blank until Word updates it, so the contents
      // are written out as real linked lines instead.
      ...doc.blocks.map(
        (b, i) =>
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new InternalHyperlink({
                anchor: `section-${i}`,
                children: [
                  ...(b.eyebrow
                    ? [
                        new TextRun({
                          text: `${b.eyebrow.toUpperCase()}   `,
                          size: 16,
                          bold: true,
                          color: theme.accent,
                        }),
                      ]
                    : []),
                  new TextRun({ text: b.title, size: 22, color: theme.ink }),
                ],
              }),
            ],
          }),
      ),
      new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
    );
  }

  doc.blocks.forEach((block, index) => {
    const breakBefore = index > 0;
    if (block.eyebrow) {
      children.push(
        new Paragraph({
          pageBreakBefore: breakBefore,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: block.eyebrow,
              font: SANS,
              size: 16,
              bold: true,
              allCaps: true,
              color: theme.accent,
            }),
          ],
        }),
      );
    }
    children.push(
      new Paragraph({
        pageBreakBefore: breakBefore && !block.eyebrow,
        heading: HeadingLevel.HEADING_1,
        children: [
          new Bookmark({ id: `section-${index}`, children: [new TextRun(block.title)] }),
        ],
      }),
    );

    if (block.subtitle) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: block.subtitle, font: SANS, size: 20, italics: true, color: theme.muted }),
          ],
        }),
      );
    }
    children.push(rulePara(theme.rule, 6));

    if (block.metrics?.length) {
      children.push(
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [3400, 5960],
          rows: block.metrics.map(
            (m) =>
              new TableRow({
                children: [
                  new TableCell({
                    borders: { ...noBorders, bottom: hair },
                    width: { size: 3400, type: WidthType.DXA },
                    margins: { top: 120, bottom: 120, left: 0, right: 160 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: m.label,
                            font: SANS,
                            size: 17,
                            bold: true,
                            allCaps: true,
                            color: theme.muted,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: { ...noBorders, bottom: hair },
                    width: { size: 5960, type: WidthType.DXA },
                    margins: { top: 120, bottom: 120, left: 0, right: 0 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: m.value, font: SERIF, size: 26, color: theme.ink }),
                          ...(m.note
                            ? [
                                new TextRun({
                                  text: `  ${m.note}`,
                                  font: SANS,
                                  size: 18,
                                  color: theme.muted,
                                }),
                              ]
                            : []),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
      );
      children.push(spacer(200));
    }

    block.images.forEach((img) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 60 },
          children: [image(img)],
        }),
      );
      if (img.label && img.label !== block.title) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: img.label, size: 17, italics: true, color: theme.muted }),
            ],
          }),
        );
      } else {
        children.push(spacer(200));
      }
    });

    if (block.markdown) {
      parseMarkdown(block.markdown).forEach((md) => {
        if (md.t === "h") {
          children.push(
            new Paragraph({
              spacing: { before: md.level === 1 ? 320 : 260, after: 100 },
              children: [
                new TextRun({
                  text: md.text,
                  font: SERIF,
                  size: md.level === 1 ? 30 : md.level === 2 ? 26 : 23,
                  color: theme.ink,
                }),
              ],
            }),
          );
        } else if (md.t === "li") {
          children.push(
            new Paragraph({
              numbering: { reference: md.ordered ? "export-numbers" : "export-bullets", level: 0 },
              spacing: { after: 80, line: 300 },
              children: runs(md.text),
            }),
          );
        } else if (md.t === "quote") {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              spacing: { before: 160, after: 200, line: 300 },
              border: {
                left: { style: BorderStyle.SINGLE, size: 12, color: theme.accent, space: 12 },
              },
              children: inlineRuns(md.text).map(
                (r) =>
                  new TextRun({ text: r.text, italics: true, size: 21, color: theme.muted, bold: r.bold }),
              ),
            }),
          );
        } else if (md.t === "table") {
          const cols = Math.max(1, md.rows[0].length);
          const colWidth = Math.floor(CONTENT / cols);
          children.push(
            new Table({
              width: { size: colWidth * cols, type: WidthType.DXA },
              columnWidths: Array.from({ length: cols }, () => colWidth),
              rows: md.rows.map(
                (row, r) =>
                  new TableRow({
                    tableHeader: r === 0,
                    children: Array.from({ length: cols }, (_, c) => row[c] ?? "").map(
                      (text) =>
                        new TableCell({
                          borders,
                          width: { size: colWidth, type: WidthType.DXA },
                          margins: { top: 100, bottom: 100, left: 140, right: 140 },
                          shading:
                            r === 0
                              ? { fill: theme.tint, type: ShadingType.CLEAR }
                              : undefined,
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text,
                                  bold: r === 0,
                                  size: r === 0 ? 18 : 20,
                                  allCaps: r === 0,
                                  color: r === 0 ? theme.muted : theme.ink,
                                }),
                              ],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            }),
          );
          children.push(spacer(220));
        } else {
          children.push(
            new Paragraph({
              spacing: { after: 200, line: 320 },
              children: runs(md.text),
            }),
          );
        }
      });
    }
  });

  const pageProps = {
    page: {
      size: { width: 12240, height: 15840 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    },
  };

  const footer = new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: theme.rule, space: 6 } },
        tabStops: [{ type: "right" as any, position: CONTENT }],
        children: [
          new TextRun({ text: doc.ventureName, size: 16, color: theme.muted }),
          new TextRun({ text: "\t", size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: theme.muted }),
        ],
      }),
    ],
  });

  const document = new Document({
    styles: {
      default: { document: { run: { font: SANS, size: 21, color: theme.ink } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: SERIF, size: 40, color: theme.ink },
          paragraph: { spacing: { before: 0, after: 80 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: SERIF, size: 30, color: theme.ink },
          paragraph: { spacing: { before: 320, after: 100 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: SERIF, size: 25, color: theme.ink },
          paragraph: { spacing: { before: 260, after: 80 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "export-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 480, hanging: 260 } } },
            },
          ],
        },
        {
          reference: "export-numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 480, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      { properties: pageProps, children: cover },
      {
        properties: { ...pageProps, type: SectionType.NEXT_PAGE },
        footers: { default: footer },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

/* --------------------------------------------------------------------- pdf */

export async function generatePdf(doc: ExportDoc): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "letter" });

  const theme = doc.theme ?? DEFAULT_THEME;
  const INK = rgb(theme.ink);
  const MUTED = rgb(theme.muted);
  const RULE = rgb(theme.rule);
  const ACCENT = rgb(theme.accent);
  const TINT = rgb(theme.tint);

  const M = 64;
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const CW = W - M * 2;
  const BOTTOM = H - M - 22; // leave room for the footer
  let y = M;
  let onCover = true;

  const drawFooter = () => {
    if (onCover) return;
    const fy = H - M + 6;
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.5);
    pdf.line(M, fy - 12, M + CW, fy - 12);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(doc.ventureName, M, fy);
    pdf.text(String(pdf.getNumberOfPages()), M + CW, fy, { align: "right" });
  };

  const newPage = () => {
    drawFooter();
    pdf.addPage();
    y = M;
  };

  const room = (need: number) => {
    if (y + need > BOTTOM) newPage();
  };

  /** Wraps a line of inline runs, preserving bold / italic / code. */
  const richText = (
    value: string,
    opts: {
      size?: number;
      color?: [number, number, number];
      font?: "helvetica" | "times" | "courier";
      style?: "normal" | "italic";
      gap?: number;
      indent?: number;
      leading?: number;
    } = {},
  ) => {
    const size = opts.size ?? 10.5;
    const color = opts.color ?? INK;
    const baseFont = opts.font ?? "helvetica";
    const baseStyle = opts.style ?? "normal";
    const indent = opts.indent ?? 0;
    const lead = (opts.leading ?? 1.55) * size;
    const width = CW - indent;
    const runs = inlineRuns(value);

    type Piece = { text: string; bold: boolean; italic: boolean; code: boolean };
    const words: Piece[] = [];
    runs.forEach((r) => {
      r.text.split(/(\s+)/).forEach((w) => {
        if (w === "") return;
        words.push({ text: w, bold: !!r.bold, italic: !!r.italic, code: !!r.code });
      });
    });

    const setStyle = (p: Piece) => {
      const font = p.code ? "courier" : baseFont;
      const style =
        p.bold && (p.italic || baseStyle === "italic")
          ? "bolditalic"
          : p.bold
            ? "bold"
            : p.italic || baseStyle === "italic"
              ? "italic"
              : "normal";
      pdf.setFont(font, style);
      pdf.setFontSize(size);
    };

    let line: Piece[] = [];
    let lineW = 0;

    const flushLine = () => {
      if (!line.length) return;
      room(lead);
      let x = M + indent;
      line.forEach((p) => {
        setStyle(p);
        pdf.setTextColor(...color);
        pdf.text(p.text, x, y + size * 0.85);
        x += pdf.getTextWidth(p.text);
      });
      y += lead;
      line = [];
      lineW = 0;
    };

    words.forEach((p) => {
      setStyle(p);
      const w = pdf.getTextWidth(p.text);
      if (lineW + w > width && line.length && p.text.trim() !== "") {
        flushLine();
        if (/^\s+$/.test(p.text)) return;
      }
      if (!line.length && /^\s+$/.test(p.text)) return;
      line.push(p);
      lineW += w;
    });
    flushLine();
    y += opts.gap ?? 8;
  };

  const plain = (
    value: string,
    size: number,
    style: "normal" | "italic" | "bold",
    font: "helvetica" | "times",
    gap = 6,
    color: [number, number, number] = INK,
  ) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(value, CW) as string[];
    lines.forEach((line) => {
      room(size * 1.3);
      pdf.text(line, M, y + size * 0.85);
      y += size * 1.3;
    });
    y += gap;
  };

  const drawImage = (img: FetchedImage, caption?: string | null) => {
    const ratio = img.height / Math.max(1, img.width);
    let w = Math.min(CW, img.width);
    let h = w * ratio;
    const maxH = BOTTOM - M - 40;
    if (h > maxH) {
      h = maxH;
      w = h / Math.max(0.01, ratio);
    }
    room(h + (caption ? 26 : 14));
    pdf.addImage(img.dataUrl, "PNG", M + (CW - w) / 2, y, w, h);
    y += h + 8;
    if (caption) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...MUTED);
      pdf.text(caption, M + CW / 2, y + 7, { align: "center" });
      y += 20;
    } else {
      y += 8;
    }
  };

  /** A real table: measured columns, tinted header, page-break continuation. */
  const drawTable = (rows: string[][]) => {
    const cols = Math.max(1, ...rows.map((r) => r.length));
    const grid = rows.map((r) => Array.from({ length: cols }, (_, c) => r[c] ?? ""));
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const natural = Array.from({ length: cols }, (_, c) =>
      Math.max(...grid.map((r) => pdf.getTextWidth(r[c]) + 20), 60),
    );
    const total = natural.reduce((a, b) => a + b, 0);
    const widths = natural.map((n) => (n / total) * CW);
    const PAD = 8;

    const rowLines = (row: string[]) =>
      row.map((cell, c) => pdf.splitTextToSize(cell, widths[c] - PAD * 2) as string[]);

    const drawRow = (row: string[], header: boolean) => {
      pdf.setFont("helvetica", header ? "bold" : "normal");
      pdf.setFontSize(header ? 8.5 : 9.5);
      const lines = rowLines(row);
      const lineH = header ? 12 : 13;
      const h = Math.max(...lines.map((l) => l.length)) * lineH + PAD * 2;
      if (y + h > BOTTOM) {
        newPage();
        if (!header) drawRow(grid[0], true);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
      }
      let x = M;
      if (header) {
        pdf.setFillColor(...TINT);
        pdf.rect(M, y, CW, h, "F");
      }
      pdf.setDrawColor(...RULE);
      pdf.setLineWidth(0.5);
      pdf.rect(M, y, CW, h);
      lines.forEach((cellLines, c) => {
        pdf.setTextColor(...(header ? MUTED : INK));
        pdf.setFont("helvetica", header ? "bold" : "normal");
        pdf.setFontSize(header ? 8.5 : 9.5);
        cellLines.forEach((l, i) => {
          pdf.text(header ? l.toUpperCase() : l, x + PAD, y + PAD + lineH * i + 8);
        });
        if (c > 0) pdf.line(x, y, x, y + h);
        x += widths[c];
      });
      y += h;
    };

    room(60);
    grid.forEach((row, r) => drawRow(row, r === 0));
    y += 16;
  };

  /* ------------------------------------------------------------ cover page */

  {
    let cy = H * 0.28;
    if (doc.logo) {
      const w = Math.min(150, doc.logo.width);
      const h = (w * doc.logo.height) / Math.max(1, doc.logo.width);
      pdf.addImage(doc.logo.dataUrl, "PNG", (W - w) / 2, cy - h, w, h);
    }
    cy += 40;
    pdf.setFont("times", "normal");
    pdf.setFontSize(34);
    pdf.setTextColor(...INK);
    const nameLines = pdf.splitTextToSize(doc.ventureName, CW) as string[];
    nameLines.forEach((l) => {
      pdf.text(l, W / 2, cy, { align: "center" });
      cy += 40;
    });
    if (doc.oneLiner) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(11.5);
      pdf.setTextColor(...MUTED);
      const lines = pdf.splitTextToSize(doc.oneLiner, CW * 0.75) as string[];
      lines.forEach((l) => {
        pdf.text(l, W / 2, cy, { align: "center" });
        cy += 17;
      });
    }
    cy += 18;
    pdf.setDrawColor(...ACCENT);
    pdf.setLineWidth(2);
    pdf.line(W / 2 - 40, cy, W / 2 + 40, cy);
    cy += 26;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED);
    const meta = [doc.docTitle, doc.dateLabel].filter(Boolean).join("   ·   ");
    if (meta) pdf.text(meta.toUpperCase(), W / 2, cy, { align: "center" });
  }

  onCover = false;
  pdf.addPage();
  y = M;

  /* ---------------------------------------------------------------- body */

  const contentsPage = doc.blocks.length > 1 ? pdf.getNumberOfPages() : 0;
  if (contentsPage) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(24);
    pdf.setTextColor(...INK);
    pdf.text("Contents", M, y + 20);
    y += 34;
    pdf.setDrawColor(...ACCENT);
    pdf.setLineWidth(1.2);
    pdf.line(M, y, M + 56, y);
    y += 26;
    pdf.setFontSize(11);
    doc.blocks.forEach((b) => {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...INK);
      const lines = pdf.splitTextToSize(b.title, CW - 40) as string[];
      room(16 * lines.length + 6);
      lines.forEach((l, i) => {
        pdf.text(l, M, y + 11);
        if (i === lines.length - 1) {
          pdf.setTextColor(...MUTED);
          pdf.text("—", M + CW, y + 11, { align: "right" });
          pdf.setTextColor(...INK);
        }
        y += 16;
      });
      y += 6;
    });
    newPage();
  }

  const pageStarts: number[] = [];

  doc.blocks.forEach((block, index) => {
    if (index > 0) newPage();
    pageStarts.push(pdf.getNumberOfPages());

    if (block.eyebrow) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...ACCENT);
      pdf.text(block.eyebrow.toUpperCase(), M, y + 8);
      y += 20;
    }
    plain(block.title, 24, "normal", "times", 4);
    if (block.subtitle) plain(block.subtitle, 10.5, "italic", "helvetica", 6, MUTED);
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y + 2, M + CW, y + 2);
    y += 20;

    if (block.metrics?.length) {
      block.metrics.forEach((m) => {
        room(38);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...MUTED);
        pdf.text(m.label.toUpperCase(), M, y + 10);
        pdf.setFont("times", "normal");
        pdf.setFontSize(15);
        pdf.setTextColor(...INK);
        pdf.text(m.value, M + CW, y + 12, { align: "right" });
        if (m.note) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...MUTED);
          pdf.text(m.note, M, y + 24);
        }
        y += m.note ? 34 : 24;
        pdf.setDrawColor(...RULE);
        pdf.setLineWidth(0.5);
        pdf.line(M, y, M + CW, y);
        y += 10;
      });
      y += 8;
    }

    block.images.forEach((img) => {
      drawImage(img, img.label && img.label !== block.title ? img.label : null);
    });

    if (block.markdown) {
      parseMarkdown(block.markdown).forEach((md) => {
        if (md.t === "h") {
          y += 8;
          room(30);
          plain(
            md.text,
            md.level === 1 ? 16 : md.level === 2 ? 13.5 : 12,
            "normal",
            "times",
            4,
          );
        } else if (md.t === "li") {
          room(18);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10.5);
          pdf.setTextColor(...ACCENT);
          pdf.text("\u2022", M + 4, y + 9);
          pdf.setTextColor(...INK);
          richText(md.text, { indent: 20, gap: 4 });
        } else if (md.t === "quote") {
          const startY = y;
          richText(md.text, { indent: 20, style: "italic", color: MUTED, gap: 10 });
          pdf.setDrawColor(...ACCENT);
          pdf.setLineWidth(2);
          pdf.line(M + 4, startY, M + 4, Math.max(startY + 10, y - 10));
        } else if (md.t === "table") {
          drawTable(md.rows);
        } else {
          richText(md.text, { gap: 10 });
        }
      });
    }
  });

  drawFooter();

  // Fill in the contents page numbers now that pagination is known.
  if (contentsPage) {
    pdf.setPage(contentsPage);
    let cy = M + 34 + 26;
    pdf.setFontSize(11);
    doc.blocks.forEach((b, i) => {
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(b.title, CW - 40) as string[];
      cy += 16 * (lines.length - 1);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(M + CW - 30, cy - 2, 30, 14, "F");
      pdf.setTextColor(...MUTED);
      pdf.text(String(pageStarts[i] ?? ""), M + CW, cy + 11, { align: "right" });
      cy += 22;
    });
  }

  return pdf.output("blob");
}

/* ------------------------------------------------------------------ output */

export const FILE_META: Record<ExportFormat, { ext: string; mime: string }> = {
  docx: {
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  pdf: { ext: "pdf", mime: "application/pdf" },
};

export async function renderExport(doc: ExportDoc, format: ExportFormat) {
  const blob = format === "docx" ? await generateDocx(doc) : await generatePdf(doc);
  return { blob, filename: `${doc.fileBase}.${FILE_META[format].ext}` };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------------------------------------------------------- google drive */

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export function driveEnabled() {
  return !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
}

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.dataset.gis = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google sign-in failed to load"));
    document.head.appendChild(s);
  });
}

async function driveToken(): Promise<string> {
  await loadGis();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
  return new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (res: any) => {
        if (res?.access_token) resolve(res.access_token);
        else reject(new Error("Google didn't grant access"));
      },
      error_callback: () => reject(new Error("Google sign-in was cancelled")),
    });
    client.requestAccessToken({ prompt: "" });
  });
}

/** Uploads the generated file into the visitor's own Drive. Returns a link. */
export async function uploadToDrive(blob: Blob, filename: string, mime: string) {
  const token = await driveToken();
  const boundary = `lovable${Math.random().toString(36).slice(2)}`;
  const metadata = JSON.stringify({ name: filename, mimeType: mime });
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, blob, tail], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  );
  if (!res.ok) throw new Error(`Drive upload failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as { id: string; webViewLink?: string };
}
