import { LandingFramework } from "@/components/landing/LandingFramework";

/**
 * Standalone landing page shown to all non-super-admin visitors when
 * `landing_only_mode` is ON in site settings.
 *
 * This is a fully independent fork of the homepage. Editing anything under
 * `src/components/landing/` changes ONLY the landing page — the live homepage
 * at `/` (rendered by `HomeFramework`) is untouched, and vice versa. Shared
 * UI primitives, brand assets, and `@/lib/*` data helpers remain shared on
 * purpose; fork them into `landing/` only if they need to diverge.
 */
export function StandaloneLanding() {
  return <LandingFramework />;
}
