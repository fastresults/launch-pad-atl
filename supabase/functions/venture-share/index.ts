// Public read-only venture showcase payload.
//
// A founder publishes a share token from the hub; anyone with the link can read
// the venture through this endpoint. All storage buckets are private, so the
// browser never touches storage directly — this function assembles the entire
// payload with the service role and mints short-lived signed image URLs for
// exactly the assets the share includes.
//
//   POST /functions/v1/venture-share  { token, password?, action?: "get" | "track" }

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "user-media";
const DOC_IMAGE_BUCKET = "venture-doc-images";
const SIGNED_TTL = 60 * 60 * 6; // 6 hours

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Display order for the left table of contents. Unknown categories land last. */
const CATEGORY_ORDER = [
  "Overview",
  "Foundation",
  "Strategy",
  "Brand",
  "Marketing",
  "Social & Content",
  "Operations",
  "Finance",
  "Governance",
];

/**
 * Assets that are internal working notes for the founder and never belong in a
 * public showcase. Hard-coded so it also applies to shares minted in the past.
 */
const HARD_EXCLUDED_DOC_TYPES = new Set(["ai_tool_stack_recommendation"]);



type Item = {
  key: string;
  title: string;
  kind: "doc" | "gallery";
  subtitle?: string | null;
  body?: string | null;
  heroImageUrl?: string | null;
  images?: { url: string; label?: string | null; width?: number | null; height?: number | null }[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const action = body?.action === "track" ? "track" : "get";
    if (!token || token.length < 8 || token.length > 128) {
      return json({ error: "Invalid link" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: share } = await admin
      .from("venture_shares")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!share || share.revoked_at) return json({ error: "This link is no longer available.", code: "REVOKED" }, 404);
    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return json({ error: "This link has expired.", code: "EXPIRED" }, 410);
    }
    if (share.password_hash) {
      if (!password) return json({ error: "Password required", code: "PASSWORD_REQUIRED" }, 401);
      if ((await sha256(password)) !== share.password_hash) {
        return json({ error: "Incorrect password", code: "PASSWORD_INVALID" }, 401);
      }
    }

    if (action === "track") {
      await admin
        .from("venture_shares")
        .update({ view_count: (share.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
        .eq("id", share.id);
      return json({ ok: true });
    }

    const snapshotId: string = share.snapshot_id;
    const excluded = new Set<string>(share.excluded_keys ?? []);

    const [snapRes, typesRes, docsRes, kitRes, collRes, socialRes, adsRes, postsRes] = await Promise.all([
      admin.from("venture_snapshots").select("*").eq("id", snapshotId).maybeSingle(),
      admin.from("venture_document_types").select("type,name,description,category,sort_order").eq("active", true),
      admin
        .from("venture_documents")
        .select("document_type,content,status,hero_image_path,word_count,updated_at")
        .eq("snapshot_id", snapshotId)
        .eq("status", "complete"),
      admin.from("venture_brand_kits").select("*").eq("snapshot_id", snapshotId).maybeSingle(),
      admin
        .from("venture_brand_collateral")
        .select("id,kind,name,storage_path,width,height,created_at")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: true }),
      admin
        .from("venture_social_assets")
        .select("id,platform,asset_kind,storage_path,width,height,is_selected,created_at")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: true }),
      admin
        .from("venture_content_ads")
        .select("id,post_id,aspect,storage_path,width,height,last_headline,created_at")
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: true }),
      admin
        .from("venture_content_calendar_posts")
        .select("id,week,day,platform,pillar,hook,body,cta,hashtags")
        .eq("snapshot_id", snapshotId)
        .order("week", { ascending: true }),
    ]);

    const snap = snapRes.data;
    if (!snap) return json({ error: "This venture is no longer available.", code: "GONE" }, 404);

    let signFailures = 0;
    const sign = async (bucket: string, path?: string | null) => {
      if (!path) return null;
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
      if (error || !data?.signedUrl) {
        signFailures += 1;
        console.error("[venture-share] sign failed", bucket, path, error?.message);
        return null;
      }
      return data.signedUrl;
    };

    const types = new Map((typesRes.data ?? []).map((t: any) => [t.type, t]));
    const docs = (docsRes.data ?? [])
      .filter((d: any) => (d.content ?? "").trim().length > 0)
      .filter((d: any) => !HARD_EXCLUDED_DOC_TYPES.has(d.document_type));

    // ---- Documents grouped by their catalog category -------------------------
    const buckets = new Map<string, Item[]>();
    const push = (cat: string, item: Item) => {
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat)!.push(item);
    };

    const docsSorted = docs.slice().sort((a: any, b: any) => {
      const sa = types.get(a.document_type)?.sort_order ?? 999;
      const sb = types.get(b.document_type)?.sort_order ?? 999;
      return sa - sb;
    });

    for (const d of docsSorted) {
      const key = `doc:${d.document_type}`;
      if (excluded.has(key)) continue;
      const t: any = types.get(d.document_type);
      const cat = t?.category ?? "Foundation";
      if (excluded.has(`cat:${cat}`)) continue;
      push(cat, {
        key,
        title: t?.name ?? d.document_type.replace(/_/g, " "),
        subtitle: t?.description ?? null,
        kind: "doc",
        body: d.content,
        heroImageUrl: await sign(DOC_IMAGE_BUCKET, d.hero_image_path),
      });
    }


    // ---- Brand identity ------------------------------------------------------
    const kit: any = kitRes.data;
    const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
    const primaryLogo = logos.find((l) => l?.primary) ?? logos[0] ?? null;
    const logoUrl = primaryLogo ? `${SUPABASE_URL}/functions/v1/brand-logo/${snapshotId}` : null;

    if (kit && !excluded.has("cat:Brand")) {
      if (!excluded.has("brand:identity")) {
        const palette = Array.isArray(kit.palette) ? kit.palette : (kit.palette?.colors ?? []);
        const lines: string[] = [];
        if (kit.dna?.positioning) lines.push(String(kit.dna.positioning));
        if (kit.voice?.summary) lines.push(String(kit.voice.summary));
        push("Brand", {
          key: "brand:identity",
          title: "Brand identity",
          subtitle: "Logo, palette and typography",
          kind: "doc",
          body: lines.join("\n\n") || kit.guide_markdown || null,
          heroImageUrl: logoUrl,
        });
        if (kit.guide_markdown && !excluded.has("brand:guide")) {
          push("Brand", {
            key: "brand:guide",
            title: "Brand guidelines",
            subtitle: "How the brand is applied",
            kind: "doc",
            body: kit.guide_markdown,
          });
        }
        void palette;
      }

      const collateral = collRes.data ?? [];
      if (collateral.length && !excluded.has("brand:collateral")) {
        const images = [];
        for (const c of collateral) {
          const url = await sign(BUCKET, c.storage_path);
          if (url) images.push({ url, label: c.name ?? c.kind, width: c.width, height: c.height });
        }
        if (images.length) {
          push("Brand", {
            key: "brand:collateral",
            title: "Brand collateral",
            subtitle: "Business card, letterhead and identity pieces",
            kind: "gallery",
            images,
          });
        }
      }
    }

    // ---- Social kit ----------------------------------------------------------
    const socialAssets = socialRes.data ?? [];
    if (socialAssets.length && !excluded.has("cat:Social & Content") && !excluded.has("social:kit")) {
      const images = [];
      for (const s of socialAssets) {
        const url = await sign(BUCKET, s.storage_path);
        if (url) images.push({ url, label: `${s.platform} · ${s.asset_kind}`, width: s.width, height: s.height });
      }
      if (images.length) {
        push("Social & Content", {
          key: "social:kit",
          title: "Social profile kit",
          subtitle: "Covers and avatars, ready to upload",
          kind: "gallery",
          images,
        });
      }
    }

    // ---- Content ads by week -------------------------------------------------
    const posts = postsRes.data ?? [];
    const postById = new Map(posts.map((p: any) => [p.id, p]));
    const ads = adsRes.data ?? [];
    if (ads.length && !excluded.has("cat:Social & Content")) {
      const byWeek = new Map<number, any[]>();
      for (const a of ads) {
        const week = (postById.get(a.post_id) as any)?.week ?? 0;
        if (!byWeek.has(week)) byWeek.set(week, []);
        byWeek.get(week)!.push(a);
      }
      for (const week of Array.from(byWeek.keys()).sort((x, y) => x - y)) {
        const key = `ads:week-${week}`;
        if (excluded.has(key)) continue;
        const images = [];
        for (const a of byWeek.get(week)!) {
          const url = await sign(BUCKET, a.storage_path);
          if (!url) continue;
          const p: any = postById.get(a.post_id);
          images.push({
            url,
            label: a.last_headline ?? p?.hook ?? p?.platform ?? null,
            width: a.width,
            height: a.height,
          });
        }
        if (!images.length) continue;
        const weekPosts = posts.filter((p: any) => p.week === week);
        const caption = weekPosts
          .map((p: any) => `**${p.platform ?? "Post"}${p.day ? ` · ${p.day}` : ""}** — ${p.hook ?? ""}\n\n${p.body ?? ""}${p.cta ? `\n\n_${p.cta}_` : ""}`)
          .join("\n\n---\n\n");
        push("Social & Content", {
          key,
          title: week ? `Campaign week ${week}` : "Campaign creative",
          subtitle: `${images.length} finished ${images.length === 1 ? "post" : "posts"}`,
          kind: "gallery",
          images,
          body: caption || null,
        });
      }
    }

    // ---- Overview ------------------------------------------------------------
    const overview: Item[] = [];
    if (!excluded.has("cat:Overview")) {
      const stats = [
        snap.industry,
        [snap.city, snap.region].filter(Boolean).join(", ") || null,
        `${docs.length} assets`,
      ].filter(Boolean);
      overview.push({
        key: "overview:summary",
        title: "At a glance",
        subtitle: stats.join(" · "),
        kind: "doc",
        body: snap.concept_summary || snap.business_concept || null,
        heroImageUrl: logoUrl,
      });
      if (snap.value_proposition) {
        overview.push({
          key: "overview:value",
          title: "Value proposition",
          kind: "doc",
          body: snap.value_proposition,
        });
      }
      if (snap.roadmap_content && !excluded.has("overview:roadmap")) {
        overview.push({
          key: "overview:roadmap",
          title: "The 14-day sprint",
          subtitle: "Day-by-day launch plan",
          kind: "doc",
          body: snap.roadmap_content,
        });
      }
    }
    if (overview.length) buckets.set("Overview", [...overview, ...(buckets.get("Overview") ?? [])]);

    const sections = Array.from(buckets.entries())
      .filter(([, items]) => items.length > 0)
      .sort((a, b) => {
        const ia = CATEGORY_ORDER.indexOf(a[0]);
        const ib = CATEGORY_ORDER.indexOf(b[0]);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      })
      .map(([label, items]) => ({ key: `cat:${label}`, label, items }));

    return json({
      venture: {
        name: snap.company_name ?? "Untitled venture",
        oneLiner: snap.value_proposition ?? snap.concept_summary ?? null,
        location: [snap.city, snap.region].filter(Boolean).join(", ") || null,
        industry: snap.industry ?? null,
        logoUrl,
        founderName: snap.founder_name ?? null,
      },
      share: { title: share.title ?? null, updatedAt: share.updated_at },
      sections,
    });
  } catch (e) {
    console.error("[venture-share]", e);
    return json({ error: "Could not load this share." }, 500);
  }
});
