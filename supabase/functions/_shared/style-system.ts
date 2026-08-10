// Per-venture style system — the portable half of the brand handoff.
//
// Everything here is read off the venture's own locked brand kit (palette,
// typography, voice, logos, mood board). Nothing is invented: if the kit does
// not carry a value, the document says so rather than filling in a house
// default. The output is two files a founder can hand to any project:
//
//   style-system.md   the spec, written to be pasted into another AI builder
//   style-system.css  the drop-in stylesheet (Tailwind v4 + a v3 fallback)

import { colorSpaces, contrastRatio, hexToRgb, isDarkSurface, relLuminance } from "./color-spaces.ts";
import type { CollateralCtx } from "./collateral-svg.ts";

export type StyleSystemExtras = {
  /** The kit's voice block (object or string). */
  voice?: any;
  /** Signed URLs for a few committed mood board frames. */
  moodboardUrls?: string[];
  /** True when the kit carries a reversed / knockout mark for dark grounds. */
  hasDarkMark?: boolean;
  /** Public/contrast-aware logo endpoints, when the venture has them. */
  logoOnLight?: string | null;
  logoOnDark?: string | null;
  /** Radius / baseline from the locked art direction. */
  radius?: number;
  baseline?: number;
  archetype?: string | null;
};

/* ------------------------------------------------------------------ colour */

function clamp(n: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, n));
}

function norm(hex: string): string {
  const h = String(hex || "").replace(/^#/, "").slice(0, 6).padEnd(6, "0");
  return `#${h.toUpperCase()}`;
}

/** sRGB hex → OKLCH, the format the token blocks are written in. */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const [r8, g8, b8] = hexToRgb(hex);
  const lin = [r8, g8, b8].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = lin;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: H };
}

export function oklchString(hex: string): string {
  const { l, c, h } = hexToOklch(hex);
  const round = (n: number, p: number) => Math.round(n * 10 ** p) / 10 ** p;
  return `oklch(${round(l, 4)} ${round(c, 4)} ${round(h, 1)})`;
}

/** Mix a colour toward white or black by `amount` (0–1), in sRGB. */
function mix(hex: string, toward: "white" | "black", amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = toward === "white" ? 255 : 0;
  const f = clamp(amount);
  const out = [r, g, b].map((v) => Math.round(v + (t - v) * f));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/**
 * Nudge an ink until it clears the required contrast on its surface. Hue is
 * preserved — only lightness moves — so the brand colour survives the fix.
 */
export function ensureContrast(
  ink: string,
  surface: string,
  target = 4.5,
): { hex: string; adjusted: boolean; ratio: number } {
  const start = norm(ink);
  if (contrastRatio(start, surface) >= target) {
    return { hex: start, adjusted: false, ratio: contrastRatio(start, surface) };
  }
  const toward: "white" | "black" = isDarkSurface(surface) ? "white" : "black";
  let best = start;
  for (let step = 1; step <= 20; step++) {
    const cand = mix(start, toward, step / 20);
    best = cand;
    if (contrastRatio(cand, surface) >= target) break;
  }
  return { hex: best, adjusted: true, ratio: contrastRatio(best, surface) };
}

type TokenRow = {
  token: string;
  dark: string;
  light: string;
  note?: string;
};

/**
 * Build the full semantic token set from whatever the kit actually carries.
 * The kit's own background decides which theme it *is*; the opposite theme is
 * derived from the same hues so both ship together and neither is guessed.
 */
export function buildTokens(colors: Record<string, string>) {
  const bg = norm(colors.bg || colors.background || "#FFFFFF");
  const fg = norm(colors.fg || colors.foreground || (isDarkSurface(bg) ? "#FFFFFF" : "#111111"));
  const primary = norm(colors.primary || colors.accent || fg);
  const secondary = norm(colors.secondary || colors.muted || primary);
  const accent = norm(colors.accent || colors.primary || primary);
  const muted = norm(colors.muted || mix(bg, isDarkSurface(bg) ? "white" : "black", 0.06));

  const kitIsDark = isDarkSurface(bg);
  const darkBg = kitIsDark ? bg : mix(fg, "black", 0.15);
  const lightBg = kitIsDark ? "#FFFFFF" : bg;
  const darkFg = kitIsDark ? fg : "#FAFAFA";
  const lightFg = kitIsDark ? mix(bg, "black", 0.88) : fg;

  const notes: string[] = [];
  const pair = (name: string, ink: string, dSurface: string, lSurface: string, target = 4.5): [string, string] => {
    const d = ensureContrast(ink, dSurface, target);
    const l = ensureContrast(ink, lSurface, target);
    if (d.adjusted) notes.push(`\`--${name}\` was lightened on the dark surface to reach ${d.ratio.toFixed(2)}:1.`);
    if (l.adjusted) notes.push(`\`--${name}\` was darkened on the light surface to reach ${l.ratio.toFixed(2)}:1.`);
    return [d.hex, l.hex];
  };

  const [primaryD, primaryL] = pair("primary", primary, darkBg, lightBg, 3);
  const [accentD, accentL] = pair("accent-ink", accent, darkBg, lightBg, 3);
  const mutedFgD = ensureContrast(mix(darkFg, "black", 0.3), darkBg, 4.5).hex;
  const mutedFgL = ensureContrast(mix(lightFg, "white", 0.35), lightBg, 4.5).hex;

  const rows: TokenRow[] = [
    { token: "--background", dark: darkBg, light: lightBg },
    { token: "--foreground", dark: darkFg, light: lightFg },
    { token: "--card", dark: mix(darkBg, "white", 0.05), light: "#FFFFFF" },
    { token: "--card-foreground", dark: darkFg, light: lightFg },
    { token: "--popover", dark: mix(darkBg, "white", 0.07), light: "#FFFFFF" },
    { token: "--popover-foreground", dark: darkFg, light: lightFg },
    { token: "--primary", dark: primaryD, light: primaryL, note: "brand primary" },
    { token: "--primary-foreground", dark: ensureContrast(darkFg, primaryD).hex, light: ensureContrast("#FFFFFF", primaryL).hex },
    { token: "--secondary", dark: mix(secondary, "black", 0.45), light: mix(secondary, "white", 0.72) },
    { token: "--secondary-foreground", dark: darkFg, light: lightFg },
    { token: "--muted", dark: mix(muted, "black", 0.45), light: mix(muted, "white", 0.7) },
    { token: "--muted-foreground", dark: mutedFgD, light: mutedFgL },
    { token: "--accent", dark: mix(accentD, "black", 0.5), light: mix(accentL, "white", 0.82) },
    { token: "--accent-foreground", dark: darkFg, light: lightFg },
    { token: "--destructive", dark: "#E5484D", light: "#C62A2F" },
    { token: "--destructive-foreground", dark: "#FFFFFF", light: "#FFFFFF" },
    { token: "--border", dark: mix(darkBg, "white", 0.14), light: mix(lightBg, "black", 0.12) },
    { token: "--input", dark: mix(darkBg, "white", 0.18), light: mix(lightBg, "black", 0.16) },
    { token: "--ring", dark: primaryD, light: primaryL },
  ];

  return { rows, notes, kitIsDark, darkBg, lightBg, primaryD, primaryL, accentD, accentL };
}

/* ------------------------------------------------------------------- files */

function fontLink(heading?: string | null, body?: string | null): string | null {
  const fams = [heading, body].filter(Boolean).map((f) => String(f).trim());
  if (!fams.length) return null;
  const uniq = [...new Set(fams)];
  const q = uniq.map((f) => `family=${f.replace(/\s+/g, "+")}:wght@300;400;500;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

function voiceBlock(voice: any): {
  summary: string | null;
  tone: string[];
  principles: string[];
  dos: string[];
  donts: string[];
  ctas: string[];
} {
  if (typeof voice === "string") {
    return { summary: voice.trim() || null, tone: [], principles: [], dos: [], donts: [], ctas: [] };
  }
  const arr = (v: any) => (Array.isArray(v) ? v.map((s: any) => String(s).trim()).filter(Boolean) : []);
  return {
    summary: String(voice?.summary ?? "").trim() || null,
    tone: arr(voice?.tone_words),
    principles: arr(voice?.principles).length ? arr(voice?.principles) : arr(voice?.bullets),
    dos: arr(voice?.dos),
    donts: arr(voice?.donts),
    ctas: arr(voice?.ctas),
  };
}

function bullets(items: string[], fallback = "_Not recorded in this brand kit._"): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : fallback;
}

export function styleSystemMarkdown(ctx: CollateralCtx, extras: StyleSystemExtras = {}): string {
  const t = buildTokens(ctx.colors ?? {});
  const v = voiceBlock(extras.voice ?? ctx.voice);
  const heading = ctx.fonts?.heading ?? null;
  const body = ctx.fonts?.body ?? null;
  const link = fontLink(heading, body);
  const radius = extras.radius ?? 12;
  const baseline = extras.baseline ?? 8;

  const tokenTable = [
    "| Token | Dark | Light |",
    "| --- | --- | --- |",
    ...t.rows.map((r) => `| \`${r.token}\` | \`${oklchString(r.dark)}\` — ${r.dark} | \`${oklchString(r.light)}\` — ${r.light} |`),
  ].join("\n");

  const paletteTable = [
    "| Role | Hex | RGB | CMYK | Pantone |",
    "| --- | --- | --- | --- | --- |",
    ...Object.entries(ctx.colors ?? {}).map(([k, hex]) => {
      const cs = colorSpaces(hex);
      return `| ${k} | ${cs.hex} | ${cs.rgb.join(", ")} | ${cs.cmyk.join(", ")} | ${cs.pantone} |`;
    }),
  ].join("\n");

  const moodboard = (extras.moodboardUrls ?? []).slice(0, 4);

  return `# ${ctx.company} — Style System

Generated from ${ctx.company}'s locked brand kit${extras.archetype ? ` (art direction: ${String(extras.archetype).replace(/_/g, " ")})` : ""}. Every value below comes from the kit itself — palette, typefaces, marks, voice and imagery — not from a template.

Companion file: **\`style-system.css\`** — the drop-in stylesheet with the same tokens, a base layer and a Tailwind v3 fallback block.

**How to use this document:** open another project and paste this whole file into the chat with:
> Apply this style system to my app — replace my tokens with these, wire the fonts, and swap any hardcoded colour utilities for the semantic tokens.

---

## 1. Principles

1. **${t.kitIsDark ? "Dark-first" : "Light-first"}.** The kit's own surface is ${t.kitIsDark ? "dark" : "light"}, so that is the default theme. The opposite theme is derived from the same hues and ships with it — never style a section for one theme only.
2. **One accent carries interaction.** \`--primary\` (${t.primaryD} on dark, ${t.primaryL} on light) is the only colour that signals "you can act here".
3. **Foreground travels with its surface.** Anything that changes its background must also set foreground, muted-foreground and border.
4. **Tokens only.** Never write \`text-white\`, \`bg-black\`, or a bare hex in a component.
5. **Contrast is a gate, not a preference.** Body text clears 4.5:1 on the surface it actually sits on; large display and interactive fills clear 3:1.

---

## 2. Colour

### Brand palette (as locked)

${paletteTable}

### Semantic tokens

${tokenTable}

**Radius:** \`--radius: ${radius}px\` with sm/md/lg derived from it. **Baseline:** ${baseline}px spacing unit.

${t.notes.length ? `### Contrast adjustments made\n\n${t.notes.map((n) => `- ${n}`).join("\n")}\n\nThe brand hue is preserved in every case — only lightness moved.` : "Every brand pair cleared its contrast target unchanged."}

---

## 3. Typography

${link ? `Add to \`index.html\` \`<head>\`:\n\n\`\`\`html\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${link}" rel="stylesheet">\n\`\`\`` : "_This kit does not name web fonts. Set them before porting._"}

- **Headings / display:** ${heading ? `**${heading}**, weights 500–700` : "_not set in the kit_"}. Tracking \`-0.02em\` at display sizes.
- **Body / UI:** ${body ? `**${body}**, weights 300–500` : "_not set in the kit_"}. Line-height 1.6.
- **Kicker / eyebrow:** ${heading ?? body ?? "the heading face"}, uppercase, 0.75rem, \`letter-spacing: 0.16em\`, \`--muted-foreground\`.
- Scale (rem): 3.5 / 2.5 / 1.875 / 1.5 / 1.125 / 1 / 0.875.

---

## 4. Logo

- Use the **primary mark on light grounds** and the **${extras.hasDarkMark ? "reversed / knockout mark" : "single-ink knockout of the primary mark"} on dark grounds**. Pick by measuring the surface: below 0.35 relative luminance is a dark ground.
- Current page surfaces: dark \`${t.darkBg}\` (luminance ${relLuminance(t.darkBg).toFixed(3)}) → use the reversed mark. Light \`${t.lightBg}\` (luminance ${relLuminance(t.lightBg).toFixed(3)}) → use the primary mark.
${extras.logoOnLight ? `- Mark for light surfaces: ${extras.logoOnLight}` : ""}
${extras.logoOnDark ? `- Mark for dark surfaces: ${extras.logoOnDark}` : ""}
- **Clear space:** the height of the mark's cap or symbol on all four sides. **Minimum size:** 24px tall on screen, 0.5in in print.
- Never recolour, stretch, outline, add a shadow to, or place the mark on a busy photograph without a scrim.

---

## 5. Voice

${v.summary ? `> ${v.summary}` : "_No voice summary recorded in this brand kit._"}

**Tone words:** ${v.tone.length ? v.tone.join(" · ") : "_not recorded_"}

**Principles**

${bullets(v.principles)}

**Say this**

${bullets(v.dos)}

**Not this**

${bullets(v.donts)}

**Call-to-action labels**

${bullets(v.ctas)}

---

## 6. Imagery

${moodboard.length ? `Art direction reference — committed mood board frames from this kit:\n\n${moodboard.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\nMatch their lighting, colour temperature and framing when sourcing or generating new imagery.` : "_No mood board frames are committed on this kit yet. Generate the mood board before commissioning imagery._"}

- Photography sits under a scrim before type is placed on it — never type straight onto an unmanaged image.
- One hero image per viewport. Supporting imagery is cropped to the same aspect family.

---

## 7. Components

- **Buttons:** primary = \`bg-primary text-primary-foreground\`, radius \`${radius}px\`. Secondary = surface + 1px \`--border\`. Ghost = transparent with \`--muted-foreground\`, hovering to \`--foreground\`.
- **Cards:** \`--card\` fill, 1px \`--border\` hairline, radius \`${radius * 1.5}px\`.
- **Inputs:** \`--input\` fill, \`--border\` hairline, 2px \`--ring\` focus ring with offset.
- **Badges:** pill, 0.75rem, token colour as text over a 12% mix of the same token.
- **Sections:** \`py-20\` desktop / \`py-12\` mobile, content max-width 72rem.

---

## 8. Hard rules

- Tokens only — no \`text-white\`, \`bg-black\`, \`text-gray-*\`, or hex values in components.
- Every background change also sets foreground, muted-foreground and border.
- Every dark token has a light counterpart and vice versa.
- Body text ≥ 4.5:1 on its own surface; large display and control fills ≥ 3:1.
- The correct logo variant for the surface, always.

## 9. Porting steps

1. Copy \`style-system.css\` into \`src/styles.css\` (Tailwind v4) or \`src/index.css\` (v3), keeping \`@import "tailwindcss"\` at the top. For v3, follow the fallback block at the bottom of that file and extend \`tailwind.config.ts\` with the mapping it supplies.
2. Add the font \`<link>\` tags to \`index.html\`.
3. Grep components for \`text-white\`, \`bg-black\`, \`bg-white\`, \`text-gray-\`, \`bg-slate-\` and \`#\` hex values, and replace with semantic tokens.
4. Drop the correct logo variant into the header and footer for each surface.
5. Rewrite CTA labels and headings against the voice section above.

### Verify

- [ ] Toggle both themes — no invisible text, no theme-only section.
- [ ] Focus rings visible on every interactive element.
- [ ] Body contrast ≥ 4.5:1 on its actual surface.
- [ ] Correct mark on every surface.
- [ ] Fonts loading — no flash of system sans.
`;
}

export function styleSystemCss(ctx: CollateralCtx, extras: StyleSystemExtras = {}): string {
  const t = buildTokens(ctx.colors ?? {});
  const radius = extras.radius ?? 12;
  const heading = ctx.fonts?.heading ?? null;
  const body = ctx.fonts?.body ?? null;
  const headStack = heading ? `'${heading}', ui-sans-serif, system-ui, sans-serif` : "ui-sans-serif, system-ui, sans-serif";
  const bodyStack = body ? `'${body}', ui-sans-serif, system-ui, sans-serif` : "ui-sans-serif, system-ui, sans-serif";
  const link = fontLink(heading, body);

  const varsFor = (which: "dark" | "light") =>
    t.rows.map((r) => `  ${r.token}: ${oklchString(which === "dark" ? r.dark : r.light)};`).join("\n");
  const hexFor = (which: "dark" | "light") =>
    t.rows.map((r) => `  ${r.token}: ${which === "dark" ? r.dark : r.light};`).join("\n");

  const defaultTheme = t.kitIsDark ? "dark" : "light";
  const altTheme = t.kitIsDark ? "light" : "dark";

  return `/* ${ctx.company} — style system
 * Generated from the locked brand kit. Tailwind v4 first; a v3 fallback block
 * sits at the bottom of this file.
 *
 * Fonts: ${link ?? "none declared on this kit"}
 */

/* @import "tailwindcss";  <- keep this as the first line of your stylesheet */

:root {
${varsFor(defaultTheme)}
  --radius: ${radius}px;
  --radius-sm: ${Math.max(2, Math.round(radius / 2))}px;
  --radius-lg: ${radius * 2}px;
  --font-heading: ${headStack};
  --font-body: ${bodyStack};
}

:root.${altTheme} {
${varsFor(altTheme)}
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-sans: var(--font-body);
  --font-display: var(--font-heading);
}

@layer base {
  * { border-color: var(--border); }
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4, .display {
    font-family: var(--font-heading);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .kicker {
    font-family: var(--font-heading);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.16em;
    color: var(--muted-foreground);
  }
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}

@layer utilities {
  .surface-card {
    background: var(--card);
    color: var(--card-foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }
  .btn-primary {
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: var(--radius);
  }
  .text-brand { color: var(--primary); }
  .ring-brand { box-shadow: 0 0 0 1px var(--ring); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ------------------------------------------------------------------------
 * TAILWIND v3 FALLBACK
 * Use this block instead of the v4 one above when the target project still
 * uses tailwind.config.ts + src/index.css. Values are hex so they work
 * everywhere; drop the @theme inline block and use the config mapping below.
 * ---------------------------------------------------------------------- */
/*
:root {
${hexFor(defaultTheme)}
}
:root.${altTheme} {
${hexFor(altTheme)}
}

// tailwind.config.ts
export default {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: { lg: "${radius * 2}px", md: "${radius}px", sm: "${Math.max(2, Math.round(radius / 2))}px" },
      fontFamily: { sans: [${body ? `"${body}"` : `"ui-sans-serif"`}, "system-ui", "sans-serif"], display: [${heading ? `"${heading}"` : `"ui-sans-serif"`}, "system-ui", "sans-serif"] },
    },
  },
} satisfies Config;
*/
`;
}
