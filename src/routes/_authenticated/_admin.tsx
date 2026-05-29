import { createFileRoute, Outlet, Navigate, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", super: false },
  { to: "/admin/registrations", label: "Registrations", super: false },
  { to: "/admin/attendees", label: "Attendees", super: false },
  { to: "/admin/cohorts", label: "Cohorts", super: true },
  { to: "/admin/review", label: "Review queue", super: true },
  { to: "/admin/media", label: "Media library", super: true },
  { to: "/admin/users", label: "Users", super: true },
] as const;

function AdminLayout() {
  const { isAdmin, loading, signOut, user, isSuperAdmin } = useAuth();
  const { location } = useRouterState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="font-semibold tracking-tight">
              Admin
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted-foreground">
              {NAV.filter((n) => !n.super || isSuperAdmin).map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={location.pathname === n.to ? "text-foreground" : "hover:text-foreground"}
                >
                  {n.label}
                </Link>
              ))}
              <Link to="/" className="hover:text-foreground">
                View site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
