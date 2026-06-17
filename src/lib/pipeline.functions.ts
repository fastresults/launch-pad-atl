// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return (input ?? {}) as T;
}

/** ------- Attendees list ------- */
export async function listAttendees() {
  // Approved members from profiles + their intake info if present.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, member_status, created_at")
    .eq("member_status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const users = profiles ?? [];

  const userIds = users.map((u: any) => u.user_id);
  let intakesByUser = new Map<string, any>();
  let attendeesByUser = new Map<string, any>();
  let counts = new Map<string, { pending: number; published: number }>();

  if (userIds.length) {
    const [intakeRes, attendeeRes, delivRes] = await Promise.all([
      supabase.from("member_intakes").select("*").in("user_id", userIds),
      supabase.from("attendee_profiles").select("*").in("user_id", userIds),
      supabase
        .from("attendee_deliverables")
        .select("user_id, review_status, publish_status")
        .in("user_id", userIds),
    ]);
    for (const r of intakeRes.data ?? []) intakesByUser.set(r.user_id, r);
    for (const r of attendeeRes.data ?? []) attendeesByUser.set(r.user_id, r);
    for (const d of delivRes.data ?? []) {
      const c = counts.get(d.user_id) ?? { pending: 0, published: 0 };
      if (d.review_status === "pending_review") c.pending++;
      if (d.publish_status === "published") c.published++;
      counts.set(d.user_id, c);
    }
  }

  const attendees = users.map((u: any) => {
    const ap = attendeesByUser.get(u.user_id);
    return {
      user_id: u.user_id,
      display_name: u.display_name,
      email: u.email,
      attendee: ap
        ? {
            business_name: ap.business_name,
            intake_completed_at: ap.intake_completed_at,
          }
        : null,
      counts: counts.get(u.user_id) ?? { pending: 0, published: 0 },
    };
  });

  return { attendees, counts: { total: attendees.length } };
}

/** ------- Attendee detail ------- */
export async function getAttendeeDetail(input: any) {
  const { userId } = unwrap<{ userId: string }>(input);
  if (!userId) return null;

  const [profileRes, attendeeRes, docsRes, delivRes, runsRes, typesRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("attendee_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("attendee_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("attendee_deliverables")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("ai_pipeline_runs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("deliverable_types").select("key, label, description, stage_label, stage_n"),
    ]);

  const typeByKey = new Map<string, any>();
  for (const t of typesRes.data ?? []) typeByKey.set(t.key, t);

  const deliverables = (delivRes.data ?? []).map((d: any) => ({
    ...d,
    deliverable_types: typeByKey.get(d.deliverable_key) ?? null,
  }));

  const documents = (docsRes.data ?? []).map((d: any) => ({
    ...d,
    original_name: d.original_name ?? d.kind ?? "Document",
  }));

  return {
    attendee: attendeeRes.data ?? null,
    profile: profileRes.data ?? null,
    documents,
    deliverables,
    runs: runsRes.data ?? [],
  };
}

/** ------- Review queue ------- */
export async function listReviewQueue() {
  const { data, error } = await supabase
    .from("attendee_deliverables")
    .select("*")
    .eq("review_status", "pending_review")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const userIds = [...new Set(rows.map((r: any) => r.user_id))];
  const keys = [...new Set(rows.map((r: any) => r.deliverable_key))];

  const [profilesRes, typesRes] = await Promise.all([
    userIds.length
      ? supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    keys.length
      ? supabase
          .from("deliverable_types")
          .select("key, label, stage_label")
          .in("key", keys)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profileByUser = new Map<string, any>();
  for (const p of profilesRes.data ?? []) profileByUser.set(p.user_id, p);
  const typeByKey = new Map<string, any>();
  for (const t of typesRes.data ?? []) typeByKey.set(t.key, t);

  const queue = rows.map((r: any) => ({
    ...r,
    profile: profileByUser.get(r.user_id) ?? null,
    deliverable_types: typeByKey.get(r.deliverable_key) ?? null,
  }));

  return { queue };
}

/** ------- Pipeline trigger ------- */
export async function triggerPipeline(input: any) {
  const { userId } = unwrap<{ userId: string; key?: string }>(input);
  const { error } = await supabase
    .from("ai_pipeline_runs")
    .insert({ user_id: userId, status: "queued" });
  if (error) throw new Error(error.message);
  return { totalSteps: 0, failed: 0 };
}

export async function regenerateDeliverable(input: any) {
  const { userId } = unwrap<{ userId: string; key: string }>(input);
  const { error } = await supabase
    .from("ai_pipeline_runs")
    .insert({ user_id: userId, status: "queued" });
  if (error) throw new Error(error.message);
}

/** ------- Deliverable edits ------- */
export async function updateDeliverableContent(input: any) {
  const { userId, key, content } = unwrap<{
    userId: string;
    key: string;
    content: unknown;
  }>(input);
  const { error } = await supabase
    .from("attendee_deliverables")
    .update({
      content_current: content as any,
      content_source: "admin",
      admin_edited_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("deliverable_key", key);
  if (error) throw new Error(error.message);
}

export async function revertDeliverableToAi(input: any) {
  const { userId, key } = unwrap<{ userId: string; key: string }>(input);
  const { data: row } = await supabase
    .from("attendee_deliverables")
    .select("content_ai")
    .eq("user_id", userId)
    .eq("deliverable_key", key)
    .maybeSingle();
  const { error } = await supabase
    .from("attendee_deliverables")
    .update({
      content_current: (row?.content_ai ?? {}) as any,
      content_source: "ai",
    })
    .eq("user_id", userId)
    .eq("deliverable_key", key);
  if (error) throw new Error(error.message);
}

export async function reviewDeliverable(input: any) {
  const { userId, key, decision, notes } = unwrap<{
    userId: string;
    key: string;
    decision: "approve" | "request_changes" | "reject";
    notes?: string;
  }>(input);
  const review_status =
    decision === "approve"
      ? "approved"
      : decision === "request_changes"
        ? "changes_requested"
        : "rejected";
  const { error } = await supabase
    .from("attendee_deliverables")
    .update({
      review_status,
      reviewer_notes: notes ?? null,
      approved_at: review_status === "approved" ? new Date().toISOString() : null,
    })
    .eq("user_id", userId)
    .eq("deliverable_key", key);
  if (error) throw new Error(error.message);
}

export async function publishDeliverable(input: any) {
  const { userId, key, when } = unwrap<{
    userId: string;
    key: string;
    when: "now" | { scheduledAt: string };
  }>(input);
  const update =
    when === "now"
      ? {
          publish_status: "published",
          published_at: new Date().toISOString(),
          publish_at: null,
        }
      : {
          publish_status: "scheduled",
          publish_at: when.scheduledAt,
        };
  const { error } = await supabase
    .from("attendee_deliverables")
    .update(update)
    .eq("user_id", userId)
    .eq("deliverable_key", key);
  if (error) throw new Error(error.message);
}

export async function unpublishDeliverable(input: any) {
  const { userId, key } = unwrap<{ userId: string; key: string }>(input);
  const { error } = await supabase
    .from("attendee_deliverables")
    .update({ publish_status: "unpublished", published_at: null, publish_at: null })
    .eq("user_id", userId)
    .eq("deliverable_key", key);
  if (error) throw new Error(error.message);
}

/** ------- Deliverable revisions ------- */
export async function listDeliverableRevisions(input: any) {
  const { userId, key } = unwrap<{ userId: string; key: string }>(input);
  const { data } = await supabase
    .from("deliverable_revisions")
    .select("*")
    .eq("user_id", userId)
    .eq("deliverable_key", key)
    .order("created_at", { ascending: false });
  return { revisions: data ?? [] };
}

export async function listDeliverableTypes() {
  const { data } = await supabase
    .from("deliverable_types")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
