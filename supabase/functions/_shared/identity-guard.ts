/**
 * Identity guard — makes sure a generated deliverable actually carries the
 * founder's company name and the committed logo instead of a name the model
 * invented or a `{Company}` placeholder it forgot to fill in.
 *
 * Used by venture-generate-document and venture-bulk-generate after the
 * gateway returns, before the document is persisted.
 */

import { BANNED_COPY_PHRASES, SECTION4_WORD_FLOOR } from "./copy-craft.ts";

/** Pull the body of a top-level numbered section (e.g. `## 4. Page-by-Page`). */
function extractSection(raw: string, n: number): string {
  const re = new RegExp(String.raw`(?:^|\n)##\s*${n}[.)]?\s[^\n]*\n([\s\S]*?)(?=\n##\s*\d|$)`, "i");
  return raw.match(re)?.[1] ?? "";
}

/** Rough word counts of FAQ answers, wherever they appear in the document. */
function extractFaqAnswers(raw: string): number[] {
  const lines = raw.split("\n");
  const out: number[] = [];
  let current: string[] | null = null;
  const isQuestion = (l: string) =>
    /\?\s*(\*\*)?\s*$/.test(l.trim()) &&
    /^(#{3,6}\s|\*\*|-\s\*\*|\d+\.\s|\*\*Q|Q\d*[:.]))?/.test(l.trim()) === true;
  for (const l of lines) {
    const t = l.trim();
    const q = /\?\s*(\*\*)?$/.test(t) && t.length > 12 && t.length < 200;
    if (q) {
      if (current) out.push(current.join(" ").split(/\s+/).filter(Boolean).length);
      current = [];
      continue;
    }
    if (current) {
      if (/^#{2,3}\s/.test(t)) {
        out.push(current.join(" ").split(/\s+/).filter(Boolean).length);
        current = null;
      } else if (t) current.push(t.replace(/^[-*]\s*/, ""));
    }
  }
  if (current) out.push(current.join(" ").split(/\s+/).filter(Boolean).length);
  return out.filter((n) => n > 0);
}

export type IdentityCheck = {
  nameMissing: boolean;
  logoMissing: boolean;
  imageryMissing: boolean;
  /** PRD only: the imagery plan exists but is too thin to art-direct a site. */
  imageryThin?: boolean;
  /** PRD only: rows lack exposure / overlay craft columns. */
  imageryCraftMissing?: boolean;
  /** PRD only: people are specified without the studio portrait recipe. */
  portraitCraftMissing?: boolean;
  /** PRD only: darkness is baked into image prompts instead of a CSS scrim. */
  imageryTooDark?: boolean;
  /** PRD only: the locked art direction was never named in the document. */
  artDirectionMissing?: boolean;
  /** PRD only: Section 4 page copy is below its word floor. */
  copyThin?: boolean;
  /** PRD only: copy is generic filler rather than venture-specific. */
  copyGeneric?: boolean;
  /** PRD only: too few FAQ answers, or answers too short. */
  faqThin?: boolean;
  ok: boolean;
};


/** Replace `{Company}` / `{COMPANY_NAME}` style placeholders with the real name. */
export function substituteIdentity(raw: string, companyName?: string | null): string {
  const name = (companyName ?? "").trim();
  if (!name || !raw) return raw;
  return raw.replace(
    /\{\s*(company|company[_ ]?name|brand|brand[_ ]?name|business[_ ]?name)\s*\}/gi,
    name,
  );
}

/** Does the body contain the company name (case/whitespace tolerant)? */
export function mentionsCompany(raw: string, companyName?: string | null): boolean {
  const name = (companyName ?? "").trim();
  if (!name) return true;
  const norm = (s: string) => s.toLowerCase().replace(/[\s\u2018\u2019'".,]+/g, " ").replace(/\s+/g, " ");
  return norm(raw).includes(norm(name));
}

export function checkIdentity(
  raw: string,
  opts: {
    companyName?: string | null;
    logoUrl?: string | null;
    requireImagery?: boolean;
    /** PRD only: minimum rows the Imagery Plan table must carry. */
    minImageryRows?: number;
    /** PRD only: the archetype name the document must commit to. */
    archetypeName?: string | null;
    /** PRD only: run the copy-depth checks. */
    requireCopyDepth?: boolean;
    /** PRD only: minimum words of Section 4 page copy. */
    minSection4Words?: number;
  },
): IdentityCheck {
  const nameMissing = !mentionsCompany(raw, opts.companyName);
  const logo = (opts.logoUrl ?? "").trim();
  const logoMissing = !!logo && !raw.includes(logo);
  const imageryMissing = !!opts.requireImagery &&
    !/<img\s/i.test(raw) &&
    !/imagery plan/i.test(raw);

  // An "Imagery Plan" heading with three rows under it is not an art direction.
  // Count table rows that carry a prompt-ish cell so thin plans fail the gate.
  let imageryThin = false;
  let imageryCraftMissing = false;
  let portraitCraftMissing = false;
  let imageryTooDark = false;
  if (opts.requireImagery && !imageryMissing) {
    const min = opts.minImageryRows ?? 12;
    const rows = raw.split("\n").filter((l) => {
      const t = l.trim();
      return t.startsWith("|") && (t.match(/\|/g)?.length ?? 0) >= 5 &&
        !/^\|[\s\-:|]+\|$/.test(t);
    });
    imageryThin = rows.length < min;

    // Craft columns: exposure targets and an overlay/scrim plan must exist.
    const hasExposure = /luminance|exposure/i.test(raw);
    const hasOverlay = /scrim|overlay/i.test(raw);
    imageryCraftMissing = !hasExposure || !hasOverlay;

    // People rows must carry the studio portrait recipe.
    const mentionsPeople =
      /\b(portrait|headshot|founder|team member|testimonial|person|people|face)\b/i.test(raw);
    portraitCraftMissing = mentionsPeople &&
      !(/85\s*mm/i.test(raw) && /catchlight/i.test(raw) && /skin texture/i.test(raw));

    // Darkness may only appear alongside an exposure target and a CSS scrim.
    const darkTalk = /\b(near-?black|very dark|moody|pitch[- ]black|darkened)\b/i.test(raw);
    imageryTooDark = darkTalk && !(hasExposure && hasOverlay);
  }

  let copyThin = false;
  let copyGeneric = false;
  let faqThin = false;
  if (opts.requireCopyDepth) {
    const floor = opts.minSection4Words ?? SECTION4_WORD_FLOOR;
    const section4 = extractSection(raw, 4);
    const prose = section4
      .split("\n")
      .filter((l) => !l.trim().startsWith("|"))
      .join(" ");
    const words = prose.split(/\s+/).filter(Boolean).length;
    copyThin = words < floor;

    if (!copyThin) {
      // Each route subsection under Section 4 must carry real copy.
      const routeBlocks = section4.split(/\n(?=###\s)/).slice(1);
      copyThin = routeBlocks.length > 0 &&
        routeBlocks.some((b) =>
          b.split("\n").filter((l) => !l.trim().startsWith("|")).join(" ")
            .split(/\s+/).filter(Boolean).length < 250
        );
    }

    const lower = raw.toLowerCase();
    const bannedHits = BANNED_COPY_PHRASES.filter((p) => lower.includes(p)).length;
    const concrete = (raw.match(/\b\d[\d,.]*\s*(%|hours?|days?|weeks?|months?|minutes?|customers?|clients?|x)\b/gi) ?? [])
      .length + (raw.match(/[$£€]\s?\d/g) ?? []).length;
    copyGeneric = bannedHits >= 3 || concrete < 12;

    const answers = extractFaqAnswers(raw);
    const mean = answers.length
      ? answers.reduce((a, b) => a + b, 0) / answers.length
      : 0;
    faqThin = answers.length < 8 || mean < 50;
  }

  const archetype = (opts.archetypeName ?? "").trim();
  const artDirectionMissing = !!archetype &&
    !raw.toLowerCase().includes(archetype.toLowerCase());

  return {
    nameMissing,
    logoMissing,
    imageryMissing,
    imageryThin,
    imageryCraftMissing,
    portraitCraftMissing,
    imageryTooDark,
    artDirectionMissing,
    copyThin,
    copyGeneric,
    faqThin,
    ok: !copyThin && !copyGeneric && !faqThin && !nameMissing && !logoMissing && !imageryMissing && !imageryThin &&
      !imageryCraftMissing && !portraitCraftMissing && !imageryTooDark &&
      !artDirectionMissing,
  };
}


/** Corrective instruction appended to a second gateway pass when a check fails. */
export function correctionPrompt(
  check: IdentityCheck,
  opts: {
    companyName?: string | null;
    logoUrl?: string | null;
    archetypeName?: string | null;
    minImageryRows?: number;
    minSection4Words?: number;
  },
): string {
  const fixes: string[] = [];
  if (check.nameMissing) {
    fixes.push(
      `You used the wrong company name. The company is **${opts.companyName}** — that exact string and no other. Rewrite the document so every headline, nav item, footer, meta title, email address and code sample uses it verbatim. Remove every trace of any other brand name you invented.`,
    );
  }
  if (check.logoMissing) {
    fixes.push(
      `The committed logo is missing. Render it as a literal \`<img src="${opts.logoUrl}" alt="${opts.companyName ?? "Company"} logo" />\` tag in the global header spec, in the brand-tokens table, and inside the paste-ready master prompt. Copy the URL character for character.`,
    );
  }
  if (check.imageryMissing) {
    fixes.push(
      "The document is text-only. Add the full Imagery Plan table (route, section, slot, visual type, aspect ratio, treatment, alt text, generation prompt) covering every section of every route, and restate it inside the master prompt's imagery spec. No page may have two consecutive text-only sections.",
    );
  }
  if (check.imageryThin) {
    fixes.push(
      `The Imagery Plan is too thin to art-direct a site. Expand it to at least ${
        opts.minImageryRows ?? 12
      } rows — every section of every route gets its own row — and give each row a 55–90 word generation prompt naming subject, lens/composition, lighting, exposure target, colour grade and mood in the brand's visual language. Generic prompts like "hero image of team" are rejected.`,
    );
  }
  if (check.imageryCraftMissing) {
    fixes.push(
      'The Imagery Plan has no craft specification. Add an "Exposure & contrast target" column and a "Text-overlay plan" column to every row. Exposure targets are numeric (e.g. "subject at 35–55% luminance, open shadows", "face at 45–60% luminance with catchlights"), never adjectives. The overlay plan names the CSS gradient scrim direction and which side of the frame stays clean, or says "no type on image". Every generation prompt must open with its craft recipe (exposure, lens/technique, composition, legibility test) before describing the subject.',
    );
  }
  if (check.portraitCraftMissing) {
    fixes.push(
      "Every image containing a person must use the studio portrait recipe verbatim: 85mm equivalent at roughly f/2, soft key at 45 degrees with fill and a rim light for separation, catchlights in both eyes, real skin texture with visible pores and natural asymmetry, face at 45–60% luminance, waist-up or head-and-shoulders with eye contact, real environment softly out of focus. Explicitly forbid plastic or CGI skin, uncanny symmetry, malformed hands, and any burned-in text, captions or hex codes.",
    );
  }
  if (check.imageryTooDark) {
    fixes.push(
      "You baked darkness into the images. Rewrite every prompt so the render ships properly exposed and legible, and state that darkening for headline contrast is applied in CSS as a token-based gradient scrim over the clean image. No prompt may ask for a near-black, murky or heavily darkened frame.",
    );
  }
  if (check.artDirectionMissing) {
    fixes.push(
      `You ignored the committed art direction. This site is built in the **${opts.archetypeName}** archetype. Name it explicitly, and make the grid, type scale, section rhythm, motion and imagery treatment obey its rules throughout — including inside the paste-ready master prompt. Do not fall back to a generic hero → three-column features → pricing stack.`,
    );
  }

  if (check.copyThin) {
    fixes.push(
      `Section 4 is too thin. Rewrite it to at least ${
        opts.minSection4Words ?? SECTION4_WORD_FLOOR
      } words of finished page copy, with every route meeting its floor (Home 900+, /about 600+, service or product detail 550+, /pricing 600+, case study 400+, launch post 700+, /faq 700+, utility routes 300+). Every section carries the real words a visitor reads: hero H1 of ten words or fewer plus a 20–35 word sub-headline and a 40–70 word body; each offer or feature card 45–80 words of body copy; each process step naming what happens, what the customer does, what they get and how long it takes; each pricing tier naming who it is for with full-sentence inclusions, explicit exclusions and a guarantee. Section 4 must be the longest section of the document.`,
    );
  }
  if (check.copyGeneric) {
    fixes.push(
      `The copy is generic. Rewrite so no paragraph could be pasted onto a competitor's site unchanged: name the audience, the mechanism, the deliverable, the price, the timeframe and the outcome, with a concrete number, name, place or timeframe at least every 150 words. Delete every instance of these banned phrases: ${
        BANNED_COPY_PHRASES.join(", ")
      }. Every CTA label starts with a verb and names the artifact — "Learn more" and "Get started" are forbidden.`,
    );
  }
  if (check.faqThin) {
    fixes.push(
      "The FAQ is too thin. Write at least 8 questions phrased the way a real buyer would type them, each answered in 60–110 words that address the objection behind the question and end with the next step. Cover price, timeline, what happens if it doesn't work, who it is not for, and how to start.",
    );
  }

  return [
    "Your previous draft failed brand validation. Reproduce the ENTIRE document from the top with the same structure, depth and word count, fixing exactly these problems:",
    ...fixes.map((f, i) => `${i + 1}. ${f}`),
    "Output the corrected document only — no apology, no commentary, no diff.",
  ].join("\n\n");
}
