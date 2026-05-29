import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/publish-due-deliverables")({
  server: {
    handlers: {
      POST: async () => {
        const nowIso = new Date().toISOString();

        const { data: due, error } = await supabaseAdmin
          .from("attendee_deliverables")
          .select("id, user_id, deliverable_key, content_current")
          .eq("publish_status", "scheduled")
          .eq("review_status", "approved")
          .lte("publish_at", nowIso);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rows = due ?? [];
        if (rows.length === 0) {
          return new Response(JSON.stringify({ published: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const ids = rows.map((r) => r.id);
        const { error: upErr } = await supabaseAdmin
          .from("attendee_deliverables")
          .update({ publish_status: "published", published_at: nowIso })
          .in("id", ids);
        if (upErr) {
          return new Response(JSON.stringify({ error: upErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        await supabaseAdmin.from("deliverable_revisions").insert(
          rows.map((r) => ({
            deliverable_id: r.id,
            user_id: r.user_id,
            deliverable_key: r.deliverable_key,
            action: "published",
            source: "scheduler",
          })),
        );

        return new Response(JSON.stringify({ published: rows.length, ids }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
