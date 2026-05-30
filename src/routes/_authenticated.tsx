import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isApprovedMember, loading } = useAuth();
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

  // Gate: non-approved members can only see /welcome
  const path = location.pathname;
  const isWelcome = path === "/welcome" || path.startsWith("/welcome/");
  if (!isApprovedMember && !isWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}
