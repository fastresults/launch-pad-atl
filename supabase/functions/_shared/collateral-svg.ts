// Deterministic brand collateral compositor.
//
// Business cards, letterhead, envelopes, invoices and guideline pages need
// exact type, alignment and real vector logo ink — so none of this is drawn by
// an image model. Every page is assembled as SVG from the LOCKED brand kit and
// rasterised, the same approach the editorial poster compositor uses.

import { colorSpaces, inkOn } from "./color-spaces.ts";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const fontCache = new Map<string, string | null>();

/** Fetch a Google font as an embedded base64 woff2 @font-face block. */
async function embedFont(family: string, weight: number, alias: string): Promise<string> {
  const key = `${family}:${weight}`;
  let data = fontCache.get(key) ?? null;
  if (!fontCache.has(key)) {
    try {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weight}&display=swap`,
        { headers: { "User-Agent": UA } },
      );
      if (css.ok) {
        const text = await css.text();
        const blocks = text.split("@font-face").filter((b) => b.includes("url("));
        const latin = blocks.find((b) => /unicode-range:[^;]*U\+0000/i.test(b)) ?? blocks[blocks.length - 1];
        const url = latin?.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
        if (url) {
          const bin = await fetch(url);
          if (bin.ok) {
            const bytes = new Uint8Array(await bin.arrayBuffer());
            let s = "";
            for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
            data = btoa(s);
          }
        }
      }
    } catch { /* fall back to system stack */ }
    fontCache.set(key, data);
  }
  if (!data) return "";
  return `@font-face{font-family:'${alias}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`;
}

export type CollateralCtx = {
  company: string;
  tagline?: string | null;
  person: {
    name?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
  };
  colors: Record<string, string>;
  fonts: { heading?: string | null; body?: string | null };
  /** Traced vector mark (preferred) — inlined so the ink stays vector. */
  logoSvg?: string | null;
  voice?: string | null;
};

export const COLLATERAL_KINDS = [
  "business_card",
  "letterhead",
  "envelope",
  "notecard",
  "email_signature",
  "invoice",
  "proposal",
  "presentation",
  "guidelines",
  "design_tokens",
] as const;
export type CollateralKind = typeof COLLATERAL_KINDS[number];

export const KIND_LABELS: Record<CollateralKind, string> = {
  business_card: "Business card",
  letterhead: "Letterhead",
  envelope: "#10 envelope",
  notecard: "Notecard",
  email_signature: "Email signature",
  invoice: "Invoice template",
  proposal: "Proposal template",
  presentation: "Presentation template",
  guidelines: "Brand guidelines",
  design_tokens: "Design tokens",
};

export type Page = { name: string; svg: string; width: number; height: number };

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function palette(ctx: CollateralCtx) {
  const c = ctx.colors ?? {};
  const primary = c.primary || c.accent || "#111827";
  const bg = c.bg || c.surface || "#FFFFFF";
  const fg = c.fg || c.text || "#111827";
  const accent = c.accent || c.secondary || primary;
  const muted = c.muted || "#6B7280";
  return { primary, bg, fg, accent, muted };
}

/** Inline the vector mark, scaled to fit a box, tinted to one ink colour. */
function markAt(
  ctx: CollateralCtx,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  ink: string | null,
): string {
  const svg = ctx.logoSvg;
  if (!svg) return "";
  const vb = /viewBox\s*=\s*["']([\d.\-\s,]+)["']/i.exec(svg)?.[1];
  let vw = 1024, vh = 1024;
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) { vw = p[2]; vh = p[3]; }
  }
  let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "").trim();
  // Drop full-bleed background plates so the mark sits on the paper.
  inner = inner.replace(/<rect\b[^>]*\bwidth\s*=\s*["']?(100%|\s*0*(?:1024|512|256)(?:px)?)["']?[^>]*\/?>(?:<\/rect>)?/gi, "");
  if (ink) {
    inner = inner
      .replace(/fill\s*=\s*["'](?!none)[^"']*["']/gi, `fill="${ink}"`)
      .replace(/stroke\s*=\s*["'](?!none)[^"']*["']/gi, `stroke="${ink}"`);
  }
  const s = Math.min(boxW / vw, boxH / vh);
  const dx = x + (boxW - vw * s) / 2;
  const dy = y + (boxH - vh * s) / 2;
  return `<g transform="translate(${r(dx)} ${r(dy)}) scale(${r(s, 5)})">${inner}</g>`;
}

function wordmark(ctx: CollateralCtx, x: number, y: number, size: number, fill: string, anchor = "start") {
  return `<text x="${r(x)}" y="${r(y)}" font-family="BrandHead" font-weight="700" font-size="${r(size)}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${r(size * -0.01)}">${esc(ctx.company)}</text>`;
}

function r(n: number, p = 2): number {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

function line(text: string, x: number, y: number, size: number, fill: string, opts: { weight?: number; family?: string; anchor?: string; tracking?: number; opacity?: number } = {}) {
  const { weight = 400, family = "BrandBody", anchor = "start", tracking = 0, opacity = 1 } = opts;
  return `<text x="${r(x)}" y="${r(y)}" font-family="${family}" font-weight="${weight}" font-size="${r(size)}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${r(tracking)}" opacity="${opacity}">${esc(text)}</text>`;
}

/** Naive greedy wrap using an average glyph-width estimate. */
function wrapText(text: string, size: number, maxWidth: number): string[] {
  const per = size * 0.52;
  const max = Math.max(8, Math.floor(maxWidth / per));
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) { out.push(cur); cur = w; } else { cur = next; }
  }
  if (cur) out.push(cur);
  return out;
}

function paragraph(text: string, x: number, y: number, size: number, width: number, fill: string, leading = 1.55, maxLines = 40) {
  return wrapText(text, size, width)
    .slice(0, maxLines)
    .map((l, i) => line(l, x, y + i * size * leading, size, fill))
    .join("");
}

function page(width: number, height: number, css: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><style>${css}</style></defs>${body}</svg>`;
}

// ── templates ───────────────────────────────────────────────────────────────

function businessCard(ctx: CollateralCtx, css: string): Page[] {
  const W = 1050, H = 600, M = 72; // 3.5 × 2in at 300dpi
  const { primary, bg, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const frontInk = inkOn(primary);

  const front = page(W, H, css, [
    `<rect width="${W}" height="${H}" fill="${primary}"/>`,
    markAt(ctx, W / 2 - 130, H / 2 - 150, 260, 180, frontInk),
    wordmark(ctx, W / 2, H / 2 + 110, 54, frontInk, "middle"),
    ctx.tagline ? line(ctx.tagline, W / 2, H / 2 + 152, 22, frontInk, { anchor: "middle", opacity: 0.75, tracking: 2 }) : "",
  ].join(""));

  const rows = [p.email, p.phone, p.website, p.address].filter(Boolean) as string[];
  const back = page(W, H, css, [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    `<rect x="0" y="0" width="14" height="${H}" fill="${primary}"/>`,
    markAt(ctx, W - M - 120, M - 6, 120, 120, primary),
    line(p.name || ctx.company, M, M + 66, 44, fg, { family: "BrandHead", weight: 700 }),
    p.title ? line(p.title, M, M + 108, 24, muted, { tracking: 1.6 }) : "",
    ...rows.map((t, i) => line(t, M, H - M - (rows.length - 1 - i) * 40, 24, fg)),
  ].join(""));

  return [
    { name: "business-card-front", svg: front, width: W, height: H },
    { name: "business-card-back", svg: back, width: W, height: H },
  ];
}

function letterhead(ctx: CollateralCtx, css: string): Page[] {
  const W = 1275, H = 1650, M = 110; // US Letter at 150dpi
  const { primary, bg, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const footer = [p.website, p.email, p.phone].filter(Boolean).join("   ·   ");
  const body = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    `<rect x="0" y="0" width="${W}" height="10" fill="${primary}"/>`,
    markAt(ctx, M, M, 110, 110, primary),
    wordmark(ctx, M + 132, M + 66, 40, fg),
    ctx.tagline ? line(ctx.tagline, M + 134, M + 96, 18, muted, { tracking: 1.4 }) : "",
    `<line x1="${M}" y1="${M + 160}" x2="${W - M}" y2="${M + 160}" stroke="${primary}" stroke-width="2" opacity="0.35"/>`,
    paragraph(
      "Date\n\nRecipient name\nCompany\nStreet address\n\nDear ______,",
      M, M + 230, 22, W - M * 2, muted, 1.6, 8,
    ),
    paragraph(
      "Body copy sits here. Keep paragraphs short and specific. This template is set in your brand typefaces at your locked sizes, so anything typed into it stays on brand.",
      M, M + 400, 22, W - M * 2, fg, 1.7, 12,
    ),
    `<line x1="${M}" y1="${H - 130}" x2="${W - M}" y2="${H - 130}" stroke="${primary}" stroke-width="1" opacity="0.3"/>`,
    line(footer, W / 2, H - 92, 18, muted, { anchor: "middle", tracking: 1.2 }),
  ].join("");
  return [{ name: "letterhead", svg: page(W, H, css, body), width: W, height: H }];
}

function envelope(ctx: CollateralCtx, css: string): Page[] {
  const W = 1425, H = 619; // #10 at 150dpi
  const { primary, bg, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const body = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    `<rect x="0" y="${H - 12}" width="${W}" height="12" fill="${primary}"/>`,
    markAt(ctx, 70, 62, 84, 84, primary),
    line(ctx.company, 172, 100, 30, fg, { family: "BrandHead", weight: 700 }),
    p.address ? paragraph(p.address, 172, 132, 18, 520, muted, 1.5, 3) : "",
    `<rect x="${W - 250}" y="56" width="180" height="120" fill="none" stroke="${muted}" stroke-width="2" stroke-dasharray="8 8" opacity="0.5"/>`,
    line("STAMP", W - 160, 122, 16, muted, { anchor: "middle", tracking: 3, opacity: 0.6 }),
  ].join("");
  return [{ name: "envelope-no10", svg: page(W, H, css, body), width: W, height: H }];
}

function notecard(ctx: CollateralCtx, css: string): Page[] {
  const W = 1050, H = 750; // A2 notecard at 150dpi
  const { primary, bg, fg, muted } = palette(ctx);
  const body = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    markAt(ctx, W / 2 - 70, 90, 140, 110, primary),
    wordmark(ctx, W / 2, 250, 40, fg, "middle"),
    ctx.tagline ? line(ctx.tagline, W / 2, 286, 18, muted, { anchor: "middle", tracking: 2 }) : "",
    `<line x1="${W / 2 - 90}" y1="330" x2="${W / 2 + 90}" y2="330" stroke="${primary}" stroke-width="2"/>`,
    ...[0, 1, 2, 3].map((i) => `<line x1="120" y1="${420 + i * 70}" x2="${W - 120}" y2="${420 + i * 70}" stroke="${muted}" stroke-width="1" opacity="0.25"/>`),
  ].join("");
  return [{ name: "notecard", svg: page(W, H, css, body), width: W, height: H }];
}

function emailSignature(ctx: CollateralCtx, css: string): Page[] {
  const W = 1200, H = 360;
  const { primary, bg, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const rows = [p.email, p.phone, p.website].filter(Boolean) as string[];
  const body = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    markAt(ctx, 60, 110, 140, 140, primary),
    `<rect x="240" y="96" width="4" height="168" fill="${primary}"/>`,
    line(p.name || ctx.company, 284, 150, 42, fg, { family: "BrandHead", weight: 700 }),
    line([p.title, ctx.company].filter(Boolean).join(" · "), 284, 190, 22, primary, { tracking: 0.8 }),
    ...rows.map((t, i) => line(t, 284, 234 + i * 34, 20, muted)),
  ].join("");
  return [{ name: "email-signature", svg: page(W, H, css, body), width: W, height: H }];
}

function docTemplate(ctx: CollateralCtx, css: string, mode: "invoice" | "proposal"): Page[] {
  const W = 1275, H = 1650, M = 110;
  const { primary, bg, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const isInvoice = mode === "invoice";
  const title = isInvoice ? "INVOICE" : "PROPOSAL";
  const cols = isInvoice
    ? ["Description", "Qty", "Rate", "Amount"]
    : ["Scope item", "Detail", "Timeline", "Investment"];
  const colX = [M, M + 560, M + 760, W - M];
  const rowsY = 700;
  const bodyRows = Array.from({ length: 7 }, (_, i) =>
    `<line x1="${M}" y1="${rowsY + 54 + i * 54}" x2="${W - M}" y2="${rowsY + 54 + i * 54}" stroke="${muted}" stroke-width="1" opacity="0.22"/>`).join("");

  const body = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    `<rect x="0" y="0" width="${W}" height="10" fill="${primary}"/>`,
    markAt(ctx, M, M, 100, 100, primary),
    wordmark(ctx, M + 122, M + 60, 36, fg),
    ctx.tagline ? line(ctx.tagline, M + 124, M + 88, 17, muted, { tracking: 1.2 }) : "",
    line(title, W - M, M + 62, 52, primary, { family: "BrandHead", weight: 700, anchor: "end", tracking: 4 }),
    line(isInvoice ? "No. 0001" : "Prepared for", W - M, M + 96, 20, muted, { anchor: "end" }),
    line("From", M, 340, 15, muted, { tracking: 2.4 }),
    paragraph([ctx.company, p.name, p.email, p.phone, p.address].filter(Boolean).join("\n"), M, 372, 20, 460, fg, 1.6, 6),
    line(isInvoice ? "Bill to" : "Client", W / 2 + 40, 340, 15, muted, { tracking: 2.4 }),
    paragraph("Client name\nCompany\nEmail\nAddress", W / 2 + 40, 372, 20, 460, muted, 1.6, 6),
    `<line x1="${M}" y1="${rowsY - 46}" x2="${W - M}" y2="${rowsY - 46}" stroke="${primary}" stroke-width="2"/>`,
    ...cols.map((c, i) => line(c, colX[i], rowsY - 12, 17, primary, { tracking: 2, anchor: i === cols.length - 1 ? "end" : "start" })),
    `<line x1="${M}" y1="${rowsY + 12}" x2="${W - M}" y2="${rowsY + 12}" stroke="${muted}" stroke-width="1" opacity="0.4"/>`,
    bodyRows,
    `<rect x="${W - M - 420}" y="${rowsY + 470}" width="420" height="92" fill="${primary}" opacity="0.08"/>`,
    line(isInvoice ? "Total due" : "Total investment", W - M - 396, rowsY + 526, 22, fg, { family: "BrandHead", weight: 700 }),
    line("$0.00", W - M - 24, rowsY + 526, 26, primary, { family: "BrandHead", weight: 700, anchor: "end" }),
    paragraph(
      isInvoice
        ? "Payment terms: net 15. Make payment to the account on file. Late balances accrue 1.5% monthly."
        : "This proposal is valid for 30 days. Work begins on countersignature and receipt of the deposit.",
      M, H - 170, 18, W - M * 2, muted, 1.5, 3,
    ),
    line([p.website, p.email].filter(Boolean).join("   ·   "), W / 2, H - 80, 17, muted, { anchor: "middle", tracking: 1.2 }),
  ].join("");
  return [{ name: mode, svg: page(W, H, css, body), width: W, height: H }];
}

function presentation(ctx: CollateralCtx, css: string): Page[] {
  const W = 1920, H = 1080, M = 140;
  const { primary, bg, fg, accent, muted } = palette(ctx);
  const ink = inkOn(primary);
  const pages: Page[] = [];

  pages.push({
    name: "slide-1-cover",
    width: W, height: H,
    svg: page(W, H, css, [
      `<rect width="${W}" height="${H}" fill="${primary}"/>`,
      markAt(ctx, M, M, 180, 180, ink),
      line(ctx.company, M, H / 2 + 40, 132, ink, { family: "BrandHead", weight: 700 }),
      ctx.tagline ? line(ctx.tagline, M, H / 2 + 110, 36, ink, { opacity: 0.8, tracking: 2 }) : "",
      line(new Date().getFullYear().toString(), W - M, H - M, 26, ink, { anchor: "end", opacity: 0.7 }),
    ].join("")),
  });

  pages.push({
    name: "slide-2-section",
    width: W, height: H,
    svg: page(W, H, css, [
      `<rect width="${W}" height="${H}" fill="${bg}"/>`,
      `<rect x="0" y="0" width="24" height="${H}" fill="${accent}"/>`,
      line("01", M, 300, 40, accent, { family: "BrandHead", weight: 700, tracking: 6 }),
      line("Section title", M, 400, 96, fg, { family: "BrandHead", weight: 700 }),
      paragraph("One sentence that frames what this section proves.", M, 470, 34, W - M * 2 - 400, muted, 1.5, 2),
      markAt(ctx, W - M - 120, H - M - 120, 120, 120, primary),
    ].join("")),
  });

  pages.push({
    name: "slide-3-content",
    width: W, height: H,
    svg: page(W, H, css, [
      `<rect width="${W}" height="${H}" fill="${bg}"/>`,
      line("Content slide", M, 200, 64, fg, { family: "BrandHead", weight: 700 }),
      `<line x1="${M}" y1="240" x2="${M + 160}" y2="240" stroke="${accent}" stroke-width="6"/>`,
      ...[0, 1, 2].map((i) => [
        `<rect x="${M + i * 540}" y="330" width="480" height="420" fill="${primary}" opacity="0.06" rx="18"/>`,
        line(`0${i + 1}`, M + 40 + i * 540, 400, 28, accent, { family: "BrandHead", weight: 700, tracking: 3 }),
        line("Point headline", M + 40 + i * 540, 452, 34, fg, { family: "BrandHead", weight: 700 }),
        paragraph("Supporting detail, kept to two lines so the slide stays readable from the back of the room.", M + 40 + i * 540, 500, 22, 400, muted, 1.5, 4),
      ].join("")),
      line(ctx.company, M, H - 90, 22, muted),
      markAt(ctx, W - M - 70, H - 130, 70, 70, primary),
    ].join("")),
  });

  pages.push({
    name: "slide-4-closing",
    width: W, height: H,
    svg: page(W, H, css, [
      `<rect width="${W}" height="${H}" fill="${fg}"/>`,
      markAt(ctx, W / 2 - 90, H / 2 - 220, 180, 160, inkOn(fg)),
      line("Thank you", W / 2, H / 2 + 40, 96, inkOn(fg), { family: "BrandHead", weight: 700, anchor: "middle" }),
      line([ctx.person?.website, ctx.person?.email].filter(Boolean).join("   ·   "), W / 2, H / 2 + 110, 28, inkOn(fg), { anchor: "middle", opacity: 0.75 }),
    ].join("")),
  });

  return pages;
}

function guidelines(ctx: CollateralCtx, css: string): Page[] {
  const W = 1600, H = 1000, M = 110;
  const { primary, bg, fg, accent, muted } = palette(ctx);
  const ink = inkOn(primary);
  const pages: Page[] = [];
  const head = (title: string, n: string) => [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    line(n, M, 110, 20, accent, { family: "BrandHead", weight: 700, tracking: 4 }),
    line(title, M, 176, 56, fg, { family: "BrandHead", weight: 700 }),
    `<line x1="${M}" y1="210" x2="${W - M}" y2="210" stroke="${primary}" stroke-width="2" opacity="0.3"/>`,
    line(`${ctx.company} — Brand guidelines`, W - M, 110, 18, muted, { anchor: "end" }),
  ].join("");

  pages.push({
    name: "guidelines-1-cover", width: W, height: H,
    svg: page(W, H, css, [
      `<rect width="${W}" height="${H}" fill="${primary}"/>`,
      markAt(ctx, M, M, 170, 170, ink),
      line("Brand guidelines", M, H / 2, 40, ink, { opacity: 0.8, tracking: 4 }),
      line(ctx.company, M, H / 2 + 110, 110, ink, { family: "BrandHead", weight: 700 }),
      ctx.tagline ? line(ctx.tagline, M, H / 2 + 160, 28, ink, { opacity: 0.75 }) : "",
      line(new Date().toLocaleDateString(), M, H - M, 20, ink, { opacity: 0.7 }),
    ].join(""),
    ),
  });

  pages.push({
    name: "guidelines-2-logo", width: W, height: H,
    svg: page(W, H, css, [
      head("Logo", "01"),
      `<rect x="${M}" y="280" width="620" height="440" fill="${bg}" stroke="${muted}" stroke-width="1" opacity="0.9"/>`,
      markAt(ctx, M + 110, 350, 400, 300, primary),
      line("Primary — full colour", M, 760, 20, muted, { tracking: 1.4 }),
      `<rect x="${M + 700}" y="280" width="300" height="210" fill="${fg}"/>`,
      markAt(ctx, M + 760, 310, 180, 150, inkOn(fg)),
      line("Knockout", M + 700, 520, 18, muted),
      `<rect x="${M + 700}" y="560" width="300" height="160" fill="${bg}" stroke="${muted}" stroke-width="1"/>`,
      markAt(ctx, M + 760, 580, 180, 120, "#111111"),
      line("Mono", M + 700, 750, 18, muted),
      paragraph(
        "Keep clear space of at least the mark's cap height on every side. Never stretch, recolour outside these variants, add effects, or place the mark on a busy photograph without a scrim.",
        M, 820, 22, W - M * 2, fg, 1.6, 4,
      ),
    ].join(""),
    ),
  });

  const entries = Object.entries(ctx.colors ?? {}).slice(0, 8);
  pages.push({
    name: "guidelines-3-colour", width: W, height: H,
    svg: page(W, H, css, [
      head("Colour", "02"),
      ...entries.map(([k, v], i) => {
        const cs = colorSpaces(v);
        const x = M + (i % 4) * 340;
        const y = 280 + Math.floor(i / 4) * 320;
        return [
          `<rect x="${x}" y="${y}" width="300" height="150" fill="${v}" rx="8"/>`,
          line(k.toUpperCase(), x, y + 190, 20, fg, { family: "BrandHead", weight: 700, tracking: 1.6 }),
          line(cs.hex, x, y + 218, 17, muted),
          line(`RGB ${cs.rgb.join(" ")}`, x, y + 242, 17, muted),
          line(`CMYK ${cs.cmyk.join(" ")}`, x, y + 266, 17, muted),
          line(cs.pantone, x, y + 290, 17, accent),
        ].join("");
      }),
    ].join("")),
  });

  pages.push({
    name: "guidelines-4-type", width: W, height: H,
    svg: page(W, H, css, [
      head("Typography", "03"),
      line(ctx.fonts?.heading || "Heading", M, 330, 34, accent, { family: "BrandHead", weight: 700, tracking: 2 }),
      line("Aa Bb Cc 0123", M, 430, 96, fg, { family: "BrandHead", weight: 700 }),
      line("Headlines · weight 700 · tight tracking", M, 480, 22, muted),
      line(ctx.fonts?.body || "Body", M, 600, 30, accent, { tracking: 2 }),
      line("Aa Bb Cc 0123", M, 690, 72, fg),
      paragraph(
        "Body copy is set at 16–20px with 1.6 line height. Use sentence case everywhere except small labels, which may be uppercase with generous tracking.",
        M, 740, 22, W - M * 2, fg, 1.6, 4,
      ),
    ].join("")),
  });

  const voice = ctx.voice || "Plain, specific, and confident. Short sentences. Name the outcome, not the process. No jargon, no hype, no exclamation marks.";
  pages.push({
    name: "guidelines-5-voice", width: W, height: H,
    svg: page(W, H, css, [
      head("Voice", "04"),
      paragraph(voice, M, 320, 26, W - M * 2, fg, 1.7, 12),
      `<rect x="${M}" y="700" width="${(W - M * 2) / 2 - 20}" height="180" fill="${primary}" opacity="0.07" rx="12"/>`,
      line("Do", M + 40, 750, 22, accent, { family: "BrandHead", weight: 700, tracking: 2 }),
      paragraph("Lead with the result. Use the customer's words. Keep it to one idea per sentence.", M + 40, 786, 20, (W - M * 2) / 2 - 100, fg, 1.5, 3),
      `<rect x="${W / 2 + 20}" y="700" width="${(W - M * 2) / 2 - 20}" height="180" fill="${muted}" opacity="0.09" rx="12"/>`,
      line("Don't", W / 2 + 60, 750, 22, muted, { family: "BrandHead", weight: 700, tracking: 2 }),
      paragraph("Don't stack adjectives, borrow buzzwords, or promise what the product can't do yet.", W / 2 + 60, 786, 20, (W - M * 2) / 2 - 100, fg, 1.5, 3),
    ].join("")),
  });

  return pages;
}

/** CSS design tokens — the web design-system half of the kit. */
export function designTokens(ctx: CollateralCtx): { css: string; json: string } {
  const c = ctx.colors ?? {};
  const vars = Object.entries(c).map(([k, v]) => `  --brand-${k}: ${v};`).join("\n");
  const css = `:root {\n${vars}\n  --brand-font-heading: '${ctx.fonts?.heading ?? "Inter"}';\n  --brand-font-body: '${ctx.fonts?.body ?? "Inter"}';\n  --brand-radius: 12px;\n  --brand-space: 8px;\n}\n`;
  const json = JSON.stringify(
    {
      color: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, colorSpaces(v)])),
      font: { heading: ctx.fonts?.heading ?? null, body: ctx.fonts?.body ?? null },
      radius: { sm: 6, md: 12, lg: 20, pill: 999 },
      space: [4, 8, 12, 16, 24, 32, 48, 64, 96],
    },
    null,
    2,
  );
  return { css, json };
}

export async function renderCollateral(kind: CollateralKind, ctx: CollateralCtx): Promise<Page[]> {
  const heading = ctx.fonts?.heading || "Inter";
  const body = ctx.fonts?.body || "Inter";
  const css = [
    await embedFont(heading, 700, "BrandHead"),
    await embedFont(body, 400, "BrandBody"),
    "text{ -webkit-font-smoothing:antialiased; }",
  ].join("");

  switch (kind) {
    case "business_card": return businessCard(ctx, css);
    case "letterhead": return letterhead(ctx, css);
    case "envelope": return envelope(ctx, css);
    case "notecard": return notecard(ctx, css);
    case "email_signature": return emailSignature(ctx, css);
    case "invoice": return docTemplate(ctx, css, "invoice");
    case "proposal": return docTemplate(ctx, css, "proposal");
    case "presentation": return presentation(ctx, css);
    case "guidelines": return guidelines(ctx, css);
    default: return [];
  }
}

/** Ready-to-paste HTML email signature (matches the PNG variant). */
export function signatureHtml(ctx: CollateralCtx, logoUrl?: string | null): string {
  const { primary, fg, muted } = palette(ctx);
  const p = ctx.person ?? {};
  const rows = [p.email, p.phone, p.website].filter(Boolean) as string[];
  return `<table cellpadding="0" cellspacing="0" style="font-family:${ctx.fonts?.body ?? "Helvetica"},Helvetica,Arial,sans-serif;color:${fg}">
  <tr>
    ${logoUrl ? `<td style="padding-right:16px;vertical-align:top"><img src="${logoUrl}" alt="${esc(ctx.company)}" width="64" height="64" style="display:block;border:0"></td>` : ""}
    <td style="border-left:3px solid ${primary};padding-left:16px">
      <div style="font-size:16px;font-weight:700">${esc(p.name || ctx.company)}</div>
      <div style="font-size:13px;color:${primary};padding-top:2px">${esc([p.title, ctx.company].filter(Boolean).join(" · "))}</div>
      ${rows.map((t) => `<div style="font-size:12px;color:${muted};padding-top:2px">${esc(t)}</div>`).join("")}
    </td>
  </tr>
</table>`;
}
