import { RELEASE_ID } from "@/lib/version-check";

const DIAGNOSTICS_PARAM = "layout-diagnostics";

type LayoutMode = "phone" | "compact" | "desktop";

function getLayoutMode(width: number): LayoutMode {
  if (width < 768) return "phone";
  if (width < 1024) return "compact";
  return "desktop";
}

function stylesheetBundle(): string {
  const stylesheet = [...document.styleSheets]
    .map((sheet) => sheet.href)
    .find((href) => href?.includes("/assets/") && href.endsWith(".css"));
  return stylesheet?.split("/").pop() ?? "development";
}

export function startRenderDiagnostics(): () => void {
  const params = new URLSearchParams(window.location.search);
  if (params.get(DIAGNOSTICS_PARAM) !== "1") return () => undefined;

  const update = () => {
    const desktopNav = document.querySelector<HTMLElement>(".sl-site-header__nav");
    const mobileNav = document.querySelector<HTMLElement>(".sl-site-header__mobile");
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const metrics = {
      release: RELEASE_ID,
      cssBundle: stylesheetBundle(),
      mode: getLayoutMode(window.innerWidth),
      innerWidth: window.innerWidth,
      visualViewportWidth: Math.round(viewportWidth * 100) / 100,
      visualViewportScale: window.visualViewport?.scale ?? 1,
      devicePixelRatio: window.devicePixelRatio,
      screenWidth: window.screen.width,
      desktopNavDisplay: desktopNav ? getComputedStyle(desktopNav).display : "missing",
      mobileNavDisplay: mobileNav ? getComputedStyle(mobileNav).display : "missing",
    };

    document.documentElement.dataset.publicLayoutMode = metrics.mode;
    document.documentElement.dataset.layoutDiagnostics = JSON.stringify(metrics);
    console.info("[Startup Labs layout diagnostics]", metrics);
  };

  const frame = window.requestAnimationFrame(update);
  window.addEventListener("resize", update);
  window.visualViewport?.addEventListener("resize", update);

  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("resize", update);
    delete document.documentElement.dataset.layoutDiagnostics;
  };
}