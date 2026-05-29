import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Role lookup failed");
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
  return roles as string[];
}

async function assertSuperAdmin(userId: string) {
  const roles = await assertAdmin(userId);
  if (!roles.includes("super_admin")) {
    throw new Error("Forbidden: super_admin access required");
  }
}

export const listRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("workshop_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { registrations: data ?? [] };
  });

export const updateRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("workshop_registrations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const [{ count: total }, { count: pending }, { count: confirmed }, { count: users }] =
      await Promise.all([
        supabaseAdmin.from("workshop_registrations").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("workshop_registrations")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabaseAdmin
          .from("workshop_registrations")
          .select("*", { count: "exact", head: true })
          .eq("status", "confirmed"),
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      ]);
    return {
      total: total ?? 0,
      pending: pending ?? 0,
      confirmed: confirmed ?? 0,
      users: users ?? 0,
    };
  });

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);
    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    return {
      users: (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) ?? [],
      })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "user"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("You cannot change your own role");
    }
    // Block touching another super_admin's record
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((existing ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("Cannot modify a super_admin's role");
    }
    // Remove existing non-super_admin roles, then insert the new one
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .in("role", ["admin", "user"]);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
