import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "./storage";
import type { SiteSettings } from "./types";

export const ARTIST_BUCKET = "artist-assets";

/** Neutral placeholders — never a fabricated artist. Real values come from admin settings. */
export const EMPTY_SETTINGS: SiteSettings = {
  id: 1,
  artist_name: "",
  artist_statement: "",
  artist_bio: null,
  hero_image: null,
  whatsapp_number: "",
  instagram_username: "",
  contact_email: "",
  location: "",
  delivery_fee: 0,
  currency: "NPR",
};

export function useSettings() {
  const query = useQuery({
    queryKey: ["artist-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return EMPTY_SETTINGS;
      const row = data as Record<string, unknown>;
      const image = (row["profile_image_url"] as string | null) ?? null;
      let heroImage = image;
      if (image && !image.startsWith("http")) {
        try {
          heroImage = await signedUrl(ARTIST_BUCKET, image);
        } catch {
          heroImage = null;
        }
      }
      const bio = (row["bio"] as string | null) ?? null;
      const firstBioLine = bio?.split("\n")[0]?.slice(0, 180) ?? "";
      return {
        id: 1,
        artist_name: (row["artist_name"] as string) || EMPTY_SETTINGS.artist_name,
        artist_statement: (row["artist_statement"] as string) || firstBioLine,
        artist_bio: bio,
        hero_image: heroImage,
        whatsapp_number: (row["whatsapp_number"] as string) ?? "",
        instagram_username: (row["instagram_username"] as string) ?? "",
        contact_email: (row["email"] as string) ?? "",
        location: (row["location"] as string) ?? "",
        delivery_fee: Number(row["delivery_fee"] ?? 0),
        currency: "NPR",
      } satisfies SiteSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
  return {
    settings: query.data ?? EMPTY_SETTINGS,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const digits = (number || "").replace(/[^\d]/g, "");
  if (digits.length < 7) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function instagramLink(username: string | null | undefined): string | null {
  const clean = (username || "").replace(/^@/, "").trim();
  return clean ? `https://instagram.com/${encodeURIComponent(clean)}` : null;
}
