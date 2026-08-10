import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  IMPERSONATION_TTL_MS,
  readImpersonationReturnPath,
  clearImpersonationReturnPath,
} from "@/lib/effective-user";

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ImpersonationBanner() {
  const {
    isImpersonating,
    impersonationTarget,
    stopImpersonation,
    viewMemberGates,
    setViewMemberGates,
  } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isImpersonating) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isImpersonating]);

  if (!isImpersonating || !impersonationTarget) return null;

  const startedAt = impersonationTarget.startedAt ?? now;
  const remaining = startedAt + IMPERSONATION_TTL_MS - now;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-400/40 bg-amber-500/15 px-4 py-2 text-amber-100 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            Viewing as <strong>{impersonationTarget.name}</strong>
            <span className="ml-1 opacity-70">({impersonationTarget.email})</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px]">
            <ShieldCheck className="h-3 w-3" /> Acting with full control
          </span>
          <span className="text-[11px] opacity-70">session ends in {formatRemaining(remaining)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400/50 bg-transparent text-amber-100 hover:bg-amber-500/20"
            onClick={() => setViewMemberGates(!viewMemberGates)}
            title="Apply this member's own access rules instead of your admin bypass"
          >
            {viewMemberGates ? (
              <><EyeOff className="mr-1 h-3.5 w-3.5" /> Member access: on</>
            ) : (
              <><Eye className="mr-1 h-3.5 w-3.5" /> Member access: off</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400/50 bg-transparent text-amber-100 hover:bg-amber-500/20"
            onClick={async () => {
              const back = readImpersonationReturnPath();
              await stopImpersonation();
              clearImpersonationReturnPath();
              navigate(back);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Back to members
          </Button>
        </div>
      </div>
    </div>
  );
}
