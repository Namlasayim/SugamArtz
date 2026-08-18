import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signedUrls } from "./storage";
import type { Category, Painting, PaintingImage } from "./types";

export const PAINTING_BUCKET = "painting-images";

const SELECT =
  "id, artwork_id, title, price, description, story, medium, width, height, year, category_id, status, featured, sort_order, created_at, updated_at, categories(name), painting_images(id, image_url, storage_path, sort_order)";

type Row = Record<string, unknown>;

function dimensions(width: unknown, height: unknown) {
  if (width == null && height == null) return null;
  const w = width == null ? "—" : Number(width);
  const h = height == null ? "—" : Number(height);
  return `${w} × ${h} cm`;
}

async function mapPaintings(rows: Row[]): Promise<Painting[]> {
  const paths = rows.flatMap((r) =>
    ((r["painting_images"] as Row[] | null) ?? []).map((i) => String(i["storage_path"] ?? "")),
  );
  const urls = await signedUrls(PAINTING_BUCKET, paths);

  return rows.map((r) => {
    const imageRows: PaintingImage[] = (((r["painting_images"] as Row[] | null) ?? []) as Row[])
      .map((i) => ({
        id: String(i["id"]),
        storage_path: (i["storage_path"] as string | null) ?? null,
        image_url:
          urls.get(String(i["storage_path"] ?? "")) ?? ((i["image_url"] as string | null) ?? ""),
        sort_order: Number(i["sort_order"] ?? 0),
      }))
      .filter((i) => Boolean(i.image_url))
      .sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: String(r["id"]),
      artwork_code: String(r["artwork_id"]),
      title: String(r["title"]),
      price: Number(r["price"] ?? 0),
      medium: (r["medium"] as string | null) ?? null,
      width: r["width"] == null ? null : Number(r["width"]),
      height: r["height"] == null ? null : Number(r["height"]),
      dimensions: dimensions(r["width"], r["height"]),
      year: r["year"] == null ? null : Number(r["year"]),
      category_id: (r["category_id"] as string | null) ?? null,
      category: ((r["categories"] as Row | null)?.["name"] as string) ?? "Uncategorised",
      description: (r["description"] as string | null) ?? null,
      story: (r["story"] as string | null) ?? null,
      images: imageRows.map((i) => i.image_url),
      imageRows,
      availability: (r["status"] as Painting["availability"]) ?? "available",
      featured: Boolean(r["featured"]),
      sort_order: Number(r["sort_order"] ?? 0),
      created_at: String(r["created_at"]),
      updated_at: String(r["updated_at"]),
    };
  });
}

export function usePaintings(options?: { includeArchived?: boolean }) {
  const includeArchived = options?.includeArchived ?? false;
  return useQuery({
    queryKey: ["paintings", includeArchived],
    queryFn: async () => {
      let query = supabase
        .from("paintings")
        .select(SELECT)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!includeArchived) query = query.neq("status", "archived");
      const { data, error } = await query;
      if (error) throw error;
      return mapPaintings((data ?? []) as unknown as Row[]);
    },
  });
}

export function usePainting(id: string) {
  return useQuery({
    queryKey: ["painting", id],
    queryFn: async () => {
      const column = isUuid(id) ? "id" : "artwork_id";
      const { data, error } = await supabase.from("paintings").select(SELECT).eq(column, id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [painting] = await mapPaintings([data as unknown as Row]);
      return painting ?? null;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function paintingImage(painting: Pick<Painting, "images">) {
  return painting.images?.[0] ?? null;
}
