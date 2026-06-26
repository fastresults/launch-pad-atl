// Resilient fetch for the Lovable AI Gateway (and any HTTP call we want hardened).
// - Adds an AbortSignal timeout so hung connections cannot pin the Edge Function
//   until the platform kills it.
// - Retries 429 / 500 / 502 / 503 / 504 with exponential backoff (1s, 3s, 9s).
// - Honors Retry-After when the server sends one.
// - Passes through everything else (4xx, network errors after retries) so the
//   caller's existing error-handling path still fires.

export interface AiFetchOptions {
  timeoutMs?: number;
  retries?: number;
  /** Status codes to retry. Defaults to common transient codes. */
  retryOn?: number[];
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

function backoffMs(attempt: number): number {
  // 1s, 3s, 9s
  return 1000 * Math.pow(3, attempt);
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * 250);
}

export async function aiFetch(
  url: string,
  init: RequestInit = {},
  opts: AiFetchOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const maxRetries = opts.retries ?? 2;
  const retryOn = opts.retryOn ? new Set(opts.retryOn) : RETRYABLE;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(t);

      if (res.ok || !retryOn.has(res.status) || attempt === maxRetries) {
        return res;
      }

      // Retryable status — honor Retry-After when present.
      let delay = jitter(backoffMs(attempt));
      const retryAfter = res.headers.get("retry-after");
      if (retryAfter) {
        const asNum = Number(retryAfter);
        if (!Number.isNaN(asNum) && asNum > 0) delay = Math.max(delay, asNum * 1000);
      }
      // Drain body to free the connection.
      try { await res.text(); } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, delay));
      continue;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      // AbortError or network error — retry unless we're out of attempts.
      if (attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, jitter(backoffMs(attempt))));
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(`aiFetch failed after ${maxRetries + 1} attempts`);
}
