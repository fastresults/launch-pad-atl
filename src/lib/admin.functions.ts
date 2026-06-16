import { supabase } from "@/integrations/supabase/client";

export async function listRegistrations() {
  const { data } = await supabase.from("workshop_registrations").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function updateRegistrationStatus(data: { id: string; status: string }) {
  const { error } = await supabase.from("workshop_registrations").update({ status: data.status }).eq("id", data.id);
  if (error) throw new Error(error.message);
}

export async function getAdminStats() {
  const [regs, members, inquiries] = await Promise.all([
    supabase.from("workshop_registrations").select("id", { count: "exact" }),
    supabase.from("members").select("id", { count: "exact" }),
    supabase.from("inquiries").select("id", { count: "exact" }).eq("status", "open"),
  ]);
  return { registrations: regs.count ?? 0, members: members.count ?? 0, openInquiries: inquiries.count ?? 0 };
}

export async function listUsersWithRoles() {
  const { data } = await supabase.from("user_roles").select("*, users:user_id(email)");
  return data ?? [];
}

export async function setUserRole(data: { userId: string; role: string; action: "add" | "remove" }) {
  if (data.action === "add") {
    const { error } = await supabase.from("user_roles").upsert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    if (error) throw new Error(error.message);
  }
}
