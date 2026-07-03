// Shared helper to embed text via Lovable AI Gateway (OpenAI text-embedding-3-small, 1536 dims).
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

export async function embedText(text: string): Promise<number[]> {
  const input = (text ?? "").trim().slice(0, 8000);
  if (!input) throw new Error("embedText: empty input");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      // Documented header for the gateway; also accept Authorization as a fallback.
      "Lovable-API-Key": LOVABLE_API_KEY,
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Embedding failed ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error("Embedding response missing vector");
  return vec as number[];
}

/** pgvector accepts this literal form via PostgREST; a raw JS array does not. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export function chunkText(text: string, maxChars = 1400, overlap = 200): string[] {
  const clean = (text ?? "").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + maxChars, clean.length);
    chunks.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - overlap;
  }
  return chunks;
}
