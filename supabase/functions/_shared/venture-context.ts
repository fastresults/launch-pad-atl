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
