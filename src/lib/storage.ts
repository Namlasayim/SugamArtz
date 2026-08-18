import { supabase } from "@/integrations/supabase/client";

const YEAR = 60 * 60 * 24 * 365;

/** Buckets are private; public-facing images are served through long-lived signed URLs. */
export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, YEAR);
  return data?.signedUrl ?? null;
}

export async function signedUrls(bucket: string, paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(unique, YEAR);
  const map = new Map<string, string>();
  (data ?? []).forEach((row) => {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  });
  return map;
}

export async function uploadFile(bucket: string, file: File, prefix = "") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
