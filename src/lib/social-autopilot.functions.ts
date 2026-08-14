// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveUserId } from "@/lib/effective-user";
import { generateDocument, listSnapshotDocuments } from "@/lib/foundersHub.functions";
import { generateSocialCover } from "@/lib/social-cover.functions";


export type SocialGoals = {
  objectives?: string[];          // ["customers","trust","investors","hire","community"]
  weekly_hours?: 1 | 3 | 5;
  on_camera?: "love" | "ok" | "avoid";
};

export type SocialProgress = {
  snapshot_id: string;
  user_id: string;
  current_step: number;
  goals: SocialGoals;
  selected_platforms: string[];
  art_direction: string | null;
  launch_status: Record<string, { live?: boolean }>;
  updated_at: string;
};

async function getUserId(): Promise<string> {
  return await getEffectiveUserId();
}


export async function getSocialProgress(snapshotId: string): Promise<SocialProgress | null> {
  const { data, error } = await supabase
    .from("venture_social_progress")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .maybeSingle();
  if (error) throw error;
  return data as SocialProgress | null;
}

export async function upsertSocialProgress(
  snapshotId: string,
  patch: Partial<SocialProgress>,
): Promise<SocialProgress> {
  const uid = await getUserId();
  const { data, error } = await supabase
    .from("venture_social_progress")
    .upsert(
      { snapshot_id: snapshotId, user_id: uid, ...patch },
      { onConflict: "snapshot_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as SocialProgress;
}

export const PLAN_DOCS = [
  { type: "social_media_audit_setup", label: "Researching your audience" },
  { type: "content_strategy_pillars", label: "Picking the right channels for you" },
  { type: "content_calendar_90day", label: "Writing your 90-day content plan" },
  { type: "launch_content_kit", label: "Drafting your launch posts" },
] as const;

export type PlanDocType = (typeof PLAN_DOCS)[number]["type"];

export async function ensurePlanDoc(
  snapshotId: string,
  documentType: PlanDocType,
): Promise<void> {
  await generateDocument({ data: { snapshotId, documentType } });
}

export async function listPlanDocs(snapshotId: string) {
  const docs = await listSnapshotDocuments({ data: { snapshotId } });
  return PLAN_DOCS.map((p) => ({
    ...p,
    doc: docs.find((d: any) => d.document_type === p.type),
  }));
}

// --- batched cover-kit generation ----------------------------------
export type KitTask = {
  platform: string;
  asset: string; // AssetKind
  direction: string;
  status: "pending" | "running" | "done" | "error";
  error?: string;
};

// Per-platform: avatar (where applicable) + a hero/cover asset chosen from the
// platform's spec. Platforms whose identity needs a second format get an extra tile.
const COVER_PRIORITY = [
  "channel_art", "header", "banner",
  "pinned_post", "video_poster", "vertical_pin",
  "story_cover", "thumbnail",
];
const EXTRA_KIT_ASSETS: Record<string, string[]> = {
  Instagram: ["story_cover"],
  TikTok:    ["video_poster"],
  YouTube:   ["thumbnail"],
  Pinterest: ["vertical_pin"],
};

/**
 * The single canonical hero/cover asset kind for a platform, using the same
 * priority the generator uses. Platforms with no wide banner (Instagram,
 * TikTok, Threads) resolve to their real hero tile instead of showing nothing.
 */
export function coverKindFor(
  platform: string,
  specs: Record<string, { assets: { kind: string }[] }>,
): string | null {
  const spec = specs[platform];
  if (!spec) return null;
  const kinds = new Set(spec.assets.map((a) => a.kind));
  return COVER_PRIORITY.find((k) => kinds.has(k)) ?? null;
}

export function coverLabelFor(
  platform: string,
  specs: Record<string, { assets: { kind: string; label?: string }[] }>,
): string {
  const kind = coverKindFor(platform, specs as any);
  const spec = specs[platform];
  const asset = spec?.assets.find((a) => a.kind === kind);
  return asset?.label ?? "cover";
}

export function buildKitTasks(
  platforms: string[],
  direction: string,
  specs: Record<string, { assets: { kind: string }[] }>,
): KitTask[] {
  const tasks: KitTask[] = [];
  for (const p of platforms) {
    const spec = specs[p];
    if (!spec) continue;
    const kinds = new Set(spec.assets.map((a) => a.kind));
    const added = new Set<string>();
    const push = (kind: string) => {
      if (!kinds.has(kind) || added.has(kind)) return;
      added.add(kind);
      tasks.push({ platform: p, asset: kind, direction, status: "pending" });
    };
    if (kinds.has("avatar")) push("avatar");
    const hero = COVER_PRIORITY.find((k) => kinds.has(k));
    if (hero) push(hero);
    for (const k of EXTRA_KIT_ASSETS[p] ?? []) push(k);
  }
  return tasks;
}

export async function generateOneKitTask(
  snapshotId: string,
  task: KitTask,
  opts?: {
    feedback?: string;
    directionOverride?: string;
    signatureIntensity?: "subtle" | "balanced" | "bold";
    signaturePlacement?:
      | "auto" | "anchor_block" | "sidebar_stripe" | "duotone_wash"
      | "focal_shape" | "corner_mark" | "framed_border";
    signatureMinCoveragePct?: number;
    paletteOverride?: { surface?: string; ink?: string; accent?: string; signature?: string };
    headlineOverride?: { mode: "auto" | "custom" | "none"; text?: string };
    logoSize?: "sm" | "md" | "lg";
    markPick?: { form: string; tone: string } | null;
    placementKey?: string;
    sceneOverride?: string;
    refreshScenes?: boolean;
  },
): Promise<void> {
  await generateSocialCover({
    snapshotId,
    platform: task.platform,
    asset: task.asset,
    direction: opts?.directionOverride || task.direction,
    feedback: opts?.feedback,
    signatureIntensity: opts?.signatureIntensity,
    signaturePlacement: opts?.signaturePlacement,
    signatureMinCoveragePct: opts?.signatureMinCoveragePct,
    paletteOverride: opts?.paletteOverride,
    headlineOverride: opts?.headlineOverride,
    logoSize: opts?.logoSize,
    markPick: opts?.markPick,
    placementKey: opts?.placementKey,
    sceneOverride: opts?.sceneOverride,
    refreshScenes: opts?.refreshScenes,
  });
}
