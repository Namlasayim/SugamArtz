import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePaintings } from "@/lib/paintings";
import { useWishlist } from "@/lib/wishlist";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Saved Paintings" },
      {
        name: "description",
        content:
          "Paintings you have saved from the studio collection, stored privately on your own device.",
      },
      { property: "og:title", content: "Your Wishlist — Saved Paintings" },
      {
        property: "og:description",
        content: "Paintings you have saved from the studio collection.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();
  const { data: paintings = [] } = usePaintings();
  const saved = paintings.filter((p) => ids.includes(p.id));

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">Saved</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Your wishlist</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Saved privately on this device — no account needed. Clearing your browser data will clear
          the list.
        </p>

        {saved.length ? (
          <div className="mt-14 grid gap-x-8 gap-y-14 grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PaintingCard key={p.id} painting={p} />
            ))}
          </div>
        ) : (
          <div className="mt-14 border border-dashed border-border p-16 text-center">
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
            <Button asChild className="mt-6 rounded-none tracking-[0.12em] uppercase">
              <Link to="/gallery">Browse the gallery</Link>
            </Button>
          </div>
        )}
      </Section>
    </SiteShell>
  );
}
