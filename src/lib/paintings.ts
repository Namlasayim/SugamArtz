import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Painting } from "./types";

const SELECT = "*";

export function usePaintings() {
  return useQuery({
    queryKey: ["paintings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paintings")
        .select(SELECT)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Painting[];
    },
  });
}

export function usePainting(id: string) {
  return useQuery({
    queryKey: ["painting", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paintings")
        .select(SELECT)
        .or(`artwork_code.eq.${id},id.eq.${isUuid(id) ? id : "00000000-0000-0000-0000-000000000000"}`)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Painting) ?? null;
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function paintingImage(painting: Pick<Painting, "images">) {
  return painting.images?.[0] ?? "/artwork/dawn-over-annapurna.jpg";
}