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

/** Wide artwork is a horizontal lockup; everything else is judged by the slot. */
export const HORIZONTAL_ASPECT = 2.2;

/**
 * Reconcile what the founder said with what the file measures.
 *
 * Only the horizontal-vs-not axis is decidable from geometry (a symbol and a
 * stacked lockup can share a box), so that is the only conflict corrected.
 * Everything else keeps the founder's intent and just records the measurement.
 */
export function reconcileSlot(
  chosen: LogoVariant,
  measurement: Measurement,
): { variant: LogoVariant; form: LogoForm; tone: LogoTone; moved: boolean; reason: string | null } {
  const { form, tone } = formToneOf(chosen);
  if (!measurement) return { variant: chosen, form, tone, moved: false, reason: null };
  const a = measurement.aspect;

  if (form === "horizontal" && a < 1.6) {
    const variant = slotFor("stacked", tone);
    return {
      variant,
      form: "stacked",
      tone,
      moved: true,
      reason: `That artwork is ${a.toFixed(2)}:1 — it reads as a stacked lockup, so it was filed under Stacked.`,
    };
  }
  if (form === "stacked" && a >= 2.4) {
    const variant = slotFor("horizontal", tone);
    return {
      variant,
      form: "horizontal",
      tone,
      moved: true,
      reason: `That artwork is ${a.toFixed(2)}:1 — it reads as a horizontal lockup, so it was filed under Horizontal.`,
    };
  }
  return { variant: chosen, form, tone, moved: false, reason: null };
}

/** Classification used for display and for entries with no explicit slot. */
export function formFromAspect(aspect: number): LogoForm {
  if (aspect >= HORIZONTAL_ASPECT) return "horizontal";
  if (aspect >= 1.15) return "stacked";
  return "symbol";
}
