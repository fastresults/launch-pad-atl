import { HomeFramework } from "@/components/home/HomeFramework";

/**
 * Standalone landing page shown to all non-super-admin visitors when
 * `landing_only_mode` is ON in site settings.
 *
 * Starts as a mirror of the full homepage so nothing visually changes
 * the moment the toggle flips. Trim this component (remove sections,
 * swap header/footer, etc.) to make the landing page truly minimal
 * without touching the full-site HomeFramework.
 */
export function StandaloneLanding() {
  return <HomeFramework />;
}
