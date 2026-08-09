// Server-side canonical venture context.
//
// Single source-of-truth that every AI edge function loads instead of
// re-querying snapshots + brief tables and stuffing raw JSON into prompts.
// Returns a typed VentureContext object plus helpers to emit a compact
// preamble or slice the snapshot brain for a specific deliverable.

export type VentureContext = {
  snapshotId: string;
  userId: string | null;
  // Raw rows (kept for callers that still need a specific field)
  snap: any;
  brief: any;
  founder: any;
  market: any;
  profile: any;
  // Compressed venture brain (computed once by snapshot-brain.ts)
  brain: VentureBrain | null;
  // Founder-uploaded source materials (cached extracted text)
  sources: {
    documents: Array<{ filename: string; text: string }>;
    urls: Array<{ url: string; title?: string; text: string }>;
  };
};

export type VentureBrain = {
  identity?: { company_name?: string; founder?: string; one_liner?: string };
  problem?: string;
  solution?: string;
  customer?: string;
  business_model_summary?: string;
  market_facts?: string[];
  differentiators?: string[];
  known_numbers?: Record<string, string | number>;
  banned_assumptions?: string[];
  generated_at?: string;
};

export async function loadVentureContext(
  supabase: any,
  snapshotId: string,
): Promise<VentureContext> {
  const { data: snap } = await supabase
    .from("venture_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .maybeSingle();
  if (!snap) throw new Error("Snapshot not found");

  const userId: string | null = snap.user_id ?? null;
  const [briefRes, founderRes, marketRes, profileRes] = await Promise.all([
    userId ? supabase.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle() : { data: null },
    userId ? supabase.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle() : { data: null },
    userId ? supabase.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle() : { data: null },
    userId ? supabase.from("attendee_profiles").select("*").eq("user_id", userId).maybeSingle() : { data: null },
  ]);

  const sm = snap.source_materials ?? {};
  const sources = {
    documents: Array.isArray(sm.documents)
      ? sm.documents.map((d: any) => ({ filename: String(d.filename ?? "document"), text: String(d.text ?? "") }))
      : [],
    urls: Array.isArray(sm.urls)
      ? sm.urls.map((u: any) => ({ url: String(u.url ?? ""), title: u.title, text: String(u.text ?? "") }))
      : [],
  };

  return {
    snapshotId,
    userId,
    snap,
    brief: briefRes.data ?? null,
    founder: founderRes.data ?? null,
    market: marketRes.data ?? null,
    profile: profileRes.data ?? null,
    brain: (snap.snapshot_brain as VentureBrain) ?? null,
    sources,
  };
}

/**
 * Compact preamble: a ~600-token markdown block that every generation prompt
 * includes verbatim. Replaces the 8-12KB of duplicated founder + brand +
 * extracted_data JSON every function was previously injecting.
 */
export function compactPreamble(ctx: VentureContext): string {
  const s = ctx.snap;
  const lines: string[] = [];
  lines.push("## Venture preamble (authoritative — every section must reflect these facts)");
  lines.push(`- Company: ${s.company_name ?? "[not provided]"}`);
  lines.push(`- Founder: ${s.founder_name ?? "[not provided]"}${s.founder_email ? ` <${s.founder_email}>` : ""}`);
  lines.push(`- Industry: ${s.industry ?? "[not provided]"}${s.sub_industry ? ` / ${s.sub_industry}` : ""}`);
  lines.push(`- Track: ${s.track ?? "lifestyle"}`);
  lines.push(`- Location: ${[s.city, s.region, s.country].filter(Boolean).join(", ") || "[not provided]"} (scope: ${s.market_scope ?? "local"})`);
  if (s.concept_summary) lines.push(`- North-star concept: ${s.concept_summary}`);
  if (s.value_proposition) lines.push(`- Value proposition: ${s.value_proposition}`);
  if (s.differentiation_statement) lines.push(`- Differentiation: ${s.differentiation_statement}`);
  if (s.brand_tokens) {
    lines.push(`- Brand tokens: ${JSON.stringify(s.brand_tokens)}`);
  }
  // Numbers the founder has already confirmed
  const numbers: Record<string, any> = {};
  for (const k of ["current_revenue", "monthly_burn", "runway_months", "funding_raised"]) {
    const v = ctx.profile?.[k];
    if (v !== null && v !== undefined && v !== "") numbers[k] = v;
  }
  if (Object.keys(numbers).length) {
    lines.push(`- Confirmed financials: ${JSON.stringify(numbers)}`);
  }
  return lines.join("\n");
}

/**
 * Slice the snapshot brain to only the keys a deliverable needs. Returns
 * `null` when there is no brain yet (caller should fall back to raw blobs).
 */
export function pickBrainSlice(
  brain: VentureBrain | null,
  keys: string[] | null | undefined,
): Partial<VentureBrain> | null {
  if (!brain) return null;
  if (!keys || keys.length === 0) return brain;
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (brain[k as keyof VentureBrain] !== undefined) out[k] = brain[k as keyof VentureBrain];
  }
  return out as Partial<VentureBrain>;
}

/**
 * Distill upstream dependency docs into 3-5 bullet summaries instead of
 * dumping full markdown. Pure-text heuristic — extracts H1/H2 lines and the
 * first 2 sentences of each section. Cheap, deterministic, no model call.
 */
export function distillDeps(
  depDocs: Array<{ document_type: string; content: string | null }>,
): string {
  const blocks: string[] = [];
  for (const d of depDocs) {
    if (!d.content) continue;
    const headings = d.content
      .split("\n")
      .filter((l) => /^#{1,3}\s+/.test(l))
      .map((l) => l.replace(/^#+\s+/, "").trim())
      .slice(0, 8);
    const firstPara = d.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#") && !p.startsWith("```"));
    const summary = firstPara ? firstPara.split(/(?<=\.)\s+/).slice(0, 2).join(" ") : "";
    blocks.push(
      `### ${d.document_type}\n` +
        (headings.length ? `Sections: ${headings.join(" · ")}\n` : "") +
        (summary ? `TL;DR: ${summary.slice(0, 400)}` : ""),
    );
  }
  return blocks.join("\n\n");
}

/**
 * Render the founder-uploaded source materials compactly. Used when a
 * deliverable explicitly needs the raw source text (rare — most generators
 * should rely on the snapshot brain instead).
 */
export function renderSources(ctx: VentureContext, perSourceCap = 6000): string {
  // Cap injected documents to the most-recent 10 to keep prompts bounded
  // even when a venture has many uploads attached.
  const docs = ctx.sources.documents.slice(-10);
  const urls = ctx.sources.urls.slice(-10);
  const docBlocks = docs.map(
    (d, i) => `### Doc ${i + 1}: ${d.filename}\n${d.text.slice(0, perSourceCap)}`,
  );
  const urlBlocks = urls.map(
    (u, i) => `### URL ${i + 1}: ${u.url}${u.title ? ` (${u.title})` : ""}\n${u.text.slice(0, perSourceCap)}`,
  );
  return [...docBlocks, ...urlBlocks].join("\n\n");
}

/**
 * Deliverables that REQUIRE a locked Brand Kit before they can be generated.
 * The Brand Kit (palette, typography, primary logo, voice) is injected as
 * authoritative context for these prompts.
 */
export const BRAND_KIT_REQUIRED_TYPES = new Set<string>(["website_prd", "presell_landing_prd"]);

export type BrandKitRow = {
  status?: string | null;
  locked_at?: string | null;
  palette?: any;
  typography?: any;
  voice?: any;
  logos?: any[] | null;
  guide_markdown?: string | null;
  dna?: any;
  moodboard?: any[] | null;
  art_direction?: any;
};

export const BRAND_KIT_SELECT =
  "status, locked_at, palette, typography, voice, logos, guide_markdown, dna, moodboard, art_direction";

export async function loadBrandKit(supabase: any, snapshotId: string): Promise<BrandKitRow | null> {
  const { data } = await supabase
    .from("venture_brand_kits")
    .select(BRAND_KIT_SELECT)

    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  return (data ?? null) as BrandKitRow | null;
}

/**
 * A kit is usable for generation when the founder locked it, or when we derived
 * a provisional one ("auto") from the assets they already have. Anything else
 * (missing, half-finished draft) still gates the deliverable.
 */
export function isBrandKitUsable(kit: BrandKitRow | null): boolean {
  return kit?.status === "locked" || kit?.status === "auto";
}

/**
 * Render a usable Brand Kit as a prompt block. Locked kits are ground truth;
 * derived ("auto") kits are labelled provisional so the model knows the founder
 * may still revise them. Returns "" when the kit is missing or unusable.
 */
export function brandLogoUrl(snapshotId: string, variant = "mark"): string {
  const base = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  return variant === "mark"
    ? `${base}/functions/v1/brand-logo/${snapshotId}`
    : `${base}/functions/v1/brand-logo/${snapshotId}/${variant}`;
}

export function brandKitBlock(kit: BrandKitRow | null, snapshotId?: string): string {
  if (!isBrandKitUsable(kit) || !kit) return "";
  const lines: string[] = [];
  const track = kit.dna?.track;
  const sourceUrl = kit.dna?.source_url;
  if (kit.status === "auto") {
    lines.push("## BRAND KIT (PROVISIONAL — inferred from this venture's existing assets; use it consistently throughout, but it may be revised later)");
  } else if (track === "existing") {
    lines.push(`## BRAND KIT (LOCKED — EXISTING brand, extracted from ${sourceUrl ?? "uploaded assets"}; treat as ground truth, do not modernize or replace)`);
  } else {
    lines.push("## BRAND KIT (LOCKED — authoritative, use VERBATIM, do not invent alternates)");
  }

  const logos = Array.isArray(kit.logos) ? kit.logos : [];
  const primaryLogo = logos.find((l: any) => l && l.primary) ?? logos[0];
  if (primaryLogo) {
    const durable = snapshotId ? brandLogoUrl(snapshotId) : (primaryLogo.public_url ?? primaryLogo.url);
    if (durable) {
      lines.push(`- Primary logo URL (PERMANENT — embed exactly this, never a placeholder): ${durable}`);
      lines.push(`  Markup to use in the site: <img src="${durable}" alt="${primaryLogo.alt ?? primaryLogo.title ?? primaryLogo.direction_name ?? "Logo"}" />`);
    }
    if (snapshotId && primaryLogo.variants) {
      const available = ["horizontal", "stacked", "mono", "knockout"].filter((v) => primaryLogo.variants?.[v]);
      for (const v of available) {
        lines.push(`  - ${v} lockup: ${brandLogoUrl(snapshotId, v)}`);
      }
    }
    if (primaryLogo.meaning) lines.push(`  Mark rationale: ${primaryLogo.meaning}`);
  }
  const colors = kit.palette?.colors ?? null;
  if (colors && typeof colors === "object") {
    lines.push("- Color tokens (exact hex, by role — use as CSS variables):");
    lines.push("\n| Token | Hex | Use |\n| --- | --- | --- |");
    for (const [k, v] of Object.entries(colors)) {
      lines.push(`| \`--${k}\` | ${v} | ${k} |`);
    }
  }
  if (kit.palette) {
    lines.push(`- Full palette object (use these exact hex values for every color token, dark mode included):\n\`\`\`json\n${JSON.stringify(kit.palette, null, 2)}\n\`\`\``);
  }
  const heading = kit.typography?.heading?.family;
  const body = kit.typography?.body?.family;
  if (heading || body) {
    const fams = [heading, body].filter(Boolean).map((f: string) => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700`);
    lines.push(`- Fonts: headings "${heading ?? body}", body "${body ?? heading}".`);
    lines.push(`  Google Fonts import: \`<link href="https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap" rel="stylesheet">\``);
  }
  if (kit.typography) {
    lines.push(`- Typography (use these exact Google Fonts for heading + body — do not substitute):\n\`\`\`json\n${JSON.stringify(kit.typography, null, 2)}\n\`\`\``);
  }
  if (kit.voice) {
    lines.push(`- Voice & tone (apply to every page of copy):\n\`\`\`json\n${JSON.stringify(kit.voice, null, 2)}\n\`\`\``);
  }
  if (kit.guide_markdown) {
    const excerpt = String(kit.guide_markdown).slice(0, 1600);
    lines.push(`- Style-guide excerpt (treat as ground truth):\n${excerpt}`);
  }
  lines.push("\nHARD RULES for this generation: every color, font name, and logo reference MUST come from the block above. Do not propose alternates, do not 'modernize' the palette, do not pick a different Google Font. If a section needs more colors than the palette provides, derive tints/shades from the existing hex values rather than introducing new hues.");
  return lines.join("\n");
}
