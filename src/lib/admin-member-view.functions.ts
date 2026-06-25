// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

/**
 * Aggregated read-only view of a member's dashboard for admins.
 * Relies on existing admin-aware RLS policies (is_admin) on each table.
 */
export async function getMemberView(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  if (!userId) throw new Error("userId required");

  const [profileRes, attendeeRes, founderRes, intakeRes, snapshotsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, email, member_status, approved_at, approved_via, founders_hub_access, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("attendee_profiles")
      .select("business_name, industry, stage, intake_completed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("attendee_founder_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("member_intakes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("venture_snapshots")
      .select("id, company_name, industry, status, concept_status, concept_summary, value_proposition, website_url, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const snapshots = snapshotsRes.data ?? [];
  const snapshotIds = snapshots.map((s: any) => s.id);

  let docsBySnapshot = new Map<string, any[]>();
  if (snapshotIds.length) {
    const { data: docs } = await supabase
      .from("venture_documents")
      .select("id, snapshot_id, document_type, status, version, created_at, updated_at, hero_image_path")
      .in("snapshot_id", snapshotIds)
      .order("updated_at", { ascending: false });
    for (const d of docs ?? []) {
      const arr = docsBySnapshot.get(d.snapshot_id) ?? [];
      arr.push(d);
      docsBySnapshot.set(d.snapshot_id, arr);
    }
  }

  return {
    profile: profileRes.data ?? null,
    attendee: attendeeRes.data ?? null,
    founder: founderRes.data ?? null,
    intake: intakeRes.data ?? null,
    snapshots: snapshots.map((s: any) => ({
      ...s,
      documents: docsBySnapshot.get(s.id) ?? [],
    })),
  };
}

export async function getMemberDocument(input: any) {
  const { documentId } = unwrap<{ documentId: string }>(input);
  if (!documentId) throw new Error("documentId required");
  const { data, error } = await supabase
    .from("venture_documents")
    .select("id, snapshot_id, document_type, content, status, hero_image_path")
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
