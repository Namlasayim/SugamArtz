import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings } from "./types";

export const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  artist_name: "Aarati Shrestha",
  artist_statement: "Painting the light, silence and colour of the Himalaya.",
  artist_bio: null,
  hero_image: "/artwork/dawn-over-annapurna.jpg",
  whatsapp_number: "9779800000000",
  instagram_username: "artist",
  contact_email: "hello@example.com",
  location: "Kathmandu, Nepal",
  delivery_fee: 500,
  currency: "NPR",
};

export function useSettings() {
  const query = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as SiteSettings) ?? FALLBACK_SETTINGS;
    },
    staleTime: 5 * 60 * 1000,
  });
  return { settings: query.data ?? FALLBACK_SETTINGS, isLoading: query.isLoading };
}

export function whatsappLink(number: string, message?: string) {
  const digits = (number || "").replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function instagramLink(username: string) {
  return `https://instagram.com/${(username || "").replace(/^@/, "")}`;
}