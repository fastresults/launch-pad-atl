import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";

/**
 * Persistent super-admin-only banner reminding them that landing-only mode
 * is ON and the public sees only the standalone landing page.
 */
export function LandingOnlyBanner() {
  const { isSuperAdmin } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000,
  });

  if (!isSuperAdmin) return null;
  if ((settings as any)?.landing_only_mode !== true) return null;

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-black shadow">
      <AlertTriangle className="size-4" />
      Landing-only mode is ON — visitors see only the standalone landing page. Turn it off in
      <a href="/admin/settings" className="underline underline-offset-2 hover:opacity-80">
        Admin → Settings
      </a>
      .
    </div>
  );
}
