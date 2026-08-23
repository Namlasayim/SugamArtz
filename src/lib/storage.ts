import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

/** Buckets are private/public according to their purpose; public-facing images use signed URLs. */
export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function signedUrls(bucket: string, paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, 60 * 60 * 24 * 365);
  if (error) throw error;
  const map = new Map<string, string>();
  (data ?? []).forEach((row) => {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  });
  return map;
}

export function imageUploadError(file: File, maxBytes = MAX_IMAGE_BYTES): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!MIME_BY_EXTENSION[extension]) {
    return "Please choose a JPG, PNG, WEBP, GIF or HEIC image.";
  }
  if (file.size > maxBytes) {
    return `That image is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  }
  return null;
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
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const validationError = imageUploadError(file);
  if (validationError) throw new Error(validationError);
  const contentType = MIME_BY_EXTENSION[extension];
  if (!contentType) throw new Error("Unsupported image type.");

  const path = `${prefix}${randomId()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    // Use the extension-derived type rather than trusting a browser-provided MIME type.
    contentType,
  });
  if (error) throw error;
  return path;
}

export async function removeFile(bucket: string, path: string | null | undefined) {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
