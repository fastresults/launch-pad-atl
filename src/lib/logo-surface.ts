import { useEffect, useState } from "react";

/**
 * Client-side companions to the server logo audit.
 *
 * Two problems live here. First, the audited logo endpoint is cacheable, so a
 * founder who uploads a reversed mark can otherwise keep seeing the verdict
 * computed seconds earlier for a set that had no reversed mark — the
 * fingerprint below changes with the set and retires that answer immediately.
 * Second, the endpoint knows whether it served the founder's own artwork or a
 * repaired version, and the studio should say so rather than silently shipping
 * a corrected mark the founder never agreed to.
 */

/** Stable short hash of a venture's logo set — mirrors `logoSetFingerprint`. */
export function logoSetFingerprint(logos: unknown): string {
  const parts = (Array.isArray(logos) ? logos : [])
    .map((l: any) => `${l?.path ?? l?.svg_path ?? ""}@${l?.created_at ?? ""}`)
    .sort()
    .join("|");
  let hash = 2166136261;
  for (let i = 0; i < parts.length; i++) {
    hash ^= parts.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export type LogoVerdict = "original" | "repaired" | "plated" | null;

/** Ask each preview URL what it actually served, so tiles can be labelled. */
export function useLogoVerdicts(urls: (string | null)[]): LogoVerdict[] {
  const key = urls.join("|");
  const [verdicts, setVerdicts] = useState<LogoVerdict[]>(() => urls.map(() => null));

  useEffect(() => {
    let cancelled = false;
    const list = key.split("|").map((u) => (u === "null" || u === "" ? null : u));
    setVerdicts(list.map(() => null));
    Promise.all(
      list.map(async (u) => {
        if (!u) return null;
        try {
          const res = await fetch(u, { method: "GET" });
          return (res.headers.get("X-Logo-Verdict") as LogoVerdict) ?? null;
        } catch {
          return null;
        }
      }),
    ).then((out) => {
      if (!cancelled) setVerdicts(out);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return verdicts;
}
