import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";

const leftNav = [
  { to: "/build", label: "workshops" },
  { to: "/services", label: "services" },
  { to: "/schedule", label: "schedule" },
] as const;

const rightNav = [
  { to: "/facilitator", label: "facilitator" },
  { to: "/contact", label: "contact" },
] as const;

export function SiteHeader() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [modesOpen, setModesOpen] = useState(false);
  const ctaFull = `Reserve seat — ${WORKSHOP_PRICE_LABEL}`;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`;

  return (
    <>
    <header className="sl-site-header">
      <div className="sl-site-header__inner">

        {/* Left edge: logo + product nav */}
        <div className="sl-site-header__left">
          <Link to="/" className="flex min-w-0 shrink items-center font-semibold tracking-tight" aria-label="Startup Labs — home">
            <StartupLabsLogo className="sl-site-header__logo" />
          </Link>
          <nav className="sl-site-header__nav" aria-label="Primary navigation">
            {leftNav.map((n, index) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={`transition-colors hover:text-foreground ${index === 2 ? "sl-site-header__compact-optional" : ""}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>


        {/* Spacer pushes right group to the edge */}
        <div className="flex-1" />

        {/* Right edge: orientation nav + auth + CTA */}
        <div className="sl-site-header__actions">
          {rightNav.map((n, index) => (
            <NavLink
              key={n.to}
              to={n.to}
                className={`transition-colors hover:text-foreground ${index === 0 ? "sl-site-header__compact-optional" : ""}`}
            >
              {n.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setModesOpen(true)}
            className="whitespace-nowrap transition-colors hover:text-foreground"
          >
            3 ways to start
          </button>

          {isAdmin && (
            <Link to="/admin" className="transition-colors hover:text-foreground">admin</Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-foreground">dashboard</Link>
              <button onClick={() => signOut()} className="whitespace-nowrap hover:text-foreground">sign out</button>
            </>
          ) : (
              <Link to="/login" className="sl-site-header__compact-optional whitespace-nowrap hover:text-foreground">sign in</Link>
          )}
          <Link to="/register" className="sl-site-header__cta bg-hero-gradient text-white transition-opacity hover:opacity-90">
            <span className="sl-site-header__cta-full">{ctaFull}</span>
          </Link>
        </div>
      </div>
    </header>
      <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />
    </>
  );
}
