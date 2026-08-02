// Lightweight build-version check. Detects new deploys by re-fetching the
// site's HTML shell and comparing the content-derived release against the one
// the running app booted with. Avoids the mobile-browser "stale index.html"
// problem without needing a service worker.

declare const __RELEASE_ID__: string;

const BOOT_RELEASE: string = typeof __RELEASE_ID__ !== "undefined" ? __RELEASE_ID__ : "dev";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const VERSION_META_NAME = "app-release";
const RELOAD_TARGET_KEY = "startuplabs:auto-reload-target";

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/?_v=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta\s+name=["']app-release["']\s+content=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function startVersionCheck(onNewVersion: (v: string) => void): () => void {
  let cancelled = false;
  let notified = false;

  // A matching content release proves the prior cache-busted replacement worked.
  if (window.sessionStorage.getItem(RELOAD_TARGET_KEY) === BOOT_RELEASE) {
    window.sessionStorage.removeItem(RELOAD_TARGET_KEY);
  }

  const run = async () => {
    if (cancelled || notified || document.hidden) return;
    const deployed = await fetchDeployedVersion();
    if (!deployed || deployed === BOOT_RELEASE) return;
    notified = true;
    onNewVersion(deployed);
  };

  // Check immediately, then on interval and whenever an existing tab is reused.
  void run();
  const interval = window.setInterval(run, CHECK_INTERVAL_MS);
  const onVisible = () => {
    if (!document.hidden) void run();
  };
  const onFocus = () => void run();
  const onPageShow = () => void run();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    cancelled = true;
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pageshow", onPageShow);
  };
}

export function replaceStaleBuild(version: string): boolean {
  if (window.sessionStorage.getItem(RELOAD_TARGET_KEY) === version) return false;

  window.sessionStorage.setItem(RELOAD_TARGET_KEY, version);
  const next = new URL(window.location.href);
  next.searchParams.set("_build", version);
  window.location.replace(next.toString());
  return true;
}

export const RELEASE_ID = BOOT_RELEASE;
export { VERSION_META_NAME };
