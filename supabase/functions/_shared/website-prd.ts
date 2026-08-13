// Website PRD post-processing — shared by venture-generate-document and
// venture-bulk-generate so both paths produce an identical document.
//
// Previously each function carried its own copy of these helpers, and the
// "depth addendum" they appended was hardcoded Startup Labs marketing (the
// $197 workshop, the three-hour format, Atlanta skyline imagery). That text
// leaked into every founder's PRD and is the main reason the resulting sites
// looked same-y and off-brand. The addendum is now built from the venture's
// own identity, art direction and palette.

import { aiFetch } from "./ai-fetch.ts";
import { modelForTier } from "./deliverable-prompts.ts";
import type { SiteArchetype } from "./site-art-direction.ts";
import { copyCraftBlock, SECTION4_WORD_FLOOR } from "./copy-craft.ts";
import { buildAcceptanceChecklist, layoutContractBlock } from "./layout-contract.ts";

const MASTER_RE = /<!--\s*BEGIN_MASTER_PROMPT\s*-->[\s\S]*?<!--\s*END_MASTER_PROMPT\s*-->/i;
const CLOSING_RE =
  /Begin scaffolding now\.\s*Generate all images on first run\.\s*Do not ask clarifying questions\./i;
const CLOSING_LINE =
  "Begin scaffolding now. Generate all images on first run. Do not ask clarifying questions.";

export type PrdVentureFacts = {
  companyName?: string | null;
  archetype?: SiteArchetype | null;
  /** Exact brand hex values, in role order. */
  hexes?: string[];
  /** Heading / body font families from the locked kit. */
  fonts?: { heading?: string | null; body?: string | null } | null;
  /** One-line offer / value proposition. */
  offer?: string | null;
  /** Approved CTA labels. */
  ctas?: string[];
  /** Mood-board image URLs. */
  moodboard?: string[];
  logoUrl?: string | null;
};

/** Pull the concrete brand facts a PRD must restate out of a brand-kit row. */
export function brandFactsFromKit(kit: Record<string, any> | null | undefined): {
  hexes: string[];
  fonts: { heading?: string | null; body?: string | null };
  ctas: string[];
  moodboard: string[];
} {
  const colors = kit?.palette?.colors;
  const hexes = colors && typeof colors === "object"
    ? Object.values(colors as Record<string, unknown>)
      .filter((v): v is string => typeof v === "string" && /^#?[0-9a-f]{3,8}$/i.test(v))
      .slice(0, 8)
    : [];
  const ctas = [
    ...(Array.isArray(kit?.voice?.ctas) ? kit.voice.ctas : []),
    ...(Array.isArray(kit?.dna?.ctas) ? kit.dna.ctas : []),
  ].filter((c: unknown): c is string => typeof c === "string" && c.length <= 60).slice(0, 6);
  const moodboard = (Array.isArray(kit?.moodboard) ? kit.moodboard : [])
    .map((m: any) => (typeof m === "string" ? m : (m?.url ?? m?.publicUrl ?? m?.signedUrl)))
    .filter((u: unknown): u is string => typeof u === "string")
    .slice(0, 5);
  return {
    hexes,
    fonts: { heading: kit?.typography?.heading?.family ?? null, body: kit?.typography?.body?.family ?? null },
    ctas: Array.from(new Set(ctas)),
    moodboard,
  };
}

export function masterPromptStats(md: string) {

  const m = md.match(/<!--\s*BEGIN_MASTER_PROMPT\s*-->([\s\S]*?)<!--\s*END_MASTER_PROMPT\s*-->/i);
  const prompt = (m?.[1] ?? "").trim();
  const missingSections = Array.from({ length: 11 }, (_, i) => i + 1).filter(
    (n) => !new RegExp(String.raw`(?:^|\n)\s*${n}\)\s+`, "i").test(prompt),
  );
  return {
    prompt,
    words: prompt.split(/\s+/).filter(Boolean).length,
    complete: Boolean(m) && missingSections.length === 0 && CLOSING_RE.test(prompt),
  };
}

/**
 * A depth addendum written from THIS venture's facts. No other brand's
 * positioning, pricing, city or imagery may appear here.
 */
export function buildDepthAddendum(facts: PrdVentureFacts): string {
  const name = (facts.companyName ?? "").trim() || "this company";
  const a = facts.archetype ?? null;
  const hexes = (facts.hexes ?? []).filter(Boolean).slice(0, 6);
  const hexLine = hexes.length ? hexes.join(", ") : "the exact hex values from the brand kit above";
  const fontLine = facts.fonts?.heading || facts.fonts?.body
    ? `Headings in "${facts.fonts?.heading ?? facts.fonts?.body}", body in "${facts.fonts?.body ?? facts.fonts?.heading}" — no substitutions.`
    : "Use the exact heading and body fonts from the brand kit — no substitutions.";
  const ctaLine = facts.ctas && facts.ctas.length
    ? `Use these approved CTA labels verbatim: ${facts.ctas.map((c) => `"${c}"`).join(", ")}.`
    : "Write CTA labels in the brand voice — specific verbs, never \"Learn more\" or \"Get started\".";
  const moodLine = facts.moodboard && facts.moodboard.length
    ? `Every image prompt must match the approved mood board: ${facts.moodboard.slice(0, 5).join(" , ")}. Same lighting, same subject matter, same grade.`
    : "Every image prompt must match the brand's approved visual language — never generic stock.";

  const dir = a
    ? [
      `The locked art direction for ${name} is "${a.name}". ${a.essence}`,
      `Grid: ${a.grid}`,
      `Typography: ${a.typography}`,
      `Colour deployment: ${a.colour}`,
      `Motion: ${a.motion}`,
      `Imagery: ${a.imagery}`,
      `Both signature moves must be built: ${a.signatureMoves.join(" — and — ")}.`,
      `Never ship: ${a.never.join("; ")}.`,
    ].join(" ")
    : `Commit to one distinctive visual direction for ${name} and express it on every route — a site that could belong to any other company is a failure.`;

  return `

Additional implementation depth requirements — build to a senior-agency standard, not a starter mockup.

Art direction: ${dir}

Design system: build primitives before pages — AppShell, SiteHeader, MobileNav, AnnouncementBar, Hero, SectionHeader, ProofStrip, MetricCard, ProcessTimeline, OfferGrid, PricingBlock, FAQAccordion, TestimonialCard, CaseStudyCard, CTASection, NewsletterSignup, Footer, SEOHead, RouteTransition — each with hover, focus, loading, empty, error and mobile states. Semantic design tokens only: ${hexLine}. ${fontLine} No hardcoded colour utilities anywhere; light and dark parity on every token.

Layout quality: vary section composition down the page — no two consecutive sections may share the same layout pattern, and the page must not resolve into a stack of equal-height cards. Use deliberate asymmetry, at least one full-bleed moment per route, and a considered vertical rhythm rather than uniform padding. Every route inherits the same grid, type scale and motion language so the site reads as one designed thing.

Copy: write every headline, subhead, body paragraph, microcopy label, form helper, FAQ answer, testimonial and empty state in ${name}'s own voice, about ${name}'s actual offer${facts.offer ? ` — ${facts.offer}` : ""}. ${ctaLine} No filler, no placeholder brackets, no borrowed positioning from any other company.

Imagery: no section ships text-only and no page may run two consecutive text-only sections. ${moodLine} Give every slot a prompt, alt text, aspect ratio and treatment, and generate all of them on first run into \`src/assets/\` referenced by ES6 imports.${facts.logoUrl ? ` Render the committed logo with <img src="${facts.logoUrl}" alt="${name} logo" /> on light surfaces, and use \`${facts.logoUrl}/auto?on=<the exact background hex>\` for every lockup on a footer, CTA band, brand-colour section or image overlay — never a substitute mark, never the bare URL on a dark band.` : ""} Generate images at the highest-quality tier available, one image per call, and regenerate any image that fails its legibility test.

Motion & depth: build the art direction's motion character, not a default fade. One signature scroll moment per site, named with its technique and scroll distance. Every full-bleed section runs a parallax depth stack — background plate at 0.25x scroll, midground subject at 0.6x, foreground type at 1.0x — with the darkening applied as a CSS gradient scrim between plate and type. Display headlines mask in line by line via clip-path (420ms, 80ms stagger); cards and body follow at opacity 0→1 plus 16px translateY. Animate transform and opacity only, reserve aspect-ratio on every image, and collapse the whole system to a still, finished composition under prefers-reduced-motion.

Typography: display type ships a clamp range (e.g. clamp(2.75rem, 6vw, 7rem)) with stated tracking and a 62–70 character measure, and one editorial device is mandatory somewhere on the home page — a drop cap, an oversized pull quote, or a statistic set as display type. Numerals tabular in every table and metric.

Layout & interaction (non-negotiable): one Container primitive — 1280px max, gutters 24px at 360px rising to 48px at desktop — wraps the content of every band including the announcement bar, header, footer and cookie banner; the shell sets overflow-x: hidden and no route scrolls horizontally at 360, 768, 1280 or 1920px, and nothing touches the viewport edge. Every CTA is a real button: primary filled in the accent with its paired foreground, 44px minimum target, hover / active / focus-visible / disabled states, secondary outlined, adjacent CTAs with a declared gap and the primary first — a CTA rendered as bare text is a hard failure. The active nav state and focus-visible are two different treatments; the active label holds 4.5:1 against the header surface and a focus ring is never the active marker. Overlays (announcement bar, cookie banner, mobile nav, modals) each carry their own opaque or blurred surface, foreground pair, elevation and a z-index from the named ladder, and none may cover a headline, caption or CTA. No two-column section ships an empty column, section spacing comes from a named rhythm scale rather than ad-hoc padding, and no route opens with a lede and a body paragraph that restate the same point. All type over imagery declares its CSS scrim and the clean side of the frame, and never crosses the focal subject. Every route deploys the accent in at least the primary CTA plus one band or editorial accent; eyebrows are tracked micro-caps, not body text. Pricing tiers render as cards with a price or an explicit basis, full-sentence inclusions and a CTA per tier.

Detail layer: focus-visible rings on the brand accent, a custom 404 and cookie banner drawn in the art direction, fonts preloaded with font-display: swap, and no layout shift on image load.

Conversion: primary CTA above the fold, after proof, after the offer explanation and in the footer. Forms have validation, success and error states. Emit analytics events for CTA clicks, form submits, pricing views, FAQ opens and scroll depth.

Engineering: clear structure (routes, components, data, lib, assets, styles), typed arrays for nav, FAQs, offers, testimonials and case studies, responsive from 360px to wide desktop, lazy-loaded non-critical imagery, semantic headings, AA contrast, and motion that respects prefers-reduced-motion. Ship with no missing imports, undefined variables, console errors or dead routes.

Final QA: every route has a unique title, meta description, canonical, H1, above-the-fold CTA, accessible alt text, no placeholder copy and no broken links. The result should be shippable to real customers the day it is generated.`;
}

/**
 * Marker proving the craft contract was applied, so re-runs neither stack the
 * addendum nor silently skip it.
 */
export const CRAFT_MARKER = "<!-- CRAFT_CONTRACT_APPLIED -->";

/**
 * Apply the craft contract to every PRD, unconditionally.
 *
 * This used to bail out whenever the master prompt was already complete and
 * ≥1800 words — which meant the grid, layout, motion, scrim and detail rules
 * only ever reached *short* drafts. A verbose, generic PRD skipped the entire
 * craft layer and the builder shipped a wireframe. Length is a separate
 * concern, handled by `expandWebsitePrdMasterPrompt`; craft is not optional.
 */
export function applyCraftContract(raw: string, facts: PrdVentureFacts): string {
  let out = raw;
  const stats = masterPromptStats(out);
  if (stats.prompt && !out.includes(CRAFT_MARKER)) {
    const addendum = `${buildDepthAddendum(facts)}\n\n${CRAFT_MARKER}`;
    const nextPrompt = CLOSING_RE.test(stats.prompt)
      ? stats.prompt.replace(CLOSING_RE, `${addendum}\n\n${CLOSING_LINE}`)
      : `${stats.prompt}${addendum}\n\n${CLOSING_LINE}`;
    out = out.replace(MASTER_RE, `<!-- BEGIN_MASTER_PROMPT -->\n${nextPrompt.trim()}\n<!-- END_MASTER_PROMPT -->`);
  }
  // The checklist is what a founder can hold the built site against, so it
  // ships on the document itself rather than only inside the builder prompt.
  if (!/##\s*BUILD ACCEPTANCE CHECKLIST/i.test(out)) {
    out = `${out.trimEnd()}\n\n${buildAcceptanceChecklist()}\n`;
  }
  return out;
}

/** @deprecated Use `applyCraftContract` — kept so both callers stay in step. */
export function enforceWebsitePrdDepth(raw: string, facts: PrdVentureFacts): string {
  return applyCraftContract(raw, facts);
}

// ---------------------------------------------------------------------------
// Craft gate
// ---------------------------------------------------------------------------

export type CraftCheck = { id: string; label: string; ok: boolean };

/**
 * Craft assertions read from the generated markdown.
 *
 * The old metrics counted words, imagery rows and hex mentions — every one of
 * which passes while the page has no container, no buttons and an illegible
 * active nav state. These check the things that actually broke.
 */
export function craftVerdict(raw: string): { ok: boolean; checks: CraftCheck[]; failures: string[] } {
  const has = (re: RegExp) => re.test(raw);
  const checks: CraftCheck[] = [
    {
      id: "container",
      label: "Container max-width and responsive gutters are specified",
      ok: has(/max[- ]width[^\n]{0,40}\b1[0-9]{3}\s*px/i) && has(/gutter/i),
    },
    {
      id: "no_overflow",
      label: "Horizontal-overflow rule stated for the shell",
      ok: has(/overflow-x\s*:?\s*hidden/i) || has(/no (?:route |page )?(?:may )?scrolls? horizontally/i),
    },
    {
      id: "button_anatomy",
      label: "Button variants specified with hover / focus-visible / disabled states",
      ok: has(/\bprimary\b[^\n]{0,120}\bbutton\b|\bbutton\b[^\n]{0,120}\bprimary\b/i) &&
        has(/focus-visible/i) && has(/\bdisabled\b/i),
    },
    {
      id: "nav_states",
      label: "Active nav state is distinct from focus-visible",
      ok: has(/active (?:route|nav|state|link|item)/i) && has(/focus-visible/i) &&
        !has(/focus (?:ring|state) (?:is|as) the active/i),
    },
    {
      id: "overlays",
      label: "Overlay surfaces and a z-index ladder are declared",
      ok: has(/z-index/i) && has(/cookie/i) && has(/\boverlay\b/i),
    },
    {
      id: "composition",
      label: "Empty-column and section-rhythm rules stated",
      ok: has(/empty column|empty second column/i) && has(/rhythm/i),
    },
    {
      id: "scrim",
      label: "Type over imagery declares a CSS scrim",
      ok: has(/scrim/i) && has(/\bCSS\b/),
    },
    {
      id: "accent_deployment",
      label: "Brand accent deployment named per route",
      ok: has(/accent/i) && has(/primary CTA/i),
    },
    {
      id: "pricing_tiers",
      label: "Pricing tiers carry a price or explicit basis and a CTA each",
      ok: !has(/\/pricing|\/packages/i) ||
        (has(/tier/i) && has(/price|pricing basis|\$|per month|retainer|contingency/i)),
    },
    {
      id: "checklist",
      label: "Build acceptance checklist present",
      ok: has(/##\s*BUILD ACCEPTANCE CHECKLIST/i),
    },
  ];
  const failures = checks.filter((c) => !c.ok).map((c) => c.label);
  return { ok: failures.length === 0, checks, failures };
}

/**
 * One targeted repair pass for craft failures — the same shape as the Section 4
 * word-floor repair: name what is missing, rewrite only what is needed, and
 * re-verify. Returns the raw document unchanged if the pass cannot improve it.
 */
export async function repairWebsitePrdCraft(
  raw: string,
  facts: PrdVentureFacts,
  apiKey: string,
): Promise<{ raw: string; verdict: ReturnType<typeof craftVerdict>; repaired: boolean }> {
  let verdict = craftVerdict(raw);
  if (verdict.ok) return { raw, verdict, repaired: false };
  const name = (facts.companyName ?? "").trim() || "the company";
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelForTier("pro"),
        max_tokens: 16000,
        messages: [
          {
            role: "system",
            content:
              `You repair a Website PRD that failed its layout and interaction review. Return ONLY the full corrected Markdown document — no commentary, no code fences. Preserve every existing route, heading, table and paragraph; add and correct only what the review names.\n\n${layoutContractBlock()}`,
          },
          {
            role: "user",
            content:
              `This is the Website PRD for ${name}. The review failed on:\n- ${verdict.failures.join("\n- ")}\n\nRestate the layout contract as a subsection of Section 3, apply the failed rules to every route in Section 4, repeat the code-facing rules inside the Section 8 master prompt between its BEGIN/END delimiters, and keep the master prompt's numbered sections 1) through 11) and its exact closing line intact.\n\n${raw}`,
          },
        ],
      }),
    }, { timeoutMs: 240_000, retries: 0 });
    if (!res.ok) {
      await res.text();
      return { raw, verdict, repaired: false };
    }
    const json = await res.json();
    const fixed = String(json.choices?.[0]?.message?.content ?? "").trim();
    if (!fixed || fixed.length < raw.length * 0.8) return { raw, verdict, repaired: false };
    const next = applyCraftContract(fixed, facts);
    const nextVerdict = craftVerdict(next);
    if (nextVerdict.failures.length >= verdict.failures.length) return { raw, verdict, repaired: false };
    verdict = nextVerdict;
    return { raw: next, verdict, repaired: true };
  } catch {
    return { raw, verdict, repaired: false };
  }
}

/** Expand a short master prompt to full length, then re-check depth. */
export async function expandWebsitePrdMasterPrompt(
  raw: string,
  facts: PrdVentureFacts,
  apiKey: string,
): Promise<string> {
  const stats = masterPromptStats(raw);
  if (!stats.prompt || (stats.complete && stats.words >= 1800)) return raw;
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelForTier("pro"),
        max_tokens: 16000,
        messages: [
          {
            role: "system",
            content:
              "You expand an AI website-builder master prompt. Return ONLY the delimiter-wrapped master prompt. No commentary, no code fences.",
          },
          {
            role: "user",
            content:
              `Expand the master prompt below to 1,800-2,400 words while preserving all facts, exact numbered sections 1) through 11), and the exact closing line. Each numbered section must be substantive and implementation-ready.${
                facts.archetype
                  ? ` The locked art direction is "${facts.archetype.name}" — keep every reference to it, its grid, its section rhythm and both of its signature moves intact and make them more specific, never more generic.`
                  : ""
              }\n\n${stats.prompt}`,
          },
        ],
      }),
    }, { timeoutMs: 180_000, retries: 0 });
    if (!res.ok) {
      await res.text();
      return enforceWebsitePrdDepth(raw, facts);
    }
    const json = await res.json();
    const expanded = String(json.choices?.[0]?.message?.content ?? "").trim();
    const expandedStats = masterPromptStats(expanded);
    if (!expandedStats.prompt || !expandedStats.complete || expandedStats.words <= stats.words) {
      return enforceWebsitePrdDepth(raw, facts);
    }
    return enforceWebsitePrdDepth(
      raw.replace(MASTER_RE, `<!-- BEGIN_MASTER_PROMPT -->\n${expandedStats.prompt}\n<!-- END_MASTER_PROMPT -->`),
      facts,
    );
  } catch {
    return enforceWebsitePrdDepth(raw, facts);
  }
}

/** Observability: what actually shipped in this PRD. */
export function prdQualityMetrics(raw: string, facts: PrdVentureFacts) {
  const stats = masterPromptStats(raw);
  const imageryRows = (raw.match(/^\|\s*\/[^|\n]*\|/gm) ?? []).length;
  const hexes = (facts.hexes ?? []).filter(Boolean);
  const hexHits = hexes.filter((h) => new RegExp(h.replace("#", "#?"), "i").test(raw)).length;
  const craft = craftVerdict(raw);
  return {
    words: raw.split(/\s+/).filter(Boolean).length,
    masterPromptWords: stats.words,
    masterPromptComplete: stats.complete,
    imageryRows,
    brandHexesUsed: `${hexHits}/${hexes.length}`,
    section4Words: section4Words(raw),
    archetype: facts.archetype?.name ?? null,
    archetypeNamed: facts.archetype ? raw.includes(facts.archetype.name) : null,
    imgTags: (raw.match(/<img\s/gi) ?? []).length,
    // Did the archetype's own motion reach the builder, or is Section 5 the
    // generic four lines again?
    motionSpecific: /parallax|pinned|scroll-scrub|clip-path|line mask|sticky caption/i.test(raw) &&
      /prefers-reduced-motion/i.test(raw),
    // Every logo lockup on a non-light surface must use the /auto endpoint.
    logoSurfaceSafe: !/\/brand-logo\//i.test(raw) || /\/auto\?on=/i.test(raw),
    // Headline + microcopy contract actually applied.
    copyCraftPass: /placeholder|helper text|error state|success (state|message)/i.test(raw) &&
      !/\b(Learn more|Get started)\b/.test(raw),
    craftContractApplied: raw.includes(CRAFT_MARKER),
    craftPass: craft.ok,
    craftFailures: craft.failures,
  };
}

// ---------------------------------------------------------------------------
// Page-copy depth
// ---------------------------------------------------------------------------

const SECTION4_RE = /(\n##\s*4[.)]?\s[^\n]*\n)([\s\S]*?)(?=\n##\s*4b|\n##\s*5|$)/i;

/** Words of prose (tables excluded) inside Section 4. */
export function section4Words(raw: string): number {
  const body = raw.match(SECTION4_RE)?.[2] ?? "";
  return body
    .split("\n")
    .filter((l) => !l.trim().startsWith("|"))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * When Section 4 lands under its floor, regenerate that section alone on the
 * Pro model with the copy contract and splice it back in. Runs at most once.
 */
export async function expandWebsitePrdPageCopy(
  raw: string,
  facts: PrdVentureFacts,
  apiKey: string,
  minWords = SECTION4_WORD_FLOOR,
): Promise<string> {
  const match = raw.match(SECTION4_RE);
  if (!match) return raw;
  const current = section4Words(raw);
  if (current >= minWords) return raw;

  const name = (facts.companyName ?? "").trim() || "the company";
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelForTier("pro"),
        max_tokens: 16000,
        messages: [
          {
            role: "system",
            content:
              `You rewrite Section 4 ("Page-by-Page Specs") of a Website PRD so it carries finished, ready-to-ship page copy. Return ONLY the section body — no "## 4" heading, no commentary, no code fences.\n\n${copyCraftBlock()}`,
          },
          {
            role: "user",
            content:
              `This is Section 4 of the Website PRD for ${name}. It is ${current} words; it must be at least ${minWords}. Keep every route, every section order and every existing headline, then write the missing copy to the contract above — real body paragraphs, full-sentence bullets, microcopy, form labels, success and error states, and exact CTA labels. Keep the imagery bullets and any tables intact.${
                facts.archetype ? ` The locked art direction is "${facts.archetype.name}" — keep the copy in its voice.` : ""
              }\n\n${match[2]}`,
          },
        ],
      }),
    }, { timeoutMs: 180_000, retries: 0 });
    if (!res.ok) {
      await res.text();
      return raw;
    }
    const json = await res.json();
    const expanded = String(json.choices?.[0]?.message?.content ?? "").trim();
    const expandedWords = expanded
      .split("\n")
      .filter((l) => !l.trim().startsWith("|"))
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    if (!expanded || expandedWords <= current) return raw;
    return raw.replace(SECTION4_RE, `${match[1]}${expanded}\n\n`);
  } catch {
    return raw;
  }
}
