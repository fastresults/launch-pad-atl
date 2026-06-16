// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export async function listAttendees() {
  const { data } = await supabase.from("members").select("*, user_id").eq("member_status", "approved").order("created_at", { ascending: false });
  return data ?? [];
}
export async function getAttendeeDetail(data: { userId: string }) {
  const { data: row } = await supabase.from("members").select("*").eq("user_id", data.userId).maybeSingle();
  return row;
}
export async function listReviewQueue() {
  const { data } = await supabase.from("member_deliverable_runs").select("*").eq("status", "completed").order("created_at", { ascending: false });
  return data ?? [];
}
export async function triggerPipeline(data: { userId: string; key?: string }) {
  const { error } = await supabase.from("member_deliverable_runs").insert({ user_id: data.userId, deliverable_key: data.key ?? "all", status: "queued" });
  if (error) throw new Error(error.message);
}
export async function regenerateDeliverable(data: { userId: string; key: string }) {
  const { error } = await supabase.from("member_deliverable_runs").insert({ user_id: data.userId, deliverable_key: data.key, status: "queued" });
  if (error) throw new Error(error.message);
}
export async function updateDeliverableContent(data: { id: string; content: string }) {
  const { error } = await supabase.from("member_deliverables").update({ content: data.content, edited: true }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function revertDeliverableToAi(data: { id: string }) {
  const { error } = await supabase.from("member_deliverables").update({ edited: false }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function reviewDeliverable(data: { id: string; status: string; notes?: string }) {
  const { error } = await supabase.from("member_deliverables").update({ review_status: data.status, review_notes: data.notes ?? null }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function publishDeliverable(data: { id: string }) {
  const { error } = await supabase.from("member_deliverables").update({ published: true }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function unpublishDeliverable(data: { id: string }) {
  const { error } = await supabase.from("member_deliverables").update({ published: false }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function listDeliverableRevisions(data: { deliverableId: string }) {
  const { data: rows } = await supabase.from("member_deliverable_revisions").select("*").eq("deliverable_id", data.deliverableId).order("created_at", { ascending: false });
  return rows ?? [];
}
export async function listDeliverableTypes() {
  const { data } = await supabase.from("deliverable_types").select("*").order("sort_order", { ascending: true });
  return data ?? [];
}
