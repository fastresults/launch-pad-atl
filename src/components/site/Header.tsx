import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";


const nav = [
  { to: "/", label: "home" },
  { to: "/schedule", label: "schedule" },
  { to: "/register", label: "register" },
  { to: "/facilitator", label: "facilitator" },
  { to: "/contact", label: "contact" },
] as const;

export function SiteHeader() {
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const getSettings = useServerFn(getPublicSiteSettings);
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSettings(),
    staleTime: 60_000,
  });
  const isFreeCohort = settings?.home_variant === "selection";
  const ctaFull = isFreeCohort ? "Apply — free cohort" : "Reserve seat — from $679";
  const ctaShort = isFreeCohort ? "Apply" : "Reserve";

  const close = () => setOpen(false);


  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:px-6">
        <Link
          to="/"
          className="flex items-center font-semibold tracking-tight"
          aria-label="Atlanta Startup Workshop"
        >
          <StartupLabsLogo className="h-9 w-auto md:h-12 text-foreground" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
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

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              sign in
            </Link>
          )}
          <Link
            to="/register"
            className="rounded-full bg-hero-gradient px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {ctaFull}
          </Link>
        </div>

        {/* Mobile + tablet right side */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/register"
            className="rounded-full bg-hero-gradient px-3.5 py-2 text-sm font-medium text-white"
          >
            {ctaShort}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-foreground"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[82vw] max-w-sm border-white/10 bg-background p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
                  <StartupLabsLogo className="h-9 w-auto text-foreground" />
                </div>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation and account actions
                </SheetDescription>

                <nav className="flex flex-col px-2 py-3">
                  {nav.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={close}
                      activeOptions={{ exact: true }}
                      activeProps={{ className: "text-foreground bg-white/5" }}
                      className="rounded-xl px-4 py-3 text-base capitalize text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      {n.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={close}
                      className="rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      admin
                    </Link>
                  )}
                </nav>

                <div className="mt-auto space-y-3 border-t border-white/5 px-6 py-5">
                  <Link
                    to="/register"
                    onClick={close}
                    className="flex w-full items-center justify-center rounded-full bg-hero-gradient px-5 py-3 text-base font-medium text-white"
                  >
                    {ctaFull}
                  </Link>
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={close}
                        className="flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-muted-foreground"
                      >
                        dashboard
                      </Link>
                      <button
                        onClick={() => {
                          close();
                          signOut();
                        }}
                        className="flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-muted-foreground"
                      >
                        sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={close}
                      className="flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-muted-foreground"
                    >
                      sign in
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
