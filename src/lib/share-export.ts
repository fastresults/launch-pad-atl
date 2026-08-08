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
  metrics?: { label: string; value: string; note?: string | null }[];
  markdown?: string | null;
  images: FetchedImage[];
}

export interface ExportDoc {
  fileBase: string;
  ventureName: string;
  oneLiner?: string | null;
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

async function blockFromItem(item: ShareItem): Promise<ExportBlock> {
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

export async function buildSectionDoc(
  payload: SharePayload,
  item: ShareItem,
): Promise<ExportDoc> {
  const logo = payload.venture.logoUrl ? await fetchImage(payload.venture.logoUrl) : null;
  return {
    fileBase: `${slug(payload.venture.name)}-${slug(item.title)}`,
    ventureName: payload.venture.name,
    oneLiner: payload.venture.oneLiner,
    logo,
    blocks: [await blockFromItem(item)],
  };
}

export async function buildFullDoc(
  payload: SharePayload,
  onProgress?: (done: number, total: number) => void,
): Promise<ExportDoc> {
  const logo = payload.venture.logoUrl ? await fetchImage(payload.venture.logoUrl) : null;
  const items = payload.sections.flatMap((s) => s.items);
  const blocks: ExportBlock[] = [];

  if (payload.executiveSummary) {
    blocks.push({
      title: "Executive summary",
      metrics: payload.executiveMetrics ?? [],
      markdown: filterShowcaseContent(payload.executiveSummary),
      images: [],
    });
  }

  for (let i = 0; i < items.length; i += 1) {
    blocks.push(await blockFromItem(items[i]));
    onProgress?.(i + 1, items.length);
  }

  return {
    fileBase: `${slug(payload.venture.name)}-showcase`,
    ventureName: payload.venture.name,
    oneLiner: payload.venture.oneLiner,
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
      out.push({ t: "li", text: stripInline(bullet[1]), ordered: false });
      continue;
    }
    const num = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (num) {
      flush();
      out.push({ t: "li", text: stripInline(num[1]), ordered: true });
      continue;
    }
    if (trimmed.startsWith(">")) {
      flush();
      out.push({ t: "quote", text: stripInline(trimmed.replace(/^>\s?/, "")) });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return out;
}

function stripInline(s: string) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

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
    PageBreak,
  } = await import("docx");

  const CONTENT = 9360; // US Letter with 1" margins, in DXA.
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const children: any[] = [];

  if (doc.logo) {
    const h = Math.round((120 * doc.logo.height) / Math.max(1, doc.logo.width));
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data: doc.logo.bytes,
            transformation: { width: 120, height: Math.min(120, h || 120) },
            altText: { title: doc.ventureName, description: doc.ventureName, name: doc.ventureName },
          }),
        ],
      }),
    );
  }
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(doc.ventureName)] }),
  );
  if (doc.oneLiner) {
    children.push(new Paragraph({ children: [new TextRun({ text: doc.oneLiner, italics: true })] }));
  }

  doc.blocks.forEach((block, index) => {
    if (index > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(block.title)] }),
    );
    if (block.subtitle) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: block.subtitle, italics: true })] }),
      );
    }

    if (block.metrics?.length) {
      children.push(
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: block.metrics.map(
            (m) =>
              new TableRow({
                children: [m.label, m.note ? `${m.value} — ${m.note}` : m.value].map(
                  (text, i) =>
                    new TableCell({
                      borders,
                      width: { size: 4680, type: WidthType.DXA },
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      shading: i === 0 ? { fill: "F2F2F2", type: ShadingType.CLEAR } : undefined,
                      children: [new Paragraph({ children: [new TextRun(text)] })],
                    }),
                ),
              }),
          ),
        }),
      );
      children.push(new Paragraph({ children: [new TextRun("")] }));
    }

    block.images.forEach((img) => {
      const width = Math.min(560, img.width);
      const height = Math.round((width * img.height) / Math.max(1, img.width));
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: "png",
              data: img.bytes,
              transformation: { width, height },
              altText: {
                title: img.label ?? block.title,
                description: img.label ?? block.title,
                name: img.label ?? block.title,
              },
            }),
          ],
        }),
      );
      if (img.label && img.label !== block.title) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: img.label, size: 18, color: "666666" })],
          }),
        );
      }
    });

    if (block.markdown) {
      parseMarkdown(block.markdown).forEach((md) => {
        if (md.t === "h") {
          children.push(
            new Paragraph({
              heading: md.level === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
              children: [new TextRun(md.text)],
            }),
          );
        } else if (md.t === "li") {
          children.push(
            new Paragraph({
              numbering: { reference: md.ordered ? "export-numbers" : "export-bullets", level: 0 },
              children: [new TextRun(md.text)],
            }),
          );
        } else if (md.t === "quote") {
          children.push(
            new Paragraph({
              indent: { left: 480 },
              children: [new TextRun({ text: md.text, italics: true })],
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
                    children: Array.from({ length: cols }, (_, c) => row[c] ?? "").map(
                      (text) =>
                        new TableCell({
                          borders,
                          width: { size: colWidth, type: WidthType.DXA },
                          margins: { top: 80, bottom: 80, left: 120, right: 120 },
                          shading:
                            r === 0 ? { fill: "F2F2F2", type: ShadingType.CLEAR } : undefined,
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text, bold: r === 0 })],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            }),
          );
          children.push(new Paragraph({ children: [new TextRun("")] }));
        } else {
          children.push(new Paragraph({ children: [new TextRun(md.text)] }));
        }
      });
    }
  });

  const document = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
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
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
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
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
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

  const M = 56;
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const CW = W - M * 2;
  let y = M;

  const room = (need: number) => {
    if (y + need > H - M) {
      pdf.addPage();
      y = M;
    }
  };

  const text = (
    value: string,
    size: number,
    style: "normal" | "bold" | "italic",
    font: "helvetica" | "times",
    gap = 6,
    color: [number, number, number] = [25, 25, 28],
  ) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(value, CW) as string[];
    lines.forEach((line) => {
      room(size * 1.35);
      pdf.text(line, M, y + size);
      y += size * 1.35;
    });
    y += gap;
  };

  // Cover-ish header
  if (doc.logo) {
    const w = 90;
    const h = Math.round((w * doc.logo.height) / Math.max(1, doc.logo.width));
    room(h + 10);
    pdf.addImage(doc.logo.dataUrl, "PNG", M, y, w, h);
    y += h + 14;
  }
  text(doc.ventureName, 26, "normal", "times", 4);
  if (doc.oneLiner) text(doc.oneLiner, 11, "italic", "helvetica", 12, [110, 110, 118]);

  doc.blocks.forEach((block, index) => {
    if (index > 0) {
      pdf.addPage();
      y = M;
    }
    text(block.title, 20, "normal", "times", 4);
    if (block.subtitle) text(block.subtitle, 10, "italic", "helvetica", 10, [110, 110, 118]);

    if (block.metrics?.length) {
      block.metrics.forEach((m) => {
        room(30);
        pdf.setDrawColor(225);
        pdf.line(M, y, M + CW, y);
        y += 6;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(25, 25, 28);
        pdf.text(m.label, M, y + 10);
        pdf.setFont("helvetica", "normal");
        pdf.text(m.note ? `${m.value} — ${m.note}` : m.value, M + CW, y + 10, { align: "right" });
        y += 20;
      });
      y += 10;
    }

    block.images.forEach((img) => {
      const w = Math.min(CW, img.width);
      const h = Math.round((w * img.height) / Math.max(1, img.width));
      const fit = h > H - M * 2 ? ((H - M * 2) / h) * w : w;
      const fitH = Math.round((fit * img.height) / Math.max(1, img.width));
      room(fitH + 16);
      pdf.addImage(img.dataUrl, "PNG", M + (CW - fit) / 2, y, fit, fitH);
      y += fitH + 8;
      if (img.label) text(img.label, 8.5, "italic", "helvetica", 8, [130, 130, 138]);
    });

    if (block.markdown) {
      parseMarkdown(block.markdown).forEach((md) => {
        if (md.t === "h") {
          y += 4;
          text(md.text, md.level === 1 ? 15 : 12.5, "bold", "helvetica", 4);
        } else if (md.t === "li") {
          text(`•  ${md.text}`, 10.5, "normal", "helvetica", 2);
        } else if (md.t === "quote") {
          text(md.text, 10.5, "italic", "helvetica", 6, [90, 90, 98]);
        } else if (md.t === "table") {
          md.rows.forEach((row, r) => {
            text(row.join("   ·   "), 9.5, r === 0 ? "bold" : "normal", "helvetica", 2);
          });
          y += 6;
        } else {
          text(md.text, 10.5, "normal", "helvetica", 8);
        }
      });
    }
  });

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
