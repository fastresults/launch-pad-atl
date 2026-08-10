// @ts-nocheck
// Peek launcher.
//
// This route no longer renders a bespoke read-only admin view. It starts an
// audited impersonation session for the target member and drops the admin into
// the *real* member dashboard, so what the admin sees is exactly what the
// member sees — and the admin can act on their behalf.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getMemberView } from "@/lib/admin-member-view.functions";
import { IMPERSONATION_RETURN_KEY } from "@/lib/effective-user";

export default function AdminMemberPeekLauncher() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, actorUser, startImpersonation } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!userId || started.current) return;
    started.current = true;

    (async () => {
      if (!isAdmin) {
        navigate("/dashboard", { replace: true });
        return;
      }
      if (userId === actorUser?.id) {
        navigate("/dashboard", { replace: true });
        return;
      }
      try {
        let name = "member";
        let email = "";
        try {
          const view = await getMemberView({ data: { userId } });
          name = view?.profile?.display_name ?? view?.profile?.email ?? "member";
          email = view?.profile?.email ?? "";
        } catch {
          /* name/email are cosmetic — proceed without them */
        }

        // Remember where to send the admin when they exit.
        const from = (location.state as any)?.from;
        try {
          sessionStorage.setItem(
            IMPERSONATION_RETURN_KEY,
            typeof from === "string" ? from : "/admin/members",
          );
        } catch {
          /* no-op */
        }

        await startImpersonation({ userId, name, email });
        toast.success(`Opened dashboard as ${name}`);
        navigate("/dashboard", { replace: true });
      } catch (e: any) {
        const message = e?.message ?? "Could not open this member's dashboard";
        setError(message);
        toast.error(message);
      }
    })();
  }, [userId, isAdmin, actorUser?.id, startImpersonation, navigate, location.state]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-200">
        <p className="font-medium">Couldn't open this member's dashboard.</p>
        <p className="mt-1 text-red-200/80">{error}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/admin/members")}
        >
          Back to members
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening member dashboard…
    </div>
  );
}
