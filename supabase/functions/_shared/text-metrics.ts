// Real text measurement from the loaded TTF.
//
// The collateral compositor used to guess glyph width at `size * 0.52`, which
// broke lines in the wrong place and let long names run out of their boxes.
// This module reads the font's own advance widths (head/hhea/hmtx/cmap) so a
// measured line is the line the rasteriser actually draws.

type Metrics = {
  unitsPerEm: number;
  advances: number[]; // per glyph id, in font units
  cmap: Map<number, number>; // codepoint -> glyph id
  kern: Map<number, number>; // (left<<16|right) -> font units (optional)
};

const cache = new WeakMap<Uint8Array, Metrics | null>();

function u8(d: DataView, o: number) { return d.getUint8(o); }
function u16(d: DataView, o: number) { return d.getUint16(o); }
function i16(d: DataView, o: number) { return d.getInt16(o); }
function u32(d: DataView, o: number) { return d.getUint32(o); }

function readTables(d: DataView): Record<string, { off: number; len: number }> {
  const tables: Record<string, { off: number; len: number }> = {};
  let base = 0;
  if (u32(d, 0) === 0x74746366) base = u32(d, 12); // 'ttcf' → first font
  const num = u16(d, base + 4);
  for (let i = 0; i < num; i++) {
    const rec = base + 12 + i * 16;
    if (rec + 16 > d.byteLength) break;
    const tag = String.fromCharCode(u8(d, rec), u8(d, rec + 1), u8(d, rec + 2), u8(d, rec + 3));
    tables[tag] = { off: u32(d, rec + 8), len: u32(d, rec + 12) };
  }
  return tables;
}

function readCmap(d: DataView, off: number): Map<number, number> {
  const map = new Map<number, number>();
  const n = u16(d, off + 2);
  let best = -1, bestScore = -1;
  for (let i = 0; i < n; i++) {
    const rec = off + 4 + i * 8;
    const plat = u16(d, rec), enc = u16(d, rec + 2), sub = off + u32(d, rec + 4);
    const score = plat === 3 && enc === 10 ? 4 : plat === 3 && enc === 1 ? 3 : plat === 0 ? 2 : 1;
    if (score > bestScore) { bestScore = score; best = sub; }
  }
  if (best < 0) return map;

  const format = u16(d, best);
  if (format === 4) {
    const segX2 = u16(d, best + 6);
    const seg = segX2 / 2;
    const endO = best + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let s = 0; s < seg; s++) {
      const end = u16(d, endO + s * 2);
      const start = u16(d, startO + s * 2);
      const delta = i16(d, deltaO + s * 2);
      const rangeOffset = u16(d, rangeO + s * 2);
      if (start > end) continue;
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let g: number;
        if (rangeOffset === 0) g = (c + delta) & 0xffff;
        else {
          const gi = rangeO + s * 2 + rangeOffset + (c - start) * 2;
          if (gi + 1 >= d.byteLength) continue;
          g = u16(d, gi);
          if (g) g = (g + delta) & 0xffff;
        }
        if (g) map.set(c, g);
      }
    }
  } else if (format === 12) {
    const groups = u32(d, best + 12);
    for (let i = 0; i < groups; i++) {
      const g = best + 16 + i * 12;
      const start = u32(d, g), end = u32(d, g + 4), gid = u32(d, g + 8);
      for (let c = start; c <= end && c - start < 0x10000; c++) map.set(c, gid + (c - start));
    }
  } else if (format === 6) {
    const first = u16(d, best + 6), count = u16(d, best + 8);
    for (let i = 0; i < count; i++) map.set(first + i, u16(d, best + 10 + i * 2));
  }
  return map;
}

function parse(bytes: Uint8Array): Metrics | null {
  try {
    const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const t = readTables(d);
    if (!t.head || !t.hhea || !t.hmtx || !t.cmap) return null;
    const unitsPerEm = u16(d, t.head.off + 18) || 1000;
    const numH = u16(d, t.hhea.off + 34);
    const advances: number[] = [];
    for (let i = 0; i < numH; i++) advances.push(u16(d, t.hmtx.off + i * 4));
    const cmap = readCmap(d, t.cmap.off);
    return { unitsPerEm, advances, cmap, kern: new Map() };
  } catch {
    return null;
  }
}

function metricsFor(bytes?: Uint8Array | null): Metrics | null {
  if (!bytes || !bytes.length) return null;
  if (!cache.has(bytes)) cache.set(bytes, parse(bytes));
  return cache.get(bytes) ?? null;
}

/** Measured width of one string at a given font size, in px. */
export function measure(text: string, size: number, bytes?: Uint8Array | null, tracking = 0): number {
  const m = metricsFor(bytes);
  const s = String(text ?? "");
  if (!m) {
    // Conservative fallback: still better than a flat 0.52 average.
    let est = 0;
    for (const ch of s) est += /[ .,:;'`|il!]/.test(ch) ? 0.28 : /[A-Z@#%&MW]/.test(ch) ? 0.72 : 0.53;
    return est * size + Math.max(0, s.length - 1) * tracking;
  }
  const last = m.advances[m.advances.length - 1] ?? m.unitsPerEm / 2;
  let units = 0;
  for (const ch of s) {
    const gid = m.cmap.get(ch.codePointAt(0)!) ?? 0;
    units += gid < m.advances.length ? m.advances[gid] : last;
  }
  return (units / m.unitsPerEm) * size + Math.max(0, s.length - 1) * tracking;
}

/** Greedy wrap using real advance widths; hard-splits words that can't fit. */
export function wrap(
  text: string,
  size: number,
  maxWidth: number,
  bytes?: Uint8Array | null,
  tracking = 0,
): string[] {
  const out: string[] = [];
  for (const para of String(text ?? "").split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (measure(next, size, bytes, tracking) <= maxWidth || !cur) {
        if (!cur && measure(w, size, bytes, tracking) > maxWidth) {
          // A single word wider than the column — break it on character.
          let chunk = "";
          for (const ch of w) {
            if (measure(chunk + ch, size, bytes, tracking) > maxWidth && chunk) { out.push(chunk); chunk = ch; }
            else chunk += ch;
          }
          cur = chunk;
          continue;
        }
        cur = next;
      } else {
        out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

export type FitResult = { size: number; lines: string[]; tracking: number };

/**
 * Fit text into a box: wrap at the requested size, then step the size down
 * until it fits both the width and the line budget. Never overruns.
 */
export function fitBox(
  text: string,
  opts: {
    size: number;
    maxWidth: number;
    maxLines: number;
    bytes?: Uint8Array | null;
    tracking?: number;
    minSize?: number;
    step?: number;
  },
): FitResult {
  const { size, maxWidth, maxLines, bytes, tracking = 0 } = opts;
  // A caller-supplied floor is a print standard, not a hint — honour it even
  // when it is larger than the shrink-to-fit default.
  const minSize = opts.minSize ?? Math.max(8, size * 0.6);
  const step = opts.step ?? Math.max(0.5, size * 0.04);
  let s = size;
  let lines = wrap(text, s, maxWidth, bytes, tracking);
  while (lines.length > maxLines && s - step >= minSize) {
    s -= step;
    lines = wrap(text, s, maxWidth, bytes, tracking);
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    // Ellipsise the last line rather than letting it read as a fragment.
    let tail = lines[maxLines - 1] ?? "";
    while (tail && measure(`${tail}…`, s, bytes, tracking) > maxWidth) tail = tail.slice(0, -1).trimEnd();
    lines[maxLines - 1] = tail ? `${tail}…` : tail;
  }
  return { size: s, lines, tracking };
}

/** Shrink a single line until it fits — used for names, titles and totals. */
export function fitLine(
  text: string,
  opts: { size: number; maxWidth: number; bytes?: Uint8Array | null; tracking?: number; minSize?: number },
): { size: number; text: string } {
  const { maxWidth, bytes, tracking = 0 } = opts;
  // Hard floor: the piece's legal minimum when given, otherwise a sane ratio.
  const minSize = opts.minSize ?? Math.max(7, opts.size * 0.55);
  let s = opts.size;
  const t = String(text ?? "");
  while (measure(t, s, bytes, tracking) > maxWidth && s > minSize) s -= Math.max(0.5, opts.size * 0.03);
  if (measure(t, s, bytes, tracking) <= maxWidth) return { size: s, text: t };
  let cut = t;
  while (cut && measure(`${cut}…`, s, bytes, tracking) > maxWidth) cut = cut.slice(0, -1).trimEnd();
  return { size: s, text: cut ? `${cut}…` : "" };
}
