import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { paintingImage } from "@/lib/paintings";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import type { Painting } from "@/lib/types";

export function PaintingCard({ painting, priority }: { painting: Painting; priority?: boolean }) {
  const { has, toggle } = useWishlist();
  const sold = painting.availability === "sold";
  const saved = has(painting.id);

  return (
    <article className="group relative">
      <Link
        to="/painting/$id"
        params={{ id: painting.artwork_code }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative overflow-hidden bg-canvas">
          {paintingImage(painting) ? (
            <img
              src={paintingImage(painting)!}
              alt={`${painting.title} — ${painting.medium ?? "original painting"}`}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={cn(
                "aspect-4/5 w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]",
                sold && "opacity-85",
              )}
            />
          ) : (
            <div className="flex aspect-4/5 w-full items-center justify-center border border-dashed border-border">
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">No image</span>
            </div>
          )}
          {sold && (
            <span className="absolute top-0 left-0 bg-ink/85 px-3 py-1.5 text-[10px] tracking-[0.22em] text-background uppercase">
              Sold
            </span>
          )}
          {painting.featured && !sold && (
            <span className="absolute top-0 left-0 bg-gold/90 px-3 py-1.5 text-[10px] tracking-[0.22em] text-gold-foreground uppercase">
              Featured
            </span>
          )}
        </div>
        <div className="mt-4 pr-10">
          <h3 className="font-display text-xl leading-snug">{painting.title}</h3>
          <p className="mt-1 text-xs tracking-[0.08em] text-muted-foreground">
            {[painting.medium, painting.dimensions, painting.year].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 text-sm">
            {sold ? <span className="text-muted-foreground">Not available</span> : formatPrice(painting.price)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle(painting.id)}
        aria-label={saved ? `Remove ${painting.title} from wishlist` : `Save ${painting.title} to wishlist`}
        aria-pressed={saved}
        className="absolute right-0 bottom-1 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary"
      >
        <Heart
          className={cn("h-[18px] w-[18px] transition-colors", saved ? "fill-clay text-clay" : "text-muted-foreground")}
          strokeWidth={1.5}
        />
      </button>
    </article>
  );
}