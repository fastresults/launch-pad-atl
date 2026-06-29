// @ts-nocheck
// Visual Brand Style Guide — generates a DOCX that embeds the user's
// chosen palette swatches, typography samples, and primary logo image,
// then appends the markdown-based guide content.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  ImageRun,
  HeightRule,
  VerticalAlign,
  LevelFormat,
  Footer,
  PageNumber,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
} from "docx";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { mdToBlocks } from "./markdown-to-docx";

// --- Page constants --------------------------------------------------------

const PAGE = {
  widthDxa: 12240,
  heightDxa: 15840,
  marginDxa: 1440,
  get contentWidthDxa() {
    return this.widthDxa - this.marginDxa * 2; // 9360
  },
};

const FALLBACK_HEADING_FONT = "Inter";
const FALLBACK_BODY_FONT = "Source Sans Pro";

// --- Color helpers ---------------------------------------------------------

function stripHash(hex: string | null | undefined): string {
  if (!hex || typeof hex !== "string") return "000000";
  return hex.replace(/^#/, "").trim().slice(0, 6).toUpperCase().padEnd(6, "0");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = stripHash(hex);
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const norm = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}

function readableTextOn(bgHex: string): string {
  return relLuminance(bgHex) > 0.55 ? "111111" : "FFFFFF";
}

// --- Image fetch -----------------------------------------------------------

async function fetchImage(url: string): Promise<{ data: ArrayBuffer; type: "png" | "jpg" } | null> {
  try {
    if (url.startsWith("data:")) {
      const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(url);
      if (!m) return null;
      const binary = atob(m[2]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return { data: bytes.buffer, type: m[1].toLowerCase().startsWith("p") ? "png" : "jpg" };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const head = new Uint8Array(buf.slice(0, 4));
    const type: "png" | "jpg" =
      head[0] === 0x89 && head[1] === 0x50 ? "png" : "jpg";
    return { data: buf, type };
  } catch {
    return null;
  }
}

async function fetchKitImage(asset: any): Promise<{ data: ArrayBuffer; type: "png" | "jpg" } | null> {
  if (!asset) return null;
  if (asset.path) {
    try {
      const { data } = await supabase.storage
        .from(asset.bucket || "user-media")
        .createSignedUrl(asset.path, 3600);
      if (data?.signedUrl) {
        const fresh = await fetchImage(data.signedUrl);
        if (fresh) return fresh;
      }
    } catch {
      // Fall back to the stored URL below.
    }
  }
  return asset.url ? fetchImage(asset.url) : null;
}

const swatchCache = new Map<string, ArrayBuffer>();

async function colorSwatchPng(hex: string, width = 260, height = 96): Promise<ArrayBuffer | null> {
  const fill = `#${stripHash(hex)}`;
  const key = `${fill}-${width}x${height}`;
  if (swatchCache.has(key)) return swatchCache.get(key)!;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    const buf = await blob.arrayBuffer();
    swatchCache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}

// --- Small builders --------------------------------------------------------

function makeP(opts: {
  text?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number; // half-points
  font?: string;
  color?: string;
  align?: any;
  spacingBefore?: number;
  spacingAfter?: number;
  allCaps?: boolean;
  letterSpacing?: number;
  children?: any[];
}): Paragraph {
  const children =
    opts.children ??
    [
      new TextRun({
        text: opts.text ?? "",
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size,
        font: opts.font,
        color: opts.color,
        allCaps: opts.allCaps,
        characterSpacing: opts.letterSpacing,
      }),
    ];
  return new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.spacingBefore ?? 0, after: opts.spacingAfter ?? 0 },
    children,
  });
}

function sectionHeader(label: string, primaryHex: string, headingFont: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 480, after: 80 },
      children: [
        new TextRun({
          text: label.toUpperCase(),
          size: 18,
          color: stripHash(primaryHex),
          characterSpacing: 60,
          bold: true,
          font: headingFont,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 8,
          color: stripHash(primaryHex),
          space: 1,
        },
      },
    }),
  ];
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
}

function thinBorders(color = "E5E7EB") {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b };
}

// --- Palette section -------------------------------------------------------

const ROLE_LABELS: Record<string, { label: string; usage: string }> = {
  primary: { label: "Primary", usage: "Lead brand color. Headlines, primary CTAs, logo." },
  secondary: { label: "Secondary", usage: "Supporting color. Section accents, secondary buttons." },
  accent: { label: "Accent", usage: "High-energy moments. Highlights, badges, links." },
  fg: { label: "Foreground", usage: "Body text and core UI elements on light surfaces." },
  bg: { label: "Background", usage: "Primary canvas color. Page and section backgrounds." },
  muted: { label: "Muted", usage: "Secondary text, dividers, low-emphasis surfaces." },
  surface: { label: "Surface", usage: "Cards, panels, and elevated UI." },
  text: { label: "Text", usage: "Default text color." },
  success: { label: "Success", usage: "Confirmations and positive states." },
  warning: { label: "Warning", usage: "Cautions and important notices." },
  danger: { label: "Danger", usage: "Destructive actions and error states." },
};

async function buildPaletteTable(palette: any, headingFont: string, bodyFont: string): Promise<Table> {
  const colors: Record<string, string> = palette?.colors ?? {};
  const rolesOrder = ["primary", "secondary", "accent", "fg", "bg", "muted", "surface", "text", "success", "warning", "danger"];
  const seen = new Set<string>();
  const entries: { key: string; hex: string }[] = [];
  for (const r of rolesOrder) {
    if (colors[r]) { entries.push({ key: r, hex: colors[r] }); seen.add(r); }
  }
  for (const [k, v] of Object.entries(colors)) {
    if (!seen.has(k) && typeof v === "string") entries.push({ key: k, hex: v });
  }

  const swatchW = 1600;
  const nameW = 2200;
  const hexW = 1600;
  const usageW = PAGE.contentWidthDxa - swatchW - nameW - hexW;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "Swatch",
      "Role",
      "Hex / RGB",
      "Usage",
    ].map((label, i) =>
      new TableCell({
        width: { size: [swatchW, nameW, hexW, usageW][i], type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          makeP({
            text: label.toUpperCase(),
            size: 16,
            bold: true,
            color: "6B7280",
            letterSpacing: 40,
            font: headingFont,
          }),
        ],
      }),
    ),
  });

  const rows = await Promise.all(entries.map(async (e) => {
    const rolesMeta = ROLE_LABELS[e.key] ?? { label: e.key, usage: "Custom brand color." };
    const rgb = hexToRgb(e.hex);
    const swatch = await colorSwatchPng(e.hex);
    return new TableRow({
      cantSplit: true,
      height: { value: 1200, rule: HeightRule.ATLEAST },
      children: [
        new TableCell({
          width: { size: swatchW, type: WidthType.DXA },
          shading: { fill: stripHash(e.hex), type: ShadingType.CLEAR },
          margins: { top: 240, bottom: 240, left: 160, right: 160 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            ...(swatch
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 },
                    children: [
                      new ImageRun({
                        type: "png",
                        data: swatch,
                        transformation: { width: 112, height: 42 },
                        altText: { title: `${e.key} color swatch`, description: `#${stripHash(e.hex)}`, name: `${e.key}-swatch` },
                      }),
                    ],
                  }),
                ]
              : []),
            makeP({
              text: `#${stripHash(e.hex)}`,
              size: 16,
              bold: true,
              color: readableTextOn(e.hex),
              align: AlignmentType.CENTER,
              font: bodyFont,
            }),
          ],
        }),
        new TableCell({
          width: { size: nameW, type: WidthType.DXA },
          margins: { top: 200, bottom: 200, left: 200, right: 160 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            makeP({ text: rolesMeta.label, bold: true, size: 24, font: headingFont, color: "111827" }),
            makeP({ text: e.key, size: 16, color: "9CA3AF", font: bodyFont, spacingBefore: 40 }),
          ],
        }),
        new TableCell({
          width: { size: hexW, type: WidthType.DXA },
          margins: { top: 200, bottom: 200, left: 160, right: 160 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            makeP({ text: `#${stripHash(e.hex)}`, size: 20, bold: true, font: "Consolas", color: "111827" }),
            makeP({
              text: `R${rgb.r} G${rgb.g} B${rgb.b}`,
              size: 16,
              color: "6B7280",
              font: "Consolas",
              spacingBefore: 40,
            }),
          ],
        }),
        new TableCell({
          width: { size: usageW, type: WidthType.DXA },
          margins: { top: 200, bottom: 200, left: 160, right: 200 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            makeP({ text: rolesMeta.usage, size: 20, color: "374151", font: bodyFont }),
          ],
        }),
      ],
    });
  }));

  return new Table({
    width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
    columnWidths: [swatchW, nameW, hexW, usageW],
    borders: thinBorders("E5E7EB"),
    rows: [headerRow, ...rows],
  });
}

// --- Typography section ----------------------------------------------------

const TYPE_SCALE = [
  { label: "H1 / Display", size: 64, weight: "Bold", usage: "Hero headlines, marquee statements." },
  { label: "H2 / Section", size: 44, weight: "Bold", usage: "Section titles and page subjects." },
  { label: "H3 / Subhead", size: 32, weight: "Semibold", usage: "Subsections and prominent callouts." },
  { label: "Body", size: 22, weight: "Regular", usage: "Default paragraph text, descriptions." },
  { label: "Caption", size: 16, weight: "Regular", usage: "Labels, captions, metadata." },
];

function buildTypographySection(
  typography: any,
  primaryHex: string,
  companyName: string,
): (Paragraph | Table)[] {
  const headingFamily = typography?.heading?.family || FALLBACK_HEADING_FONT;
  const bodyFamily = typography?.body?.family || FALLBACK_BODY_FONT;
  const headingWeight = typography?.heading?.weight || 700;
  const bodyWeight = typography?.body?.weight || 400;

  const blocks: (Paragraph | Table)[] = [];

  // Heading specimen card
  blocks.push(
    new Table({
      width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
      columnWidths: [PAGE.contentWidthDxa],
      borders: thinBorders("E5E7EB"),
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
              shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
              margins: { top: 360, bottom: 360, left: 360, right: 360 },
              children: [
                makeP({
                  text: "HEADING TYPEFACE",
                  size: 16,
                  bold: true,
                  color: "6B7280",
                  letterSpacing: 40,
                  font: bodyFamily,
                  spacingAfter: 60,
                }),
                makeP({
                  text: `${headingFamily} · ${headingWeight}`,
                  size: 22,
                  color: stripHash(primaryHex),
                  font: bodyFamily,
                  bold: true,
                  spacingAfter: 160,
                }),
                makeP({
                  text: companyName || "Your Brand Speaks Here",
                  bold: true,
                  size: 84, // 42pt
                  font: headingFamily,
                  color: stripHash(primaryHex),
                  spacingAfter: 80,
                }),
                makeP({
                  text: "The quick brown fox jumps over the lazy dog.",
                  size: 32,
                  font: headingFamily,
                  color: "111827",
                }),
                makeP({
                  text: "1234567890 — ABCDEFGHIJKLMNOPQRSTUVWXYZ — !@#$%&*()",
                  size: 18,
                  font: headingFamily,
                  color: "6B7280",
                  spacingBefore: 120,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  blocks.push(makeP({ spacingAfter: 200 }));

  // Body specimen card
  blocks.push(
    new Table({
      width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
      columnWidths: [PAGE.contentWidthDxa],
      borders: thinBorders("E5E7EB"),
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
              margins: { top: 360, bottom: 360, left: 360, right: 360 },
              children: [
                makeP({
                  text: "BODY TYPEFACE",
                  size: 16,
                  bold: true,
                  color: "6B7280",
                  letterSpacing: 40,
                  font: bodyFamily,
                  spacingAfter: 60,
                }),
                makeP({
                  text: `${bodyFamily} · ${bodyWeight}`,
                  size: 22,
                  color: stripHash(primaryHex),
                  font: bodyFamily,
                  bold: true,
                  spacingAfter: 200,
                }),
                makeP({
                  text:
                    "Body copy should feel calm, legible, and unmistakably ours. We pair generous line-height with a measured rhythm so paragraphs read effortlessly across decks, docs, and the web. Use this typeface for everything from product descriptions to long-form storytelling — wherever clarity matters more than spectacle.",
                  size: 22,
                  font: bodyFamily,
                  color: "1F2937",
                  spacingAfter: 160,
                }),
                makeP({
                  text:
                    "abcdefghijklmnopqrstuvwxyz · ABCDEFGHIJKLMNOPQRSTUVWXYZ · 0123456789",
                  size: 18,
                  font: bodyFamily,
                  color: "6B7280",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  blocks.push(makeP({ spacingAfter: 240 }));

  // Type scale table
  const colW = [2400, 1200, 1400, PAGE.contentWidthDxa - 2400 - 1200 - 1400];
  const scaleHeader = new TableRow({
    tableHeader: true,
    children: ["Style", "Size", "Weight", "Usage"].map((t, i) =>
      new TableCell({
        width: { size: colW[i], type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [
          makeP({
            text: t.toUpperCase(),
            size: 16,
            bold: true,
            color: "6B7280",
            letterSpacing: 40,
            font: bodyFamily,
          }),
        ],
      }),
    ),
  });
  const scaleRows = TYPE_SCALE.map((s, idx) =>
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: colW[0], type: WidthType.DXA },
          shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
          margins: { top: 140, bottom: 140, left: 160, right: 160 },
          children: [
            makeP({
              text: s.label,
              size: Math.min(s.size, 36),
              bold: true,
              font: headingFamily,
              color: "111827",
            }),
          ],
        }),
        new TableCell({
          width: { size: colW[1], type: WidthType.DXA },
          shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
          margins: { top: 140, bottom: 140, left: 160, right: 160 },
          children: [makeP({ text: `${s.size / 2}pt`, size: 20, font: "Consolas", color: "374151" })],
        }),
        new TableCell({
          width: { size: colW[2], type: WidthType.DXA },
          shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
          margins: { top: 140, bottom: 140, left: 160, right: 160 },
          children: [makeP({ text: s.weight, size: 20, font: bodyFamily, color: "374151" })],
        }),
        new TableCell({
          width: { size: colW[3], type: WidthType.DXA },
          shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
          margins: { top: 140, bottom: 140, left: 160, right: 160 },
          children: [makeP({ text: s.usage, size: 20, font: bodyFamily, color: "374151" })],
        }),
      ],
    }),
  );
  blocks.push(
    new Table({
      width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
      columnWidths: colW,
      borders: thinBorders("E5E7EB"),
      rows: [scaleHeader, ...scaleRows],
    }),
  );

  // Font sources note
  blocks.push(
    makeP({
      text: `Source: Google Fonts. Install ${headingFamily} and ${bodyFamily} from fonts.google.com so collaborators render the brand correctly.`,
      size: 18,
      color: "6B7280",
      italic: true,
      font: bodyFamily,
      spacingBefore: 200,
    }),
  );

  return blocks;
}

// --- Logo section ----------------------------------------------------------

async function buildLogoSection(
  logos: any[],
  headingFont: string,
  bodyFont: string,
  primaryHex: string,
): Promise<(Paragraph | Table)[]> {
  const blocks: (Paragraph | Table)[] = [];
  if (!Array.isArray(logos) || logos.length === 0) {
    blocks.push(
      makeP({
        text: "No logo selections recorded for this brand.",
        size: 20,
        italic: true,
        color: "6B7280",
        font: bodyFont,
      }),
    );
    return blocks;
  }

  const primary = logos.find((l: any) => l?.primary) ?? logos[0];
  const others = logos.filter((l: any) => l !== primary).slice(0, 4);

  // Primary logo card
  const primaryImg = await fetchKitImage(primary);
  if (primaryImg) {
    blocks.push(
      new Table({
        width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
        columnWidths: [PAGE.contentWidthDxa],
        borders: thinBorders("E5E7EB"),
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 480, bottom: 480, left: 360, right: 360 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  makeP({
                    text: "PRIMARY LOGO",
                    size: 16,
                    bold: true,
                    color: "6B7280",
                    letterSpacing: 40,
                    align: AlignmentType.CENTER,
                    font: bodyFont,
                    spacingAfter: 240,
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 },
                    children: [
                      new ImageRun({
                        type: primaryImg.type,
                        data: primaryImg.data,
                        transformation: { width: 360, height: 360 },
                        altText: {
                          title: "Primary logo",
                          description: primary?.direction_name || "Primary logo",
                          name: "primary-logo",
                        },
                      }),
                    ],
                  }),
                  makeP({
                    text: primary?.direction_name || "Selected mark",
                    size: 22,
                    bold: true,
                    align: AlignmentType.CENTER,
                    font: headingFont,
                    color: stripHash(primaryHex),
                  }),
                  ...(primary?.logo_type
                    ? [
                        makeP({
                          text: primary.logo_type,
                          size: 16,
                          color: "6B7280",
                          align: AlignmentType.CENTER,
                          font: bodyFont,
                          spacingBefore: 40,
                          allCaps: true,
                          letterSpacing: 30,
                        }),
                      ]
                    : []),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  }

  // Alternates
  if (others.length) {
    blocks.push(makeP({ spacingAfter: 240 }));
    blocks.push(
      makeP({
        text: "ALTERNATE MARKS",
        size: 16,
        bold: true,
        color: "6B7280",
        letterSpacing: 40,
        font: bodyFont,
        spacingAfter: 160,
      }),
    );

    // Build 2-up grid rows
    const cellW = Math.floor(PAGE.contentWidthDxa / 2);
    const rowsGrid: TableRow[] = [];
    for (let i = 0; i < others.length; i += 2) {
      const pair = [others[i], others[i + 1]].filter(Boolean);
      const imgs = await Promise.all(pair.map((p) => fetchKitImage(p)));
      const cells = await Promise.all(
        pair.map(async (alt, idx) => {
          const img = imgs[idx];
          return new TableCell({
            width: { size: cellW, type: WidthType.DXA },
            shading: { fill: "FAFAFA", type: ShadingType.CLEAR },
            margins: { top: 300, bottom: 300, left: 240, right: 240 },
            verticalAlign: VerticalAlign.CENTER,
            children: img
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 160 },
                    children: [
                      new ImageRun({
                        type: img.type,
                        data: img.data,
                        transformation: { width: 200, height: 200 },
                        altText: {
                          title: "Alternate logo",
                          description: alt?.direction_name || "Alternate logo",
                          name: `alt-logo-${idx}`,
                        },
                      }),
                    ],
                  }),
                  makeP({
                    text: alt?.direction_name || "Alternate",
                    size: 18,
                    bold: true,
                    align: AlignmentType.CENTER,
                    font: headingFont,
                    color: "111827",
                  }),
                  ...(alt?.logo_type
                    ? [
                        makeP({
                          text: alt.logo_type,
                          size: 14,
                          color: "6B7280",
                          align: AlignmentType.CENTER,
                          font: bodyFont,
                          spacingBefore: 40,
                          allCaps: true,
                          letterSpacing: 30,
                        }),
                      ]
                    : []),
                ]
              : [
                  makeP({
                    text: alt?.direction_name || "—",
                    size: 16,
                    italic: true,
                    color: "9CA3AF",
                    align: AlignmentType.CENTER,
                    font: bodyFont,
                  }),
                ],
          });
        }),
      );
      // Pad to 2 cells
      while (cells.length < 2) {
        cells.push(
          new TableCell({
            width: { size: cellW, type: WidthType.DXA },
            children: [makeP({})],
          }),
        );
      }
      rowsGrid.push(new TableRow({ cantSplit: true, children: cells }));
    }
    blocks.push(
      new Table({
        width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
        columnWidths: [cellW, cellW],
        borders: thinBorders("E5E7EB"),
        rows: rowsGrid,
      }),
    );
  }

  blocks.push(
    makeP({
      text: "Maintain clear space around the mark equal to the cap height of the wordmark on all sides. Minimum digital size: 24px tall; minimum print size: 0.5 inch tall. Do not stretch, recolor, rotate, or place the logo on busy imagery without an overlay.",
      size: 18,
      color: "6B7280",
      italic: true,
      font: bodyFont,
      spacingBefore: 200,
    }),
  );

  return blocks;
}

// --- Voice section ---------------------------------------------------------

function buildVoiceSection(voice: any, headingFont: string, bodyFont: string): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [];
  const attributes = voice?.attributes ?? {};
  const rules = voice?.rules;
  const tagline = voice?.tagline;

  if (tagline) {
    blocks.push(
      makeP({
        text: `"${tagline}"`,
        size: 32,
        italic: true,
        font: headingFont,
        color: "111827",
        spacingAfter: 200,
      }),
    );
  }

  const attrEntries = Object.entries(attributes).filter(([, v]) => typeof v === "number");
  if (attrEntries.length) {
    const colW = [2400, PAGE.contentWidthDxa - 2400 - 1400, 1400];
    const rows = attrEntries.map(([k, v]: any, idx) => {
      const pct = Math.max(0, Math.min(100, Number(v)));
      const filled = Math.round(pct / 5); // 20-segment bar
      const bar = "█".repeat(filled) + "░".repeat(20 - filled);
      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: colW[0], type: WidthType.DXA },
            shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: [
              makeP({
                text: k.charAt(0).toUpperCase() + k.slice(1),
                size: 22,
                bold: true,
                font: headingFont,
                color: "111827",
              }),
            ],
          }),
          new TableCell({
            width: { size: colW[1], type: WidthType.DXA },
            shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: [makeP({ text: bar, size: 22, font: "Consolas", color: "374151" })],
          }),
          new TableCell({
            width: { size: colW[2], type: WidthType.DXA },
            shading: idx % 2 ? { fill: "FAFAFA", type: ShadingType.CLEAR } : undefined,
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: [makeP({ text: `${pct}%`, size: 22, font: "Consolas", color: "374151", align: AlignmentType.RIGHT })],
          }),
        ],
      });
    });
    blocks.push(
      new Table({
        width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
        columnWidths: colW,
        borders: thinBorders("E5E7EB"),
        rows,
      }),
    );
  }

  if (rules && String(rules).trim()) {
    blocks.push(makeP({ spacingAfter: 200 }));
    blocks.push(
      makeP({
        text: "Voice rules",
        size: 22,
        bold: true,
        font: headingFont,
        color: "111827",
        spacingAfter: 80,
      }),
    );
    blocks.push(makeP({ text: String(rules), size: 22, font: bodyFont, color: "1F2937" }));
  }

  if (!tagline && !attrEntries.length && !(rules && String(rules).trim())) {
    blocks.push(
      makeP({
        text: "No voice attributes recorded.",
        size: 20,
        italic: true,
        color: "6B7280",
        font: bodyFont,
      }),
    );
  }

  return blocks;
}

// --- Main entry ------------------------------------------------------------

export async function brandKitToDocxBlob(kit: any, companyName: string): Promise<Blob> {
  const palette = kit?.palette ?? {};
  const typography = kit?.typography ?? {};
  const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
  const voice = kit?.voice ?? {};
  const guideMarkdown: string = kit?.guide_markdown || "";

  const primaryHex = palette?.colors?.primary || "111827";
  const headingFont = typography?.heading?.family || FALLBACK_HEADING_FONT;
  const bodyFont = typography?.body?.family || FALLBACK_BODY_FONT;

  const body: (Paragraph | Table)[] = [];

  // ===== Cover =====
  const primaryLogo = logos.find((l: any) => l?.primary) ?? logos[0];
  const coverImg = await fetchKitImage(primaryLogo);
  if ((primaryLogo?.path || primaryLogo?.url) && !coverImg) {
    console.warn("[brand-guide-docx] Cover logo fetch failed", primaryLogo.path || primaryLogo.url);
  }
  if (coverImg) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [
          new ImageRun({
            type: coverImg.type,
            data: coverImg.data,
            transformation: { width: 280, height: 280 },
            altText: { title: "Brand logo", description: companyName, name: "cover-logo" },
          }),
        ],
      }),
    );
  }

  body.push(
    makeP({
      text: companyName || "Your Brand",
      bold: true,
      size: 88, // 44pt
      font: headingFont,
      color: stripHash(primaryHex),
      align: AlignmentType.CENTER,
      spacingAfter: 80,
    }),
  );
  body.push(
    makeP({
      text: "BRAND STYLE GUIDE",
      size: 22,
      color: "6B7280",
      letterSpacing: 80,
      bold: true,
      align: AlignmentType.CENTER,
      font: bodyFont,
      spacingAfter: 120,
    }),
  );
  body.push(
    makeP({
      text: `Generated ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
      size: 18,
      italic: true,
      color: "9CA3AF",
      align: AlignmentType.CENTER,
      font: bodyFont,
      spacingAfter: 320,
    }),
  );

  // Divider
  body.push(
    new Paragraph({
      spacing: { after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: stripHash(primaryHex), space: 1 },
      },
    }),
  );

  // ===== Color =====
  body.push(...sectionHeader("Color System", primaryHex, headingFont));
  if (palette?.name) {
    body.push(
      makeP({
        text: palette.name,
        size: 28,
        bold: true,
        font: headingFont,
        color: "111827",
        spacingAfter: 80,
      }),
    );
  }
  if (palette?.rationale) {
    body.push(
      makeP({
        text: palette.rationale,
        size: 20,
        color: "374151",
        font: bodyFont,
        spacingAfter: 200,
      }),
    );
  }
  body.push(await buildPaletteTable(palette, headingFont, bodyFont));

  // ===== Typography =====
  body.push(...sectionHeader("Typography", primaryHex, headingFont));
  if (typography?.name) {
    body.push(
      makeP({
        text: typography.name,
        size: 28,
        bold: true,
        font: headingFont,
        color: "111827",
        spacingAfter: 200,
      }),
    );
  }
  body.push(...buildTypographySection(typography, primaryHex, companyName));

  // ===== Logo =====
  body.push(...sectionHeader("Logo", primaryHex, headingFont));
  body.push(...(await buildLogoSection(logos, headingFont, bodyFont, primaryHex)));

  // ===== Voice =====
  body.push(...sectionHeader("Voice & Messaging", primaryHex, headingFont));
  body.push(...buildVoiceSection(voice, headingFont, bodyFont));

  // ===== Written Guide =====
  if (guideMarkdown && guideMarkdown.trim()) {
    body.push(...sectionHeader("Brand Narrative", primaryHex, headingFont));
    body.push(...mdToBlocks(guideMarkdown));
  }

  const doc = new Document({
    creator: "StartupLabs",
    title: `${companyName} — Brand Style Guide`,
    styles: {
      default: {
        document: {
          run: { font: bodyFont, size: 22, color: "1F2937" },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 44, bold: true, font: headingFont, color: stripHash(primaryHex) },
          paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: headingFont, color: "111827" },
          paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1, keepNext: true },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: headingFont, color: "111827" },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2, keepNext: true },
        },
        {
          id: "Heading4",
          name: "Heading 4",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 20,
            bold: true,
            font: headingFont,
            color: "6B7280",
            allCaps: true,
            characterSpacing: 30,
          },
          paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 3, keepNext: true },
        },
      ],
      characterStyles: [
        {
          id: "Hyperlink",
          name: "Hyperlink",
          basedOn: "DefaultParagraphFont",
          run: {
            color: stripHash(primaryHex),
            underline: { type: "single", color: stripHash(primaryHex) },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "ol",
          levels: [0, 1, 2, 3].map((lvl) => ({
            level: lvl,
            format: LevelFormat.DECIMAL,
            text: `%${lvl + 1}.`,
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5 * (lvl + 1)), hanging: 360 },
              },
              run: { color: stripHash(primaryHex), bold: true },
            },
          })),
        },
        {
          reference: "ul-violet",
          levels: [0, 1, 2, 3].map((lvl) => ({
            level: lvl,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5 * (lvl + 1)), hanging: 360 },
              },
              run: { color: stripHash(primaryHex) },
            },
          })),
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.widthDxa, height: PAGE.heightDxa },
            margin: {
              top: PAGE.marginDxa,
              right: PAGE.marginDxa,
              bottom: PAGE.marginDxa,
              left: PAGE.marginDxa,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                children: [
                  new TextRun({ text: `${companyName} — Brand Style Guide`, size: 16, color: "9CA3AF", font: bodyFont }),
                  new TextRun({ text: "\t", size: 16 }),
                  new TextRun({ text: "Page ", size: 16, color: "9CA3AF", font: bodyFont }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "9CA3AF", font: bodyFont }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function validateBrandGuideDocxBlob(blob: Blob, kit: any): Promise<{ ok: boolean; errors: string[]; mediaCount: number; colorFillCount: number }> {
  const errors: string[] = [];
  const zip = await JSZip.loadAsync(blob);
  const mediaCount = Object.keys(zip.files).filter((name) => /^word\/media\//.test(name)).length;
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) errors.push("The Word package is missing its document body.");

  const colors = kit?.palette?.colors ?? {};
  const expectedColors = Object.values(colors).filter((v: any) => typeof v === "string").map((v: string) => stripHash(v));
  const colorFillCount = expectedColors.filter((hex) => documentXml?.includes(`w:fill="${hex}"`) || documentXml?.includes(`fill="${hex}"`)).length;
  if (expectedColors.length && colorFillCount === 0) {
    errors.push("The selected color system was not embedded into the Word file.");
  }

  const logos = Array.isArray(kit?.logos) ? kit.logos : [];
  if (logos.length && mediaCount === 0) {
    errors.push("The selected logo images were not embedded into the Word file.");
  }

  return { ok: errors.length === 0, errors, mediaCount, colorFillCount };
}
