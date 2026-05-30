// Server-only helpers for founder memory.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BRIEF_BLOCKS, fieldLabel } from "@/lib/brief-blocks";

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
  const [{ data: brief }, memories] = await Promise.all([
    supabaseAdmin
      .from("attendee_business_brief")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    loadCurrentFounderMemory(userId),
  ]);

  const lines: string[] = ["## Founder memory", ""];

  if (brief) {
    lines.push("### Raw startup brief answers");
    for (const block of BRIEF_BLOCKS) {
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

  const briefMems = memories
    .filter((m) => m.source === "brief_block")
    .sort((a, b) => (a.block_n ?? 0) - (b.block_n ?? 0));

  if (briefMems.length) {
    lines.push("### Block recaps (AI summaries the founder confirmed)");
    for (const m of briefMems) {
      const block = BRIEF_BLOCKS.find((b) => b.id === m.block_n);
      lines.push(`#### Block ${m.block_n}${block ? ` — ${block.title}` : ""}`);
      if (m.summary) lines.push(m.summary);
      if (m.bullets?.length) {
        for (const b of m.bullets) lines.push(`- ${b}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
