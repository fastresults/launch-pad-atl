/**
 * Brand vision inputs for the Website PRD.
 *
 * The PRD used to receive the brand only as strings — hex codes, font names
 * and a logo URL. The model never saw the actual mark, so the art direction it
 * wrote was a palette application rather than an extension of the logo.
 *
 * This module fetches the real artwork (primary logo + its lockup variants +
 * the mood board tiles), rasterises SVGs so a vision model sees what a human
 * sees, and returns chat `image_url` content blocks plus the instruction that
 * tells the model what to derive from them.
 */

import { rasterizeSvg } from "./logo-raster.ts";

export type VisionImage = { label: string; dataUrl: string };

const MAX_BYTES = 3_000_000;

function b64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length || buf.byteLength > MAX_BYTES) return null;

    const looksSvg = ct.includes("svg") || /\.svg(\?|$)/i.test(url);
    if (looksSvg) {
      const svg = new TextDecoder().decode(buf);
      const png = await rasterizeSvg(svg, 768);
      return png ? `data:image/png;base64,${png}` : null;
    }
    const mime = ct.split(";")[0] || "image/png";
    if (!mime.startsWith("image/")) return null;
    return `data:${mime};base64,${b64(buf)}`;
  } catch {
    return null;
  }
}

function logoUrls(kit: Record<string, any> | null): { label: string; url: string }[] {
  const logos = Array.isArray(kit?.logos) ? kit!.logos : [];
  if (!logos.length) return [];
  const primary = logos.find((l: any) => l && l.primary) ?? logos[0];
  const out: { label: string; url: string }[] = [];
  const push = (label: string, u: any) => {
    const url = typeof u === "string" ? u : (u?.url ?? u?.public_url ?? u?.signedUrl);
    if (url && out.length < 4 && !out.some((o) => o.url === url)) out.push({ label, url: String(url) });
  };
  push("Primary logo (the committed mark)", primary?.public_url ?? primary?.url);
  const variants = primary?.variants ?? {};
  for (const v of ["horizontal", "stacked", "mono", "knockout"]) {
    if (variants?.[v]) push(`${v} lockup`, variants[v]);
  }
  return out;
}

function moodUrls(kit: Record<string, any> | null): { label: string; url: string }[] {
  const mood = Array.isArray(kit?.moodboard) ? kit!.moodboard : [];
  return mood
    .map((m: any, i: number) => {
      const url = typeof m === "string" ? m : (m?.url ?? m?.publicUrl ?? m?.signedUrl);
      if (!url) return null;
      const caption = typeof m === "object" ? (m?.caption ?? m?.angle ?? null) : null;
      return { label: `Mood board tile ${i + 1}${caption ? ` — ${caption}` : ""}`, url: String(url) };
    })
    .filter(Boolean)
    .slice(0, 6) as { label: string; url: string }[];
}

/** Fetch and encode the brand artwork the PRD model should actually look at. */
export async function collectBrandVisionImages(
  kit: Record<string, any> | null,
): Promise<VisionImage[]> {
  if (!kit) return [];
  const targets = [...logoUrls(kit), ...moodUrls(kit)];
  if (!targets.length) return [];
  const settled = await Promise.all(
    targets.map(async (t) => {
      const dataUrl = await fetchAsDataUrl(t.url);
      return dataUrl ? { label: t.label, dataUrl } : null;
    }),
  );
  return settled.filter(Boolean) as VisionImage[];
}

/**
 * The instruction paired with the images. Requires a literal, checkable block
 * in the document so the identity guard can prove the model looked.
 */
export function brandVisionInstruction(images: VisionImage[]): string {
  if (!images.length) return "";
  return [
    "\n## BRAND ARTWORK (attached as images — LOOK at them, do not guess)",
    "The images attached to this message are the venture's real logo (and its lockup variants) followed by the approved mood board tiles. Read them like a design director:",
    "- Sample the actual ink colours in the mark — name the hexes you observe, and say which one is the site's primary ink.",
    "- Read the mark's geometry: stroke weight, terminal shape, counter/negative-space rhythm, and the corner radius it implies. The site's radius scale, rule weight and grid rhythm must be derived from these, not chosen at random.",
    "- Read the lettering in the lockup: classify the letterforms (serif/sans, contrast, width, case) and choose site typography that agrees with the wordmark rather than competing with it.",
    "- Read the mood board: state the imagery grade you observe (contrast, saturation, colour temperature, grain, depth of field, subject distance) and apply that grade to every generation prompt in the Imagery Plan.",
    "",
    "In Section 1 you MUST include this block verbatim as a heading, filled in from what you actually see:",
    "",
    "### Mark-derived art direction",
    "- Ink sampled from the mark: <hexes + which is primary>",
    "- Geometry and negative space: <what the mark's construction dictates about radius, rule weight, spacing>",
    "- Letterforms observed in the lockup: <classification + the type pairing it implies>",
    "- Imagery grade observed on the mood board: <contrast, saturation, temperature, grain, depth of field>",
    "",
    "Attached images in order: " + images.map((i, n) => `${n + 1}. ${i.label}`).join("; "),
  ].join("\n");
}

/** Build the multimodal user content array for a chat-completions call. */
export function visionUserContent(text: string, images: VisionImage[]) {
  if (!images.length) return text;
  return [
    { type: "text", text },
    ...images.map((i) => ({ type: "image_url", image_url: { url: i.dataUrl } })),
  ];
}
