// Founder Second Brain corpus retrieval for generators.
//
// The snapshot brain (snapshot-brain.ts) is a compressed venture summary.
// The *corpus* is everything the founder actually put in their Second Brain:
// uploaded materials (PDFs, docs, links, images), notes, and extracted
// sources — chunked and embedded in `founder_brain_memory`.
//
// Every "Generate" path should ground its prompt in this corpus so a
// regeneration reflects the founder's latest uploads, not a stale summary.

import { embedText, toVectorLiteral } from "./brain-embed.ts";

export type BrainChunk = {
  kind: string;
  source_ref: string | null;
  title: string | null;
  content: string | null;
};

/**
 * Retrieve the corpus chunks most relevant to `query`. Falls back to the most
 * recent chunks when embedding/retrieval fails, so generation is never blocked
 * by a gateway hiccup — it just gets less-targeted grounding.
 */
export async function loadBrainCorpus(
  admin: any,
  userId: string | null,
  snapshotId: string | null,
  opts: { query?: string; limit?: number } = {},
): Promise<BrainChunk[]> {
  if (!userId) return [];
  const limit = opts.limit ?? 10;
  const query = (opts.query ?? "").trim();

  if (query) {
    try {
      const emb = await embedText(query);
      const { data } = await admin.rpc("match_founder_brain_memory", {
        _user_id: userId,
        query_embedding: toVectorLiteral(emb),
        match_count: limit,
        _snapshot_id: snapshotId,
      });
      const rows = Array.isArray(data) ? data : [];
      if (rows.length) return rows as BrainChunk[];
    } catch (e) {
      console.warn("loadBrainCorpus: retrieval failed, falling back to recent", e);
    }
  }

  const q = admin
    .from("founder_brain_memory")
    .select("kind, source_ref, title, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (snapshotId) q.eq("snapshot_id", snapshotId);
  const { data } = await q;
  return (Array.isArray(data) ? data : []) as BrainChunk[];
}

/** Render corpus chunks as an authoritative prompt block. Empty string when none. */
export function renderBrainCorpus(chunks: BrainChunk[], perChunkChars = 1400): string {
  if (!chunks.length) return "";
  const body = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.kind}${c.title ? ` · ${c.title}` : ""})\n${(c.content ?? "").slice(0, perChunkChars)}`,
    )
    .join("\n\n---\n\n");
  return [
    "## Founder's Second Brain corpus (AUTHORITATIVE — the founder's own uploaded materials and notes)",
    "Ground every claim below in this material. Where it conflicts with the compressed summary, THIS WINS. Never invent facts it does not support.",
    "",
    body,
  ].join("\n");
}

/**
 * One-call convenience: retrieve + render. Returns "" when the founder has no
 * corpus yet.
 */
export async function brainCorpusBlock(
  admin: any,
  userId: string | null,
  snapshotId: string | null,
  query: string,
  limit = 10,
): Promise<string> {
  const chunks = await loadBrainCorpus(admin, userId, snapshotId, { query, limit });
  return renderBrainCorpus(chunks);
}

/**
 * A compact digest of the whole corpus (titles + leading text), used when
 * building the compressed snapshot brain so the summary itself reflects
 * everything the founder uploaded.
 */
export async function loadCorpusDigest(
  admin: any,
  userId: string | null,
  snapshotId: string | null,
  maxChars = 24_000,
): Promise<string> {
  if (!userId) return "";
  const q = admin
    .from("founder_brain_memory")
    .select("kind, title, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(120);
  if (snapshotId) q.eq("snapshot_id", snapshotId);
  const { data } = await q;
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return "";

  const out: string[] = [];
  let used = 0;
  for (const r of rows) {
    const block = `- (${r.kind}${r.title ? ` · ${r.title}` : ""}) ${(r.content ?? "").slice(0, 800)}`;
    if (used + block.length > maxChars) break;
    out.push(block);
    used += block.length;
  }
  return out.join("\n");
}
