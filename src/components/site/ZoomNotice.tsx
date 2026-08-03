import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "sl-zoom-notice-dismissed";

/**
 * Browsers persist zoom per origin. A visitor sitting at 175% on this domain
 * sees a CSS viewport far narrower than their monitor, which reads as a
 * "magnified" site. The layout handles it, but we offer the one-key fix.
 */
export function ZoomNotice() {
  const [zoom, setZoom] = useState(1);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");

    const measure = () => {
      const cssWidth = document.documentElement.clientWidth || window.innerWidth;
      const physicalWidth = window.screen.width;
      if (!cssWidth || !physicalWidth) return;
      setZoom(Math.round((physicalWidth / cssWidth) * 100) / 100);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (dismissed || zoom < 1.25) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="sl-zoom-notice" role="status">
      <p className="m-0">
        Your browser is zoomed to about {Math.round(zoom * 100)}%. Press{" "}
        <strong>Cmd/Ctrl + 0</strong> to see the full-width layout.
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss zoom notice">
        <X className="size-4" />
      </button>
    </div>
  );
}
