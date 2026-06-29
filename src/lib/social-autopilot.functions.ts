// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
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
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error("Not signed in");
  return data.user.id;
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

// Per-platform: avatar (where applicable) + banner/header/channel_art
export function buildKitTasks(
  platforms: string[],
  direction: string,
  specs: Record<string, { assets: { kind: string }[] }>,
): KitTask[] {
  const tasks: KitTask[] = [];
  for (const p of platforms) {
    const spec = specs[p];
    if (!spec) continue;
    const wanted = spec.assets.filter((a) =>
      ["avatar", "banner", "header", "channel_art"].includes(a.kind),
    );
    // Prefer 1 avatar + 1 cover-ish, dedup by kind family
    const seenCover = new Set<string>();
    for (const a of wanted) {
      if (a.kind === "avatar") {
        tasks.push({ platform: p, asset: a.kind, direction, status: "pending" });
      } else if (!seenCover.has("cover")) {
        seenCover.add("cover");
        tasks.push({ platform: p, asset: a.kind, direction, status: "pending" });
      }
    }
  }
  return tasks;
}

export async function generateOneKitTask(
  snapshotId: string,
  task: KitTask,
  opts?: { feedback?: string; directionOverride?: string },
): Promise<void> {
  await generateSocialCover({
    snapshotId,
    platform: task.platform,
    asset: task.asset,
    direction: opts?.directionOverride || task.direction,
    feedback: opts?.feedback,
  });
}
