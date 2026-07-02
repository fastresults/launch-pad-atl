import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ImpersonationBanner() {
  const { isImpersonating, impersonationTarget, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  if (!isImpersonating || !impersonationTarget) return null;
  return (
    <div className="sticky top-0 z-50 border-b border-amber-400/40 bg-amber-500/15 px-4 py-2 text-amber-100 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Viewing as <strong>{impersonationTarget.name}</strong>
            <span className="ml-1 opacity-70">({impersonationTarget.email})</span>
            <span className="ml-2 opacity-70">— actions affect their account.</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-400/50 bg-transparent text-amber-100 hover:bg-amber-500/20"
          onClick={async () => {
            await stopImpersonation();
            navigate("/admin/users");
          }}
        >
          <X className="mr-1 h-3.5 w-3.5" /> Exit impersonation
        </Button>
      </div>
    </div>
  );
}
