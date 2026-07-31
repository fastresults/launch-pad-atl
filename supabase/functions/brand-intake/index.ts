// AI-First Brand Intake — admin-only.
// Takes 2–3 short user answers, calls Lovable AI Gateway with a strict JSON
// schema, and persists a full Brand Package (identity, per-platform bios,
// visual direction, launch kit) to social_setup_brand_package. Writes vibe /
// color_mood / brand_colors / short_bio / long_bio / display_name / handle /
// website through to social_setup_brand so Creative Studio + platform cards
// pick it up without extra wiring.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Platforms with their bio character limits -----------------------------
const PLATFORM_BIO_LIMITS: Record<string, number> = {
  twitter: 160,
  instagram: 150,
  facebook: 255,
  linkedin_personal: 220,
  linkedin_company: 2000,
  tiktok: 80,
  youtube: 1000,
  pinterest: 160,
  reddit: 200,
  bluesky: 256,
  threads: 150,
  googlebusiness: 750,
  telegram: 255,
  snapchat: 80,
  discord: 120,
};

const PLATFORM_LIST = Object.keys(PLATFORM_BIO_LIMITS);

const VIBES = [
  "bold_editorial",
  "soft_minimal",
  "tech_futurist",
  "warm_founder",
  "playful_startup",
  "premium_corporate",
] as const;
const COLOR_MOODS = ["ocean", "sunset", "forest", "monochrome", "electric"] as const;
const TONES = ["professional", "founder_personal", "playful", "authoritative"] as const;

// --- JSON schema for the Brand Package -------------------------------------
function buildSchema() {
  const platformBioProps: Record<string, unknown> = {};
  for (const p of PLATFORM_LIST) {
    platformBioProps[p] = {
      type: "string",
      description: `Bio for ${p}, max ${PLATFORM_BIO_LIMITS[p]} characters. Stay under the limit.`,
    };
  }
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      identity: {
        type: "object",
        additionalProperties: false,
        properties: {
          display_name: { type: "string", description: "Brand / startup display name (2–40 chars)." },
          handle_suggestions: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
            description: "3–5 lowercase handle suggestions, no @, no spaces, <=15 chars, consistent across platforms.",
          },
          short_bio: { type: "string", description: "Generic short bio, <=160 chars." },
          long_bio: { type: "string", description: "Long-form bio for LinkedIn About / website (400–700 chars)." },
        },
        required: ["display_name", "handle_suggestions", "short_bio", "long_bio"],
      },
      per_platform_bios: {
        type: "object",
        additionalProperties: false,
        properties: platformBioProps,
        required: PLATFORM_LIST,
      },
      visual_direction: {
        type: "object",
        additionalProperties: false,
        properties: {
          vibe: { type: "string", enum: [...VIBES] },
          color_mood: { type: "string", enum: [...COLOR_MOODS] },
          brand_colors: {
            type: "array",
            items: { type: "string", description: "Hex color like #1a2b3c" },
            minItems: 3,
            maxItems: 3,
          },
          logo_prompt: {
            type: "string",
            description: "One-line prompt for an AI image model to generate the logo mark.",
          },
        },
        required: ["vibe", "color_mood", "brand_colors", "logo_prompt"],
      },
      launch_kit: {
        type: "object",
        additionalProperties: false,
        properties: {
          pinned_post_short: { type: "string", description: "Pinned-post copy for X/Threads/Bluesky (<=240 chars)." },
          pinned_post_long: { type: "string", description: "Pinned-post copy for LinkedIn/Facebook (400–800 chars)." },
          link_in_bio: { type: "string", description: "One-liner for link-in-bio tools (<=80 chars)." },
          hashtags: {
            type: "array",
            items: { type: "string", description: "Hashtag without #." },
            minItems: 5,
            maxItems: 5,
          },
          first_week_ideas: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 3,
            description: "3 post-idea one-liners for the first week.",
          },
        },
        required: [
          "pinned_post_short",
          "pinned_post_long",
          "link_in_bio",
          "hashtags",
          "first_week_ideas",
        ],
      },
    },
    required: ["identity", "per_platform_bios", "visual_direction", "launch_kit"],
  };
}

function buildSystemPrompt() {
  return [
    "You are a brand strategist for early-stage startup founders.",
    "Given a short description of the startup and a tone, draft a complete brand package that the founder can paste into every social platform.",
    "Rules:",
    "- Be concrete. No filler, no buzzwords like 'innovative', 'cutting-edge', 'revolutionize'.",
    "- Stay under every character limit. If unsure, write shorter.",
    "- Per-platform bios must be tuned to that platform's culture and length limit (e.g. LinkedIn is professional, TikTok is casual, X is punchy).",
    "- Handle suggestions: lowercase, no spaces, <=15 chars, alphanumeric/underscore only, consistent across platforms.",
    "- Visual direction: pick the single vibe + color mood that best matches the description and tone.",
    "- Brand colors: 3 hex codes that match the chosen color mood.",
    "- Logo prompt: one sentence, no quotation marks, describes a simple mark (not an illustration).",
    "- Output only fields specified by the schema. Do not include commentary.",
  ].join("\n");
}

function buildUserPrompt(input: {
  description: string;
  tone: string;
  industry?: string;
  founder_name?: string;
  website?: string;
}) {
  const parts = [
    `Startup description:\n${input.description}`,
    `Audience tone: ${input.tone}`,
  ];
  if (input.industry) parts.push(`Industry: ${input.industry}`);
  if (input.founder_name) parts.push(`Founder name: ${input.founder_name}`);
  if (input.website) parts.push(`Website: ${input.website}`);
  parts.push(`Available platforms (produce a tuned bio for each): ${PLATFORM_LIST.join(", ")}`);
  return parts.join("\n\n");
}

async function callAiGateway(messages: any[], schema: any, apiKey: string, model: string) {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: { name: "brand_package", strict: true, schema },
      },
      temperature: 0.7,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    const err: any = new Error(
      parsed?.error?.message || parsed?.error || `AI gateway error (${res.status})`,
    );
    err.status = res.status;
    err.code = parsed?.error?.code;
    throw err;
  }
  const data = JSON.parse(text);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI gateway returned empty content");
  let pkg: any;
  try {
    pkg = typeof content === "string" ? JSON.parse(content) : content;
  } catch (e) {
    throw new Error("AI gateway returned invalid JSON");
  }
  return { pkg, usage: data?.usage };
}

// Validate intake input
const IntakeSchema = {
  description: (v: unknown) => typeof v === "string" && v.trim().length >= 20 && v.length <= 1500,
  tone: (v: unknown) => typeof v === "string" && (TONES as readonly string[]).includes(v),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // F22: admin gate via service-role is_admin RPC (single authoritative
    // read; closes the small TOCTOU window between a user-scoped roles read
    // and the subsequent privileged writes).
    const { data: isAdminRes, error: adminErr } = await admin.rpc("is_admin", { _user_id: userId });
    if (adminErr || !isAdminRes) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({})) as any;
    const action = body?.action ?? "generate";

    if (action === "approve") {
      // Mark package as approved + flip progress flag.
      const { error: e1 } = await admin
        .from("social_setup_brand_package")
        .update({ status: "approved" })
        .eq("user_id", userId);
      if (e1) throw e1;
      await admin
        .from("social_setup_progress")
        .upsert(
          { user_id: userId, platform: "_brand_package", brand_package_approved: true },
          { onConflict: "user_id,platform" },
        );
      return json({ ok: true });
    }

    if (action === "update") {
      // Inline edits from the review screen. Only updates jsonb fields, no AI call.
      const updates: any = {};
      for (const k of ["identity", "per_platform_bios", "visual_direction", "launch_kit"] as const) {
        if (body[k] !== undefined) updates[k] = body[k];
      }
      if (Object.keys(updates).length === 0) return json({ error: "Nothing to update" }, 400);
      const { data: row, error } = await admin
        .from("social_setup_brand_package")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      // Mirror identity + visual direction to social_setup_brand so existing
      // brand getters keep working.
      await syncBrandKit(admin, userId, row);
      return json({ package: row });
    }

    // Default: generate (full pack)
    if (!IntakeSchema.description(body?.description) || !IntakeSchema.tone(body?.tone)) {
      return json({ error: "Invalid intake input. Description must be 20–1500 chars and tone must be one of the allowed values." }, 400);
    }

    const model = body.model || DEFAULT_MODEL;
    const schema = buildSchema();
    const messages = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(body) },
    ];

    let pkg: any;
    let usage: any;
    try {
      const out = await callAiGateway(messages, schema, apiKey, model);
      pkg = out.pkg;
      usage = out.usage;
    } catch (e: any) {
      const status = e?.status;
      const errBody: any = {
        error: e?.message ?? "Generation failed",
        upstreamStatus: status,
      };
      if (status === 402) {
        errBody.code = "PAYMENT_REQUIRED";
        errBody.reason = "ai_credits_exhausted";
      } else if (status === 429) {
        errBody.code = "RATE_LIMITED";
      }
      return json(errBody, 200);
    }

    // Persist
    const intake_input = {
      description: body.description,
      tone: body.tone,
      industry: body.industry ?? null,
      founder_name: body.founder_name ?? null,
      website: body.website ?? null,
    };
    const { data: row, error: upErr } = await admin
      .from("social_setup_brand_package")
      .upsert(
        {
          user_id: userId,
          status: "draft",
          intake_input,
          identity: pkg.identity,
          per_platform_bios: pkg.per_platform_bios,
          visual_direction: pkg.visual_direction,
          launch_kit: pkg.launch_kit,
          model_used: model,
          tokens_used: usage?.total_tokens ?? null,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (upErr) throw upErr;

    await syncBrandKit(admin, userId, row);

    return json({ package: row });
  } catch (e) {
    console.error("brand-intake error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

async function syncBrandKit(admin: any, userId: string, pkgRow: any) {
  const ident = pkgRow?.identity ?? {};
  const vis = pkgRow?.visual_direction ?? {};
  const handle = Array.isArray(ident.handle_suggestions) ? ident.handle_suggestions[0] : null;
  // Don't clobber a user-set website if they have one and we don't.
  const { data: existing } = await admin
    .from("social_setup_brand")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const next: any = {
    user_id: userId,
    display_name: ident.display_name ?? existing?.display_name ?? null,
    handle: handle ?? existing?.handle ?? null,
    short_bio: ident.short_bio ?? existing?.short_bio ?? null,
    long_bio: ident.long_bio ?? existing?.long_bio ?? null,
    vibe: vis.vibe ?? existing?.vibe ?? null,
    color_mood: vis.color_mood ?? existing?.color_mood ?? null,
    brand_colors: vis.brand_colors ?? existing?.brand_colors ?? null,
    website_url: existing?.website_url ?? pkgRow?.intake_input?.website ?? null,
    logo_url: existing?.logo_url ?? null,
    banner_url: existing?.banner_url ?? null,
  };
  await admin
    .from("social_setup_brand")
    .upsert(next, { onConflict: "user_id" });
}
