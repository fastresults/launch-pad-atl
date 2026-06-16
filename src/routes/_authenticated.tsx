import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function AuthenticatedLayout() {
  const { isAuthenticated, isApprovedMember, isAdmin, memberStatus, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const path = location.pathname;
  const isPaused = path === "/paused" || path.startsWith("/paused/");
  const isWelcome = path === "/welcome" || path.startsWith("/welcome/");

  if (!isAdmin && memberStatus === "paused") {
    if (!isPaused) return <Navigate to="/paused" replace />;
    return <Outlet />;
  }

  if (!isApprovedMember && !isWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  if (isApprovedMember && isPaused) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
