import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { useSettings } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Artist — Studio Practice in Kathmandu" },
      {
        name: "description",
        content:
          "The biography, training and studio practice of a Nepalese painter working in oil and acrylic from the Kathmandu Valley.",
      },
      { property: "og:title", content: "About the Artist — Studio Practice in Kathmandu" },
      {
        property: "og:description",
        content: "Biography and studio practice of a Nepalese painter.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { settings } = useSettings();

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {settings.hero_image ? (
            <img
              src={settings.hero_image}
              alt={`${settings.artist_name} in the studio`}
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
            <p className="eyebrow">About</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              {settings.artist_name}
            </h1>
            {settings.artist_statement && (
              <p className="mt-6 font-display text-xl leading-relaxed text-foreground/80 italic">
                “{settings.artist_statement}”
              </p>
            )}
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              {settings.artist_bio ? (
                settings.artist_bio
                  .split("\n")
                  .filter(Boolean)
                  .map((para, i) => <p key={i}>{para}</p>)
              ) : (
                <p className="border border-dashed border-border p-8 text-sm">
                  The artist's biography will appear here soon.
                </p>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-20 text-center sm:pt-28">
        <h2 className="font-display text-3xl sm:text-4xl">Bring a painting home</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-none px-8 tracking-[0.12em] uppercase">
            <Link to="/gallery">View the gallery</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-none border-foreground/25 px-8 tracking-[0.12em] uppercase"
          >
            <Link to="/custom">Commission a piece</Link>
          </Button>
        </div>
      </Section>
    </SiteShell>
  );
}
