import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/site";
import { useRefresh } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings } = useSettings();
  const refresh = useRefresh();
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      id: 1,
      artist_name: get("artist_name"),
      artist_statement: get("artist_statement"),
      artist_bio: get("artist_bio") || null,
      hero_image: get("hero_image") || null,
      whatsapp_number: get("whatsapp_number"),
      instagram_username: get("instagram_username"),
      contact_email: get("contact_email"),
      location: get("location"),
      delivery_fee: Number(get("delivery_fee") || 0),
    } as never);
    setSaving(false);

    if (error) {
      toast.error("Could not save settings.");
      return;
    }
    toast.success("Settings saved.");
    refresh(["site-settings"]);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Studio settings</h1>
      <form onSubmit={submit} className="max-w-2xl space-y-4 bg-background p-6 sm:p-8">
        <Field name="artist_name" label="Artist name" defaultValue={settings.artist_name} />
        <TextField name="artist_statement" label="Short statement" defaultValue={settings.artist_statement} rows={2} />
        <TextField name="artist_bio" label="Biography" defaultValue={settings.artist_bio ?? ""} rows={5} />
        <Field name="hero_image" label="Hero image URL" defaultValue={settings.hero_image ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="whatsapp_number" label="WhatsApp number" defaultValue={settings.whatsapp_number} />
          <Field name="instagram_username" label="Instagram username" defaultValue={settings.instagram_username} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="contact_email" label="Contact email" type="email" defaultValue={settings.contact_email} />
          <Field name="location" label="Location" defaultValue={settings.location} />
          <Field name="delivery_fee" label="Delivery fee (NPR)" type="number" defaultValue={settings.delivery_fee} />
        </div>
        <Button type="submit" disabled={saving} className="rounded-none tracking-[0.12em] uppercase">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="eyebrow">
        {label}
      </Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} className="rounded-none" />
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  rows,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="eyebrow">
        {label}
      </Label>
      <Textarea id={name} name={name} rows={rows} defaultValue={defaultValue} className="rounded-none" />
    </div>
  );
}