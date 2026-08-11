// Creative sign-off registry.
//
// The studios (brand, collateral, social, content) each own their own tables.
// Sign-off state lives in one join table keyed by (asset_kind, asset_ref) so we
// never have to widen those tables. This module enumerates a venture's creative
// and lazily seeds a `draft` review row for anything new.

export type CreativeState =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "ready_to_publish";

export type CreativeItem = {
  assetKind: string;
  assetRef: string;
  label: string;
  group: string;
  previewPath: string | null;
};

export const CREATIVE_GROUPS: Record<string, string> = {
  logo: "Logo",
  brand_kit: "Brand identity",
  collateral: "Collateral",
  social: "Social kit",
  content_ad: "Ad creative",
};

/** Human label from a storage filename / kind slug. */
const titleize = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "").replace(/\b\w/g, (m) => m.toUpperCase()).trim();

/** Every reviewable creative deliverable this venture currently has. */
export async function listCreativeItems(db: any, snapshotId: string): Promise<CreativeItem[]> {
  const [kitRes, collRes, socialRes, adsRes] = await Promise.all([
    db.from("venture_brand_kits").select("logos, palette, guide_markdown").eq("snapshot_id", snapshotId).maybeSingle(),
    db.from("venture_brand_collateral").select("id, kind, name, storage_path, created_at")
      .eq("snapshot_id", snapshotId).order("created_at"),
    db.from("venture_social_assets").select("id, platform, asset_kind, storage_path, created_at")
      .eq("snapshot_id", snapshotId).order("created_at"),
    db.from("venture_content_ads").select("id, aspect, storage_path, last_headline, created_at")
      .eq("snapshot_id", snapshotId).order("created_at"),
  ]);

  const items: CreativeItem[] = [];
  const kit: any = kitRes.data;

  const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
  logos.forEach((l, i) => {
    const path = l?.preview_path ?? l?.svg_path ?? l?.path ?? null;
    items.push({
      assetKind: "logo",
      assetRef: String(l?.id ?? path ?? `logo-${i}`),
      label: l?.label ?? l?.name ?? (l?.primary ? "Primary mark" : `Logo variant ${i + 1}`),
      group: CREATIVE_GROUPS.logo,
      previewPath: path,
    });
  });

  if (kit) {
    items.push({
      assetKind: "brand_kit",
      assetRef: "identity",
      label: "Brand identity — palette, type, voice",
      group: CREATIVE_GROUPS.brand_kit,
      previewPath: null,
    });
  }

  // Collateral is stored as vector + `-preview` raster pairs; review the pair once.
  const seenBase = new Set<string>();
  for (const c of collRes.data ?? []) {
    const path = String(c.storage_path ?? "");
    if (!/\.(png|jpe?g|webp|svg)$/i.test(path)) continue;
    const base = String(c.name ?? c.kind ?? "collateral").replace(/-preview$/i, "");
    if (seenBase.has(base)) continue;
    seenBase.add(base);
    items.push({
      assetKind: "collateral",
      assetRef: base,
      label: titleize(base),
      group: CREATIVE_GROUPS.collateral,
      previewPath: path,
    });
  }

  for (const s of socialRes.data ?? []) {
    items.push({
      assetKind: "social",
      assetRef: String(s.id),
      label: `${titleize(String(s.platform ?? ""))} · ${titleize(String(s.asset_kind ?? ""))}`,
      group: CREATIVE_GROUPS.social,
      previewPath: s.storage_path ?? null,
    });
  }

  for (const a of adsRes.data ?? []) {
    items.push({
      assetKind: "content_ad",
      assetRef: String(a.id),
      label: a.last_headline ? String(a.last_headline).slice(0, 80) : `Ad creative ${a.aspect ?? ""}`.trim(),
      group: CREATIVE_GROUPS.content_ad,
      previewPath: a.storage_path ?? null,
    });
  }

  return items;
}

/**
 * Ensure a review row exists for every current creative item, refresh drifted
 * labels/previews, and return the joined rows. Never touches review state.
 */
export async function syncCreativeReviews(db: any, snapshotId: string) {
  const items = await listCreativeItems(db, snapshotId);

  const { data: existing } = await db
    .from("venture_creative_reviews").select("*").eq("snapshot_id", snapshotId);
  const key = (k: string, r: string) => `${k}::${r}`;
  const have = new Map<string, any>((existing ?? []).map((r: any) => [key(r.asset_kind, r.asset_ref), r]));

  const missing = items
    .filter((i) => !have.has(key(i.assetKind, i.assetRef)))
    .map((i) => ({
      snapshot_id: snapshotId,
      asset_kind: i.assetKind,
      asset_ref: i.assetRef,
      label: i.label,
      preview_path: i.previewPath,
    }));
  if (missing.length) {
    await db.from("venture_creative_reviews")
      .upsert(missing, { onConflict: "snapshot_id,asset_kind,asset_ref" });
  }

  for (const i of items) {
    const row = have.get(key(i.assetKind, i.assetRef));
    if (row && (row.label !== i.label || row.preview_path !== i.previewPath)) {
      await db.from("venture_creative_reviews")
        .update({ label: i.label, preview_path: i.previewPath }).eq("id", row.id);
    }
  }

  const { data: rows } = await db
    .from("venture_creative_reviews").select("*").eq("snapshot_id", snapshotId)
    .order("asset_kind").order("label");

  const live = new Set(items.map((i) => key(i.assetKind, i.assetRef)));
  // Rows whose asset was regenerated away stay in history but drop out of the board.
  return (rows ?? []).filter((r: any) => live.has(key(r.asset_kind, r.asset_ref)));
}

/**
 * Publish gate. Sign-off only starts constraining a venture once someone has
 * moved at least one item off `draft` — otherwise every existing showcase would
 * go blank the moment this shipped.
 */
export function buildPublishGate(rows: any[]) {
  const active = rows.some((r) => r.state !== "draft");
  const ready = new Set(
    rows.filter((r) => r.state === "ready_to_publish").map((r) => `${r.asset_kind}::${r.asset_ref}`),
  );
  return {
    active,
    allows: (assetKind: string, assetRef: string) =>
      !active || ready.has(`${assetKind}::${assetRef}`),
  };
}
