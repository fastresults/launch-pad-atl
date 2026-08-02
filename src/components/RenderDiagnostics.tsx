import { useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RELEASE_ID } from "@/lib/version-check";

type ElementFingerprint = {
  selector: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  transform: string;
  zoom: string;
  rect: { x: number; y: number; width: number; height: number };
} | null;

type RenderingFingerprint = {
  capturedAt: string;
  location: { hostname: string; pathname: string };
  release: string;
  assets: { css: string[]; js: string[] };
  viewport: Record<string, number | null>;
  responsiveTiers: Record<string, boolean>;
  fonts: { status: string; root: string; body: string; publicSurface: string | null };
  stylesheets: string[];
  elements: Record<string, ElementFingerprint>;
};

const TARGETS = {
  header: ".sl-site-header, header",
  heroTitle: ".sl-hero__title, h1",
  promptPanel: ".sl-prompt__panel",
  contentHeading: "main section:not(.sl-hero) h2, main section:not(.sl-hero) h1",
};

function elementFingerprint(selector: string): ElementFingerprint {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    selector,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    transform: style.transform,
    zoom: style.zoom,
    rect: {
      x: Number(rect.x.toFixed(2)),
      y: Number(rect.y.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
    },
  };
}

function assetNames(selector: string, attribute: "href" | "src"): string[] {
  return [...document.querySelectorAll<HTMLElement>(selector)]
    .map((element) => element.getAttribute(attribute))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.split("?")[0]?.split("/").pop() ?? value);
}

function captureFingerprint(): RenderingFingerprint {
  const rootStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const publicSurface = document.querySelector<HTMLElement>(".public-surface");
  const visualViewport = window.visualViewport;
  const breakpoints = [640, 960, 1024, 1280, 1400, 1440];

  return {
    capturedAt: new Date().toISOString(),
    location: { hostname: window.location.hostname, pathname: window.location.pathname },
    release: document.documentElement.dataset.appRelease ?? RELEASE_ID,
    assets: {
      css: assetNames('link[rel="stylesheet"]', "href"),
      js: assetNames("script[src]", "src"),
    },
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      outerWidth: window.outerWidth,
      screenWidth: window.screen.width,
      screenAvailWidth: window.screen.availWidth,
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: visualViewport?.width ?? null,
      visualViewportScale: visualViewport?.scale ?? null,
      rootFontSize: Number.parseFloat(rootStyle.fontSize),
    },
    responsiveTiers: Object.fromEntries(
      breakpoints.map((breakpoint) => [
        String(breakpoint),
        matchMedia(`(min-width: ${breakpoint}px)`).matches,
      ]),
    ),
    fonts: {
      status: document.fonts.status,
      root: rootStyle.fontFamily,
      body: bodyStyle.fontFamily,
      publicSurface: publicSurface ? getComputedStyle(publicSurface).fontFamily : null,
    },
    stylesheets: [...document.styleSheets].map((sheet) => sheet.href ?? "inline"),
    elements: Object.fromEntries(
      Object.entries(TARGETS).map(([name, selector]) => [name, elementFingerprint(selector)]),
    ),
  };
}

export function RenderDiagnostics() {
  const enabled = useMemo(
    () => new URLSearchParams(window.location.search).has("render-diagnostics"),
    [],
  );
  const [open, setOpen] = useState(true);
  const [fingerprint, setFingerprint] = useState<RenderingFingerprint | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    await document.fonts.ready;
    setFingerprint(captureFingerprint());
  };

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [enabled]);

  if (!enabled || !open) return null;

  const serialized = fingerprint ? JSON.stringify(fingerprint, null, 2) : "Capturing…";
  const copy = async () => {
    if (!fingerprint) return;
    await navigator.clipboard.writeText(serialized);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <aside
      aria-label="Rendering diagnostics"
      className="fixed inset-x-3 bottom-3 z-[10000] max-h-[70vh] overflow-hidden rounded-md border border-border bg-background text-foreground shadow-2xl md:left-auto md:w-[34rem]"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <strong className="text-sm">Rendering fingerprint</strong>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void refresh()}
            aria-label="Refresh fingerprint"
            title="Refresh fingerprint"
          >
            <RefreshCw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void copy()}
            aria-label="Copy fingerprint"
            title="Copy fingerprint"
          >
            <Copy />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close diagnostics"
            title="Close diagnostics"
          >
            <X />
          </Button>
        </div>
      </div>
      {copied && (
        <p className="m-0 border-b border-border px-3 py-1 text-xs text-primary">Copied</p>
      )}
      <pre className="m-0 max-h-[58vh] overflow-auto p-3 text-[11px] leading-5">{serialized}</pre>
    </aside>
  );
}
