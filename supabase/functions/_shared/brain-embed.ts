// Shared helper to embed text via Lovable AI Gateway (OpenAI text-embedding-3-small, 1536 dims).
import { aiFetch } from "./ai-fetch.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const input = texts.map((text) => (text ?? "").trim()).filter(Boolean);
  if (!input.length) throw new Error("embedTexts: empty input");

  const input = (text ?? "").trim().slice(0, 8000);
  if (!input) throw new Error("embedText: empty input");
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/embeddings", {
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
  }, { timeoutMs: 45_000, retries: 2 });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Embedding failed ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const vectors = data
    .slice()
    .sort((a: { index?: number }, b: { index?: number }) => (a.index ?? 0) - (b.index ?? 0))
    .map((row: { embedding?: unknown }) => row.embedding);
  if (vectors.length !== input.length || vectors.some((vec: unknown) => !Array.isArray(vec))) {
    throw new Error("Embedding response missing vector");
  }
  return vectors as number[][];
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
