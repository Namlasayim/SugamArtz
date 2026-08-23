import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, SectionHeading } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePaintings, paintingImage } from "@/lib/paintings";
import { useSettings, whatsappLink, instagramLink } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Original Himalayan Paintings — Artist Studio, Nepal" },
      {
        name: "description",
        content:
          "Original oil and acrylic paintings of Nepal by a Kathmandu-based artist. Browse the collection, commission a custom piece, order directly from the studio.",
      },
      { property: "og:title", content: "Original Himalayan Paintings — Artist Studio, Nepal" },
      {
        property: "og:description",
        content: "Original oil and acrylic paintings of Nepal, sold directly by the artist.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { settings } = useSettings();
  const { data: paintings = [], isLoading } = usePaintings();

  const available = paintings.filter((p) => p.availability !== "sold");
  const featured = paintings.filter((p) => p.featured).slice(0, 3);
  const latest = [...paintings].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 4);
  const sold = paintings.filter((p) => p.availability === "sold").slice(0, 3);
  const hero = settings.hero_image ?? paintingImage(available[0] ?? { images: [] });
  const instagramTiles = paintings.filter((p) => paintingImage(p)).slice(0, 4);
  const artistWhatsApp = whatsappLink(settings.whatsapp_number);
  const artistInstagram = instagramLink(settings.instagram_username);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <div className="order-2 flex flex-col justify-center px-5 py-14 sm:py-20 lg:order-1 lg:px-16">
            <p className="eyebrow">
              Original paintings{settings.location ? ` · ${settings.location}` : ""}
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl">
              {settings.artist_name}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              {settings.artist_statement}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none px-8 tracking-[0.12em] uppercase">
                <Link to="/gallery">Explore Artwork</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none border-foreground/25 px-8 tracking-[0.12em] uppercase"
              >
                <Link to="/custom">Custom Painting</Link>
              </Button>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            {hero ? (
              <img
                src={hero}
                alt={`Featured painting by ${settings.artist_name}`}
                className="h-[46vh] w-full object-cover sm:h-[60vh] lg:h-full lg:min-h-[38rem]"
              />
            ) : (
              <div className="flex h-[46vh] w-full items-center justify-center bg-canvas sm:h-[60vh] lg:h-full lg:min-h-[38rem]">
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Artwork coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      <Section className="pt-20 sm:pt-28">
        <SectionHeading
          eyebrow="Selected works"
          title="Featured paintings"
          action={
            <Link
              to="/gallery"
              className="group inline-flex items-center gap-2 text-xs tracking-[0.16em] uppercase"
            >
              View all
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          }
        />
        {isLoading ? (
          <GridSkeleton count={3} />
        ) : featured.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <PaintingCard key={p.id} painting={p} priority={i === 0} />
            ))}
          </div>
        ) : (
          <EmptyNote>New artwork coming soon.</EmptyNote>
        )}
      </Section>

      {/* Latest */}
      <Section className="pt-20 sm:pt-28">
        <SectionHeading eyebrow="Fresh from the easel" title="Latest paintings" />
        {isLoading ? (
          <GridSkeleton count={4} />
        ) : latest.length ? (
          <div className="grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => (
              <PaintingCard key={p.id} painting={p} />
            ))}
          </div>
        ) : (
          <EmptyNote>No artworks available yet.</EmptyNote>
        )}
      </Section>

      {/* Story */}
      <Section className="pt-24 sm:pt-32">
        <div className="grid items-center gap-10 bg-canvas p-6 sm:p-12 lg:grid-cols-2 lg:gap-16">
          {settings.hero_image ? (
            <img
              src={settings.hero_image}
              alt={`${settings.artist_name} in the studio`}
              loading="lazy"
              className="aspect-4/5 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-4/5 w-full items-center justify-center border border-dashed border-border">
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Studio portrait coming soon
              </p>
            </div>
          )}
          <div>
            <p className="eyebrow">The artist</p>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              A studio practice rooted in the valley
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {settings.artist_bio ?? "The artist's story will appear here soon."}
            </p>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-xs tracking-[0.16em] uppercase"
            >
              Read the full story <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </Section>

      {/* Sold preview */}
      <Section className="pt-24 sm:pt-32">
        <SectionHeading
          eyebrow="Archive"
          title="Works that found a home"
          action={
            <Link to="/sold" className="text-xs tracking-[0.16em] uppercase">
              See the archive
            </Link>
          }
        />
        {sold.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {sold.map((p) => (
              <PaintingCard key={p.id} painting={p} />
            ))}
          </div>
        ) : (
          <EmptyNote>No sold works yet.</EmptyNote>
        )}
      </Section>

      {/* Instagram */}
      {artistInstagram && (
        <Section className="pt-24 sm:pt-32">
          <div className="border border-border p-8 text-center sm:p-14">
            <p className="eyebrow">Instagram</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              @{settings.instagram_username}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Works in progress, studio light and new canvases before they reach the gallery.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {instagramTiles.map((p) => (
                <img
                  key={p.id}
                  src={paintingImage(p)!}
                  alt={p.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              ))}
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-8 rounded-none tracking-[0.12em] uppercase"
            >
              <a href={artistInstagram} target="_blank" rel="noreferrer">
                <Instagram className="mr-2 h-4 w-4" strokeWidth={1.5} /> Follow the studio
              </a>
            </Button>
          </div>
        </Section>
      )}

      {/* Contact */}
      <Section className="pt-24 sm:pt-32">
        <div className="grid gap-8 bg-ink px-6 py-14 text-background sm:px-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-[0.6875rem] tracking-[0.22em] text-background/60 uppercase">
              Enquiries
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              Talk to the artist directly
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-background/70">
              Every order and commission is handled personally — no middlemen, no automated
              checkout.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {artistWhatsApp && (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-none tracking-[0.12em] uppercase"
              >
                <a href={artistWhatsApp} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} /> WhatsApp the artist
                </a>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none border-background/30 bg-transparent text-background tracking-[0.12em] uppercase hover:bg-background/10 hover:text-background"
            >
              <Link to="/contact">Send a message</Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-4/5 w-full bg-canvas" />
          <div className="mt-4 h-4 w-2/3 bg-canvas" />
          <div className="mt-2 h-3 w-1/3 bg-canvas" />
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
