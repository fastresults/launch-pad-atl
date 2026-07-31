// Zernio API proxy — admin-only.
// Routes requests by { action, params } body to https://zernio.com/api/v1
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ZERNIO_BASE = "https://zernio.com/api/v1";

type Action =
  | "profiles.list"
  | "profiles.create"
  | "profiles.delete"
  | "accounts.list"
  | "accounts.disconnect"
  | "connect.getUrl"
  | "posts.list"
  | "posts.create"
  | "posts.delete"
  | "analytics.get";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function zernio(
  method: "GET" | "POST" | "DELETE",
  path: string,
  apiKey: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>,
) {
  const url = new URL(ZERNIO_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ZERNIO_API_KEY");
    if (!apiKey) return json({ error: "ZERNIO_API_KEY not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    // Admin gate
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as Action | undefined;
    const params = (body?.params ?? {}) as Record<string, any>;
    if (!action) return json({ error: "Missing action" }, 400);

    let result: { status: number; data: unknown };
    switch (action) {
      case "profiles.list":
        result = await zernio("GET", "/profiles", apiKey);
        break;
      case "profiles.create":
        result = await zernio("POST", "/profiles", apiKey, {
          name: params.name,
          description: params.description,
        });
        break;
      case "profiles.delete":
        result = await zernio("DELETE", `/profiles/${params.profileId}`, apiKey);
        break;
      case "accounts.list":
        result = await zernio("GET", "/accounts", apiKey, undefined, {
          profileId: params.profileId,
        });
        break;
      case "accounts.disconnect":
        result = await zernio("DELETE", `/accounts/${params.accountId}`, apiKey);
        break;
      case "connect.getUrl":
        result = await zernio("GET", `/connect/${params.platform}`, apiKey, undefined, {
          profileId: params.profileId,
        });
        break;
      case "posts.list":
        result = await zernio("GET", "/posts", apiKey, undefined, {
          status: params.status,
          profileId: params.profileId,
          limit: params.limit ?? 50,
        });
        break;
      case "posts.create":
        result = await zernio("POST", "/posts", apiKey, {
          content: params.content,
          platforms: params.platforms,
          scheduledFor: params.scheduledFor,
          timezone: params.timezone,
          publishNow: params.publishNow,
          mediaUrls: params.mediaUrls,
        });
        break;
      case "posts.delete":
        result = await zernio("DELETE", `/posts/${params.postId}`, apiKey);
        break;
      case "analytics.get":
        result = await zernio("GET", "/analytics", apiKey, undefined, {
          accountId: params.accountId,
          startDate: params.startDate,
          endDate: params.endDate,
        });
        break;
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }

    // Always return 200 so supabase.functions.invoke doesn't throw a generic
    // "Edge function returned <status>" error and swallow the upstream body.
    // Surface upstream status + data so the client can render a friendly message.
    if (result.status >= 400) {
      const d: any = result.data ?? {};
      return json(
        {
          error: d.error || d.message || `Zernio error (${result.status})`,
          code: d.code,
          reason: d.reason,
          documentation_url: d.documentation_url,
          dashboard_url: d.dashboard_url,
          details: d.details,
          upstreamStatus: result.status,
        },
        200,
      );
    }
    return json(result.data, 200);
  } catch (e) {
    console.error("zernio function error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
