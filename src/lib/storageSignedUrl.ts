import { supabase } from "@/integrations/supabase/client";

type SignedUrlResult = {
  signedUrl?: string | null;
  signedURL?: string | null;
};

type CacheEntry = {
  url: string;
  expiresAt: number;
  promise?: Promise<string>;
};

const signedUrlCache = new Map<string, CacheEntry>();
const CACHE_REFRESH_BUFFER_MS = 60_000;

function cacheKey(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

function normalizeSignedUrl(signed: string) {
  if (/^https?:\/\//i.test(signed)) return signed;

  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error("Storage URL is not configured");

  const root = base.replace(/\/$/, "");
  const relative = signed.startsWith("/storage/v1")
    ? signed
    : `/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}`;

  return `${root}${relative}`;
}

export function invalidateSignedStorageUrl(bucket: string, path: string) {
  signedUrlCache.delete(cacheKey(bucket, path));
}

export function primeSignedStorageUrl(bucket: string, path: string, signedUrl: string, expiresIn = 3600) {
  const url = normalizeSignedUrl(signedUrl);
  signedUrlCache.set(cacheKey(bucket, path), {
    url,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  preloadImageUrl(url);
  browserPreload(url);
  return url;
}

export function preloadImageUrl(url: string) {
  if (typeof document === "undefined" || !url) return;
  const id = `storage-preload-${btoa(url).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  document.head.appendChild(link);
}

function browserPreload(url: string) {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

export async function getSignedStorageUrl(bucket: string, path: string, expiresIn = 3600) {
  const key = cacheKey(bucket, path);
  const now = Date.now();
  const cached = signedUrlCache.get(key);
  if (cached?.url && cached.expiresAt > now + CACHE_REFRESH_BUFFER_MS) return cached.url;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw new Error(error.message);

    const signed = (data as SignedUrlResult | null)?.signedUrl ?? (data as SignedUrlResult | null)?.signedURL;
    if (!signed) throw new Error("Signed image URL was not returned");

    return primeSignedStorageUrl(bucket, path, signed, expiresIn);
  })();

  signedUrlCache.set(key, { url: "", expiresAt: 0, promise });
  try {
    return await promise;
  } catch (e) {
    signedUrlCache.delete(key);
    throw e;
  }
}