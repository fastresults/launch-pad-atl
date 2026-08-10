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
  kind: "doc" | "gallery" | "timeline";
  timeline?: { data: unknown; scenario: unknown } | null;

  subtitle?: string | null;
  body?: string | null;
  heroImageUrl?: string | null;
  /** Contrast-checked hero marks, so a logo hero never sinks into its card. */
  heroImageOnDark?: string | null;
  heroImageOnLight?: string | null;
  images?: {
    url: string; label?: string | null; width?: number | null; height?: number | null;
    /** Everything the preview modal needs to show the copy that ships with the image. */
    meta?: {
      platform?: string | null; day?: string | null; week?: number | null;
      pillar?: string | null; aspect?: string | null;
      headline?: string | null; hook?: string | null; body?: string | null;
      cta?: string | null; hashtags?: string[] | null;
      assetKind?: string | null; filename?: string | null;
    } | null;
  }[];
  brandBoard?: {
    paletteName?: string | null;
    swatches: { label: string; hex: string }[];
    fonts: { role: string; family: string; weight?: number | null }[];
    logos: { url: string; label?: string | null }[];
    moodboard?: { url: string; caption?: string | null }[];
    dna?: { positioning?: string | null; traits?: string[]; toneWords?: string[] } | null;
    voice?: { summary?: string | null; principles?: string[]; dos?: string[]; donts?: string[] } | null;
    ctas?: string[];
  };
  metrics?: { label: string; value: string; note?: string | null; source?: string | null }[];


};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const action = body?.action === "track" ? "track" : "get";
    if (!token || token.length < 3 || token.length > 128) {
      return json({ error: "Invalid link" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Links carry either the readable slug (new) or the long token (legacy).
    let { data: share } = await admin
      .from("venture_shares")
      .select("*")
      .ilike("slug", token)
      .is("revoked_at", null)
      .maybeSingle();

    if (!share) {
      ({ data: share } = await admin
        .from("venture_shares")
        .select("*")
        .eq("token", token)
        .maybeSingle());
    }

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
    // Surface-aware marks. The endpoint measures the stored variants' own ink
    // and returns the one that clears contrast on the requested ground, so a
    // navy wordmark never lands on a navy hero again.
    const logoUrlOnDark = primaryLogo
      ? `${SUPABASE_URL}/functions/v1/brand-logo/${snapshotId}/auto?on=dark&contrast=v2`
      : null;
    const logoUrlOnLight = primaryLogo
      ? `${SUPABASE_URL}/functions/v1/brand-logo/${snapshotId}/auto?on=light&contrast=v2`
      : null;

    const paletteColors: Record<string, string> =
      (kit?.palette?.colors && typeof kit.palette.colors === "object" ? kit.palette.colors : {}) as any;

    if (kit && !excluded.has("cat:Brand")) {
      if (!excluded.has("brand:identity")) {
        const lines: string[] = [];
        if (kit.dna?.positioning) lines.push(String(kit.dna.positioning));
        if (kit.voice?.summary) lines.push(String(kit.voice.summary));

        const swatchOrder = [
          ["primary", "Primary"],
          ["secondary", "Secondary"],
          ["accent", "Accent"],
          ["fg", "Text"],
          ["muted", "Muted"],
          ["bg", "Surface"],
          ["border", "Border"],
        ];
        const swatches = swatchOrder
          .filter(([k]) => typeof paletteColors[k] === "string")
          .map(([k, label]) => ({ label, hex: paletteColors[k] }));

        // Logo variants: every stored mark, signed so the reader can see them.
        const logoImages: { url: string; label?: string | null }[] = [];
        for (const l of logos) {
          const p = l?.preview_path ?? l?.svg_path ?? l?.path;
          const url = await sign(BUCKET, p);
          if (url) logoImages.push({ url, label: l?.label ?? l?.name ?? (l?.primary ? "Primary mark" : "Variant") });
        }

        // Mood board: entries hold either an absolute URL (scraped) or a
        // storage path (uploaded), so resolve both shapes.
        const moodEntries: any[] = Array.isArray(kit.moodboard) ? kit.moodboard : [];
        const moodImages: { url: string; caption?: string | null }[] = [];
        for (const m of moodEntries.slice(0, 12)) {
          const raw = typeof m === "string" ? m : m?.url ?? m?.path ?? m?.storage_path;
          if (!raw) continue;
          const url = /^https?:\/\//i.test(String(raw)) ? String(raw) : await sign(BUCKET, String(raw));
          if (url) moodImages.push({ url, caption: (typeof m === "object" && (m?.caption ?? m?.source)) || null });
        }

        const strArr = (v: any, max = 5): string[] =>
          (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter(Boolean).slice(0, max);

        // Real calls to action the venture already uses in its content plan.
        const ctas = Array.from(
          new Set(
            [
              ...strArr(kit.voice?.ctas, 6),
              ...strArr(kit.dna?.ctas, 6),
              ...(postsRes.data ?? []).map((p: any) => String(p?.cta ?? "").trim()),
            ].filter((s) => s && s.length <= 60),
          ),
        ).slice(0, 4);

        push("Brand", {
          key: "brand:identity",
          title: "Brand identity",
          subtitle: "Logo, palette, typography, mood and voice",
          kind: "doc",
          body: null,
          heroImageUrl: logoUrl,
          heroImageOnDark: logoUrlOnDark,
          heroImageOnLight: logoUrlOnLight,
          brandBoard: {
            paletteName: kit.palette?.name ?? null,
            swatches,
            fonts: [
              kit.typography?.heading?.family
                ? {
                    role: "Headings",
                    family: String(kit.typography.heading.family),
                    weight: Number(kit.typography.heading.weight) || null,
                  }
                : null,
              kit.typography?.body?.family
                ? {
                    role: "Body",
                    family: String(kit.typography.body.family),
                    weight: Number(kit.typography.body.weight) || null,
                  }
                : null,
            ].filter(Boolean) as { role: string; family: string; weight?: number | null }[],
            logos: logoImages,
            moodboard: moodImages,
            dna: {
              positioning: kit.dna?.positioning ?? kit.dna?.promise ?? null,
              traits: strArr(kit.dna?.traits ?? kit.dna?.personality),
              toneWords: strArr(kit.voice?.tone_words, 6),
            },
            voice: {
              summary: kit.voice?.summary ?? kit.voice?.rules ?? null,
              principles: strArr(kit.voice?.bullets),
              dos: strArr(kit.voice?.dos, 3),
              donts: strArr(kit.voice?.donts, 3),
            },
            ctas,
          },
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
      }


      // Every collateral page is stored twice — the vector source and a `-preview`
      // raster of the same artwork — plus a few non-image handoff files (CSS,
      // JSON, HTML). Showing the raw rows made the showcase look like it held
      // duplicate cards. Collapse each pair into one tile (raster preferred, it
      // renders everywhere) and drop files a gallery cannot display.
      const collateral = collRes.data ?? [];
      if (collateral.length && !excluded.has("brand:collateral")) {
        const isImage = (p?: string | null) => !!p && /\.(png|jpe?g|webp|svg)$/i.test(p);
        const baseOf = (name: string) => name.replace(/-preview$/i, "");

        const byBase = new Map<string, { display: any; source: any }>();
        for (const c of collateral) {
          if (!isImage(c.storage_path)) continue;
          const base = baseOf(String(c.name ?? c.kind ?? "collateral"));
          const slot = byBase.get(base) ?? { display: null, source: null };
          const raster = !/\.svg$/i.test(c.storage_path ?? "");
          if (raster) slot.display = c;
          else slot.source = c;
          byBase.set(base, slot);
        }

        const images = [];
        for (const [base, slot] of byBase) {
          const pick = slot.display ?? slot.source;
          if (!pick) continue;
          const url = await sign(BUCKET, pick.storage_path);
          if (!url) continue;
          const label = base.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
          images.push({
            url, label, width: pick.width, height: pick.height,
            meta: {
              assetKind: pick.kind ?? null,
              filename: base,
              collateralIds: [slot.display?.id, slot.source?.id].filter(Boolean),
            },
          });
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
        if (url) images.push({
          url, label: `${s.platform} · ${s.asset_kind}`, width: s.width, height: s.height,
          meta: { platform: s.platform ?? null, assetKind: s.asset_kind ?? null, filename: `${s.platform}-${s.asset_kind}` },
        });
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
            meta: {
              platform: p?.platform ?? null,
              day: p?.day ?? null,
              week: p?.week ?? week,
              pillar: p?.pillar ?? null,
              aspect: a.aspect ?? null,
              headline: a.last_headline ?? null,
              hook: p?.hook ?? null,
              body: p?.body ?? null,
              cta: p?.cta ?? null,
              hashtags: Array.isArray(p?.hashtags) ? p.hashtags : null,
              filename: `${p?.platform ?? "post"}-week-${p?.week ?? week}-${(a.aspect ?? "1x1").replace(":", "x")}`,
            },
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
      const execMetrics = Array.isArray(snap.executive_metrics)
        ? (snap.executive_metrics as any[])
            .filter((m) => m && m.label && m.value)
            .slice(0, 6)
        : [];
      if (snap.executive_summary && !excluded.has("overview:executive")) {
        overview.push({
          key: "overview:executive",
          title: "Executive summary",
          subtitle: "Every asset in this showcase, in 300 words",
          kind: "doc",
          body: snap.executive_summary,
          heroImageUrl: logoUrl,
          heroImageOnDark: logoUrlOnDark,
          heroImageOnLight: logoUrlOnLight,
          metrics: execMetrics,
        });
      }

      // Written write-ups when the summary pass produced them; the raw snapshot
      // one-liners are only the fallback.
      const blurbs = (snap.overview_blurbs ?? {}) as { glance?: string; value?: string };
      const glanceBody = (blurbs.glance ?? "").trim() || snap.concept_summary || snap.business_concept || null;
      const valueBody = (blurbs.value ?? "").trim() || snap.value_proposition || null;

      const glanceFacts = [
        snap.industry ? { label: "Industry", value: String(snap.industry) } : null,
        [snap.city, snap.region].filter(Boolean).length
          ? { label: "Based in", value: [snap.city, snap.region].filter(Boolean).join(", ") }
          : null,
        { label: "Built assets", value: String(docs.length) },
        snap.founder_name ? { label: "Founder", value: String(snap.founder_name) } : null,
      ].filter(Boolean) as { label: string; value: string }[];

      overview.push({
        key: "overview:summary",
        title: "At a glance",
        subtitle: stats.join(" · "),
        kind: "doc",
        body: glanceBody,
        heroImageUrl: snap.executive_summary ? null : logoUrl,
        heroImageOnDark: snap.executive_summary ? null : logoUrlOnDark,
        heroImageOnLight: snap.executive_summary ? null : logoUrlOnLight,
        metrics: glanceFacts,
      });

      if (valueBody) {
        overview.push({
          key: "overview:value",
          title: "Value proposition",
          subtitle: "The promise, and why it beats the alternatives",
          kind: "doc",
          body: valueBody,
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

      // The launch cadence — readers can pan it and run their own what-ifs.
      if (snap.venture_timeline && !excluded.has("overview:timeline")) {
        overview.push({
          key: "overview:timeline",
          title: "The build, end to end",
          subtitle: "Idea to cash flowing — drag the levers to see it your way",
          kind: "timeline",
          timeline: {
            data: snap.venture_timeline,
            scenario: snap.venture_timeline_scenario ?? null,
          },
          metrics: execMetrics,
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

    // A gallery section carries its own artwork; a document section is only
    // "illustrated" when it has real header art.
    const allItems = sections.flatMap((s) => s.items);
    const illustrated = allItems.filter(
      (i) => !!i.heroImageUrl || (i.kind === "gallery" && !!i.images?.length),
    ).length;

    if (signFailures) console.error("[venture-share] signed url failures:", signFailures);

    // The website the founder confirmed for print is the same one worth
    // featuring on the public showcase.
    const rawWebsite = String(
      (kit?.contact_details as any)?.website ?? snap.website_url ?? "",
    ).trim();
    const website = rawWebsite
      ? rawWebsite.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim() || null
      : null;

    // Owner controls. A share link is public, but when the founder (or an admin)
    // opens their own link while signed in we let them delete or regenerate the
    // assets in place instead of hunting for them back in the hub.
    let canManage = false;
    try {
      const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
      if (jwt) {
        const { data: u } = await admin.auth.getUser(jwt);
        const uid = u?.user?.id;
        if (uid) {
          if (uid === snap.user_id) canManage = true;
          else {
            const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: uid });
            canManage = !!isAdmin;
          }
        }
      }
    } catch { /* anonymous viewers just read */ }

    return json({
      canManage,
      snapshotId: canManage ? snapshotId : null,
      venture: {
        name: snap.company_name ?? "Untitled venture",
        oneLiner: snap.value_proposition ?? snap.concept_summary ?? null,
        location: [snap.city, snap.region].filter(Boolean).join(", ") || null,
        industry: snap.industry ?? null,
        logoUrl,
        logoUrlOnDark,
        logoUrlOnLight,
        founderName: snap.founder_name ?? null,
        website,
        colors: {
          primary: paletteColors.primary ?? null,
          accent: paletteColors.accent ?? null,
          secondary: paletteColors.secondary ?? null,
        },
      },

      share: { title: share.title ?? null, updatedAt: share.updated_at },
      chatEnabled: share.chat_enabled !== false,
      mapEnabled: share.map_enabled !== false,
      executiveSummary: snap.executive_summary ?? null,
      executiveMetrics: Array.isArray(snap.executive_metrics) ? snap.executive_metrics : null,

      coverage: { total: allItems.length, illustrated, signFailures },
      sections,

    });

  } catch (e) {
    console.error("[venture-share]", e);
    return json({ error: "Could not load this share." }, 500);
  }
});
