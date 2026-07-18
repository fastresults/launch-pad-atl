import { useEffect } from "react";

/**
 * Sets document.title (and optionally meta description + JSON-LD) for the
 * mounted route. Restores previous values on unmount so SPA navigation doesn't
 * leak stale SEO between pages.
 */
export function useDocumentTitle(
  title: string,
  description?: string,
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>,
) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let prevDesc: string | null = null;
    let descEl: HTMLMetaElement | null = null;
    if (description) {
      descEl = document.querySelector('meta[name="description"]');
      if (descEl) {
        prevDesc = descEl.getAttribute("content");
        descEl.setAttribute("content", description);
      }
    }

    let ldScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.dataset.routeJsonLd = "true";
      ldScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(ldScript);
    }

    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== null) descEl.setAttribute("content", prevDesc);
      if (ldScript && ldScript.parentNode) ldScript.parentNode.removeChild(ldScript);
    };
  }, [title, description, jsonLd]);
}
