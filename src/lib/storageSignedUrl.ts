import { supabase } from "@/integrations/supabase/client";

type SignedUrlResult = {
  signedUrl?: string | null;
  signedURL?: string | null;
};

export async function getSignedStorageUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);

  const signed = (data as SignedUrlResult | null)?.signedUrl ?? (data as SignedUrlResult | null)?.signedURL;
  if (!signed) throw new Error("Signed image URL was not returned");

  if (/^https?:\/\//i.test(signed)) return signed;

  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error("Storage URL is not configured");

  const root = base.replace(/\/$/, "");
  const relative = signed.startsWith("/storage/v1")
    ? signed
    : `/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}`;

  return `${root}${relative}`;
}