import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { getAdminStats, listRegistrations } from "@/lib/admin.functions";
import {
  listApplications,
  updateApplication,
  bulkUpdateApplications,
  bulkDeleteApplications,
} from "@/lib/applications-admin.functions";
import {
  listMembers,
  approveMember,
  rejectMember,
  pauseMember,
  restoreMemberToPending,
} from "@/lib/members-admin.functions";
import type { MemberRow, MemberStatusValue as MemberStatus } from "@/lib/members-admin.functions";
import type { ApplicationStatus } from "@/lib/applications-admin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const STATUS_CHOICES: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "selected", label: "Selected" },
  { value: "waitlisted", label: "Waitlist" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin dashboard" }] }),
});

function AdminDashboard() {
  const statsFn = useServerFn(getAdminStats);
  const regFn = useServerFn(listRegistrations);
  const appsFn = useServerFn(listApplications);
  const updateAppFn = useServerFn(updateApplication);
  const bulkUpdateFn = useServerFn(bulkUpdateApplications);
  const bulkDeleteFn = useServerFn(bulkDeleteApplications);
  const membersFn = useServerFn(listMembers);
  const approveFn = useServerFn(approveMember);
  const rejectFn = useServerFn(rejectMember);
  const pauseFn = useServerFn(pauseMember);
  const restoreFn = useServerFn(restoreMemberToPending);
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmRowDelete, setConfirmRowDelete] = useState<{ id: string; name: string } | null>(null);
  const [memberFilter, setMemberFilter] = useState<"all" | MemberStatus>("all");
  const [pauseTarget, setPauseTarget] = useState<MemberRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MemberRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => statsFn() });
  const regs = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: () => regFn(),
  });
  const apps = useQuery({
    queryKey: ["admin", "applications", "applied"],
    queryFn: () => appsFn({ data: { status: "applied" } }),
  });
  const members = useQuery({
    queryKey: ["admin", "members", "all"],
    queryFn: () => membersFn({ data: {} }),
  });

  const applicationsPending =
    (apps.data?.counts.applied ?? 0) + (apps.data?.counts.reviewing ?? 0);
  const applicationsTotal = apps.data?.counts
    ? Object.values(apps.data.counts).reduce((a, b) => a + b, 0)
    : 0;
  const confirmedRegistrations = stats.data?.confirmed ?? 0;
  const pendingMembers = members.data?.counts.pending ?? 0;

  const STATUS_ORDER: Record<MemberStatus, number> = {
    pending: 0,
    paused: 1,
    approved: 2,
    rejected: 3,
  };
  const allMembers = (members.data?.members ?? []) as MemberRow[];
  const sortedMembers = useMemo(
    () =>
      [...allMembers].sort(
        (a, b) =>
          (STATUS_ORDER[a.member_status] ?? 9) -
          (STATUS_ORDER[b.member_status] ?? 9),
      ),
    [allMembers],
  );
  const filteredMembers =
    memberFilter === "all"
      ? sortedMembers
      : sortedMembers.filter((m) => m.member_status === memberFilter);
  const previewMembers = filteredMembers.slice(0, 12);

  const invalidateMembers = () => {
    qc.invalidateQueries({ queryKey: ["admin", "members"] });
    qc.invalidateQueries({ queryKey: ["admin", "badges"] });
  };

  const runMember = async (fn: () => Promise<unknown>, okMsg: string) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(okMsg);
      invalidateMembers();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (userId: string) =>
    runMember(() => approveFn({ data: { userId } }), "Member approved");
  const handleRestore = (userId: string) =>
    runMember(
      () => restoreFn({ data: { userId } }),
      "Moved back to pending",
    );
  const confirmPause = async (reason?: string) => {
    if (!pauseTarget) return;
    await runMember(
      () => pauseFn({ data: { userId: pauseTarget.user_id, reason } }),
      "Access paused",
    );
    setPauseTarget(null);
  };
  const confirmReject = async (reason?: string) => {
    if (!rejectTarget) return;
    await runMember(
      () => rejectFn({ data: { userId: rejectTarget.user_id, reason } }),
      "Member rejected",
    );
    setRejectTarget(null);
  };

  const previewApps = (apps.data?.applications ?? []).slice(0, 8);
  const previewIds = previewApps.map((a) => a.id);
  const allSelected = previewIds.length > 0 && previewIds.every((id) => selectedIds.has(id));
  const someSelected = previewIds.some((id) => selectedIds.has(id));

  const toggleOne = (id: string, on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleAll = (on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      previewIds.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const invalidateApps = () => {
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    qc.invalidateQueries({ queryKey: ["admin", "badges"] });
  };

  const handleRowStatus = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateAppFn({ data: { id, patch: { status: newStatus } } });
      toast.success("Status updated");
      invalidateApps();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    }
  };

  const handleBulkStatus = async (newStatus: ApplicationStatus) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await bulkUpdateFn({ data: { ids, patch: { status: newStatus } } });
      toast.success(`Updated ${ids.length} application(s)`);
      setSelectedIds(new Set());
      invalidateApps();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const res = await bulkDeleteFn({ data: { ids } });
      toast.success(
        `Deleted ${res.deleted}${res.skipped.length ? ` — skipped ${res.skipped.length} (already registered)` : ""}`,
      );
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      invalidateApps();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  const handleRowDelete = async (id: string) => {
    try {
      const res = await bulkDeleteFn({ data: { ids: [id] } });
      if (res.deleted) toast.success("Application deleted");
      else toast.error(res.skipped[0]?.reason ?? "Could not delete");
      setConfirmRowDelete(null);
      invalidateApps();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Dashboard"
        description="Triage what needs attention today: pending approvals, new applications, registrations, and inquiries — all at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending members" value={pendingMembers} href="/admin/members" highlight={pendingMembers > 0} />
        <StatCard label="Applications to review" value={applicationsPending} />
        <StatCard label="Applications total" value={applicationsTotal} />
        <StatCard label="Registrations confirmed" value={confirmedRegistrations} />
        <StatCard label="Accounts" value={stats.data?.users} />
      </div>

      <Panel
        title="Members"
        empty={
          memberFilter === "all"
            ? "No members yet. New signups will appear here."
            : `No ${memberFilter} members.`
        }
        href="/admin/members"
        viewAllLabel="Manage all"
        toolbar={
          <div className="flex flex-wrap items-center gap-1">
            {(["all", "pending", "paused", "approved", "rejected"] as const).map((f) => {
              const counts = members.data?.counts as Record<string, number> | undefined;
              const count = f === "all" ? allMembers.length : counts?.[f] ?? 0;
              const active = memberFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setMemberFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide transition ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {f} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        }
      >
        {previewMembers.map((m) => (
          <div
            key={m.user_id}
            className="flex flex-col gap-2 border-t border-white/5 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{m.display_name ?? m.email}</span>
                <span className="text-xs text-muted-foreground">{m.email}</span>
                <MemberStatusBadge status={m.member_status} />
                {m.intake && (
                  <Badge variant="secondary" className="text-[10px]">
                    {m.intake.startup_type}
                  </Badge>
                )}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {m.intake ? (
                  <>
                    {m.intake.startup_name ? <strong>{m.intake.startup_name}: </strong> : null}
                    {m.intake.one_line_idea}
                  </>
                ) : (
                  "No startup intake submitted yet."
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {m.member_status === "pending" && (
                <Button size="sm" disabled={actionLoading} onClick={() => handleApprove(m.user_id)}>
                  Approve
                </Button>
              )}
              {m.member_status === "paused" && (
                <Button size="sm" disabled={actionLoading} onClick={() => handleApprove(m.user_id)}>
                  Reinstate
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {m.member_status === "pending" && (
                    <DropdownMenuItem onClick={() => setRejectTarget(m)}>
                      Reject…
                    </DropdownMenuItem>
                  )}
                  {m.member_status === "approved" && (
                    <DropdownMenuItem onClick={() => setPauseTarget(m)}>
                      Pause access…
                    </DropdownMenuItem>
                  )}
                  {m.member_status === "paused" && (
                    <DropdownMenuItem onClick={() => handleRestore(m.user_id)}>
                      Move to pending
                    </DropdownMenuItem>
                  )}
                  {m.member_status === "rejected" && (
                    <DropdownMenuItem onClick={() => handleRestore(m.user_id)}>
                      Move to pending
                    </DropdownMenuItem>
                  )}
                  {m.member_status === "approved" && (
                    <DropdownMenuItem onClick={() => handleRestore(m.user_id)}>
                      Move to pending
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/admin/members">Open full review</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </Panel>


      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="New applications"
          description="Founders who applied to the free cohort but haven't been admitted yet. Review each application, then move them through Reviewing, Shortlisted, Selected, Waitlist, or Rejected. Selecting an applicant promotes them to a confirmed registration and unlocks their founder dashboard."
          empty="No applications yet."
          href="/admin/applications"
          toolbar={
            previewIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all"
                />
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Set status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUS_CHOICES.map((s) => (
                          <DropdownMenuItem key={s.value} onClick={() => handleBulkStatus(s.value)}>
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      onClick={() => setConfirmBulkDelete(true)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            ) : null
          }
        >
          {previewApps.map((a) => {
            const checked = selectedIds.has(a.id);
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 border-t border-white/5 px-4 py-3 first:border-t-0 hover:bg-white/5"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggleOne(a.id, !!v)}
                  aria-label={`Select ${a.name}`}
                />
                <Link
                  to="/admin/applications/$id"
                  params={{ id: a.id }}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.email}</div>
                </Link>
                <Select value={a.status} onValueChange={(v) => handleRowStatus(a.id, v as ApplicationStatus)}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_CHOICES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                  onClick={() => setConfirmRowDelete({ id: a.id, name: a.name })}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </Panel>

        <Panel
          title="Confirmed registrations"
          description="Founders accepted into the current free cohort. Each entry represents a secured seat — they've cleared application review and are enrolled in programming. Use this list to confirm headcount, follow up on onboarding, and prep cohort communications."
          empty="No registrations yet."
          href="/admin/registrations"
        >
          {(regs.data?.registrations ?? [])
            .filter((r) => r.status === "confirmed" || r.status === "pending")
            .slice(0, 8)
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-t border-white/5 px-4 py-3 first:border-t-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {r.status}
                </Badge>
              </div>
            ))}
        </Panel>
      </div>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} application(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Applications already promoted to a registration will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmRowDelete}
        onOpenChange={(o) => !o && setConfirmRowDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmRowDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRowDelete && handleRowDelete(confirmRowDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={!!pauseTarget}
        onOpenChange={(o) => !o && setPauseTarget(null)}
        title={`Pause ${pauseTarget?.display_name ?? pauseTarget?.email ?? "this member"}'s access?`}
        description="They'll see the paused-account screen until you reinstate them. Their data and progress remain intact."
        confirmLabel="Pause access"
        variant="destructive"
        reasonLabel="Reason (optional)"
        reasonPlaceholder="Shared with the member on the paused screen"
        loading={actionLoading}
        onConfirm={confirmPause}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={`Reject ${rejectTarget?.display_name ?? rejectTarget?.email ?? "this member"}?`}
        description="They won't be able to access the founder dashboard. You can move them back to pending later."
        confirmLabel="Reject"
        variant="destructive"
        reasonLabel="Reason (optional)"
        reasonPlaceholder="Internal note — not sent to the member"
        loading={actionLoading}
        onConfirm={confirmReject}
      />
    </div>
  );
}

function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    paused: { label: "Paused", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
    rejected: { label: "Rejected", className: "bg-muted text-muted-foreground border-white/10" },
  };
  const v = map[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${v.className}`}>
      {v.label}
    </Badge>
  );
}


function Panel({
  title,
  href,
  children,
  empty,
  toolbar,
  viewAllLabel = "View all",
  description,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  empty: string;
  toolbar?: React.ReactNode;
  viewAllLabel?: string;
  description?: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {toolbar}
          <Link to={href} className="text-xs text-muted-foreground hover:text-foreground">
            {viewAllLabel} →
          </Link>
        </div>
      </div>
      {description ? (
        <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {hasChildren ? (
          children
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number | undefined;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div
      className={`rounded-2xl border p-5 transition ${
        highlight
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
          : "border-white/10 bg-card"
      } ${href ? "hover:border-white/20" : ""}`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value ?? "—"}</div>
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
