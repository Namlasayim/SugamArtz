import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePaintings } from "@/lib/paintings";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Original Paintings for Sale" },
      {
        name: "description",
        content:
          "Browse original Himalayan and Newari paintings available directly from the artist's studio. Filter by category, price and availability.",
      },
      { property: "og:title", content: "Gallery — Original Paintings for Sale" },
      {
        property: "og:description",
        content: "Browse original paintings available directly from the artist's studio.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data: paintings = [], isLoading } = usePaintings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(paintings.map((p) => p.category))).sort(),
    [paintings],
  );
  const priceCeiling = useMemo(
    () => Math.max(10000, ...paintings.map((p) => Number(p.price))),
    [paintings],
  );
  const activeMax = maxPrice ?? priceCeiling;

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = paintings.filter((p) => {
      if (term) {
        const haystack = `${p.title} ${p.category} ${p.medium ?? ""} ${p.artwork_code} ${p.description ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (category !== "all" && p.category !== category) return false;
      if (availability === "available" && p.availability === "sold") return false;
      if (availability === "sold" && p.availability !== "sold") return false;
      if (Number(p.price) > activeMax) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [paintings, search, category, availability, activeMax, sort]);

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">The collection</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Gallery</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every painting is an original, signed work. Sold pieces remain on view as part of the archive.
        </p>

        <div className="mt-10 grid gap-4 border-y border-border py-6 lg:grid-cols-[1.4fr_repeat(3,_1fr)] lg:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, medium or artwork ID"
              aria-label="Search paintings"
              className="rounded-none border-border bg-transparent pl-9"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-none" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="rounded-none" aria-label="Filter by availability">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All works</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="rounded-none" aria-label="Sort works">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4 py-6">
          <span className="eyebrow shrink-0">Max price</span>
          <Slider
            value={[activeMax]}
            min={0}
            max={priceCeiling}
            step={1000}
            onValueChange={([v]) => setMaxPrice(v)}
            className="max-w-xs flex-1"
            aria-label="Maximum price"
          />
          <span className="text-sm text-muted-foreground">{formatPrice(activeMax)}</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "work" : "works"}
          </span>
        </div>

        {isLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Loading the collection…</p>
        ) : results.length ? (
          <div className="grid gap-x-8 gap-y-14 pb-8 grid-cols-2 lg:grid-cols-3">
            {results.map((p, i) => (
              <PaintingCard key={p.id} painting={p} priority={i < 2} />
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            No paintings match these filters yet.
          </p>
        )}
      </Section>
    </SiteShell>
  );
}