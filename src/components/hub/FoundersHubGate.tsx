import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";

export function FoundersHubGate({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isAdmin, foundersHubAccess } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isAdmin && !foundersHubAccess) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Founders Hub unlocks when your 14-Day Sprint begins</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your facilitator will unlock the AI venture workflow at the start of your sprint.
          Once granted, you'll be able to generate 60+ founder-ready startup assets from a
          single venture concept.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
