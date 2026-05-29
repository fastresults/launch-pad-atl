import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@/assets/startuplabs-logo.svg";

const nav = [
  { to: "/", label: "home" },
  { to: "/schedule", label: "schedule" },
  { to: "/register", label: "register" },
] as const;

export function SiteHeader() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
        <Link to="/" className="flex items-center font-semibold tracking-tight" aria-label="Atlanta Startup Workshop">
          <img src={logoUrl} alt="StartupLabs" className="h-12 w-auto md:h-14" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground" }}
              className="transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="transition-colors hover:text-foreground">
              admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              sign out
            </button>
          ) : (
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              sign in
            </Link>
          )}
          <Link
            to="/register"
            className="rounded-full bg-hero-gradient px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Reserve seat — from $679
          </Link>
        </div>
      </div>
    </header>
  );
}
