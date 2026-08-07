// Venture Collateral — the deterministic half of the brand deliverable set.
//
// Business cards, letterhead, envelopes, notecards, the email signature,
// invoice/proposal templates, presentation masters, guideline pages and design
// tokens are all typeset from the LOCKED brand kit (palette, typography, vector
// mark) and rasterised. No image model touches them: type has to be exact.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireUser, requireSnapshotOwner } from "../_shared/auth.ts";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { rasterizeSvgToBytes } from "../_shared/logo-raster.ts";
import {
  COLLATERAL_KINDS,
  KIND_LABELS,
  designTokens,
  renderCollateral,
  signatureHtml,
  type CollateralCtx,
  type CollateralKind,
} from "../_shared/collateral-svg.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "user-media";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function tidy(s: unknown): string {
  return String(s ?? "").trim();
}

async function buildCtx(admin: any, snapshotId: string): Promise<CollateralCtx> {
  const { data: kit } = await admin
    .from("venture_brand_kits")
    .select("palette, typography, logos, voice, dna, status")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();

  if (!kit) throw new Error("NO_BRAND_KIT");

  const colors: Record<string, string> = {};
  for (const [k, v] of Object.entries(kit.palette?.colors ?? {})) {
    if (typeof v === "string" && /^#?[0-9a-f]{6}$/i.test(v.replace(/^#/, ""))) {
      colors[k] = v.startsWith("#") ? v : `#${v}`;
    }
  }
  if (!Object.keys(colors).length) throw new Error("NO_PALETTE");

  const logos: any[] = Array.isArray(kit.logos) ? kit.logos : [];
  const primary = logos.find((l) => l?.primary) ?? logos[0] ?? null;
  let logoSvg: string | null = null;
  const svgPath = primary?.svg_path ?? primary?.path;
  if (svgPath && String(svgPath).endsWith(".svg")) {
    const { data: file } = await admin.storage.from(BUCKET).download(svgPath);
    if (file) logoSvg = await file.text();
  }
  if (!logoSvg) throw new Error("NO_VECTOR_LOGO");

  const ctx = await loadVentureContext(admin, snapshotId).catch(() => null);
  const snap = ctx?.snap ?? {};
  const profile = ctx?.profile ?? {};
  const brain = ctx?.brain ?? {};

  const company =
    tidy(brain?.identity?.company_name) ||
    tidy(snap.business_name) ||
    tidy(snap.title) ||
    "Your Company";

  return {
    company,
    tagline: tidy(kit.dna?.tagline) || tidy(brain?.identity?.one_liner) || null,
    person: {
      name: tidy(profile.full_name) || tidy(brain?.identity?.founder) || null,
      title: tidy(profile.role) || "Founder",
      email: tidy(profile.email) || null,
      phone: tidy(profile.phone) || null,
      website: tidy(snap.website_url) || tidy(profile.website) || null,
      address: tidy(profile.city && profile.state ? `${profile.city}, ${profile.state}` : profile.address) || null,
    },
    colors,
    fonts: {
      heading: tidy(kit.typography?.heading?.family) || null,
      body: tidy(kit.typography?.body?.family) || null,
    },
    logoSvg,
    voice: typeof kit.voice === "string" ? kit.voice : tidy(kit.voice?.summary) || null,
  };
}

async function store(
  admin: any,
  snapshotId: string,
  userId: string,
  kind: CollateralKind,
  name: string,
  bytes: Uint8Array | string,
  mime: string,
  width: number | null,
  height: number | null,
  meta: Record<string, unknown> = {},
) {
  const ext = mime.includes("svg") ? "svg" : mime.includes("png") ? "png" : mime.includes("json") ? "json" : mime.includes("css") ? "css" : mime.includes("html") ? "html" : "txt";
  const path = `${userId}/brand-collateral/${snapshotId}/${name}.${ext}`;
  const body = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  const { error } = await admin.storage.from(BUCKET).upload(path, body, { contentType: mime, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  await admin.from("venture_brand_collateral").upsert(
    {
      snapshot_id: snapshotId,
      user_id: userId,
      kind,
      name,
      storage_path: path,
      mime_type: mime,
      width,
      height,
      meta,
    },
    { onConflict: "snapshot_id,kind,name" },
  );
  return path;
}

async function generateKind(
  admin: any,
  snapshotId: string,
  userId: string,
  kind: CollateralKind,
  ctx: CollateralCtx,
): Promise<{ kind: CollateralKind; files: number }> {
  if (kind === "design_tokens") {
    const { css, json: tokenJson } = designTokens(ctx);
    await store(admin, snapshotId, userId, kind, "brand-tokens", css, "text/css", null, null);
    await store(admin, snapshotId, userId, kind, "brand-tokens-json", tokenJson, "application/json", null, null);
    return { kind, files: 2 };
  }

  const pages = await renderCollateral(kind, ctx);
  let count = 0;
  for (const p of pages) {
    // Vector master, so a printer can scale it without loss.
    await store(admin, snapshotId, userId, kind, p.name, p.svg, "image/svg+xml", p.width, p.height, { vector: true });
    const bytes = await rasterizeSvgToBytes(p.svg, Math.min(p.width, 2400));
    if (bytes) {
      await store(admin, snapshotId, userId, kind, `${p.name}-preview`, bytes, "image/png", p.width, p.height, { preview: true });
    }
    count++;
  }

  if (kind === "email_signature") {
    await store(admin, snapshotId, userId, kind, "email-signature-html", signatureHtml(ctx), "text/html", null, null);
  }
  return { kind, files: count };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = tidy(body?.action) || "list";
    const snapshotId = tidy(body?.snapshotId);
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);

    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const owner = await requireSnapshotOwner(admin, snapshotId, auth.userId!, corsHeaders);
    if (owner.error) return owner.error;
    const userId: string = owner.userId ?? auth.userId!;

    if (action === "list") {
      const { data } = await admin
        .from("venture_brand_collateral")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("kind")
        .order("name");
      const rows = data ?? [];
      const signed = await Promise.all(
        rows.map(async (r: any) => {
          if (!r.storage_path) return { ...r, url: null };
          const { data: s } = await admin.storage.from(BUCKET).createSignedUrl(r.storage_path, 60 * 60 * 24 * 7);
          return { ...r, url: s?.signedUrl ?? null };
        }),
      );
      return json({ items: signed, kinds: COLLATERAL_KINDS, labels: KIND_LABELS });
    }

    if (action === "delete") {
      const kind = tidy(body?.kind);
      let q = admin.from("venture_brand_collateral").delete().eq("snapshot_id", snapshotId);
      if (kind) q = q.eq("kind", kind);
      const { error } = await q;
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "generate") {
      const requested: CollateralKind[] = Array.isArray(body?.kinds) && body.kinds.length
        ? body.kinds.filter((k: string) => (COLLATERAL_KINDS as readonly string[]).includes(k))
        : [...COLLATERAL_KINDS];
      if (!requested.length) return json({ error: "No valid collateral kinds requested" }, 400);

      let ctx: CollateralCtx;
      try {
        ctx = await buildCtx(admin, snapshotId);
      } catch (e) {
        const code = (e as Error).message;
        const msg = code === "NO_BRAND_KIT"
          ? "No brand kit yet — run the Brand Wizard first."
          : code === "NO_PALETTE"
          ? "Lock a colour palette in the Brand Wizard before generating collateral."
          : code === "NO_VECTOR_LOGO"
          ? "Save a vector logo to your live brand first — collateral is typeset around the mark."
          : code;
        return json({ error: msg, code }, 400);
      }

      const done: any[] = [];
      const failed: any[] = [];
      for (const kind of requested) {
        try {
          done.push(await generateKind(admin, snapshotId, userId, kind, ctx));
        } catch (e) {
          console.error("collateral failed", kind, e);
          failed.push({ kind, error: (e as Error).message });
        }
      }
      return json({ ok: true, generated: done, failed });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("venture-collateral error", e);
    return json({ error: (e as Error).message || "Collateral generation failed" }, 500);
  }
});
