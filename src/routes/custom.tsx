import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { useSettings, whatsappLink } from "@/lib/site";
import { generateCode } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Commission a Custom Painting — Nepalese Artist" },
      {
        name: "description",
        content:
          "Commission an original custom painting: share your idea, size, budget and timeline, and the artist will reply personally on WhatsApp.",
      },
      { property: "og:title", content: "Commission a Custom Painting" },
      {
        property: "og:description",
        content: "Share your idea and the artist will paint an original piece for you.",
      },
    ],
  }),
  component: CustomPage,
});

const STEPS = [
  { title: "Share your idea", text: "Tell the artist the subject, mood, size and budget you have in mind." },
  { title: "Sketch & quote", text: "You receive a rough sketch, a firm price and a timeline over WhatsApp." },
  { title: "Painting begins", text: "Progress photos are sent at the underpainting and final-layer stages." },
  { title: "Delivery", text: "The signed canvas is varnished, packed and shipped to your address." },
];

function CustomPage() {
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();

    const full_name = get("full_name");
    const idea = get("idea");
    const whatsapp = get("whatsapp");
    if (full_name.length < 2 || idea.length < 10 || whatsapp.length < 7) {
      toast.error("Please add your name, WhatsApp number and a short description of your idea.");
      return;
    }

    setSaving(true);
    const request_code = generateCode("CR");
    const { error } = await supabase.from("custom_requests").insert({
      request_code,
      full_name,
      whatsapp,
      email: get("email") || null,
      idea,
      preferred_size: get("preferred_size") || null,
      budget: get("budget") || null,
      deadline: get("deadline") || null,
      reference_image: get("reference_image") || null,
    } as never);
    setSaving(false);

    if (error) {
      toast.error("Could not send the request. Please try again.");
      return;
    }

    setDone(request_code);
    toast.success("Request sent to the artist.");
    const message = [
      `Namaste! I'd like to commission a custom painting.`,
      ``,
      `Request: ${request_code}`,
      `Name: ${full_name}`,
      `Idea: ${idea}`,
      get("preferred_size") ? `Size: ${get("preferred_size")}` : "",
      get("budget") ? `Budget: ${get("budget")}` : "",
      get("deadline") ? `Needed by: ${get("deadline")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(whatsappLink(settings.whatsapp_number, message), "_blank", "noopener");
  }

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">Commissions</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Custom painting</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A portrait, a place that matters to you, a scene from memory — commissioned pieces are painted
          from scratch on stretched canvas, usually over four to eight weeks.
        </p>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-border pt-5">
              <span className="font-display text-2xl text-clay">0{i + 1}</span>
              <h2 className="mt-2 text-sm tracking-[0.12em] uppercase">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="pt-16 pb-4 sm:pt-24">
        <div className="grid gap-10 bg-canvas p-6 sm:p-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl">Tell the artist your idea</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The more detail you give — subject, colours, where it will hang — the more accurate the
              first sketch will be. You will receive a reply on WhatsApp, usually within a day.
            </p>
            {done && (
              <p className="mt-6 border border-gold bg-background p-4 text-sm">
                Request <strong>{done}</strong> received. Keep this code for reference.
              </p>
            )}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="full_name" label="Full name" required />
              <Field name="whatsapp" label="WhatsApp number" type="tel" required />
            </div>
            <Field name="email" label="Email" type="email" />
            <div className="space-y-2">
              <Label htmlFor="idea" className="eyebrow">
                Your idea *
              </Label>
              <Textarea
                id="idea"
                name="idea"
                rows={5}
                required
                maxLength={1500}
                placeholder="A view of Boudhanath at dusk, warm tones, for a living room wall…"
                className="rounded-none bg-background"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="preferred_size" label="Size" />
              <Field name="budget" label="Budget" />
              <Field name="deadline" label="Needed by" />
            </div>
            <Field name="reference_image" label="Reference image link" />
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="w-full rounded-none tracking-[0.12em] uppercase"
            >
              <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
              {saving ? "Sending…" : "Send request"}
            </Button>
          </form>
        </div>
      </Section>
    </SiteShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="eyebrow">
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={200}
        className="rounded-none bg-background"
      />
    </div>
  );
}