import { supabase } from "@/integrations/supabase/client";

export type InquiryStatus = "new" | "in_progress" | "replied" | "closed";

export async function listInquiries(data?: { status?: InquiryStatus }) {
  let q = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  if (data?.status) q = q.eq("status", data.status);
  const { data: rows } = await q;
  return rows ?? [];
}
export async function getInquiry(data: { id: string }) {
  const { data: row } = await supabase.from("inquiries").select("*").eq("id", data.id).maybeSingle();
  return row;
}
export async function updateInquiryStatus(data: { id: string; status: InquiryStatus }) {
  const { error } = await supabase.from("inquiries").update({ status: data.status }).eq("id", data.id);
  if (error) throw new Error(error.message);
}
export async function replyToInquiry(data: { id: string; body: string }) {
  const { error } = await supabase.from("inquiry_messages").insert({ inquiry_id: data.id, direction: "outbound", body: data.body });
  if (error) throw new Error(error.message);
  await supabase.from("inquiries").update({ status: "replied" }).eq("id", data.id);
}
