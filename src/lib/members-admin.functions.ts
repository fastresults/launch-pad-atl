// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type MemberStatusValue = "pending" | "approved" | "rejected" | "paused";
export type MemberRow = { id: string; user_id: string; member_status: MemberStatusValue; approved_via: string | null; created_at: string; [key: string]: any };

export async function listMembers(data?: { status?: MemberStatusValue }) {
  let q = supabase.from("members").select("*").order("created_at", { ascending: false });
  if (data?.status) q = q.eq("member_status", data.status);
  const { data: rows } = await q;
  return rows ?? [];
}
export async function getMemberDetail(data: { userId: string }) {
  const { data: row } = await supabase.from("members").select("*").eq("user_id", data.userId).maybeSingle();
  return row;
}
export async function approveMember(data: { userId: string; via: "admin" | "payment" }) {
  const { error } = await supabase.from("members").update({ member_status: "approved", approved_via: data.via }).eq("user_id", data.userId);
  if (error) throw new Error(error.message);
}
export async function rejectMember(data: { userId: string }) {
  const { error } = await supabase.from("members").update({ member_status: "rejected" }).eq("user_id", data.userId);
  if (error) throw new Error(error.message);
}
export async function markMemberContacted(data: { userId: string }) {
  const { error } = await supabase.from("members").update({ contacted_at: new Date().toISOString() }).eq("user_id", data.userId);
  if (error) throw new Error(error.message);
}
export async function pauseMember(data: { userId: string }) {
  const { error } = await supabase.from("members").update({ member_status: "paused" }).eq("user_id", data.userId);
  if (error) throw new Error(error.message);
}
export async function restoreMemberToPending(data: { userId: string }) {
  const { error } = await supabase.from("members").update({ member_status: "pending" }).eq("user_id", data.userId);
  if (error) throw new Error(error.message);
}
