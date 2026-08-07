// Assemble the lockup family from ONE traced vector mark.
//
// No model call, no redraw. The symbol is the founder's approved artwork; the
// wordmark is set in the venture's real heading typeface as outlined vectors.

import { fontStackFor, outlineWordmark } from "./logo-type.ts";

type Box = { w: number; h: number };

/** Pull the drawable interior and the intrinsic box out of a traced SVG. */
export function unwrapSvg(svg: string): { inner: string; box: Box } {
  const viewBox = /viewBox\s*=\s*["']([\d.\-\s]+)["']/i.exec(svg)?.[1];
  let w = 1024;
  let h = 1024;
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) { w = parts[2]; h = parts[3]; }
  }
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "").trim();
  return { inner, box: { w, h } };
}

/** Force every painted shape to one colour (mono and knockout lockups). */
function recolour(inner: string, colour: string): string {
  return inner
    .replace(/fill\s*=\s*["'][^"']*["']/gi, `fill="${colour}"`)
    .replace(/stroke\s*=\s*["'](?!none)[^"']*["']/gi, `stroke="${colour}"`);
}

function wrap(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}">${body}</svg>`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export type LockupFamily = {
  mark: string;
  horizontal: string | null;
  stacked: string | null;
  mono: string;
  knockout: string;
  wordmark_family: string | null;
};

export async function composeLockups(
  traced: string,
  tokens: any,
  companyName: string,
): Promise<LockupFamily> {
  const { inner, box } = unwrapSvg(traced);
  const mark = wrap(box.w, box.h, inner);
  const heading = tokens?.fonts?.heading;
  const ink = typeof tokens?.colors?.primary === "string" ? tokens.colors.primary : "#111111";

  const outlined = companyName ? await outlineWordmark(companyName, { family: heading, weight: 600, tracking: 10 }) : null;

  let horizontal: string | null = null;
  let stacked: string | null = null;

  if (companyName) {
    // Symbol height sets the scale; the wordmark is optically ~46% of it.
    const symbolSize = 200;
    const scale = symbolSize / Math.max(box.w, box.h);
    const symbolW = box.w * scale;
    const symbolH = box.h * scale;
    const symbol = (x: number, y: number) =>
      `<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})">${inner}</g>`;

    if (outlined) {
      const typeSize = symbolSize * 0.46;
      const typeScale = typeSize / outlined.height;
      const typeW = outlined.width * typeScale;
      const typeH = outlined.height * typeScale;
      const gap = symbolSize * 0.22;

      const hW = symbolW + gap + typeW;
      const hH = Math.max(symbolH, typeH);
      horizontal = wrap(hW, hH,
        symbol(0, (hH - symbolH) / 2) +
        `<g transform="translate(${round(symbolW + gap)} ${round((hH - typeH) / 2)}) scale(${round(typeScale)})"><path d="${outlined.d}" fill="${ink}"/></g>`,
      );

      const sW = Math.max(symbolW, typeW);
      const sH = symbolH + gap + typeH;
      stacked = wrap(sW, sH,
        symbol((sW - symbolW) / 2, 0) +
        `<g transform="translate(${round((sW - typeW) / 2)} ${round(symbolH + gap)}) scale(${round(typeScale)})"><path d="${outlined.d}" fill="${ink}"/></g>`,
      );
    } else {
      // No real typeface available — set the name in a curated stack instead of
      // dropping the wordmark entirely.
      const stack = fontStackFor(heading);
      const typeH = symbolSize * 0.34;
      const approxW = companyName.length * typeH * 0.58;
      const gap = symbolSize * 0.22;
      const hW = symbolW + gap + approxW;
      const hH = Math.max(symbolH, typeH);
      horizontal = wrap(hW, hH,
        symbol(0, (hH - symbolH) / 2) +
        `<text x="${round(symbolW + gap)}" y="${round(hH / 2 + typeH * 0.36)}" font-family="${stack}" font-size="${round(typeH)}" font-weight="600" letter-spacing="0.01em" fill="${ink}">${escapeXml(companyName)}</text>`,
      );
      const sW = Math.max(symbolW, approxW);
      const sH = symbolH + gap + typeH;
      stacked = wrap(sW, sH,
        symbol((sW - symbolW) / 2, 0) +
        `<text x="${round(sW / 2)}" y="${round(symbolH + gap + typeH * 0.86)}" text-anchor="middle" font-family="${stack}" font-size="${round(typeH)}" font-weight="600" fill="${ink}">${escapeXml(companyName)}</text>`,
      );
    }
  }

  return {
    mark,
    horizontal,
    stacked,
    mono: wrap(box.w, box.h, recolour(inner, "#111111")),
    knockout: wrap(box.w, box.h, recolour(inner, "#FFFFFF")),
    wordmark_family: outlined?.family ?? null,
  };
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] as string));
}
