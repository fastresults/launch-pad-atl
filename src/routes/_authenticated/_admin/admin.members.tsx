import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMembers,
  approveMember,
  rejectMember,
  markMemberContacted,
  pauseMember,
  restoreMemberToPending,
} from "@/lib/members-admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/_authenticated/_admin/admin/members")({
  component: AdminMembersPage,
  head: () => ({ meta: [{ title: "Members — Admin" }] }),
});

type Tab = "pending" | "approved" | "paused" | "rejected" | "no_intake";

function AdminMembersPage() {
  const listFn = useServerFn(listMembers);
  const approveFn = useServerFn(approveMember);
  const rejectFn = useServerFn(rejectMember);
  const contactFn = useServerFn(markMemberContacted);
  const pauseFn = useServerFn(pauseMember);
  const restoreFn = useServerFn(restoreMemberToPending);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [pauseTarget, setPauseTarget] = useState<{ userId: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ userId: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "members", tab, search],
    queryFn: () => listFn({ data: { status: tab, search: search || undefined } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "members"] });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const handleApprove = (userId: string) =>
    run(() => approveFn({ data: { userId } }), "Member approved");
  const handleContact = (userId: string) =>
    run(() => contactFn({ data: { userId } }), "Marked as contacted");
  const handleRestoreToPending = (userId: string) =>
    run(() => restoreFn({ data: { userId } }), "Moved back to pending");

  const confirmPause = async (reason?: string) => {
    if (!pauseTarget) return;
    setActionLoading(true);
    await run(() => pauseFn({ data: { userId: pauseTarget.userId, reason } }), "Access paused");
    setActionLoading(false);
    setPauseTarget(null);
  };

  const confirmReject = async (reason?: string) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    await run(() => rejectFn({ data: { userId: rejectTarget.userId, reason } }), "Member rejected");
    setActionLoading(false);
    setRejectTarget(null);
  };

  const counts =
    q.data?.counts ?? { pending: 0, approved: 0, paused: 0, rejected: 0, no_intake: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Approve new signups to unlock their founder dashboard. Pause or reinstate access at any time."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({counts.paused})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="no_intake">No intake ({counts.no_intake})</TabsTrigger>
          </TabsList>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or startup"
            className="max-w-xs"
          />
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {q.isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (q.data?.members ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No members in this tab.
              </div>
            ) : (
              (q.data?.members ?? []).map((m) => {
                const name = m.display_name ?? m.email ?? "this member";
                return (
                  <div
                    key={m.user_id}
                    className="flex flex-col gap-3 border-t border-white/5 p-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{m.display_name ?? m.email}</span>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                        {m.approved_via && (
                          <Badge variant="outline" className="text-[10px]">
                            via {m.approved_via}
                          </Badge>
                        )}
                        {m.approved_at && (
                          <span className="text-[10px] text-muted-foreground">
                            approved {new Date(m.approved_at).toLocaleDateString()}
                          </span>
                        )}
                        {m.intake && (
                          <Badge variant="secondary" className="text-[10px]">
                            {m.intake.startup_type}
                          </Badge>
                        )}
                      </div>
                      {m.intake ? (
                        <div className="mt-1 truncate text-sm text-muted-foreground">
                          {m.intake.startup_name ? <strong>{m.intake.startup_name}: </strong> : null}
                          {m.intake.one_line_idea}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-muted-foreground">
                          No intake submitted yet.
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {tab === "approved" && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setPauseTarget({ userId: m.user_id, name })}
                          >
                            Pause access
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectTarget({ userId: m.user_id, name })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {tab === "paused" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(m.user_id)}>
                            Reinstate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectTarget({ userId: m.user_id, name })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {tab === "rejected" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(m.user_id)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreToPending(m.user_id)}
                          >
                            Move to pending
                          </Button>
                        </>
                      )}
                      {(tab === "pending" || tab === "no_intake") && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(m.user_id)}>
                            Approve
                          </Button>
                          {m.intake && m.intake.status === "submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContact(m.user_id)}
                            >
                              Mark contacted
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectTarget({ userId: m.user_id, name })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Members are auto-approved when their workshop registration is paid, or you can approve
        them manually here. Approvals are fully reversible — pause to revoke dashboard access
        without losing their data. <Link to="/admin" className="underline">Back to dashboard</Link>
      </p>

      <ConfirmDialog
        open={pauseTarget !== null}
        onOpenChange={(o) => !o && setPauseTarget(null)}
        title={pauseTarget ? `Pause ${pauseTarget.name}'s access?` : "Pause access"}
        description="They will see the paused-account screen until you reinstate them. Their data and progress remain intact."
        confirmLabel="Pause access"
        variant="destructive"
        reasonLabel="Internal note about why (optional)"
        reasonPlaceholder="e.g. Failure to pay"
        loading={actionLoading}
        onConfirm={confirmPause}
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={rejectTarget ? `Reject ${rejectTarget.name}?` : "Reject member"}
        description="Their intake will be closed. You can move them back to pending later if needed."
        confirmLabel="Reject"
        variant="destructive"
        reasonLabel="Reason for rejection (optional)"
        reasonPlaceholder="Visible only to admins"
        loading={actionLoading}
        onConfirm={confirmReject}
      />
    </div>
  );
}
