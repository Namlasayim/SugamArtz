import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePaintings } from "@/lib/paintings";

export const Route = createFileRoute("/sold")({
  head: () => ({
    meta: [
      { title: "Sold Works Archive — Paintings in Private Collections" },
      {
        name: "description",
        content:
          "An archive of original paintings that have found homes. These works are no longer available for purchase.",
      },
      { property: "og:title", content: "Sold Works Archive" },
      { property: "og:description", content: "Original paintings now in private collections." },
    ],
  }),
  component: SoldPage,
});

function SoldPage() {
  const { data: paintings = [], isLoading } = usePaintings();
  const sold = paintings.filter((p) => p.availability === "sold");

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">Archive</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Sold works</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          These paintings now live in private collections. They remain here as a record of the studio's
          work — and cannot be purchased. A similar piece can always be commissioned.
        </p>
        <div className="mt-14 grid gap-x-8 gap-y-14 grid-cols-2 lg:grid-cols-3">
          {sold.map((p) => (
            <PaintingCard key={p.id} painting={p} />
          ))}
        </div>
        {!isLoading && sold.length === 0 && (
          <p className="border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            No sold works yet.
          </p>
        )}
      </Section>
    </SiteShell>
  );
}