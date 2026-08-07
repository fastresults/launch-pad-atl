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

export interface ShareItem {
  key: string;
  title: string;
  subtitle?: string | null;
  kind: "doc" | "gallery";
  body?: string | null;
  heroImageUrl?: string | null;
  images?: { url: string; label?: string | null; width?: number | null; height?: number | null }[];
}

export interface SharePayload {
  venture: {
    name: string;
    oneLiner: string | null;
    location: string | null;
    industry: string | null;
    logoUrl: string | null;
    founderName: string | null;
  };
  share: { title: string | null; updatedAt: string };
  sections: { key: string; label: string; items: ShareItem[] }[];
}

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function shareUrl(token: string) {
  return `${window.location.origin}/v/${token}`;
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

export async function createVentureShare(snapshotId: string, patch: Partial<VentureShare> = {}) {
  const userId = await getEffectiveUserId();
  const { data, error } = await supabase
    .from("venture_shares")
    .insert({
      snapshot_id: snapshotId,
      user_id: userId,
      token: newToken(),
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

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

/** Public fetch — works signed out, so it calls the endpoint directly. */
export async function fetchSharePayload(token: string, password?: string) {
  const res = await fetch(`${FUNCTIONS_BASE}/venture-share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, action: "get" }),
  });
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
