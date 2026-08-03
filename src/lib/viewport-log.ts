import { RELEASE_ID } from "@/lib/version-check";

/**
 * Runtime layout logging.
 *
 * Records, for every page load (and every subsequent viewport change), the
 * effective CSS viewport width and which breakpoint styles the browser is
 * actually applying. Always on — no query param required — so real-world
 * user sessions can be diagnosed from the console.
 */

/** Tailwind default breakpoints used across the app. */
const TAILWIND_BREAKPOINTS: Array<[string, number]> = [
  ["sm", 640],
  ["md", 768],
  ["lg", 1024],
  ["xl", 1280],
  ["2xl", 1536],
];

export type ViewportLogEntry = {
  at: string;
  reason: "load" | "resize" | "route";
  release: string;
  path: string;
  /** Width the CSS cascade resolves media queries against. */
  cssViewportWidth: number;
  cssViewportHeight: number;
  innerWidth: number;
  documentClientWidth: number;
  visualViewportWidth: number | null;
  visualViewportScale: number | null;
  devicePixelRatio: number;
  screenWidth: number;
  /** Ratio of physical screen px to CSS px — >1 means OS/browser zoom. */
  effectiveZoom: number;
  orientation: "portrait" | "landscape";
  /** Highest matching Tailwind breakpoint, e.g. "lg". */
  activeBreakpoint: string;
  /** All matching Tailwind breakpoint prefixes. */
  matchedBreakpoints: string[];
  /** Public-surface layout tier resolved from public.css. */
  publicLayoutTier: string;
  /** Whether the desktop nav / mobile nav are actually rendered. */
  desktopNavDisplay: string;
  mobileNavDisplay: string;
  cssBundle: string;
};

const HISTORY_LIMIT = 25;

declare global {
  interface Window {
    __slViewportLog?: ViewportLogEntry[];
  }
}

function cssBundleName(): string {
  const stylesheet = [...document.styleSheets]
    .map((sheet) => {
      try {
        return sheet.href;
      } catch {
        return null;
      }
    })
    .find((href) => href?.includes("/assets/") && href.endsWith(".css"));
  return stylesheet?.split("/").pop() ?? "development";
}

function measureCssViewportWidth(): number {
  // 100vw resolved by the engine — the exact value media queries use.
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;visibility:hidden;";
  document.documentElement.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return Math.round(rect.width * 100) / 100;
}

function measureCssViewportHeight(): number {
  return Math.round((window.innerHeight || document.documentElement.clientHeight) * 100) / 100;
}

function matchedBreakpoints(): string[] {
  return TAILWIND_BREAKPOINTS.filter(([, min]) =>
    window.matchMedia(`(min-width: ${min}px)`).matches,
  ).map(([name]) => name);
}

function publicLayoutTier(width: number): string {
  const surface = document.querySelector<HTMLElement>(".public-surface");
  if (!surface) return "non-public-route";
  const minWidth = Number.parseFloat(getComputedStyle(surface).minWidth) || 0;
  if (width < minWidth) return `desktop-forced (canvas ${minWidth}px, viewport ${width}px)`;
  if (width >= 1440) return "desktop-wide";
  if (width >= 1280) return "desktop";
  if (width >= 1024) return "desktop-compact";
  return `sub-desktop (${width}px)`;
}

function buildEntry(reason: ViewportLogEntry["reason"]): ViewportLogEntry {
  const cssViewportWidth = measureCssViewportWidth();
  const desktopNav = document.querySelector<HTMLElement>(".sl-site-header__nav");
  const mobileNav = document.querySelector<HTMLElement>(".sl-site-header__mobile");
  const matched = matchedBreakpoints();

  return {
    at: new Date().toISOString(),
    reason,
    release: RELEASE_ID,
    path: window.location.pathname,
    cssViewportWidth,
    cssViewportHeight: measureCssViewportHeight(),
    innerWidth: window.innerWidth,
    documentClientWidth: document.documentElement.clientWidth,
    visualViewportWidth: window.visualViewport
      ? Math.round(window.visualViewport.width * 100) / 100
      : null,
    visualViewportScale: window.visualViewport?.scale ?? null,
    devicePixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    effectiveZoom: Math.round((window.screen.width / Math.max(cssViewportWidth, 1)) * 100) / 100,
    orientation: window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
    activeBreakpoint: matched.at(-1) ?? "base",
    matchedBreakpoints: matched,
    publicLayoutTier: publicLayoutTier(cssViewportWidth),
    desktopNavDisplay: desktopNav ? getComputedStyle(desktopNav).display : "missing",
    mobileNavDisplay: mobileNav ? getComputedStyle(mobileNav).display : "absent",
    cssBundle: cssBundleName(),
  };
}

function record(reason: ViewportLogEntry["reason"]) {
  const entry = buildEntry(reason);
  const history = (window.__slViewportLog ??= []);
  history.push(entry);
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);

  document.documentElement.dataset.cssViewportWidth = String(entry.cssViewportWidth);
  document.documentElement.dataset.activeBreakpoint = entry.activeBreakpoint;
  document.documentElement.dataset.publicLayoutTier = entry.publicLayoutTier;

  console.info(
    `[layout] ${entry.reason} · ${entry.path} · css ${entry.cssViewportWidth}px · breakpoint ${entry.activeBreakpoint} · tier ${entry.publicLayoutTier} · zoom ~${entry.effectiveZoom}x`,
    entry,
  );
  return entry;
}

/** Starts always-on viewport/breakpoint logging. Returns a cleanup function. */
export function startViewportLogging(): () => void {
  let debounce = 0;
  let lastPath = window.location.pathname;

  const onResize = () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => record("resize"), 200);
  };

  const onRoute = () => {
    if (window.location.pathname === lastPath) return;
    lastPath = window.location.pathname;
    window.setTimeout(() => record("route"), 0);
  };

  const frame = window.requestAnimationFrame(() => record("load"));
  window.addEventListener("resize", onResize);
  window.addEventListener("popstate", onRoute);
  window.visualViewport?.addEventListener("resize", onResize);

  const routeTimer = window.setInterval(onRoute, 500);

  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(debounce);
    window.clearInterval(routeTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("popstate", onRoute);
    window.visualViewport?.removeEventListener("resize", onResize);
  };
}
