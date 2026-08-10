import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type NoticeRow = {
  id: string;
  user_id: string;
  snapshot_id: string | null;
  context_label: string | null;
  error_code: string | null;
  providers: string[] | null;
  note: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
};

async function listNotices(): Promise<NoticeRow[]> {
  const { data, error } = await supabase
    .from("ai_capacity_notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as NoticeRow[];
}

async function setStatus(id: string, status: "open" | "resolved") {
  const { error } = await supabase
    .from("ai_capacity_notices")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

/** Triage desk for founders blocked by AI provider capacity. */
export default function AdminAiCapacityPage() {
  const qc = useQueryClient();
  const noticesQ = useQuery({ queryKey: ["admin_ai_capacity_notices"], queryFn: listNotices });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "open" | "resolved" }) => setStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_ai_capacity_notices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = noticesQ.data ?? [];
  const open = rows.filter((r) => r.status === "open");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI capacity notices"
        description="When a founder's AI step is blocked by a provider limit, they can send a notice from the app. Top up the provider, then mark it resolved."
      />

      {noticesQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!noticesQ.isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No capacity notices yet.</p>
      )}

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {open.length} open of {rows.length}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={row.status === "open" ? "default" : "secondary"}>
                    {row.status}
                  </Badge>
                  {(row.providers ?? []).map((p) => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                  {row.error_code && (
                    <span className="text-xs text-muted-foreground">{row.error_code}</span>
                  )}
                </div>
                <p className="text-sm">
                  {row.context_label || "Unspecified step"}
                </p>
                {row.note && <p className="text-sm text-muted-foreground">{row.note}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()} · user {row.user_id.slice(0, 8)}
                  {row.snapshot_id ? ` · venture ${row.snapshot_id.slice(0, 8)}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant={row.status === "open" ? "default" : "outline"}
                disabled={statusM.isPending}
                onClick={() =>
                  statusM.mutate({ id: row.id, status: row.status === "open" ? "resolved" : "open" })
                }
              >
                {row.status === "open" ? "Mark resolved" : "Reopen"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
