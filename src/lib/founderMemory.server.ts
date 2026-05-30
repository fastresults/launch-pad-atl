// Server-only helpers for founder memory.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BRIEF_BLOCKS, QA_BLOCKS, fieldLabel } from "@/lib/brief-blocks";

export type FounderMemoryRow = {
  id: string;
  source: string;
  source_key: string;
  block_n: number | null;
  field_keys: string[];
  qa: Array<{ key: string; label: string; answer: string; voice_transcript?: string | null }>;
  summary: string | null;
  bullets: string[];
  created_at: string;
};

export async function loadCurrentFounderMemory(userId: string): Promise<FounderMemoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from("attendee_founder_memory")
    .select("id, source, source_key, block_n, field_keys, qa, summary, bullets, created_at")
    .eq("user_id", userId)
    .is("superseded_at", null)
    .order("source", { ascending: true })
    .order("source_key", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FounderMemoryRow[];
}

// Build a single Markdown context string for AI prompts (the 25 deliverables).
export async function loadFounderContext(userId: string): Promise<string> {
  const [{ data: brief }, { data: founder }, { data: market }, memories] = await Promise.all([
    supabaseAdmin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("attendee_founder_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("attendee_market_profile" as never)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    loadCurrentFounderMemory(userId),
  ]);

  const lines: string[] = ["## Founder memory", ""];

  if (brief) {
    lines.push("### Raw startup brief answers");
    for (const block of QA_BLOCKS) {
      for (const key of block.fieldKeys) {
        const value = (brief as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim()) {
          lines.push(`- **${fieldLabel(key)}**`);
          lines.push(`  ${value.trim()}`);
        }
      }
    }
    lines.push("");
  }

  if (founder) {
    const f = founder as Record<string, unknown>;
    const extracted = (f.extracted ?? {}) as Record<string, unknown>;
    lines.push("### Founder background");
    if (extracted.headline) lines.push(`- Headline: ${extracted.headline}`);
    if (extracted.years_experience) lines.push(`- Years experience: ${extracted.years_experience}`);
    if (extracted.location) lines.push(`- Location: ${extracted.location}`);
    const roles = (extracted.roles as Array<{ title: string; company?: string; years?: string }>) ?? [];
    if (roles.length) {
      lines.push("- Roles:");
      for (const r of roles) lines.push(`  - ${r.title}${r.company ? ` @ ${r.company}` : ""}${r.years ? ` (${r.years})` : ""}`);
    }
    const skills = (extracted.skills as string[]) ?? [];
    if (skills.length) lines.push(`- Skills: ${skills.join(", ")}`);
    const industries = (extracted.industries as string[]) ?? [];
    if (industries.length) lines.push(`- Industries: ${industries.join(", ")}`);
    const wins = (extracted.wins as string[]) ?? [];
    if (wins.length) {
      lines.push("- Notable wins:");
      for (const w of wins) lines.push(`  - ${w}`);
    }
    if (f.right_person_reason) lines.push(`- Why they're the right person: ${f.right_person_reason}`);
    if (f.unfair_advantage) lines.push(`- Unfair advantage: ${f.unfair_advantage}`);
    if (f.linkedin_url) lines.push(`- LinkedIn: ${f.linkedin_url}`);
    lines.push("");
  }

  if (market) {
    const m = market as Record<string, unknown>;
    lines.push("### Market & model");
    const archetype = (m.archetype as string[]) ?? [];
    if (archetype.length) lines.push(`- Archetype: ${archetype.join(", ")}`);
    if (m.geography) lines.push(`- Geography: ${m.geography}`);
    if (m.industry) lines.push(`- Industry: ${m.industry}`);
    const channels = (m.channels as string[]) ?? [];
    if (channels.length) lines.push(`- Primary channels: ${channels.join(", ")}`);
    if (m.customer_type) lines.push(`- Who pays: ${m.customer_type}`);
    if (m.market_note) lines.push(`- Note: ${m.market_note}`);
    lines.push("");
  }

  const mems = memories.sort((a, b) => (a.block_n ?? 0) - (b.block_n ?? 0));
  if (mems.length) {
    lines.push("### Block recaps (AI summaries the founder confirmed)");
    for (const m of mems) {
      const block = BRIEF_BLOCKS.find((b) => b.id === m.block_n);
      lines.push(`#### Block ${m.block_n}${block ? ` — ${block.title}` : ""}`);
      if (m.summary) lines.push(m.summary);
      if (m.bullets?.length) for (const b of m.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
