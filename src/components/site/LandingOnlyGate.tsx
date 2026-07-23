import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import { StandaloneLanding } from "@/components/landing/StandaloneLanding";

/** Routes that must remain reachable even in landing-only mode. */
const ALLOWED_PATHS = new Set<string>(["/login", "/reset-password"]);

/**
 * When `landing_only_mode` is ON in site settings, non-super-admin visitors
 * see the StandaloneLanding page for every non-allowlisted route. Super admins
 * pass through unchanged so they can keep editing the full site.
 */
export function LandingOnlyGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isSuperAdmin, loading } = useAuth();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000,
  });

  // While either the auth or settings check is loading, fall through to
  // children — the normal Suspense/loading UI already handles the blank state
  // and we don't want to flash a landing page on top of a logged-in admin.
  if (loading || settingsLoading) return <>{children}</>;

  const landingOnly = (settings as any)?.landing_only_mode === true;
  if (!landingOnly) return <>{children}</>;
  if (isSuperAdmin) return <>{children}</>;
  if (ALLOWED_PATHS.has(pathname)) return <>{children}</>;

  return <StandaloneLanding />;
}
