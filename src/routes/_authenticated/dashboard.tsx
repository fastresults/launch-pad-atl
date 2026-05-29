import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
  head: () => ({ meta: [{ title: "Dashboard" }] }),
});

function DashboardLayout() {
  const { user, signOut, isAdmin } = useAuth();
  const { location } = useRouterState();
  const tabs = [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/brief", label: "Brief" },
    { to: "/dashboard/filing", label: "Filing" },
    { to: "/dashboard/workflow", label: "Workflow" },
    { to: "/dashboard/profile", label: "Profile" },
    { to: "/dashboard/documents", label: "Documents" },
    { to: "/dashboard/media", label: "Media" },
    { to: "/dashboard/goals", label: "Goals" },
    { to: "/dashboard/deliverables", label: "Deliverables" },
  ] as const;


  return (
    <ThemeProvider>
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            <Link to="/dashboard" className="font-semibold tracking-tight">
              Attendee Portal
            </Link>
            <div className="flex items-center gap-3 text-sm md:hidden">
              {isAdmin && (
                <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
          <nav className="-mx-4 flex items-center gap-4 overflow-x-auto px-4 text-sm text-muted-foreground md:mx-0 md:gap-5 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={`shrink-0 py-1 ${location.pathname === t.to ? "text-foreground" : "hover:text-foreground"}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 text-sm md:flex">
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
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
