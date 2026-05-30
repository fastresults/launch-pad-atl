import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listApplications,
  updateApplication,
  bulkUpdateApplications,
  bulkDeleteApplications,
  type ApplicationStatus,
} from "@/lib/applications-admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/applications/")({
  component: ApplicationsListPage,
  head: () => ({ meta: [{ title: "Applications — Admin" }] }),
});

const STATUS_OPTIONS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "selected", label: "Selected" },
  { value: "waitlisted", label: "Waitlist" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const EDITABLE_STATUSES = STATUS_OPTIONS.filter(
  (o): o is { value: ApplicationStatus; label: string } => o.value !== "all",
);

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  reviewing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  shortlisted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  selected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  waitlisted: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  withdrawn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function ApplicationsListPage() {
  const [status, setStatus] = useState<ApplicationStatus | "all">("applied");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmRowDelete, setConfirmRowDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  const listFn = useServerFn(listApplications);
  const updateFn = useServerFn(updateApplication);
  const bulkUpdateFn = useServerFn(bulkUpdateApplications);
  const bulkDeleteFn = useServerFn(bulkDeleteApplications);
  const qc = useQueryClient();

  const queryKey = ["admin", "applications", status, search] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      listFn({
        data: {
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
        },
      }),
  });

  // Reset selection on filter/search change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [status, search]);

  const counts = data?.counts;
  const totalAll = useMemo(
    () => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0),
    [counts],
  );

  const rows = data?.applications ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));
  const colSpan = 8;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }
  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleInlineStatus(id: string, next: ApplicationStatus) {
    try {
      await updateFn({ data: { id, patch: { status: next } } });
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleBulkStatus(next: ApplicationStatus) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const res = await bulkUpdateFn({ data: { ids, patch: { status: next } } });
      toast.success(`Updated ${res.updated} application${res.updated === 1 ? "" : "s"}`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const res = await bulkDeleteFn({ data: { ids } });
      toast.success(`Deleted ${res.deleted} application${res.deleted === 1 ? "" : "s"}`);
      if (res.skipped.length > 0) {
        toast.warning(
          `Skipped ${res.skipped.length}: ${res.skipped.map((s) => s.name).join(", ")} (already promoted)`,
        );
      }
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function handleRowDelete(id: string) {
    try {
      const res = await bulkDeleteFn({ data: { ids: [id] } });
      if (res.deleted === 0 && res.skipped.length > 0) {
        toast.error(res.skipped[0].reason);
      } else {
        toast.success("Application deleted");
      }
      setConfirmRowDelete(null);
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Applications"
        description="Review applicants, edit inline, bulk-update status, and promote selected founders into a cohort registration."
        actions={
          <Input
            placeholder="Search name, email, industry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64"
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const n =
            opt.value === "all" ? totalAll : counts ? counts[opt.value] : 0;
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {opt.label} <span className="ml-1 opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Set status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {EDITABLE_STATUSES.map((o) => (
                  <DropdownMenuItem key={o.value} onClick={() => handleBulkStatus(o.value)}>
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
            >
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(c) => toggleAll(c === true)}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Industry · Stage</th>
              <th className="px-4 py-3">About startup</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((a) => {
              const checked = selectedIds.has(a.id);
              return (
                <tr
                  key={a.id}
                  className={cn(
                    "border-t border-white/5 align-top hover:bg-white/5",
                    checked && "bg-primary/5",
                  )}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => toggleOne(a.id, c === true)}
                      aria-label={`Select ${a.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/admin/applications/$id"
                      params={{ id: a.id }}
                      className="hover:underline"
                    >
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.industry} · {a.stage}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-2 max-w-md">
                    {a.about_startup}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={a.status as ApplicationStatus}
                      onValueChange={(v) =>
                        handleInlineStatus(a.id, v as ApplicationStatus)
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-[130px] border text-xs",
                          STATUS_TONE[a.status as ApplicationStatus],
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDITABLE_STATUSES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirmRowDelete({ id: a.id, name: a.name })}
                      aria-label={`Delete ${a.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {data && rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
                  No applications match this filter yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} applications?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Applications already promoted to a registration will be
              skipped to avoid orphaning the registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmRowDelete}
        onOpenChange={(o) => !o && setConfirmRowDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete application from {confirmRowDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If this application was already promoted to a registration,
              the delete will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRowDelete && handleRowDelete(confirmRowDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
