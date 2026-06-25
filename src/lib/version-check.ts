// Lightweight build-version check. Detects new deploys by re-fetching the
// site's HTML shell and comparing the embedded build stamp against the one
// the running app booted with. Avoids the mobile-browser "stale index.html"
// problem without needing a service worker.

declare const __APP_VERSION__: string;

const BOOT_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const VERSION_META_NAME = "app-version";

async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/?_v=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(
      /<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i,
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function startVersionCheck(onNewVersion: (v: string) => void): () => void {
  let cancelled = false;
  let notified = false;

  const run = async () => {
    if (cancelled || notified || document.hidden) return;
    const deployed = await fetchDeployedVersion();
    if (!deployed || deployed === BOOT_VERSION) return;
    notified = true;
    onNewVersion(deployed);
  };

  // First check shortly after load, then on interval + visibility regain.
  const initial = window.setTimeout(run, 30_000);
  const interval = window.setInterval(run, CHECK_INTERVAL_MS);
  const onVisible = () => {
    if (!document.hidden) void run();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    cancelled = true;
    window.clearTimeout(initial);
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export const APP_VERSION = BOOT_VERSION;
export { VERSION_META_NAME };
