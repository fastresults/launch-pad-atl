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
} from "docx";

// Minimal markdown -> docx converter. Handles headings, paragraphs,
// bold/italic/code/links, bullet & numbered lists, blockquotes, code blocks,
// horizontal rules, and GFM pipe tables. Good enough for our generated docs.

type Inline =
  | { kind: "text"; text: string; bold?: boolean; italic?: boolean; code?: boolean }
  | { kind: "link"; href: string; children: Inline[] };

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  const push = (run: Inline) => out.push(run);

  while (i < src.length) {
    // link [text](url)
    const linkMatch = src.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      push({ kind: "link", href: linkMatch[2], children: parseInline(linkMatch[1]) });
      i += linkMatch[0].length;
      continue;
    }
    // bold **x** or __x__
    const boldMatch = src.slice(i).match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      for (const r of parseInline(boldMatch[2])) {
        if (r.kind === "text") push({ ...r, bold: true });
        else push(r);
      }
      i += boldMatch[0].length;
      continue;
    }
    // italic *x* or _x_
    const itMatch = src.slice(i).match(/^(\*|_)([^*_]+?)\1/);
    if (itMatch) {
      for (const r of parseInline(itMatch[2])) {
        if (r.kind === "text") push({ ...r, italic: true });
        else push(r);
      }
      i += itMatch[0].length;
      continue;
    }
    // inline code `x`
    const codeMatch = src.slice(i).match(/^`([^`]+)`/);
    if (codeMatch) {
      push({ kind: "text", text: codeMatch[1], code: true });
      i += codeMatch[0].length;
      continue;
    }
    // plain char — accumulate until a special char
    let j = i + 1;
    while (j < src.length && !/[\*_`\[]/.test(src[j])) j++;
    push({ kind: "text", text: src.slice(i, j) });
    i = j;
  }
  return out;
}

function inlineToRuns(inlines: Inline[]): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  for (const r of inlines) {
    if (r.kind === "link") {
      runs.push(
        new ExternalHyperlink({
          link: r.href,
          children: (inlineToRuns(r.children).filter((x) => x instanceof TextRun) as TextRun[]).map(
            (t) => t,
          ),
        }),
      );
    } else {
      runs.push(
        new TextRun({
          text: r.text,
          bold: r.bold,
          italics: r.italic,
          font: r.code ? "Courier New" : undefined,
        }),
      );
    }
  }
  return runs;
}

function paragraphFromMd(line: string, opts: Partial<ConstructorParameters<typeof Paragraph>[0]> = {}) {
  return new Paragraph({
    ...opts,
    children: inlineToRuns(parseInline(line)),
  });
}

function makeTable(rows: string[][]): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const colCount = Math.max(...rows.map((r) => r.length));
  const tableWidthDxa = 9360;
  const colWidth = Math.floor(tableWidthDxa / colCount);
  const columnWidths = Array.from({ length: colCount }, () => colWidth);

  return new Table({
    width: { size: tableWidthDxa, type: WidthType.DXA },
    columnWidths,
    rows: rows.map(
      (row, rIdx) =>
        new TableRow({
          children: Array.from({ length: colCount }, (_, cIdx) => {
            const cell = (row[cIdx] ?? "").trim();
            return new TableCell({
              borders,
              width: { size: colWidth, type: WidthType.DXA },
              shading:
                rIdx === 0
                  ? { fill: "EFEFF2", type: ShadingType.CLEAR, color: "auto" }
                  : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: inlineToRuns(parseInline(cell)).map((r) =>
                    r instanceof TextRun
                      ? new TextRun({
                          text: (r as any).options?.text ?? "",
                          bold: rIdx === 0 ? true : (r as any).options?.bold,
                          italics: (r as any).options?.italics,
                          font: (r as any).options?.font,
                        })
                      : r,
                  ),
                }),
              ],
            });
          }),
        }),
    ),
  });
}

function mdToBlocks(md: string): (Paragraph | Table)[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      for (const c of code) {
        blocks.push(
          new Paragraph({
            children: [new TextRun({ text: c || " ", font: "Courier New", size: 20 })],
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "F4F4F6" },
          }),
        );
      }
      continue;
    }

    // horizontal rule
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
        }),
      );
      i++;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const headingMap: any = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      blocks.push(paragraphFromMd(text, { heading: headingMap[level] }));
      i++;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        paragraphFromMd(quote.join(" "), {
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: "8B5CF6", space: 12 } },
        }),
      );
      continue;
    }

    // table (GFM: header | --- | rows)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const parseRow = (l: string) =>
        l
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());
      const header = parseRow(line);
      i += 2; // skip separator
      const rows = [header];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(makeTable(rows));
      continue;
    }

    // list
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
            numbering: ol ? { reference: "ol", level: indent } : undefined,
            bullet: ul ? { level: indent } : undefined,
          }),
        );
        i++;
      }
      continue;
    }

    // paragraph (merge consecutive non-blank, non-special lines)
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s?|```|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1]))) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(paragraphFromMd(para.join(" ")));
  }

  return blocks;
}

export async function markdownToDocxBlob(title: string, markdown: string): Promise<Blob> {
  const body: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 40 })],
    }),
    new Paragraph({ children: [] }),
    ...mdToBlocks(markdown),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
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
            style: { paragraph: { indent: { left: 720 * (lvl + 1), hanging: 360 } } },
          })),
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
        children: body,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
