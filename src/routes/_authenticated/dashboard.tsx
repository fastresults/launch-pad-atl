import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
  head: () => ({ meta: [{ title: "Dashboard" }] }),
});

function DashboardLayout() {
  const { user, signOut, isAdmin } = useAuth();
  const { location } = useRouterState();
  const tabs = [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/profile", label: "Profile" },
    { to: "/dashboard/documents", label: "Documents" },
    { to: "/dashboard/goals", label: "Goals" },
    { to: "/dashboard/deliverables", label: "Deliverables" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-semibold tracking-tight">
              Attendee Portal
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted-foreground">
              {tabs.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={location.pathname === t.to ? "text-foreground" : "hover:text-foreground"}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {isAdmin && (
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
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
