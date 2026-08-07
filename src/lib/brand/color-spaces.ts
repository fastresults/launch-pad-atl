// Deterministic colour-space maths for brand collateral.
// Print collateral needs CMYK and a Pantone reference, not just hex.

export type ColorSpaces = {
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  pantone: string;
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || "#000000").replace(/^#/, "").slice(0, 6).padEnd(6, "0");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

export function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k >= 1) return [0, 0, 0, 100];
  const c = (1 - rr - k) / (1 - k);
  const m = (1 - gg - k) / (1 - k);
  const y = (1 - bb - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

// Compact Pantone Solid Coated reference set. Nearest match in Lab space is a
// good-enough spec line for a founder's print vendor to start from.
const PANTONE: Array<[string, string]> = [
  ["Black 6 C", "#101820"], ["Cool Gray 11 C", "#53565A"], ["Cool Gray 5 C", "#B1B3B3"],
  ["Warm Gray 2 C", "#CBC4BC"], ["White", "#FFFFFF"], ["Bright White", "#F7F7F7"],
  ["185 C", "#E4002B"], ["199 C", "#D50032"], ["485 C", "#DA291C"], ["1795 C", "#D22630"],
  ["032 C", "#EF3340"], ["Warm Red C", "#F9423A"], ["021 C", "#FE5000"], ["165 C", "#FF6720"],
  ["1585 C", "#FF8200"], ["137 C", "#FFA300"], ["123 C", "#FFC72C"], ["109 C", "#FFD100"],
  ["Yellow C", "#FEDD00"], ["396 C", "#E1E000"], ["382 C", "#C4D600"], ["375 C", "#97D700"],
  ["361 C", "#43B02A"], ["347 C", "#009639"], ["356 C", "#007A33"], ["343 C", "#115740"],
  ["3275 C", "#00C1A2"], ["3252 C", "#4FE0CE"], ["319 C", "#2DCCD3"], ["3115 C", "#00C1D5"],
  ["306 C", "#00B5E2"], ["2995 C", "#00A3E0"], ["300 C", "#005EB8"], ["286 C", "#0033A0"],
  ["281 C", "#00205B"], ["2758 C", "#001A70"], ["2685 C", "#330072"], ["527 C", "#6D2077"],
  ["266 C", "#753BBD"], ["2592 C", "#9B26B6"], ["245 C", "#E56DB1"], ["232 C", "#E93CAC"],
  ["219 C", "#DA1884"], ["213 C", "#E31C79"], ["705 C", "#F9DDE1"], ["7527 C", "#D6D2C4"],
  ["4685 C", "#E3CDA4"], ["465 C", "#B9975B"], ["7562 C", "#A08629"], ["876 C", "#8B6F4E"],
  ["4625 C", "#4E3629"], ["476 C", "#623B2A"], ["7530 C", "#A39382"], ["Cool Gray 1 C", "#D9D9D6"],
];

function srgbToLab(rgb: [number, number, number]): [number, number, number] {
  const lin = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = lin;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 1.0;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function nearestPantone(hex: string): string {
  const lab = srgbToLab(hexToRgb(hex));
  let best = PANTONE[0][0];
  let bestD = Infinity;
  for (const [name, ref] of PANTONE) {
    const l2 = srgbToLab(hexToRgb(ref));
    const d = (lab[0] - l2[0]) ** 2 + (lab[1] - l2[1]) ** 2 + (lab[2] - l2[2]) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return `PANTONE ${best}`;
}

export function colorSpaces(hex: string): ColorSpaces {
  const rgb = hexToRgb(hex);
  return {
    hex: `#${hex.replace(/^#/, "").slice(0, 6).toUpperCase()}`,
    rgb,
    cmyk: rgbToCmyk(...rgb),
    pantone: nearestPantone(hex),
  };
}

export function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick black or white ink for legible type on a given background. */
export function inkOn(hex: string): string {
  return relLuminance(hex) > 0.45 ? "#111111" : "#FFFFFF";
}
