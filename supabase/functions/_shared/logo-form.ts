// One vocabulary for logo artwork: FORM x TONE.
//
//   form: symbol | horizontal | stacked | wordmark   (what shape the lockup is)
//   tone: colour | inverse                           (which ground it is drawn for)
//
// Historically the set was described by slot names that mixed the two ideas
// ("primary" meant *horizontal, colour and also the default*), so nothing could
// tell a symbol apart from a full horizontal lockup. Slots are kept as the
// storage key for backwards compatibility, but every entry now also carries the
// measured form/tone/aspect so downstream placement never has to guess.

export type LogoForm = "symbol" | "horizontal" | "stacked" | "wordmark";
export type LogoTone = "colour" | "inverse";

export const LOGO_VARIANTS = [
  "primary",
  "reversed",
  "stacked",
  "stacked_reversed",
  "icon",
  "icon_reversed",
  "wordmark",
  "wordmark_reversed",
] as const;

export type LogoVariant = (typeof LOGO_VARIANTS)[number];

const SLOT_MAP: Record<LogoVariant, { form: LogoForm; tone: LogoTone }> = {
  primary: { form: "horizontal", tone: "colour" },
  reversed: { form: "horizontal", tone: "inverse" },
  stacked: { form: "stacked", tone: "colour" },
  stacked_reversed: { form: "stacked", tone: "inverse" },
  icon: { form: "symbol", tone: "colour" },
  icon_reversed: { form: "symbol", tone: "inverse" },
  wordmark: { form: "wordmark", tone: "colour" },
  wordmark_reversed: { form: "wordmark", tone: "inverse" },
};

export function formToneOf(variant: string | null | undefined): { form: LogoForm; tone: LogoTone } {
  const key = String(variant ?? "primary") as LogoVariant;
  return SLOT_MAP[key] ?? SLOT_MAP.primary;
}

export function slotFor(form: LogoForm, tone: LogoTone): LogoVariant {
  for (const [slot, ft] of Object.entries(SLOT_MAP)) {
    if (ft.form === form && ft.tone === tone) return slot as LogoVariant;
  }
  return "primary";
}

export const FORM_LABEL: Record<LogoForm, string> = {
  symbol: "Symbol",
  horizontal: "Horizontal lockup",
  stacked: "Stacked lockup",
  wordmark: "Wordmark",
};

/* ---------------- measurement ---------------- */

export type Measurement = { width: number; height: number; aspect: number } | null;

const num = (v: string | undefined): number => {
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Intrinsic box of an SVG: viewBox first, then width/height attributes. */
export function measureSvg(svg: string): Measurement {
  const vb = /viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)/i.exec(svg);
  if (vb) {
    const w = parseFloat(vb[3]);
    const h = parseFloat(vb[4]);
    if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
  }
  const open = /<svg[^>]*>/i.exec(svg)?.[0] ?? "";
  const w = num(/\swidth\s*=\s*["']([\d.]+)/i.exec(open)?.[1]);
  const h = num(/\sheight\s*=\s*["']([\d.]+)/i.exec(open)?.[1]);
  if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
  return null;
}

/** PNG / JPEG / WebP header read — no decoding, so it is effectively free. */
export function measureRaster(bytes: Uint8Array): Measurement {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // PNG
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const w = dv.getUint32(16);
    const h = dv.getUint32(20);
    if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
  }
  // JPEG
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      const len = dv.getUint16(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = dv.getUint16(i + 5);
        const w = dv.getUint16(i + 7);
        if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
      }
      if (len <= 0) break;
      i += 2 + len;
    }
  }
  // WebP (VP8X / VP8 / VP8L)
  if (bytes.length > 30 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF") {
    const fourcc = String.fromCharCode(...bytes.subarray(12, 16));
    if (fourcc === "VP8X") {
      const w = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
      const h = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
      if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
    }
    if (fourcc === "VP8 " && bytes.length > 30) {
      const w = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
      const h = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
      if (w > 0 && h > 0) return { width: w, height: h, aspect: w / h };
    }
  }
  return null;
}

export function measureArtwork(bytes: Uint8Array, contentType: string): Measurement {
  if (contentType.includes("svg")) {
    try {
      return measureSvg(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }
  try {
    return measureRaster(bytes);
  } catch {
    return null;
  }
}

/** Wide artwork is a horizontal lockup; everything else is judged by the ink. */
export const HORIZONTAL_ASPECT = 2.2;

/* ---------------- ink: shape count and tone ---------------- */

/** Drawn shapes in an SVG. A bare symbol has a handful; a lockup has dozens. */
export function countShapes(svg: string): number {
  return (svg.match(/<(path|polygon|polyline|circle|ellipse|rect|line|text|tspan|use|image)\b/gi) ?? []).length;
}

/**
 * A wordmark is present when the artwork carries letterforms, and letterforms
 * mean many small shapes. Geometry alone cannot separate a stacked lockup from
 * a bare symbol — both sit in a near-square box — but shape count can.
 */
export const WORDMARK_SHAPE_FLOOR = 8;

const HEX = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;

function hexLuminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Which ground the artwork is drawn for, read from its own ink.
 *
 * Filenames lie — "bw" says nothing about tone, and a mark drawn in near-white
 * filed as colour gets painted white-on-white. Mean ink luminance does not lie:
 * light ink exists to sit on a dark ground.
 */
export function inkTone(svg: string): { tone: LogoTone; luminance: number } | null {
  const body = svg.replace(/<!--[\s\S]*?-->/g, "");
  const hits = body.match(HEX) ?? [];
  const lums = hits.map(hexLuminance).filter((n) => Number.isFinite(n));
  if (!lums.length) return null;
  const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
  return { tone: mean >= 0.75 ? "inverse" : "colour", luminance: Math.round(mean * 1000) / 1000 };
}

export type Classification = {
  form: LogoForm;
  tone: LogoTone;
  aspect: number | null;
  width: number | null;
  height: number | null;
  shapes: number | null;
  /** True when form or tone was guessed rather than read from the artwork. */
  inferred: boolean;
};

/**
 * What a file actually is: form from ink + box, tone from ink.
 *
 * `hint` carries the founder's intent (chosen slot or filename hints) and is
 * only consulted where the artwork itself is inconclusive — rasters, where
 * shapes cannot be counted, and mid-tone palettes.
 */
export function classifyArtwork(
  bytes: Uint8Array,
  contentType: string,
  hint?: { form?: LogoForm | null; tone?: LogoTone | null },
): Classification {
  const measurement = measureArtwork(bytes, contentType);
  const aspect = measurement?.aspect ?? null;
  const isSvg = contentType.includes("svg");
  let svg = "";
  if (isSvg) {
    try {
      svg = new TextDecoder().decode(bytes);
    } catch {
      svg = "";
    }
  }

  const shapes = svg ? countShapes(svg) : null;
  const ink = svg ? inkTone(svg) : null;

  let inferred = false;

  let tone: LogoTone;
  if (ink) tone = ink.tone;
  else {
    tone = hint?.tone ?? "colour";
    inferred = true;
  }

  let form: LogoForm;
  if (shapes != null && aspect != null) {
    if (shapes < WORDMARK_SHAPE_FLOOR) form = "symbol";
    else if (hint?.form === "wordmark") form = "wordmark";
    else form = aspect >= HORIZONTAL_ASPECT ? "horizontal" : "stacked";
  } else if (aspect != null) {
    // Raster: no ink to count, so fall back to the aspect bands and say so.
    form = hint?.form ?? formFromAspect(aspect);
    inferred = true;
  } else {
    form = hint?.form ?? "horizontal";
    inferred = true;
  }

  return {
    form,
    tone,
    aspect: aspect != null ? Math.round(aspect * 1000) / 1000 : null,
    width: measurement?.width ?? null,
    height: measurement?.height ?? null,
    shapes,
    inferred,
  };
}

/**
 * Reconcile what the founder said with what the file actually is.
 *
 * Both axes are now measurable — form from shape count plus box, tone from ink
 * luminance — so both are corrected, and every correction is reported rather
 * than applied silently.
 */
export function reconcileSlot(
  chosen: LogoVariant,
  measurement: Measurement | Classification | null,
): {
  variant: LogoVariant;
  form: LogoForm;
  tone: LogoTone;
  moved: boolean;
  reason: string | null;
  inferred: boolean;
} {
  const intent = formToneOf(chosen);
  if (!measurement) {
    return { variant: chosen, ...intent, moved: false, reason: null, inferred: true };
  }

  // A bare Measurement (no `form` field) keeps the old geometry-only behaviour.
  const cls: Classification =
    "form" in measurement
      ? (measurement as Classification)
      : {
          // Geometry only ever splits horizontal from stacked — a symbol or
          // wordmark slot is the founder's word and is left alone.
          form:
            intent.form === "stacked" && (measurement as Measurement)!.aspect >= 2.4
              ? "horizontal"
              : intent.form === "horizontal" && (measurement as Measurement)!.aspect < 1.6
              ? "stacked"
              : intent.form,
          tone: intent.tone,
          aspect: (measurement as Measurement)!.aspect,
          width: (measurement as Measurement)!.width,
          height: (measurement as Measurement)!.height,
          shapes: null,
          inferred: true,
        };

  const form = cls.form;
  const tone = cls.tone;
  const variant = slotFor(form, tone);
  const moved = variant !== chosen;

  let reason: string | null = null;
  if (moved) {
    const bits: string[] = [];
    if (form !== intent.form) {
      bits.push(
        cls.shapes != null && cls.shapes < WORDMARK_SHAPE_FLOOR
          ? "it carries no wordmark, so it reads as a symbol"
          : `it is ${cls.aspect?.toFixed(2) ?? "?"}:1 with a wordmark, so it reads as a ${FORM_LABEL[form].toLowerCase()}`,
      );
    }
    if (tone !== intent.tone) {
      bits.push(tone === "inverse" ? "it is drawn in light ink, for dark grounds" : "it is drawn in dark ink, for light grounds");
    }
    reason = `That artwork was filed under ${FORM_LABEL[form]} · ${tone === "inverse" ? "Inverse" : "Colour"} — ${bits.join(", and ")}.`;
  }

  return { variant, form, tone, moved, reason, inferred: cls.inferred };
}

/** Classification used for display and for entries with no explicit slot. */
export function formFromAspect(aspect: number): LogoForm {
  if (aspect >= HORIZONTAL_ASPECT) return "horizontal";
  if (aspect >= 1.15) return "stacked";
  return "symbol";
}

