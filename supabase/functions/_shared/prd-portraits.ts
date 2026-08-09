/**
 * PRD portraits — the Website PRD renders its own people shots instead of
 * asking a downstream builder to do it.
 *
 * Prompt-only enforcement kept failing: Section 4b described a portrait, the
 * guard checked the recipe text was present, and the testimonial block still
 * shipped as three empty cards. Here we parse the 4b imagery table, render the
 * portrait rows through the image gateway, QA them, upload the originals to the
 * private doc-image bucket and splice permanent signed URLs back into the
 * markdown.
 */

import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { craftPrompt } from "./image-craft.ts";

const BUCKET = "venture-doc-images";
const MAX_PORTRAITS = 4;
/** Signed URLs embedded in a document need to outlive the document. */
const URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

type Row = { line: string; cells: string[] };

function tableRows(raw: string): Row[] {
  return raw.split("\n")
    .map((line) => ({ line, cells: line.trim().split("|").slice(1, -1).map((c) => c.trim()) }))
    .filter((r) =>
      r.line.trim().startsWith("|") &&
      r.cells.length >= 5 &&
      !/^\|[\s\-:|]+\|$/.test(r.line.trim())
    );
}

const PORTRAIT_RE = /\b(portrait|headshot|testimonial|founder|team member|people|person)\b/i;

/** Rows in the imagery plan whose subject is a human being. */
export function selectPortraitRows(raw: string): Row[] {
  const rows = tableRows(raw).filter((r) => PORTRAIT_RE.test(r.line));
  // Drop header rows ("Visual type", "Alt text" …).
  return rows
    .filter((r) => !/generation prompt/i.test(r.line))
    .slice(0, MAX_PORTRAITS);
}

function longestCell(cells: string[]): string {
  return cells.reduce((a, b) => (b.length > a.length ? b : a), "");
}

function altFor(cells: string[], prompt: string): string {
  const candidates = cells.filter((c) => c !== prompt && c.split(/\s+/).length >= 4);
  return (candidates.sort((a, b) => b.length - a.length)[0] ?? "Portrait").slice(0, 160);
}

function pngStats(bytes: Uint8Array): { w: number; h: number; centerLuma: number } | null {
  try {
    const png = PNG.sync.read(Buffer.from(bytes));
    let sum = 0;
    let n = 0;
    const x0 = Math.floor(png.width * 0.3), x1 = Math.floor(png.width * 0.7);
    const y0 = Math.floor(png.height * 0.15), y1 = Math.floor(png.height * 0.6);
    for (let y = y0; y < y1; y += 3) {
      for (let x = x0; x < x1; x += 3) {
        const i = (png.width * y + x) << 2;
        sum += (0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]) / 255;
        n++;
      }
    }
    return { w: png.width, h: png.height, centerLuma: n ? sum / n : 0 };
  } catch {
    return null;
  }
}

/** Cheap, deterministic portrait QA. Returns a reason string when it fails. */
export function portraitQA(bytes: Uint8Array): string | null {
  if (bytes.length < 40_000) return "image too small / likely blank";
  const s = pngStats(bytes);
  if (!s) return null; // non-PNG payload: accept, the gateway already validated it
  if (s.w < 640 || s.h < 640) return `too low-res (${s.w}x${s.h})`;
  if (s.centerLuma < 0.28) return `face region too dark (${Math.round(s.centerLuma * 100)}% luminance)`;
  if (s.centerLuma > 0.82) return `face region blown out (${Math.round(s.centerLuma * 100)}% luminance)`;
  return null;
}

function extractB64(aiJson: any): string | null {
  const msg = aiJson?.choices?.[0]?.message;
  const fromUrl = (url: unknown) => {
    if (typeof url !== "string") return null;
    const m = url.match(/^data:[^;]+;base64,(.+)$/);
    return m ? m[1] : null;
  };
  for (const im of msg?.images ?? []) {
    const b = fromUrl(im?.image_url?.url ?? im?.url);
    if (b) return b;
  }
  if (Array.isArray(msg?.content)) {
    for (const block of msg.content) {
      const b = fromUrl(block?.image_url?.url);
      if (b) return b;
    }
  }
  return null;
}

async function renderPortrait(
  apiKey: string,
  prompt: string,
): Promise<{ bytes: Uint8Array } | { error: string }> {
  let lastError = "no image returned";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const attemptPrompt = attempt === 1
      ? prompt
      : `${prompt}\n\nRETRY (previous render rejected: ${lastError}). Deliver a photographic, studio-lit environmental portrait of a real-looking human with visible skin texture and catchlights, face at 45–60% luminance. No text, no watermark, no CGI sheen.`;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image",
          messages: [{ role: "user", content: attemptPrompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        lastError = `gateway ${res.status}`;
        await res.text();
        if (res.status === 429 || res.status === 402) return { error: lastError };
        continue;
      }
      const b64 = extractB64(await res.json());
      if (!b64) {
        lastError = "model returned no image payload";
        continue;
      }
      const bytes = decodeBase64(b64);
      const problem = portraitQA(bytes);
      if (problem) {
        lastError = problem;
        continue;
      }
      return { bytes };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { error: lastError };
}

/**
 * Render every portrait row in the PRD's imagery plan and splice the finished
 * images back into the markdown. Never throws — a failure leaves the row as a
 * prompt flagged for manual generation.
 */
export async function renderPrdPortraits(
  admin: any,
  raw: string,
  opts: { apiKey: string; ownerId: string; snapshotId: string; documentType?: string },
): Promise<string> {
  const rows = selectPortraitRows(raw);
  if (!rows.length) return raw;

  const docType = opts.documentType ?? "website_prd";
  const gallery: string[] = [];
  let out = raw;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const promptCell = longestCell(row.cells);
    if (promptCell.split(/\s+/).length < 8) continue;
    const alt = altFor(row.cells, promptCell);
    const prompt = craftPrompt("portrait", promptCell.replace(/<[^>]+>/g, " "));

    const result = await renderPortrait(opts.apiKey, prompt);
    if ("error" in result) {
      console.warn("[prd-portraits] render failed", result.error);
      out = out.replace(
        row.line,
        `${row.line.replace(/\s*\|\s*$/, "")} <br />**Generate manually** (auto-render failed: ${result.error}) |`,
      );
      continue;
    }

    const path = `${opts.ownerId}/${opts.snapshotId}/${docType}/portraits/${Date.now()}-${i}.png`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, result.bytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) {
      console.warn("[prd-portraits] upload failed", upErr.message);
      continue;
    }
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, URL_TTL_SECONDS);
    const url = signed?.signedUrl ?? signed?.signedURL ?? null;
    if (!url) continue;

    out = out.replace(
      row.line,
      `${row.line.replace(/\s*\|\s*$/, "")} <br />**Rendered:** <img src="${url}" alt="${
        alt.replace(/"/g, "'")
      }" width="480" /> |`,
    );
    gallery.push(
      [
        `**Portrait ${gallery.length + 1}** — ${alt}`,
        "",
        `<img src="${url}" alt="${alt.replace(/"/g, "'")}" width="640" />`,
        "",
        `Prompt used: ${prompt}`,
      ].join("\n"),
    );
  }

  if (!gallery.length) return out;

  const block = [
    "",
    "### 4c. Rendered portraits (ship these files)",
    "",
    "These photographs were rendered and QA'd with this PRD. Download them, place them in `src/assets/`, and use them in the social-proof, founder and team slots exactly as specified. Do not substitute stock or re-generate unless a shot fails review.",
    "",
    ...gallery.flatMap((g) => [g, ""]),
  ].join("\n");

  // Insert immediately before Section 5, or append.
  const m = out.match(/\n##\s*5[.)]?\s/);
  if (m && m.index != null) return out.slice(0, m.index) + "\n" + block + out.slice(m.index);
  return `${out}\n${block}\n`;
}
