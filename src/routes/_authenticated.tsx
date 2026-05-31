import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isApprovedMember, isAdmin, memberStatus, loading } = useAuth();
  const { location } = useRouterState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: location.href }} replace />;
  }

  const path = location.pathname;
  const isPaused = path === "/paused" || path.startsWith("/paused/");
  const isWelcome = path === "/welcome" || path.startsWith("/welcome/");

  // Paused members: account was previously approved, now revoked.
  if (!isAdmin && memberStatus === "paused") {
    if (!isPaused) return <Navigate to="/paused" replace />;
    return <Outlet />;
  }

  // Non-approved (pending/rejected): send to the new-applicant welcome flow.
  if (!isApprovedMember && !isWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  // Approved members trying to view /paused should be sent back to the app.
  if (isApprovedMember && isPaused) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
}

