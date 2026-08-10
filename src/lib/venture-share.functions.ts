// @ts-nocheck
// Owner-side CRUD for public venture share links, plus the public fetch used by
// the share page itself (which runs signed-out and goes through the edge
// function so private storage is never exposed to the browser).
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";

export interface VentureShare {
  id: string;
  snapshot_id: string;
  user_id: string;
  token: string;
  /** Readable address derived from the venture name; preferred over token in URLs. */
  slug: string | null;
  title: string | null;
  excluded_keys: string[];
  password_hash: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareBrandBoard {
  paletteName?: string | null;
  swatches: { label: string; hex: string }[];
  fonts: { role: string; family: string; weight?: number | null }[];
  logos: { url: string; label?: string | null }[];
  moodboard?: { url: string; caption?: string | null }[];
  dna?: { positioning?: string | null; traits?: string[]; toneWords?: string[] } | null;
  voice?: { summary?: string | null; principles?: string[]; dos?: string[]; donts?: string[] } | null;
  ctas?: string[];
}


/** One verified figure pulled from the venture's own finance assets. */
export interface ShareMetric {
  label: string;
  value: string;
  note?: string | null;
  source?: string | null;
}

export interface ShareImage {
  url: string;
  label?: string | null;
  width?: number | null;
  height?: number | null;
  /** Copy that ships with the creative, surfaced in the preview modal. */
  meta?: {
    platform?: string | null;
    day?: string | null;
    week?: number | null;
    pillar?: string | null;
    aspect?: string | null;
    headline?: string | null;
    hook?: string | null;
    body?: string | null;
    cta?: string | null;
    hashtags?: string[] | null;
    assetKind?: string | null;
    filename?: string | null;
  } | null;
}

export interface ShareItem {
  key: string;
  title: string;
  subtitle?: string | null;
  kind: "doc" | "gallery" | "timeline";
  body?: string | null;
  heroImageUrl?: string | null;
  /** Contrast-checked variants of a logo hero; pick by the surface it lands on. */
  heroImageOnDark?: string | null;
  heroImageOnLight?: string | null;
  images?: ShareImage[];
  brandBoard?: ShareBrandBoard;
  metrics?: ShareMetric[];
  /** Launch cadence payload — raw timeline plus the founder's saved scenario. */
  timeline?: { data: unknown; scenario: unknown } | null;
}


export interface SharePayload {
  /** True when the signed-in viewer owns this venture (or is an admin). */
  canManage?: boolean;
  /** Only returned to a manager — powers regenerate / delete from the showcase. */
  snapshotId?: string | null;
  venture: {
    name: string;
    oneLiner: string | null;
    location: string | null;
    industry: string | null;
    logoUrl: string | null;
    /** Contrast-checked marks: the endpoint picks a variant that stays legible. */
    logoUrlOnDark?: string | null;
    logoUrlOnLight?: string | null;
    founderName: string | null;
    /** Bare domain (no scheme) confirmed by the founder, when they have one. */
    website?: string | null;
    colors?: { primary: string | null; accent: string | null; secondary: string | null };
  };
  share: { title: string | null; updatedAt: string };
  chatEnabled?: boolean;
  mapEnabled?: boolean;
  executiveSummary?: string | null;
  executiveMetrics?: ShareMetric[] | null;
  coverage?: { total: number; illustrated: number; signFailures: number };
  sections: { key: string; label: string; items: ShareItem[] }[];
}



function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Short, unambiguous fallback address when a venture has no usable name. */
export function newShortToken() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;
const RESERVED_SLUGS = new Set([
  "v", "admin", "api", "app", "auth", "login", "signup", "dashboard", "hub",
  "share", "new", "settings", "about", "contact", "privacy", "terms", "help",
  "support", "static", "assets", "public", "null", "undefined",
]);

/**
 * Venture name → readable address. Never invents words: if the full name is too
 * long, trailing words are dropped so the most identifying part survives
 * ("Anderson Residential Elderly Care" → "anderson-residential-elderly-care").
 */
export function slugifyVentureName(name: string | null | undefined): string {
  const words = String(name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return newShortToken();

  let slug = words.join("-");
  while (slug.length > SLUG_MAX && words.length > 1) {
    words.pop();
    slug = words.join("-");
  }
  slug = slug.slice(0, SLUG_MAX).replace(/-+$/g, "");
  if (slug.length < SLUG_MIN || RESERVED_SLUGS.has(slug)) return newShortToken();
  return slug;
}

/** Same rules the database check uses, so the UI can validate before saving. */
export function slugError(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `At least ${SLUG_MIN} characters.`;
  if (slug.length > SLUG_MAX) return `At most ${SLUG_MAX} characters.`;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug))
    return "Lowercase letters, numbers and hyphens only.";
  if (slug.includes("--")) return "No double hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved.";
  return null;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("venture_share_slug_available", { _slug: slug });
  if (error) throw error;
  return data === true;
}

/** Appends -2, -3… until the address is free. */
export async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  for (let n = 2; n < 60; n++) {
    if (await isSlugAvailable(candidate)) return candidate;
    const suffix = `-${n}`;
    candidate = `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/g, "")}${suffix}`;
  }
  return newShortToken();
}

export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Canonical public origin — share links must never point at a preview host. */
export const PUBLIC_ORIGIN = "https://startuplabs.online";

/**
 * Origin used for anything a founder copies and sends to someone else.
 * Preview/editor and localhost hosts require a login, so they are never used.
 */
export function publicOrigin() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isPrivateHost =
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com");
  return isPrivateHost ? PUBLIC_ORIGIN : window.location.origin;
}

/** Accepts a share row or a raw identifier; always prefers the readable slug. */
export function shareUrl(share: string | { slug?: string | null; token: string }) {
  const id = typeof share === "string" ? share : share.slug || share.token;
  return `${publicOrigin()}/v/${id}`;
}

export async function getVentureShare(snapshotId: string): Promise<VentureShare | null> {
  const { data, error } = await supabase
    .from("venture_shares")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as VentureShare) ?? null;
}

export async function createVentureShare(
  snapshotId: string,
  patch: Partial<VentureShare> = {},
  ventureName?: string | null,
) {
  const userId = await getEffectiveUserId();
  let name = ventureName ?? null;
  if (!name && !patch.slug) {
    const { data: snap } = await supabase
      .from("venture_snapshots")
      .select("company_name,business_concept")
      .eq("id", snapshotId)
      .maybeSingle();
    name = (snap as any)?.company_name || null;
  }
  const slug = patch.slug ?? (await uniqueSlug(slugifyVentureName(name)));
  const { data, error } = await supabase
    .from("venture_shares")
    .insert({
      snapshot_id: snapshotId,
      user_id: userId,
      token: newToken(),
      slug,
      excluded_keys: [],
      ...patch,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as VentureShare;
}

export async function updateVentureShare(id: string, patch: Partial<VentureShare>) {
  const { data, error } = await supabase
    .from("venture_shares")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as VentureShare;
}

export async function revokeVentureShare(id: string) {
  return updateVentureShare(id, { revoked_at: new Date().toISOString() });
}

// Built from VITE_SUPABASE_URL (injected in production builds) with a hard
// fallback — deriving it from VITE_SUPABASE_PROJECT_ID produced
// "https://undefined.supabase.co" in published bundles.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://hflfxytqrlkobhuugsca.supabase.co";
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

/**
 * Public fetch — works signed out, so it calls the endpoint directly. When the
 * viewer happens to be signed in we forward the session so the founder opening
 * their own link gets the owner controls back.
 */
export async function fetchSharePayload(token: string, password?: string) {
  let res: Response;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token;
    if (jwt) headers.Authorization = `Bearer ${jwt}`;
  } catch { /* anonymous viewer */ }
  try {
    res = await fetch(`${FUNCTIONS_BASE}/venture-share`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token, password, action: "get" }),
    });
  } catch {
    const err: any = new Error("Couldn't reach the server. Check your connection and try again.");
    err.code = "NETWORK";
    throw err;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(body?.error ?? "Could not load this share.");
    err.code = body?.code;
    throw err;
  }
  return body as SharePayload;
}


export async function trackShareView(token: string, password?: string) {
  await fetch(`${FUNCTIONS_BASE}/venture-share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, action: "track" }),
  }).catch(() => {});
}

export interface ShareChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Ask the venture's second brain a question from the public showcase. */
export async function askShareChat(
  token: string,
  messages: ShareChatMessage[],
  password?: string,
): Promise<string> {
  const res = await fetch(`${FUNCTIONS_BASE}/venture-share-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, messages }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? "The assistant is unavailable right now.");
  return String(body?.reply ?? "");
}

