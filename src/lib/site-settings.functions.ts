import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteVariant = "original" | "selection";

export type SiteSettings = {
  home_variant: SiteVariant;
  register_variant: SiteVariant;
  updated: {
    home_variant: string | null;
    register_variant: string | null;
  };
};

const DEFAULTS: SiteSettings = {
  home_variant: "original",
  register_variant: "original",
  updated: { home_variant: null, register_variant: null },
};

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    try {
      // site_settings is new; types may not include it yet — cast to bypass typed table list.
      const { data, error } = await (supabaseAdmin as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            in: (col: string, vals: string[]) => Promise<{
              data: Array<{ key: string; value: unknown; updated_at: string }> | null;
              error: unknown;
            }>;
          };
        };
      })
        .from("site_settings")
        .select("key, value, updated_at")
        .in("key", ["home_variant", "register_variant"]);
      if (error || !data) return DEFAULTS;
      const out: SiteSettings = { ...DEFAULTS, updated: { home_variant: null, register_variant: null } };
      for (const row of data) {
        const v: SiteVariant = row.value === "selection" ? "selection" : "original";
        if (row.key === "home_variant") {
          out.home_variant = v;
          out.updated.home_variant = row.updated_at;
        } else if (row.key === "register_variant") {
          out.register_variant = v;
          out.updated.register_variant = row.updated_at;
        }
      }
      return out;
    } catch {
      return DEFAULTS;
    }
  },
);

const UpdateInput = z.object({
  key: z.enum(["home_variant", "register_variant"]),
  value: z.enum(["original", "selection"]),
});

export const updateSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateInput.parse(i))
  .handler(async ({ data, context }) => {
    // super_admin check
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isSuper = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");
    if (!isSuper) throw new Error("Forbidden: super admin only.");

    const { error } = await (supabaseAdmin as unknown as {
      from: (t: string) => {
        upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("site_settings")
      .upsert(
        {
          key: data.key,
          value: data.value,
          updated_at: new Date().toISOString(),
          updated_by: context.userId,
        },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
