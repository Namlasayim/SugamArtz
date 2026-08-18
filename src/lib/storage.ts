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

/** crypto.randomUUID() is missing in older iOS Safari and many in-app browsers. */
export function randomId() {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 12)}`;
}

export async function uploadFile(bucket: string, file: File, prefix = "") {
  const raw = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = /^[a-z0-9]{1,5}$/.test(raw) ? raw : "jpg";
  const path = `${prefix}${randomId()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return path;
}
