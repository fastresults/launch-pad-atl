// Venture Collateral — the deterministic half of the brand deliverable set.
//
// Business cards, letterhead, envelopes, notecards, the email signature,
// invoice/proposal templates, presentation masters, guideline pages and design
// tokens are all typeset from the LOCKED brand kit (palette, typography, vector
// mark) plus the founder's VERIFIED text inventory, laid out on the grid the
// art director chose. No image model touches them: type has to be exact.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireUser, requireSnapshotOwner } from "../_shared/auth.ts";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { rasterizeSvgToBytes } from "../_shared/logo-raster.ts";
import { isolateSymbol } from "../_shared/logo-geometry.ts";

import {
  COLLATERAL_KINDS,
  KIND_LABELS,
  designTokens,
  renderCollateral,
  signatureHtml,
  type CollateralCopy,
  type CollateralCtx,
  type CollateralKind,
} from "../_shared/collateral-svg.ts";
import {
  auditDetails,
  type ContactDetails,
  FIELD_SPECS,
  KIND_LABEL,
  normalizeDetails,
} from "../_shared/collateral-fields.ts";
import { suggestDetails } from "../_shared/collateral-suggest.ts";

import { type ArtDirection, directArt, hydrate } from "../_shared/brand-art-direction.ts";
import { writeCollateralCopy } from "../_shared/collateral-copy.ts";
import { resolveSpec } from "../_shared/collateral-specs.ts";
import { qcPage, type QcVerdict } from "../_shared/collateral-qc.ts";

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

/** Best-guess starting values, so the founder confirms rather than types. */
function seedDetails(kit: any, ctxData: any): ContactDetails {
  const snap = ctxData?.snap ?? {};
  const profile = ctxData?.profile ?? {};
  const brain = ctxData?.brain ?? {};
  const company = tidy(brain?.identity?.company_name) || tidy(snap.business_name) || tidy(snap.title);
  const website = tidy(snap.website_url) || tidy(profile.website);
  return normalizeDetails({
    company,
    tagline: tidy(kit?.dna?.tagline) || tidy(brain?.identity?.one_liner),
    person_name: tidy(profile.full_name) || tidy(brain?.identity?.founder),
    person_title: tidy(profile.role) || "Founder",
    email: tidy(profile.email),
    phone: tidy(profile.phone),
    website,
    address_street: tidy(profile.address),
    address_city: tidy(profile.city),
    address_state: tidy(profile.state),
    address_zip: tidy(profile.postal_code) || tidy(profile.zip),
    voice: typeof kit?.voice === "string" ? kit.voice : tidy(kit?.voice?.summary),
  });
}

async function loadKit(admin: any, snapshotId: string) {
  const { data: kit } = await admin
    .from("venture_brand_kits")
    .select(
      "palette, typography, logos, voice, dna, status, contact_details, contact_verified_at, art_direction, contact_details_suggested, contact_suggested_at",
    )
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  return kit;
}

/**
 * Structured seed first, then an AI pass over the founder's own prose for
 * whatever is still blank. Cached on the kit so re-opening the form is free.
 */
async function seedWithSuggestions(
  admin: any,
  snapshotId: string,
  kit: any,
  vctx: any,
  opts: { force?: boolean } = {},
): Promise<{ details: ContactDetails; suggested: Record<string, { value: string; basis: string }> }> {
  const seeded = seedDetails(kit, vctx);

  let suggested = (kit?.contact_details_suggested ?? null) as Record<string, any> | null;
  if (opts.force || !suggested) {
    suggested = await suggestDetails(admin, snapshotId, vctx, seeded);
    await admin
      .from("venture_brand_kits")
      .update({ contact_details_suggested: suggested, contact_suggested_at: new Date().toISOString() })
      .eq("snapshot_id", snapshotId);
  }

  // Structured data always wins — suggestions only fill genuine gaps.
  const merged: ContactDetails = { ...seeded };
  const applied: Record<string, { value: string; basis: string }> = {};
  for (const [key, entry] of Object.entries(suggested ?? {})) {
    const value = tidy((entry as any)?.value);
    if (!value || tidy((merged as any)[key])) continue;
    (merged as any)[key] = value;
    applied[key] = { value, basis: tidy((entry as any)?.basis) || "inferred from your own material" };
  }
  return { details: normalizeDetails(merged), suggested: applied };
}


async function buildCtx(
  admin: any,
  snapshotId: string,
  opts: { redirect?: boolean } = {},
): Promise<{ ctx: CollateralCtx; details: ContactDetails }> {
  const kit = await loadKit(admin, snapshotId);
  if (!kit) throw new Error("NO_BRAND_KIT");

  const colors: Record<string, string> = {};
  for (const [k, v] of Object.entries(kit.palette?.colors ?? {})) {
    if (typeof v === "string" && /^#?[0-9a-f]{6}$/i.test(v.replace(/^#/, ""))) {
      colors[k] = v.startsWith("#") ? v : `#${v}`;
    }
  }
  if (!Object.keys(colors).length) throw new Error("NO_PALETTE");

  const logos: any[] = Array.isArray(kit.logos) ? kit.logos : [];
  const primaryLogo = logos.find((l) => l?.primary) ?? logos[0] ?? null;
  let logoSvg: string | null = null;
  const svgPath = primaryLogo?.svg_path ?? primaryLogo?.path;
  if (svgPath && String(svgPath).endsWith(".svg")) {
    const { data: file } = await admin.storage.from(BUCKET).download(svgPath);
    if (file) logoSvg = await file.text();
  }
  if (!logoSvg) throw new Error("NO_VECTOR_LOGO");

  const vctx = await loadVentureContext(admin, snapshotId).catch(() => null);
  const brain = vctx?.brain ?? {};

  const details: ContactDetails = kit.contact_details && Object.keys(kit.contact_details).length
    ? normalizeDetails(kit.contact_details)
    : seedDetails(kit, vctx);

  const company = details.company || tidy(brain?.identity?.company_name) || "Your Company";
  const fonts = {
    heading: tidy(kit.typography?.heading?.family) || null,
    body: tidy(kit.typography?.body?.family) || null,
  };
  const voice = details.voice || (typeof kit.voice === "string" ? kit.voice : tidy(kit.voice?.summary)) || null;

  // Art direction: reuse the locked record unless the founder asked to re-direct.
  let ad: ArtDirection | null = opts.redirect ? null : hydrate(kit.art_direction);
  if (!ad) {
    ad = await directArt({
      company,
      tagline: details.tagline ?? null,
      category: tidy((vctx?.snap ?? {}).industry) || tidy((vctx?.snap ?? {}).sic_description) || null,
      audience: tidy(brain?.customer) || null,
      voice,
      colors,
      fonts,
    });
    await admin.from("venture_brand_kits").update({ art_direction: ad }).eq("snapshot_id", snapshotId);
  }

  const copy: CollateralCopy | null = await writeCollateralCopy({
    company,
    tagline: details.tagline ?? null,
    oneLiner: tidy(brain?.identity?.one_liner) || null,
    problem: tidy(brain?.problem) || null,
    solution: tidy(brain?.solution) || null,
    customer: tidy(brain?.customer) || null,
    differentiators: Array.isArray(brain?.differentiators) ? brain.differentiators.slice(0, 4) : null,
    voice,
  });

  const ctx: CollateralCtx = {
    company,
    tagline: details.tagline ?? null,
    person: {
      name: details.person_name ?? null,
      title: details.person_title ?? null,
      email: details.email ?? null,
      phone: details.phone ?? null,
      website: details.website ?? null,
      address: details.address_street ?? null,
    },
    details,
    colors,
    fonts,
    logoSvg,
    // A traced lockup ships its wordmark as polygons — rough stems, filled
    // counters. When the symbol can be separated, collateral draws the symbol
    // and sets the company name in the brand's real typeface.
    symbolSvg: isolateSymbol(logoSvg)?.symbol ?? null,

    voice,
    ad,
    copy,
  };
  return { ctx, details };
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
): Promise<{ kind: CollateralKind; files: number; qc: QcVerdict[] }> {
  if (kind === "design_tokens") {
    const { css, json: tokenJson } = designTokens(ctx);
    await store(admin, snapshotId, userId, kind, "brand-tokens", css, "text/css", null, null);
    await store(admin, snapshotId, userId, kind, "brand-tokens-json", tokenJson, "application/json", null, null);
    return { kind, files: 2, qc: [] };
  }

  const { pages, fontBuffers, fontsOk } = await renderCollateral(kind, ctx);
  // Fail loudly. Without a real TTF the rasteriser silently drops every line of
  // type, and we would store a "finished" page that is a logo on blank paper.
  if (!fontsOk) throw new Error("Brand fonts could not be loaded — refusing to render type-less pages");
  let count = 0;
  const verdicts: QcVerdict[] = [];
  for (const p of pages) {
    const expectedText = (p.svg.match(/<text\b/g) || []).length;
    if (expectedText === 0 && !/design_tokens|email_signature/.test(kind)) {
      throw new Error(`${p.name}: no type was set on the page`);
    }

    const rs = resolveSpec(p.name, p.width, p.height);
    // One raster pass per page. The former thumbnail pipeline rendered the
    // first page at full size, rendered it again at 700px, embedded that PNG in
    // a mock-up SVG, then rendered the mock-up a third time. On complex traced
    // marks those duplicate resvg passes exceed the worker CPU allowance.
    // The stored preview is already suitable for both the library thumbnail
    // and detailed preview, so do not manufacture a second presentation image.
    let bytes = await rasterizeSvgToBytes(p.svg, Math.min(p.width, 1100), undefined, fontBuffers);

    // Quality control: the drawn geometry against this piece's print standard,
    // plus the pixels that came out. A page that fails is still stored so the
    // founder can see it, but it carries the reason and is reported back.
    const verdict = qcPage(bytes ?? null, p.metrics ?? {
      page: p.name, safe: rs.safe, bleed: rs.bleed, minType: rs.minType, textLines: 0,
    }, rs);
    verdicts.push(verdict);
    if (!verdict.ok) console.warn("[collateral qc]", p.name, verdict.reasons.join(" | "));

    // Vector master, so a printer can scale it without loss.
    await store(admin, snapshotId, userId, kind, p.name, p.svg, "image/svg+xml", p.width, p.height, {
      vector: true,
      archetype: ctx.ad.archetype,
      qc: verdict,
    });

    if (bytes) {
      await store(admin, snapshotId, userId, kind, `${p.name}-preview`, bytes, "image/png", p.width, p.height, {
        preview: true,
        archetype: ctx.ad.archetype,
        qc: verdict,
      });
      bytes = null as unknown as Uint8Array;
    }

    count++;
  }

  if (kind === "email_signature") {
    await store(admin, snapshotId, userId, kind, "email-signature-html", signatureHtml(ctx), "text/html", null, null);
  }
  return { kind, files: count, qc: verdicts };
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
    const userId: string = owner.snapshot?.user_id ?? auth.userId!;

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
      const kit = await loadKit(admin, snapshotId);
      const details = kit?.contact_details && Object.keys(kit.contact_details).length
        ? normalizeDetails(kit.contact_details)
        : {};
      return json({
        items: signed,
        kinds: COLLATERAL_KINDS,
        labels: KIND_LABELS,
        details,
        verifiedAt: kit?.contact_verified_at ?? null,
        artDirection: kit?.art_direction ?? null,
      });
    }

    // Text audit — the field inventory plus what's missing, pre-filled from the
    // venture so the founder confirms rather than types from scratch.
    if (action === "details:get" || action === "details:rescan") {
      const kit = await loadKit(admin, snapshotId);
      if (!kit) return json({ error: "No brand kit yet — run the Brand Wizard first.", code: "NO_BRAND_KIT" }, 400);
      const vctx = await loadVentureContext(admin, snapshotId).catch(() => null);
      const saved = kit.contact_details && Object.keys(kit.contact_details).length
        ? normalizeDetails(kit.contact_details)
        : null;

      const filled = await seedWithSuggestions(admin, snapshotId, kit, vctx, {
        force: action === "details:rescan",
      });


      const details = saved ? normalizeDetails({ ...filled.details, ...saved }) : filled.details;
      // A suggestion the founder already overrode is no longer a suggestion.
      const suggested: Record<string, { value: string; basis: string }> = {};
      for (const [k, v] of Object.entries(filled.suggested)) {
        if (details[k as keyof ContactDetails] === v.value) suggested[k] = v;
      }

      return json({
        details,
        suggested,
        verifiedAt: saved ? kit.contact_verified_at : null,
        audit: auditDetails(details),
        specs: FIELD_SPECS,
        kindLabels: KIND_LABEL,
      });
    }


    if (action === "details:save") {
      const incoming = (body?.details ?? {}) as ContactDetails;
      const details = normalizeDetails(incoming);
      const audit = auditDetails(details);
      const { error } = await admin
        .from("venture_brand_kits")
        .update({ contact_details: details, contact_verified_at: new Date().toISOString() })
        .eq("snapshot_id", snapshotId);
      if (error) return json({ error: error.message }, 400);
      // Anything already generated is now out of date.
      await admin
        .from("venture_brand_collateral")
        .update({ meta: { stale: true } })
        .eq("snapshot_id", snapshotId)
        .neq("kind", "design_tokens");
      return json({ ok: true, details, audit });
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
      let details: ContactDetails;
      try {
        ({ ctx, details } = await buildCtx(admin, snapshotId, { redirect: !!body?.redirect }));
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

      // Gate: a piece that prints a required field it doesn't have is not
      // "generated successfully" — it's broken. Block and say exactly why.
      const audit = auditDetails(details, requested);
      const blocked = Object.keys(audit.blockedKinds);
      if (blocked.length) {
        const names = blocked.map((k) => KIND_LABEL[k] ?? k).join(", ");
        const gaps = [...new Set(Object.values(audit.blockedKinds).flat())];
        return json({
          error: `Confirm your details first — ${names} need ${gaps.length} missing field${gaps.length === 1 ? "" : "s"}.`,
          code: "DETAILS_INCOMPLETE",
          audit,
        }, 400);
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
      const qcIssues = done.flatMap((r: any) =>
        (r.qc ?? []).filter((v: QcVerdict) => !v.ok).map((v: QcVerdict) => ({ kind: r.kind, page: v.page, reasons: v.reasons })),
      );
      return json({
        ok: true,
        generated: done,
        failed,
        qcIssues,
        // Tells the library whether the wordmark on these pieces is real type
        // (symbol isolated) or the tracer's polygons (nothing to isolate).
        logo: { symbolIsolated: !!ctx.symbolSvg },
        artDirection: { archetype: ctx.ad.archetype, rationale: ctx.ad.rationale },
      });

    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("venture-collateral error", e);
    return json({ error: (e as Error).message || "Collateral generation failed" }, 500);
  }
});
