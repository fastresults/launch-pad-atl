import { supabase } from "@/integrations/supabase/client";

async function uid() { return (await supabase.auth.getUser()).data.user!.id; }

export async function getMyWorkflow() {
  const { data } = await supabase.from("member_workflow_steps").select("*").eq("user_id", await uid()).order("sort_order", { ascending: true });
  return data ?? [];
}
export async function runMyDeliverable(data: { key: string }) {
  const { error } = await supabase.from("member_deliverable_runs").insert({ user_id: await uid(), deliverable_key: data.key, status: "queued" });
  if (error) throw new Error(error.message);
}
export async function runMyRemaining() {
  const { error } = await supabase.from("member_deliverable_runs").insert({ user_id: await uid(), deliverable_key: "all", status: "queued" });
  if (error) throw new Error(error.message);
}
export async function adminRunForUser(data: { userId: string; key: string }) {
  const { error } = await supabase.from("member_deliverable_runs").insert({ user_id: data.userId, deliverable_key: data.key, status: "queued" });
  if (error) throw new Error(error.message);
}
export async function getMyRecentRuns() {
  const { data } = await supabase.from("member_deliverable_runs").select("*").eq("user_id", await uid()).order("created_at", { ascending: false }).limit(10);
  return data ?? [];
}
export async function adminGetUserWorkflow(data: { userId: string }) {
  const { data: rows } = await supabase.from("member_workflow_steps").select("*").eq("user_id", data.userId).order("sort_order", { ascending: true });
  return rows ?? [];
}
