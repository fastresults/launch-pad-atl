// Higgsfield platform API client (server-side only).
//
// Auth is a key/secret header pair issued at platform.higgsfield.ai -> API keys.
// IMPORTANT: platform API credits are a SEPARATE wallet from the Higgsfield app
// subscription. A funded app plan does not fund this endpoint — an empty API
// wallet returns 403 "Not enough credits", which we surface verbatim so the
// pipeline can fall back instead of retrying forever.

import { aiFetch } from "./ai-fetch.ts";

const BASE = "https://platform.higgsfield.ai";

/** Square sizes the Soul text2image endpoint accepts. Logos always use square. */
export const HF_SQUARE = "1536x1536" as const;

export class HiggsfieldError extends Error {
  status: number;
  body: string;
  /** True when the failure can never succeed on retry (bad key, no credits). */
  terminal: boolean;

  constructor(status: number, body: string) {
    super(`Higgsfield ${status}: ${body.slice(0, 500)}`);
    this.name = "HiggsfieldError";
    this.status = status;
    this.body = body;
    this.terminal = status === 401 || status === 403 || status === 422;
  }
}

function credentials(): { key: string; secret: string } | null {
  const key = Deno.env.get("HIGGSFIELD_API_KEY");
  const secret = Deno.env.get("HIGGSFIELD_API_SECRET");
  if (!key || !secret) return null;
  return { key, secret };
}

export function higgsfieldConfigured(): boolean {
  return credentials() !== null;
}

function headers() {
  const creds = credentials();
  if (!creds) throw new Error("HIGGSFIELD_API_KEY / HIGGSFIELD_API_SECRET not configured");
  return {
    "hf-api-key": creds.key,
    "hf-secret": creds.secret,
    "Content-Type": "application/json",
  };
}

async function request(path: string, init: RequestInit): Promise<any> {
  const res = await aiFetch(`${BASE}${path}`, { ...init, headers: headers() }, {
    timeoutMs: 60_000,
    retries: 1,
  });
  const text = await res.text();
  if (!res.ok) throw new HiggsfieldError(res.status, text);
  try {
    return JSON.parse(text);
  } catch {
    throw new HiggsfieldError(res.status, `non-JSON response: ${text.slice(0, 300)}`);
  }
}

export interface SoulRenderOptions {
  prompt: string;
  /** Negative prompt — things that must not appear in the mark. */
  negativePrompt?: string;
  seed?: number;
  /** Higgsfield rewrites short prompts when true; our prompts are already art-directed. */
  enhancePrompt?: boolean;
}

/** Submits a Soul text2image job. Returns the job id to poll. */
export async function submitSoulRender(opts: SoulRenderOptions): Promise<string> {
  const body: Record<string, unknown> = {
    params: {
      prompt: opts.prompt,
      width_and_height: HF_SQUARE,
      quality: "1080p",
      batch_size: 1,
      enhance_prompt: opts.enhancePrompt ?? false,
    },
  };
  if (opts.negativePrompt) (body.params as any).negative_prompt = opts.negativePrompt;
  if (typeof opts.seed === "number") (body.params as any).seed = opts.seed;

  const data = await request("/v1/text2image/soul", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const id = data?.id ?? data?.job_id ?? data?.request_id ?? data?.jobs?.[0]?.id;
  if (!id) throw new HiggsfieldError(200, `no job id in response: ${JSON.stringify(data).slice(0, 300)}`);
  return String(id);
}

export type HfJobState = "queued" | "in_progress" | "completed" | "failed";

export interface HfJobStatus {
  state: HfJobState;
  /** Present once completed. */
  imageUrl?: string;
  raw: any;
}

function extractImageUrl(data: any): string | undefined {
  const candidates = [
    data?.results?.raw?.url,
    data?.results?.min?.url,
    data?.result?.url,
    data?.results?.[0]?.url,
    data?.jobs?.[0]?.results?.raw?.url,
    data?.jobs?.[0]?.results?.min?.url,
    data?.url,
  ];
  return candidates.find((u: unknown): u is string => typeof u === "string" && u.startsWith("http"));
}

function normalizeState(raw: unknown): HfJobState {
  const s = String(raw ?? "").toLowerCase();
  if (s === "completed" || s === "succeeded" || s === "success") return "completed";
  if (s === "failed" || s === "error" || s === "canceled" || s === "cancelled") return "failed";
  if (s === "in_progress" || s === "processing" || s === "running") return "in_progress";
  return "queued";
}

export async function getSoulJob(jobId: string): Promise<HfJobStatus> {
  const data = await request(`/v1/job-sets/${jobId}`, { method: "GET" });
  const node = data?.jobs?.[0] ?? data;
  const state = normalizeState(node?.status ?? node?.state);
  const imageUrl = extractImageUrl(node) ?? extractImageUrl(data);
  // A "completed" set with no asset is a failure, not a success.
  if (state === "completed" && !imageUrl) {
    return { state: "failed", raw: data };
  }
  return { state, imageUrl, raw: data };
}

export interface RenderResult {
  imageUrl: string;
  jobId: string;
}

/**
 * Submit + poll to completion. Kept well under the Edge Function wall clock so
 * the caller's atomic-stage ledger can lease, time out, and retry cleanly.
 */
export async function renderLogoConcept(
  opts: SoulRenderOptions,
  { timeoutMs = 100_000, pollMs = 3_000 }: { timeoutMs?: number; pollMs?: number } = {},
): Promise<RenderResult> {
  const jobId = await submitSoulRender(opts);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const status = await getSoulJob(jobId);
    if (status.state === "completed" && status.imageUrl) {
      return { imageUrl: status.imageUrl, jobId };
    }
    if (status.state === "failed") {
      throw new HiggsfieldError(502, `render job ${jobId} failed: ${JSON.stringify(status.raw).slice(0, 300)}`);
    }
  }
  throw new HiggsfieldError(504, `render job ${jobId} did not finish within ${Math.round(timeoutMs / 1000)}s`);
}

/** Downloads a finished render as bytes for storage upload. */
export async function fetchRenderBytes(url: string): Promise<Uint8Array> {
  const res = await aiFetch(url, { method: "GET" }, { timeoutMs: 60_000, retries: 2 });
  if (!res.ok) throw new HiggsfieldError(res.status, `could not download render: ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

export type HiggsfieldAuthState = "not_configured" | "ok" | "invalid" | "unreachable";

export interface HiggsfieldAuthCheck {
  state: HiggsfieldAuthState;
  detail: string | null;
}

/**
 * FREE credential probe — costs no render credits.
 *
 * The platform exposes no balance endpoint (every /v1/credits-style path 404s),
 * so the only free signal is whether auth passes. We GET a job-set that cannot
 * exist: valid credentials answer 404 "Job set not found", missing or wrong
 * credentials answer 401/422. Credit state is NOT observable here — it only
 * shows up when a real render is submitted, so the UI reports credits from the
 * last actual render outcome instead of guessing.
 */
export async function checkHiggsfieldAuth(): Promise<HiggsfieldAuthCheck> {
  if (!higgsfieldConfigured()) {
    return { state: "not_configured", detail: "Higgsfield API key and secret are not set." };
  }
  const probeId = "00000000-0000-0000-0000-000000000000";
  try {
    const res = await aiFetch(`${BASE}/v1/job-sets/${probeId}`, { method: "GET", headers: headers() }, {
      timeoutMs: 15_000,
      retries: 1,
    });
    if (res.status === 404) return { state: "ok", detail: null };
    if (res.status === 401 || res.status === 422) {
      return { state: "invalid", detail: "Higgsfield rejected the API key or secret." };
    }
    if (res.ok) return { state: "ok", detail: null };
    return { state: "unreachable", detail: `Higgsfield returned ${res.status}.` };
  } catch (e) {
    return { state: "unreachable", detail: e instanceof Error ? e.message : String(e) };
  }
}

/** True when an error string is Higgsfield telling us the API wallet is empty. */
export function isCreditExhaustion(message: string): boolean {
  return /not enough credits|insufficient credits/i.test(message);
}

/**
 * PAID probe — submits a real render and therefore spends one credit when the
 * wallet is funded. Only call this from an explicit user action.
 * Returns a human-readable reason, or null when Higgsfield is good to go.
 */
export async function probeHiggsfield(): Promise<string | null> {
  if (!higgsfieldConfigured()) return "Higgsfield credentials are not configured.";
  try {
    await submitSoulRender({ prompt: "a single solid black circle centered on a plain white background" });
    return null;
  } catch (e) {
    if (e instanceof HiggsfieldError) {
      if (e.status === 403 && /credit/i.test(e.body)) {
        return "Higgsfield platform API has no credits. Note: platform API credits are billed separately from the Higgsfield app subscription — top up at platform.higgsfield.ai.";
      }
      if (e.status === 401) return "Higgsfield API key or secret is invalid.";
      return e.message;
    }
    return e instanceof Error ? e.message : String(e);
  }
}
