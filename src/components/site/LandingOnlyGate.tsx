import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";
import { StandaloneLanding } from "@/components/landing/StandaloneLanding";

/**
 * Paths that must remain reachable even when landing-only mode is ON.
 * Includes admin settings (and its parents) so super admins can always reach
 * the toggle to turn landing-only mode back off. The `_authenticated/_admin`
 * route guards still gate non-admin access to those routes.
 */
const ALLOWED_PREFIXES = ["/login", "/reset-password", "/admin", "/v"];

/**
 * Post-login destinations, reachable only once the visitor is authenticated.
 * Anonymous visitors still see the landing page for these paths.
 */
const AUTHENTICATED_PREFIXES = ["/dashboard", "/welcome", "/account"];

/**
 * When `landing_only_mode` is ON, EVERY visitor (including super admins) sees
 * the StandaloneLanding page for every non-allowlisted route. Super admins
 * keep access to /admin/* so they can toggle the mode back off.
 */
export function LandingOnlyGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { loading, isAuthenticated } = useAuth();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000,
  });

  if (loading || settingsLoading) return <>{children}</>;

  const landingOnly = (settings as any)?.landing_only_mode === true;
  if (!landingOnly) return <>{children}</>;
  const matches = (list: string[]) =>
    list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (matches(ALLOWED_PREFIXES)) return <>{children}</>;
  if (isAuthenticated && matches(AUTHENTICATED_PREFIXES)) return <>{children}</>;

  return <StandaloneLanding />;
}
