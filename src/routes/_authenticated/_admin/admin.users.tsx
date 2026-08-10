// @ts-nocheck
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { listUsersWithRoles, setUserRole } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, LogIn } from "lucide-react";

export default function UsersPage() {
  const qc = useQueryClient();
  const { user, actorUser, isAdmin, startImpersonation } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsersWithRoles(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "user" }) =>
      setUserRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenDashboard = async (u: any) => {
    if (!isAdmin) return;
    if (u.user_id === actorUser?.id) {
      navigate("/dashboard");
      return;
    }
    try {
      await startImpersonation({
        userId: u.user_id,
        name: u.display_name ?? u.email ?? "member",
        email: u.email ?? "",
      });
      toast.success(`Opened dashboard as ${u.display_name ?? u.email}`);
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to open dashboard");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users & roles"
        description="Grant or revoke admin access, or open any user's dashboard to work in their account. Actions taken while impersonating affect that user's data."
      />

      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
        Opening a dashboard signs you in as that user for this tab. Exit anytime from the amber banner.
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3 w-[320px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((u) => {
                const isSelf = u.user_id === actorUser?.id;
                const isSuper = u.roles.includes("super_admin");
                const isRowAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.user_id} className="border-t border-white/5">
                    <td className="px-4 py-3">{u.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.member_status ? (
                        <Badge
                          variant={u.member_status === "approved" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {u.member_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.roles.map((r) => (
                        <span key={r} className="mr-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                          {r}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenDashboard(u)}
                            title="Open this user's dashboard and act on their behalf"
                          >
                            <LogIn className="mr-1 h-3.5 w-3.5" /> Open dashboard
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            to={`/admin/members/${u.user_id}/view`}
                            state={{ from: "/admin/users" }}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Open as member
                          </Link>
                        </Button>
                        {isSuper || isSelf ? null : isRowAdmin ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              mutate.mutate({ userId: u.user_id, role: "user" })
                            }
                          >
                            Demote
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              mutate.mutate({ userId: u.user_id, role: "admin" })
                            }
                          >
                            Make admin
                          </Button>
                        )}
                      </div>
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
