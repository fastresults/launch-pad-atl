// Scrapes 1-3 founder-provided URLs and returns markdown + title for use as
// context in venture-synthesize-concept. Uses the Firecrawl REST v2 API.

import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const PER_URL_CAP = 30_000;
const MAX_URLS = 3;

type ScrapeResult = {
  url: string;
  title: string | null;
  text: string;
  charCount: number;
  error?: string;
};

function isPrivateIPv4(parts: number[]): boolean {
  if (parts.length !== 4 || parts.some((p) => !Number.isFinite(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isSafeUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, error: "Invalid URL" }; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http(s) URLs are allowed" };
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host.startsWith("[::") ||           // any IPv6 literal — too risky to allow
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) return { ok: false, error: "Private/loopback hosts are blocked" };

  // F12: catch IPv4 in dotted, decimal, octal, or hex form.
  //   dotted   → 127.0.0.1
  //   decimal  → 2130706433
  //   octal    → 0177.0.0.1
  //   hex      → 0x7f000001
  if (/^\d+$/.test(host)) {
    // single decimal integer
    const n = Number(host);
    if (Number.isFinite(n)) {
      const parts = [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
      if (isPrivateIPv4(parts)) return { ok: false, error: "Private IP is blocked" };
    }
    return { ok: false, error: "Numeric-only hosts are blocked" };
  }
  if (/^0x[0-9a-f]+$/i.test(host)) {
    return { ok: false, error: "Hex-encoded hosts are blocked" };
  }
  if (/^[\d.]+$/.test(host)) {
    // dotted-quad — accept each segment as decimal/octal/hex.
    const segs = host.split(".");
    const parts = segs.map((s) => {
      if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
      if (/^0\d+$/.test(s)) return parseInt(s, 8);
      return Number(s);
    });
    if (isPrivateIPv4(parts)) return { ok: false, error: "Private IP is blocked" };
  }
  return { ok: true, url: u };
}

async function scrapeWithFirecrawl(url: string): Promise<ScrapeResult> {
  if (!FIRECRAWL_API_KEY) {
    return await scrapeFallback(url, "Firecrawl not configured — used basic fetch fallback");
  }
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 1200,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error || `Firecrawl ${res.status}`;
      // Fall back to plain fetch for resilience
      return await scrapeFallback(url, typeof msg === "string" ? msg : "Firecrawl failed");
    }
    const data = json?.data ?? json;
    const md: string = (data?.markdown ?? "").toString();
    const title: string | null = data?.metadata?.title ?? null;
    const text = md.trim().slice(0, PER_URL_CAP);
    if (!text) return { url, title, text: "", charCount: 0, error: "Page had no readable text" };
    return { url, title, text, charCount: text.length };
  } catch (e) {
    return await scrapeFallback(url, e instanceof Error ? e.message : "Scrape error");
  }
}

async function scrapeFallback(url: string, note: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 StartupLabs Concept Bot" },
      redirect: "follow",
    });
    if (!res.ok) return { url, title: null, text: "", charCount: 0, error: `Fetch ${res.status} — ${note}` };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const text = stripped.slice(0, PER_URL_CAP);
    if (!text) return { url, title, text: "", charCount: 0, error: `Empty page — ${note}` };
    return { url, title, text, charCount: text.length };
  } catch (e) {
    return { url, title: null, text: "", charCount: 0, error: e instanceof Error ? e.message : "Fetch failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireUser(req, corsHeaders);
  if (auth.error) return auth.error;
  try {
    const body = await req.json().catch(() => ({}));
    const raw: unknown = body?.urls;
    if (!Array.isArray(raw) || raw.length === 0) {
      return new Response(JSON.stringify({ error: "Provide a non-empty urls array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const urls = raw.slice(0, MAX_URLS).map((u) => (typeof u === "string" ? u.trim() : ""));

    const results: ScrapeResult[] = [];
    for (const u of urls) {
      const check = isSafeUrl(u);
      if (!check.ok) { results.push({ url: u, title: null, text: "", charCount: 0, error: check.error }); continue; }
      results.push(await scrapeWithFirecrawl(check.url.toString()));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
