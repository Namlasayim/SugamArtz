import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, ARTIST_BUCKET } from "@/lib/site";
import { useRefresh } from "@/lib/admin";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BIO_MAX = 3000;

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, isLoading } = useSettings();
  const refresh = useRefresh();
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState(settings.artist_bio ?? "");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const bioValue = get("bio");
    if (bioValue.length > BIO_MAX) {
      toast.error(`Biography must be ${BIO_MAX} characters or fewer.`);
      return;
    }

    setSaving(true);

    let profileImagePath: string | null | undefined;
    const file = data.get("profile_image");
    if (file instanceof File && file.size > 0) {
      try {
        profileImagePath = await uploadFile(ARTIST_BUCKET, file, "profile/");
      } catch {
        toast.error("Could not upload the portrait.");
      }
    }

    const payload: Record<string, unknown> = {
      id: 1,
      artist_name: get("artist_name"),
      bio: bioValue || null,
      whatsapp_number: get("whatsapp_number"),
      instagram_username: get("instagram_username"),
      email: get("email"),
      location: get("location"),
      delivery_fee: Number(get("delivery_fee") || 0),
    };
    if (profileImagePath) payload["profile_image_url"] = profileImagePath;

    const { data: saved, error } = await supabase
      .from("artist_settings")
      .upsert(payload as never)
      .select("artist_name, delivery_fee")
      .maybeSingle();
    setSaving(false);

    if (error || !saved) {
      toast.error(error?.message ?? "Could not save settings.");
      return;
    }
    toast.success("Settings saved.");
    refresh(["artist-settings"]);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Studio settings</h1>
        <p className="text-sm text-muted-foreground">Loading saved settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Studio settings</h1>
      <form onSubmit={submit} className="max-w-2xl space-y-4 bg-background p-6 sm:p-8">
        <Field name="artist_name" label="Artist name" defaultValue={settings.artist_name} />
        <TextField name="bio" label="Biography" defaultValue={settings.artist_bio ?? ""} rows={6} />
        <div className="space-y-2">
          <Label htmlFor="profile_image" className="eyebrow">
            Portrait / hero image
          </Label>
          {settings.hero_image && (
            <img src={settings.hero_image} alt="Current portrait" className="h-28 w-28 object-cover" />
          )}
          <Input id="profile_image" name="profile_image" type="file" accept="image/*" className="rounded-none" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="whatsapp_number" label="WhatsApp number" defaultValue={settings.whatsapp_number} />
          <Field name="instagram_username" label="Instagram username" defaultValue={settings.instagram_username} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="email" label="Contact email" type="email" defaultValue={settings.contact_email} />
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
