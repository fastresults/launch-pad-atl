// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-invoke";

export const ZERNIO_PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "reddit", label: "Reddit" },
  { value: "bluesky", label: "Bluesky" },
  { value: "threads", label: "Threads" },
  { value: "googlebusiness", label: "Google Business" },
  { value: "telegram", label: "Telegram" },
  { value: "snapchat", label: "Snapchat" },
  { value: "discord", label: "Discord" },
] as const;

async function call(action: string, params: any = {}) {
  const { data, error } = await invokeEdge("zernio", {
    body: { action, params },
  });
  if (error) throw new Error(error.message || "Zernio request failed");
  if (data && typeof data === "object" && "error" in data && data.error) {
    const err: any = new Error(
      typeof data.error === "string" ? data.error : "Zernio error",
    );
    err.code = (data as any).code;
    err.reason = (data as any).reason;
    err.dashboardUrl = (data as any).dashboard_url;
    err.documentationUrl = (data as any).documentation_url;
    err.details = (data as any).details;
    err.upstreamStatus = (data as any).upstreamStatus;
    throw err;
  }
  return data;
}

export async function listProfiles() {
  const d = await call("profiles.list");
  return { profiles: d?.profiles ?? d ?? [] };
}

export async function createProfile(input: { name: string; description?: string }) {
  return await call("profiles.create", input);
}

export async function deleteProfile(profileId: string) {
  return await call("profiles.delete", { profileId });
}

export async function listAccounts(profileId?: string) {
  const d = await call("accounts.list", { profileId });
  return { accounts: d?.accounts ?? d ?? [] };
}

export async function disconnectAccount(accountId: string) {
  return await call("accounts.disconnect", { accountId });
}

export async function getConnectUrl(platform: string, profileId: string) {
  const d = await call("connect.getUrl", { platform, profileId });
  return { authUrl: d?.authUrl ?? d?.url ?? null };
}

export async function listPosts(opts: { status?: string; profileId?: string } = {}) {
  const d = await call("posts.list", opts);
  return { posts: d?.posts ?? d ?? [] };
}

export async function createPost(input: {
  content: string;
  platforms: { platform: string; accountId: string }[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  mediaUrls?: string[];
}) {
  return await call("posts.create", input);
}

export async function deletePost(postId: string) {
  return await call("posts.delete", { postId });
}

export async function getAnalytics(input: {
  accountId: string;
  startDate?: string;
  endDate?: string;
}) {
  return await call("analytics.get", input);
}
