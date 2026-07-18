import { useEffect } from "react";

/**
 * Sets document.title (and optionally meta description) for the mounted route.
 * Restores previous values on unmount so SPA navigation doesn't leak stale SEO.
 */
export function useDocumentTitle(title: string, description?: string) {
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

    return () => {
      document.title = prevTitle;
      if (descEl && prevDesc !== null) descEl.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}
