// Pixel sampler for the generated photographic plate.
// Lets the poster compositor pick ink colors, scrim strength and logo corners
// from what is ACTUALLY in the image rather than from the brand plan alone.

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";

export type RegionStats = {
  /** Mean sRGB of the sampled region. */
  rgb: [number, number, number];
  hex: string;
  /** WCAG relative luminance of the mean color, 0..1. */
  lum: number;
  /** Mean per-channel standard deviation — how "busy" the region is. */
  variance: number;
};

function toLin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relLuminance(r: number, g: number, b: number): number {
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function contrastOf(lumA: number, lumB: number): number {
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

function hex2(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

export class PlateSampler {
  private png: any | null = null;
  readonly width: number;
  readonly height: number;

  private constructor(png: any | null, w: number, h: number) {
    this.png = png;
    this.width = w;
    this.height = h;
  }

  static from(bytes: Uint8Array | null | undefined, fallbackW: number, fallbackH: number): PlateSampler {
    if (!bytes || bytes.byteLength === 0) return new PlateSampler(null, fallbackW, fallbackH);
    // Decoding is the single most expensive CPU step in the poster pipeline.
    // Refuse absurdly large plates rather than risk a runtime kill — the
    // compositor falls back to plan colors when sampling is unavailable.
    if (bytes.byteLength > 12_000_000) {
      console.warn(`[plate-sample] skipping decode, plate too large (${bytes.byteLength} bytes)`);
      return new PlateSampler(null, fallbackW, fallbackH);
    }
    const t0 = Date.now();
    try {
      const png = PNG.sync.read(Buffer.from(bytes));
      console.log(`[plate-sample] decoded ${png.width}x${png.height} in ${Date.now() - t0}ms`);
      return new PlateSampler(png, png.width, png.height);
    } catch (e) {
      console.warn("[plate-sample] decode failed", e instanceof Error ? e.message : e);
      return new PlateSampler(null, fallbackW, fallbackH);
    }
  }


  get available(): boolean {
    return !!this.png;
  }

  /**
   * Mean color + busyness of a rectangle expressed in the CALLER's canvas
   * coordinates (scaled to the decoded plate if the sizes differ).
   */
  sample(x: number, y: number, w: number, h: number, canvasW: number, canvasH: number): RegionStats | null {
    const png = this.png;
    if (!png) return null;
    const sx = png.width / Math.max(1, canvasW);
    const sy = png.height / Math.max(1, canvasH);
    const x0 = Math.max(0, Math.floor(x * sx));
    const y0 = Math.max(0, Math.floor(y * sy));
    const x1 = Math.min(png.width, Math.ceil((x + w) * sx));
    const y1 = Math.min(png.height, Math.ceil((y + h) * sy));
    if (x1 <= x0 || y1 <= y0) return null;

    const stepX = Math.max(1, Math.floor((x1 - x0) / 40));
    const stepY = Math.max(1, Math.floor((y1 - y0) / 40));
    let n = 0;
    let sr = 0, sg = 0, sb = 0;
    let qr = 0, qg = 0, qb = 0;
    for (let py = y0; py < y1; py += stepY) {
      for (let px = x0; px < x1; px += stepX) {
        const i = (png.width * py + px) << 2;
        const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
        sr += r; sg += g; sb += b;
        qr += r * r; qg += g * g; qb += b * b;
        n++;
      }
    }
    if (!n) return null;
    const mr = sr / n, mg = sg / n, mb = sb / n;
    const sd = (q: number, m: number) => Math.sqrt(Math.max(0, q / n - m * m));
    return {
      rgb: [mr, mg, mb],
      hex: `#${hex2(mr)}${hex2(mg)}${hex2(mb)}`.toUpperCase(),
      lum: relLuminance(mr, mg, mb),
      variance: (sd(qr, mr) + sd(qg, mg) + sd(qb, mb)) / 3,
    };
  }
}
