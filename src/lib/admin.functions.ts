// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

// All functions accept either a bare arg or the wrapped `{ data: ... }`
// shape that the UI uses (TanStack Start server-fn style).
function unwrap<T>(input: any): T {
  if (input && typeof input === "object" && "data" in input && Object.keys(input).length === 1) {
    return input.data as T;
  }
  return input as T;
}

export async function listRegistrations() {
  const { data, error } = await supabase
    .from("workshop_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    registrations: rows,
    counts: rows.reduce<Record<string, number>>((acc, r: any) => {
      const k = r.status ?? "unknown";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
    confirmed: rows.filter((r: any) => r.status === "confirmed").length,
  };
}

export async function updateRegistrationStatus(input: any) {
  const { id, status } = unwrap<{ id: string; status: string }>(input);
  const { error } = await supabase
    .from("workshop_registrations")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAdminStats() {
  const [regs, profiles, inquiries] = await Promise.all([
    supabase.from("workshop_registrations").select("status"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const regRows = regs.data ?? [];
  return {
    registrations: regRows.length,
    confirmed: regRows.filter((r: any) => r.status === "confirmed").length,
    users: profiles.count ?? 0,
    members: profiles.count ?? 0,
    openInquiries: inquiries.count ?? 0,
  };
}

export async function listUsersWithRoles() {
  const { data } = await supabase.from("user_roles").select("*");
  return data ?? [];
}

export async function setUserRole(input: any) {
  const { userId, role, action } = unwrap<{
    userId: string;
    role: string;
    action: "add" | "remove";
  }>(input);
  if (action === "add") {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) throw new Error(error.message);
  }
}
