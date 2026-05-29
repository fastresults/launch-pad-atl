import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildCohortFromRow, type Cohort, type CohortRow } from "./cohorts";

const COHORT_COLUMNS =
  "id, cohort_date, tz, start_time, end_time, status, seats_left, venue_name, venue_address, venue_city, venue_region, venue_postal, sort_order";

export const listCohorts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cohort[]> => {
    const { data, error } = await supabaseAdmin
      .from("cohorts" as never)
      .select(COHORT_COLUMNS)
      .order("cohort_date", { ascending: true });

    if (error) {
      console.error("[cohorts] list failed", error);
      return [];
    }
    return ((data ?? []) as unknown as CohortRow[]).map(buildCohortFromRow);
  },
);

const UpsertSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cohort_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tz: z.enum(["EDT", "EST"]),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  status: z.enum(["sold_out", "filling", "open"]),
  seats_left: z.number().int().min(0).max(999).nullable().optional(),
  venue_name: z.string().trim().min(1).max(200),
  venue_address: z.string().trim().min(1).max(200),
  venue_city: z.string().trim().min(1).max(100),
  venue_region: z.string().trim().min(1).max(60),
  venue_postal: z.string().trim().min(1).max(20),
  sort_order: z.number().int().optional(),
});

async function ensureSuperAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Could not verify permissions.");
  const isSuper = (data ?? []).some((r: { role: string }) => r.role === "super_admin");
  if (!isSuper) throw new Error("Forbidden: super admin only.");
}

export const upsertCohort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);

    const id = data.id ?? data.cohort_date;
    const sort_order =
      data.sort_order ?? Math.floor(new Date(data.cohort_date).getTime() / 86_400_000);

    const row = {
      id,
      cohort_date: data.cohort_date,
      tz: data.tz,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status,
      seats_left: data.status === "filling" ? data.seats_left ?? null : null,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      venue_city: data.venue_city,
      venue_region: data.venue_region,
      venue_postal: data.venue_postal,
      sort_order,
    };

    const { error } = await supabaseAdmin
      .from("cohorts" as never)
      .upsert(row as never, { onConflict: "id" });

    if (error) {
      console.error("[cohorts] upsert failed", error);
      throw new Error(error.message);
    }
    return { ok: true as const, id };
  });

export const deleteCohort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("cohorts" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
