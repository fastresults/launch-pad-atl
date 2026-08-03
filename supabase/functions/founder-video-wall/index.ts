import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: settingRow } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "founder_video_wall")
      .maybeSingle();

    const settings = {
      enabled: true,
      heading: "Founders in their own words",
      subheading: "",
      ...((settingRow?.value as Record<string, unknown>) ?? {}),
    };

    if (settings.enabled === false) {
      return new Response(JSON.stringify({ settings, items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rows, error } = await admin
      .from("founder_video_wall")
      .select("*")
      .eq("is_live", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    const items = await Promise.all(
      (rows ?? []).map(async (r: Record<string, any>) => {
        let video_url: string | null = null;
        let poster_url: string | null = null;

        if (r.video_path) {
          if (/^https?:\/\//i.test(r.video_path)) {
            video_url = r.video_path;
          } else {
            const { data } = await admin.storage
              .from(r.video_bucket || "founder-videos")
              .createSignedUrl(r.video_path, 60 * 60 * 6);
            video_url = data?.signedUrl ?? null;
          }
        }

        if (r.poster_path) {
          if (/^https?:\/\//i.test(r.poster_path)) {
            poster_url = r.poster_path;
          } else {
            const { data } = await admin.storage
              .from(r.poster_bucket || r.video_bucket || "founder-videos")
              .createSignedUrl(r.poster_path, 60 * 60 * 6);
            poster_url = data?.signedUrl ?? null;
          }
        }

        return {
          id: r.id,
          founder_name: r.founder_name,
          city: r.city,
          founder_role: r.founder_role,
          startup_name: r.startup_name,
          quote: r.quote,
          duration_seconds: r.duration_seconds,
          video_url,
          poster_url,
        };
      }),
    );

    return new Response(JSON.stringify({ settings, items }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
