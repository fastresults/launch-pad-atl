// @ts-nocheck
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  ExternalHyperlink,
  LevelFormat,
  ImageRun,
  Footer,
  PageNumber,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
} from "docx";

// ---------------------------------------------------------------------------
// Theme — mirrors the on-screen DocumentViewer styling, translated to Word.
// ---------------------------------------------------------------------------

const THEME = {
  fontBody: "Aptos",
  fontHeading: "Aptos Display",
  fontMono: "Consolas",
  colors: {
    text: "1F2937",
    textMuted: "6B7280",
    textSoft: "374151",
    primary: "7C3AED",
    primarySoft: "A78BFA",
    border: "E5E7EB",
    borderSoft: "F3F4F6",
    rule: "D1D5DB",
    codeBg: "F4F4F6",
    codeChip: "EFEFF2",
    inlineCodeBg: "F1F1F3",
    quoteBg: "F4F1FB",
    quoteBar: "8B5CF6",
    tableHeader: "EFEFF2",
    tableZebra: "FAFAFC",
    calloutInfoBg: "EAF4FB",
    calloutInfoBar: "38BDF8",
    calloutWarnBg: "FEF6E7",
    calloutWarnBar: "F59E0B",
    calloutTipBg: "F4F1FB",
    calloutTipBar: "8B5CF6",
    calloutSuccessBg: "ECFBF3",
    calloutSuccessBar: "10B981",
  },
};

const PAGE = {
  widthDxa: 12240,
  heightDxa: 15840,
  marginDxa: 1440,
  get contentWidthDxa() {
    return this.widthDxa - this.marginDxa * 2; // 9360
  },
};

// ---------------------------------------------------------------------------
// Inline markdown parser → docx runs
// ---------------------------------------------------------------------------

type Inline =
  | { kind: "text"; text: string; bold?: boolean; italic?: boolean; code?: boolean }
  | { kind: "link"; href: string; children: Inline[] };

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  const push = (run: Inline) => out.push(run);

  while (i < src.length) {
    const linkMatch = src.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      push({ kind: "link", href: linkMatch[2], children: parseInline(linkMatch[1]) });
      i += linkMatch[0].length;
      continue;
    }
    const boldMatch = src.slice(i).match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      for (const r of parseInline(boldMatch[2])) {
        if (r.kind === "text") push({ ...r, bold: true });
        else push(r);
      }
      i += boldMatch[0].length;
      continue;
    }
    const itMatch = src.slice(i).match(/^(\*|_)([^*_]+?)\1/);
    if (itMatch) {
      for (const r of parseInline(itMatch[2])) {
        if (r.kind === "text") push({ ...r, italic: true });
        else push(r);
      }
      i += itMatch[0].length;
      continue;
    }
    const codeMatch = src.slice(i).match(/^`([^`]+)`/);
    if (codeMatch) {
      push({ kind: "text", text: codeMatch[1], code: true });
      i += codeMatch[0].length;
      continue;
    }
    let j = i + 1;
    while (j < src.length && !/[\*_`\[]/.test(src[j])) j++;
    push({ kind: "text", text: src.slice(i, j) });
    i = j;
  }
  return out;
}

function runForInline(r: Inline & { kind: "text" }, overrides: any = {}): TextRun {
  if (r.code) {
    return new TextRun({
      text: r.text,
      font: THEME.fontMono,
      size: 20, // 10pt
      shading: { type: ShadingType.CLEAR, color: "auto", fill: THEME.colors.inlineCodeBg },
      color: THEME.colors.textSoft,
      bold: r.bold,
      italics: r.italic,
      ...overrides,
    });
  }
  return new TextRun({
    text: r.text,
    bold: r.bold,
    italics: r.italic,
    color: overrides.color ?? THEME.colors.text,
    ...overrides,
  });
}

function inlineToRuns(
  inlines: Inline[],
  overrides: any = {},
): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  for (const r of inlines) {
    if (r.kind === "link") {
      runs.push(
        new ExternalHyperlink({
          link: r.href,
          children: r.children
            .filter((c) => c.kind === "text")
            .map((c) =>
              runForInline(c as any, {
                color: THEME.colors.primary,
                underline: { type: "single", color: THEME.colors.primary },
                ...overrides,
              }),
            ),
        }),
      );
    } else {
      runs.push(runForInline(r, overrides));
    }
  }
  return runs;
}

function paragraphFromMd(
  line: string,
  opts: Partial<ConstructorParameters<typeof Paragraph>[0]> = {},
  runOverrides: any = {},
) {
  return new Paragraph({
    spacing: { after: 160, line: 340 }, // 1.5x line height
    ...opts,
    children: inlineToRuns(parseInline(line), runOverrides),
  });
}

// ---------------------------------------------------------------------------
// Block builders
// ---------------------------------------------------------------------------

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: THEME.colors.border };
const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function makeTable(rows: string[][]): Table {
  const colCount = Math.max(...rows.map((r) => r.length));
  const tableWidthDxa = PAGE.contentWidthDxa;
  const colWidth = Math.floor(tableWidthDxa / colCount);
  const columnWidths = Array.from({ length: colCount }, () => colWidth);
  const NUMERIC_RE = /^[\$£€]?\s*-?[\d,]+(?:\.\d+)?%?$/;

  return new Table({
    width: { size: tableWidthDxa, type: WidthType.DXA },
    columnWidths,
    rows: rows.map(
      (row, rIdx) =>
        new TableRow({
          tableHeader: rIdx === 0,
          children: Array.from({ length: colCount }, (_, cIdx) => {
            const cell = (row[cIdx] ?? "").trim();
            const isHeader = rIdx === 0;
            const isZebra = !isHeader && rIdx % 2 === 0;
            const numeric = !isHeader && NUMERIC_RE.test(cell);
            const fill = isHeader
              ? THEME.colors.tableHeader
              : isZebra
                ? THEME.colors.tableZebra
                : undefined;
            return new TableCell({
              borders: cellBorders,
              width: { size: colWidth, type: WidthType.DXA },
              shading: fill
                ? { fill, type: ShadingType.CLEAR, color: "auto" }
                : undefined,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  alignment: numeric ? AlignmentType.RIGHT : AlignmentType.LEFT,
                  spacing: { after: 0, line: 280 },
                  children: inlineToRuns(parseInline(cell), {
                    bold: isHeader || undefined,
                    size: isHeader ? 18 : numeric ? 20 : 22, // 9pt header, 10pt numeric mono, 11pt
                    font: numeric ? THEME.fontMono : undefined,
                    color: isHeader ? THEME.colors.textMuted : THEME.colors.text,
                    allCaps: isHeader || undefined,
                    characterSpacing: isHeader ? 20 : undefined,
                  }),
                }),
              ],
            });
          }),
        }),
    ),
  });
}

const CALLOUT_PATTERNS: Array<{
  re: RegExp;
  bg: string;
  bar: string;
  icon: string;
}> = [
  { re: /^(note|info)[:\s]/i, bg: THEME.colors.calloutInfoBg, bar: THEME.colors.calloutInfoBar, icon: "ⓘ" },
  { re: /^(warning|caution|important)[:\s]/i, bg: THEME.colors.calloutWarnBg, bar: THEME.colors.calloutWarnBar, icon: "▲" },
  { re: /^tip[:\s]/i, bg: THEME.colors.calloutTipBg, bar: THEME.colors.calloutTipBar, icon: "✦" },
  { re: /^(success|done)[:\s]/i, bg: THEME.colors.calloutSuccessBg, bar: THEME.colors.calloutSuccessBar, icon: "✓" },
];

function makeCallout(text: string, cfg: (typeof CALLOUT_PATTERNS)[number]): Table {
  const leftBar = { style: BorderStyle.SINGLE, size: 18, color: cfg.bar };
  const edge = { style: BorderStyle.SINGLE, size: 4, color: cfg.bg };
  return new Table({
    width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
    columnWidths: [PAGE.contentWidthDxa],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: edge, bottom: edge, right: edge, left: leftBar },
            width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
            shading: { fill: cfg.bg, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 160, bottom: 160, left: 220, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 0, line: 320 },
                children: [
                  new TextRun({ text: `${cfg.icon}  `, color: cfg.bar, bold: true }),
                  ...inlineToRuns(parseInline(text), { color: THEME.colors.textSoft }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeCodeBlock(lang: string, code: string[]): Table {
  const chip = new TableRow({
    children: [
      new TableCell({
        borders: {
          top: thinBorder,
          left: thinBorder,
          right: thinBorder,
          bottom: { style: BorderStyle.SINGLE, size: 2, color: THEME.colors.border },
        },
        width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
        shading: { fill: THEME.colors.codeChip, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 60, bottom: 60, left: 160, right: 160 },
        children: [
          new Paragraph({
            spacing: { after: 0 },
            children: [
              new TextRun({
                text: (lang || "text").toUpperCase(),
                font: THEME.fontMono,
                size: 16, // 8pt
                color: THEME.colors.textMuted,
                characterSpacing: 30,
              }),
            ],
          }),
        ],
      }),
    ],
  });
  const body = new TableRow({
    children: [
      new TableCell({
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: thinBorder,
          right: thinBorder,
          bottom: thinBorder,
        },
        width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
        shading: { fill: THEME.colors.codeBg, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        children: code.length
          ? code.map(
              (line) =>
                new Paragraph({
                  spacing: { after: 0, line: 260 },
                  children: [
                    new TextRun({
                      text: line || " ",
                      font: THEME.fontMono,
                      size: 19, // 9.5pt
                      color: THEME.colors.text,
                    }),
                  ],
                }),
            )
          : [new Paragraph({ children: [new TextRun({ text: " " })] })],
      }),
    ],
  });
  return new Table({
    width: { size: PAGE.contentWidthDxa, type: WidthType.DXA },
    columnWidths: [PAGE.contentWidthDxa],
    rows: [chip, body],
  });
}

export function mdToBlocks(md: string): (Paragraph | Table)[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      const lang = fence[1].trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(makeCodeBlock(lang, code));
      blocks.push(new Paragraph({ spacing: { after: 0 }, children: [] }));
      continue;
    }

    // horizontal rule
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(
        new Paragraph({
          spacing: { before: 240, after: 240 },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: THEME.colors.rule,
              space: 1,
            },
          },
        }),
      );
      i++;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(h[1].length, 4);
      const text = h[2];
      const headingMap: any = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
      };
      blocks.push(paragraphFromMd(text, { heading: headingMap[level], spacing: { before: 0, after: 0 } }));
      i++;
      continue;
    }

    // blockquote (+ callout detection)
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const joined = quote.join(" ").trim();
      const callout = CALLOUT_PATTERNS.find((c) => c.re.test(joined));
      if (callout) {
        blocks.push(makeCallout(joined.replace(callout.re, "").trim(), callout));
      } else {
        blocks.push(
          new Paragraph({
            spacing: { before: 120, after: 200, line: 320 },
            indent: { left: 360 },
            border: {
              left: {
                style: BorderStyle.SINGLE,
                size: 12,
                color: THEME.colors.quoteBar,
                space: 12,
              },
            },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: THEME.colors.quoteBg },
            children: inlineToRuns(parseInline(joined), {
              italics: true,
              color: THEME.colors.textSoft,
            }),
          }),
        );
      }
      blocks.push(new Paragraph({ spacing: { after: 0 }, children: [] }));
      continue;
    }

    // GFM table
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const parseRow = (l: string) =>
        l
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const rows = [header];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(makeTable(rows));
      blocks.push(new Paragraph({ spacing: { after: 0 }, children: [] }));
      continue;
    }

    // lists
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      while (i < lines.length) {
        const ul = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
        const ol = lines[i].match(/^(\s*)\d+\.\s+(.*)$/);
        if (!ul && !ol) break;
        const m = (ul ?? ol)!;
        const indent = Math.min(Math.floor(m[1].length / 2), 3);
        const text = m[2];
        blocks.push(
          paragraphFromMd(text, {
            spacing: { after: 80, line: 320 },
            numbering: {
              reference: ol ? "ol" : "ul-violet",
              level: indent,
            },
          }),
        );
        i++;
      }
      continue;
    }

    // paragraph
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>\s?|```|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1]))
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(paragraphFromMd(para.join(" ")));
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Hero image
// ---------------------------------------------------------------------------

async function fetchHero(url: string): Promise<{ data: ArrayBuffer; type: "png" | "jpg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || "";
    const type: "png" | "jpg" = ct.includes("png") ? "png" : "jpg";
    return { data, type };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

export async function markdownToDocxBlob(
  title: string,
  markdown: string,
  options: { heroUrl?: string; subtitle?: string } = {},
): Promise<Blob> {
  const body: (Paragraph | Table)[] = [];

  // Optional hero image at top
  if (options.heroUrl) {
    const hero = await fetchHero(options.heroUrl);
    if (hero) {
      // 624pt content width at 96dpi-ish; docx ImageRun uses pixel-ish units
      body.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new ImageRun({
              type: hero.type,
              data: hero.data,
              transformation: { width: 624, height: 351 },
              altText: { title, description: title, name: "hero" },
            }),
          ],
        }),
      );
    }
  }

  // Title block
  body.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 56, // 28pt
          font: THEME.fontHeading,
          color: THEME.colors.primary,
        }),
      ],
    }),
  );
  if (options.subtitle) {
    body.push(
      new Paragraph({
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: options.subtitle.toUpperCase(),
            size: 18,
            color: THEME.colors.textMuted,
            characterSpacing: 40,
          }),
        ],
      }),
    );
  } else {
    body.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
  }

  // Divider
  body.push(
    new Paragraph({
      spacing: { after: 240 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 8,
          color: THEME.colors.primarySoft,
          space: 1,
        },
      },
    }),
  );

  // Content
  body.push(...mdToBlocks(markdown));

  const doc = new Document({
    creator: "StartupLabs",
    title,
    styles: {
      default: {
        document: { run: { font: THEME.fontBody, size: 22, color: THEME.colors.text } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 44, bold: true, font: THEME.fontHeading, color: THEME.colors.primary },
          paragraph: {
            spacing: { before: 360, after: 160 },
            outlineLevel: 0,
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: THEME.colors.primarySoft,
                space: 4,
              },
            },
            keepNext: true,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: THEME.fontHeading, color: THEME.colors.text },
          paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1, keepNext: true },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: THEME.fontHeading, color: THEME.colors.text },
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
            font: THEME.fontHeading,
            color: THEME.colors.textMuted,
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
            color: THEME.colors.primary,
            underline: { type: "single", color: THEME.colors.primary },
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
              run: { color: THEME.colors.primary, bold: true },
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
              run: { color: THEME.colors.primary },
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
                  new TextRun({
                    text: title,
                    size: 16,
                    color: THEME.colors.textMuted,
                  }),
                  new TextRun({ text: "\t", size: 16 }),
                  new TextRun({
                    text: "Page ",
                    size: 16,
                    color: THEME.colors.textMuted,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: THEME.colors.textMuted,
                  }),
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
