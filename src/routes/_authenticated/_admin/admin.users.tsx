import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsersWithRoles, setUserRole } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/users")({
  component: UsersPage,
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
});

function UsersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const listFn = useServerFn(listUsersWithRoles);
  const setRoleFn = useServerFn(setUserRole);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "user" }) =>
      setRoleFn({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users & roles"
        description="Grant or revoke admin access for staff. Anyone listed here can read and modify founder data."
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((u) => {
                const isSelf = u.user_id === user?.id;
                const isSuper = u.roles.includes("super_admin");
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.user_id} className="border-t border-white/5">
                    <td className="px-4 py-3">{u.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className="mr-1 rounded-full bg-white/10 px-2 py-0.5 text-xs"
                        >
                          {r}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {isSuper || isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            mutate.mutate({ userId: u.user_id, role: "user" })
                          }
                        >
                          Demote
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            mutate.mutate({ userId: u.user_id, role: "admin" })
                          }
                        >
                          Make admin
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
