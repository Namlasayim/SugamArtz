import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { useSettings, whatsappLink, instagramLink } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact the Artist — Studio Enquiries" },
      {
        name: "description",
        content:
          "Message the studio about a painting, a commission or delivery. Reach the artist by WhatsApp, email or Instagram.",
      },
      { property: "og:title", content: "Contact the Artist — Studio Enquiries" },
      { property: "og:description", content: "Message the studio about a painting or commission." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const artistWhatsApp = whatsappLink(settings.whatsapp_number);
  const artistInstagram = instagramLink(settings.instagram_username);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const full_name = get("full_name");
    const message = get("message");
    const email = get("email");
    if (get("website")) return;
    if (full_name.length < 2 || message.length < 5) {
      toast.error("Please add your name and a message.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("submit_contact_message", {
      _full_name: full_name,
      _email: email,
      _phone: get("phone"),
      _message: message,
      _website: get("website"),
    });
    setSaving(false);

    if (error) {
      toast.error("Could not send your message. Please try WhatsApp instead.");
      return;
    }
    form.reset();
    setSent(true);
    toast.success("Message sent — the artist will reply soon.");
  }

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">Get in touch</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Contact</h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div className="space-y-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every message reaches the artist directly. For anything urgent — a painting you want
              to hold, a delivery date — WhatsApp is fastest.
            </p>
            <ul className="space-y-5 text-sm">
              {artistWhatsApp && (
                <li className="flex gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.5} />
                  <a
                    href={artistWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-foreground/20"
                  >
                    WhatsApp +{settings.whatsapp_number}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.5} />
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="border-b border-foreground/20"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {artistInstagram && (
                <li className="flex gap-3">
                  <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.5} />
                  <a
                    href={artistInstagram}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-foreground/20"
                  >
                    @{settings.instagram_username}
                  </a>
                </li>
              )}
              {settings.location && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.5} />
                  <span className="text-muted-foreground">{settings.location}</span>
                </li>
              )}
            </ul>
          </div>

          <form onSubmit={submit} className="space-y-4 bg-canvas p-6 sm:p-10">
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="full_name" label="Full name" required />
              <Field name="phone" label="Phone" type="tel" />
            </div>
            <Field name="email" label="Email" type="email" />
            <div className="space-y-2">
              <Label htmlFor="message" className="eyebrow">
                Message *
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                required
                maxLength={1500}
                className="rounded-none bg-background"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="w-full rounded-none tracking-[0.12em] uppercase"
            >
              {saving ? "Sending…" : "Send message"}
            </Button>
            {sent && (
              <p className="text-center text-xs text-muted-foreground">
                Thank you — your message is with the artist.
              </p>
            )}
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
