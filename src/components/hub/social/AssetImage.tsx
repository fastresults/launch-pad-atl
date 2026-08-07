// @ts-nocheck
import { ImgHTMLAttributes, useEffect, useMemo, useState } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
};

function isSvgUrl(src?: string | null) {
  return !!src && /\.svg(?:\?|#|$)/i.test(src);
}

/**
 * Supabase signed SVG URLs can be served with attachment headers. Fetching the
 * SVG as a Blob URL makes preview rendering deterministic while normal raster
 * assets continue to use the direct signed URL.
 */
export function AssetImage({ src, alt = "", className, ...props }: Props) {
  const needsBlob = useMemo(() => isSvgUrl(src), [src]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src || !needsBlob) {
      setBlobUrl(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setBlobUrl(null);

    fetch(src, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Asset fetch failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        const typed = blob.type === "image/svg+xml" ? blob : new Blob([blob], { type: "image/svg+xml" });
        objectUrl = URL.createObjectURL(typed);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setBlobUrl(src);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, needsBlob]);

  if (!src) return null;

  return (
    <img
      src={needsBlob ? (blobUrl || src) : src}
      alt={alt}
      loading="lazy"
      className={["rounded-lg", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
