import { useEffect, useState } from "react";

/**
 * Which ground is the UI painting on right now?
 *
 * The showcase renders in whichever theme the reader's device asks for, and a
 * mark that reads perfectly on paper can vanish on a dark hero. Watching the
 * `dark` class means the logo choice follows the theme instead of guessing.
 */
export function useIsDarkSurface(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return dark;
}

/** Pick the contrast-checked mark for the current theme, with safe fallbacks. */
export function useSurfaceLogo(venture: {
  logoUrl?: string | null;
  logoUrlOnDark?: string | null;
  logoUrlOnLight?: string | null;
} | null | undefined): string | null {
  const dark = useIsDarkSurface();
  if (!venture) return null;
  const preferred = dark ? venture.logoUrlOnDark : venture.logoUrlOnLight;
  return preferred ?? venture.logoUrl ?? null;
}
