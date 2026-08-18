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
      { property: "og:description", content: "Biography and studio practice of a Nepalese painter." },
    ],
  }),
  component: AboutPage,
});

const TIMELINE = [
  { year: "2011", text: "Begins formal training in fine art in Kathmandu, studying under a traditional paubha painter." },
  { year: "2015", text: "First group exhibition at a Patan gallery; turns fully to oil painting." },
  { year: "2019", text: "Solo show 'Valley Light' — sixteen canvases of Newari architecture." },
  { year: "2022", text: "Begins the Himalaya series, painting on location above 3,000 metres." },
  { year: "Today", text: "Works from a studio in the valley, selling directly to collectors worldwide." },
];

function AboutPage() {
  const { settings } = useSettings();

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <img
            src="/artwork/artist-portrait.jpg"
            alt={`${settings.artist_name} in her studio`}
            width={1104}
            height={1408}
            className="aspect-4/5 w-full object-cover"
          />
          <div>
            <p className="eyebrow">About</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{settings.artist_name}</h1>
            <p className="mt-6 font-display text-xl leading-relaxed text-foreground/80 italic">
              “{settings.artist_statement}”
            </p>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                {settings.artist_bio ??
                  "Born in the Kathmandu Valley, the artist works in oil and acrylic, translating Himalayan light and Newari heritage into contemporary canvases."}
              </p>
              <p>
                The work sits between observation and memory. Landscapes are begun outdoors — on ridges, in
                courtyards, beside flooded terraces — and finished in the studio, where colour is pushed
                until the painting matches the feeling of standing there rather than the photograph of it.
              </p>
              <p>
                Each canvas is stretched by hand, painted in layers over several weeks, varnished and signed.
                No prints, no reproductions: when a painting sells, it is gone.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-20 sm:pt-28">
        <div className="bg-canvas p-6 sm:p-14">
          <p className="eyebrow">Practice</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">A short chronology</h2>
          <ol className="mt-10 space-y-8">
            {TIMELINE.map((item) => (
              <li key={item.year} className="grid gap-2 border-t border-border pt-6 sm:grid-cols-[7rem_1fr] sm:gap-8">
                <span className="font-display text-2xl text-clay">{item.year}</span>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>
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