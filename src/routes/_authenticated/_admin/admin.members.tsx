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
} from "@/lib/members-admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/members")({
  component: AdminMembersPage,
  head: () => ({ meta: [{ title: "Members — Admin" }] }),
});

type Tab = "pending" | "approved" | "rejected" | "no_intake";

function AdminMembersPage() {
  const listFn = useServerFn(listMembers);
  const approveFn = useServerFn(approveMember);
  const rejectFn = useServerFn(rejectMember);
  const contactFn = useServerFn(markMemberContacted);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "members", tab, search],
    queryFn: () => listFn({ data: { status: tab, search: search || undefined } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "members"] });

  const handleApprove = async (userId: string) => {
    try {
      await approveFn({ data: { userId } });
      toast.success("Member approved");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };
  const handleReject = async (userId: string) => {
    const reason = window.prompt("Reason for rejection (optional)") ?? undefined;
    try {
      await rejectFn({ data: { userId, reason } });
      toast.success("Member rejected");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };
  const handleContact = async (userId: string) => {
    try {
      await contactFn({ data: { userId } });
      toast.success("Marked as contacted");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const counts = q.data?.counts ?? { pending: 0, approved: 0, rejected: 0, no_intake: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Members"
        description="Approve new signups to unlock their founder dashboard. Review intakes and manage existing members."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
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
              (q.data?.members ?? []).map((m) => (
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
                  <div className="flex shrink-0 gap-2">
                    {m.member_status !== "approved" && (
                      <Button size="sm" onClick={() => handleApprove(m.user_id)}>
                        Approve
                      </Button>
                    )}
                    {m.intake && m.intake.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContact(m.user_id)}
                      >
                        Mark contacted
                      </Button>
                    )}
                    {m.member_status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(m.user_id)}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Members are auto-approved when their workshop registration is paid, or you can approve
        them manually here. <Link to="/admin" className="underline">Back to dashboard</Link>
      </p>
    </div>
  );
}
