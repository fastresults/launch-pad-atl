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
  const [rolesRes, profilesRes] = await Promise.all([
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("profiles").select("user_id, display_name, email"),
  ]);
  const profileByUser = new Map<string, any>();
  for (const p of profilesRes.data ?? []) profileByUser.set(p.user_id, p);

  const rolesByUser = new Map<string, string[]>();
  for (const r of rolesRes.data ?? []) {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  }
  // Include users in profiles even if they have no role rows (defensive).
  for (const uid of profileByUser.keys()) {
    if (!rolesByUser.has(uid)) rolesByUser.set(uid, []);
  }

  const users = Array.from(rolesByUser.entries()).map(([user_id, roles]) => {
    const p = profileByUser.get(user_id);
    return {
      user_id,
      display_name: p?.display_name ?? null,
      email: p?.email ?? null,
      roles,
    };
  });
  // Sort: admins first, then by name/email
  users.sort((a, b) => {
    const ar = a.roles.includes("super_admin") ? 0 : a.roles.includes("admin") ? 1 : 2;
    const br = b.roles.includes("super_admin") ? 0 : b.roles.includes("admin") ? 1 : 2;
    if (ar !== br) return ar - br;
    return (a.display_name ?? a.email ?? "").localeCompare(b.display_name ?? b.email ?? "");
  });
  return { users };
}

export async function setUserRole(input: any) {
  const args = unwrap<{
    userId: string;
    role: "admin" | "user" | "super_admin";
    action?: "add" | "remove";
  }>(input);
  const { userId, role } = args;
  if (!userId || !role) throw new Error("Missing userId or role");

  // The UI passes role: "admin" | "user" as the *desired* state.
  // Interpret "user" as remove-admin, "admin" as add-admin, unless an explicit action is given.
  const action: "add" | "remove" =
    args.action ?? (role === "user" ? "remove" : "add");
  const targetRole = role === "user" ? "admin" : role;

  if (action === "add") {
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: userId, role: targetRole },
        { onConflict: "user_id,role" },
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", targetRole);
    if (error) throw new Error(error.message);
  }
}
