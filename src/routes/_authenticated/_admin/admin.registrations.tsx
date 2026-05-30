import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRegistrations, updateRegistrationStatus } from "@/lib/admin.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/registrations")({
  component: RegistrationsPage,
  head: () => ({ meta: [{ title: "Registrations — Admin" }] }),
});

const STATUSES = ["pending", "confirmed", "cancelled", "waitlist"] as const;

function RegistrationsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRegistrations);
  const updateFn = useServerFn(updateRegistrationStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; status: (typeof STATUSES)[number] }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Registrations"
        description="Founders confirming their cohort seat. Track payment status, update assignments, and finalize the attendee roster."
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Idea</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 w-40">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.registrations ?? []).map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{r.email}</div>
                    {r.phone && <div className="text-xs">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-sm">{r.business_idea}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.industry}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.stage}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tier_interest ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        mutate.mutate({ id: r.id, status: v as (typeof STATUSES)[number] })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {data && data.registrations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
