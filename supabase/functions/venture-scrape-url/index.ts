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

function isSafeUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, error: "Invalid URL" }; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http(s) URLs are allowed" };
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "::1"
  ) return { ok: false, error: "Private/loopback hosts are blocked" };
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
