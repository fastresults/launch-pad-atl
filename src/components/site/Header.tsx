import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";
import { AccessModeDialog } from "@/components/home/AccessModeDialog";
import { ZoomNotice } from "@/components/site/ZoomNotice";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const leftNav = [
  { to: "/build", label: "workshops" },
  { to: "/calendar", label: "calendar" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const ctaFull = `Reserve seat — ${WORKSHOP_PRICE_LABEL}`;

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
                className={`transition-colors hover:text-foreground ${index >= 2 ? "sl-site-header__compact-optional" : ""}`}
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

        {/* Phone-only menu */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" className="sl-site-header__mobile" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="marketing-sheet w-[86vw] max-w-xs">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="sl-site-header__mobile-panel" aria-label="Mobile navigation">
              {[...leftNav, ...rightNav].map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)}>
                  {n.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setModesOpen(true);
                }}
              >
                3 ways to start
              </button>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>admin</Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>dashboard</Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                  >
                    sign out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>sign in</Link>
              )}
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="sl-site-header__cta bg-hero-gradient text-white"
              >
                {ctaFull}
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
      <AccessModeDialog open={modesOpen} onOpenChange={setModesOpen} />
      <ZoomNotice />
      <MobileCtaBar />
    </>

  );
}
