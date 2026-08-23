import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, ARTIST_BUCKET } from "@/lib/site";
import { useRefresh } from "@/lib/admin";
import { removeFile, uploadFile } from "@/lib/storage";
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
  const [statement, setStatement] = useState(settings.artist_statement);

  useEffect(() => {
    setBio(settings.artist_bio ?? "");
    setStatement(settings.artist_statement);
  }, [settings.artist_bio, settings.artist_statement]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const artistName = get("artist_name");
    const statementValue = get("artist_statement");
    const bioValue = get("bio");
    const whatsappNumber = get("whatsapp_number");
    const deliveryFee = Number(get("delivery_fee") || 0);
    if (artistName.length < 2) {
      toast.error("Please enter the artist name.");
      return;
    }
    if (statementValue.length > 300) {
      toast.error("The artist statement must be 300 characters or fewer.");
      return;
    }
    if (bioValue.length > BIO_MAX) {
      toast.error(`Biography must be ${BIO_MAX} characters or fewer.`);
      return;
    }
    if (whatsappNumber && whatsappNumber.replace(/[^\\d]/g, "").length < 7) {
      toast.error("Please enter a valid WhatsApp number or leave it blank.");
      return;
    }
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      toast.error("Delivery fee must be zero or greater.");
      return;
    }

    setSaving(true);

    let profileImagePath: string | null | undefined;
    const file = data.get("profile_image");
    if (file instanceof File && file.size > 0) {
      try {
        profileImagePath = await uploadFile(ARTIST_BUCKET, file, "profile/");
      } catch {
        setSaving(false);
        toast.error("Could not upload the portrait. Please choose a supported image up to 15 MB.");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      id: 1,
      artist_name: artistName,
      artist_statement: statementValue,
      bio: bioValue || null,
      whatsapp_number: whatsappNumber,
      instagram_username: get("instagram_username").replace(/^@/, ""),
      email: get("email"),
      location: get("location"),
      delivery_fee: deliveryFee,
    };
    if (profileImagePath) payload["profile_image_url"] = profileImagePath;

    const { data: saved, error } = await supabase
      .from("artist_settings")
      .upsert(payload as never)
      .select("artist_name, delivery_fee")
      .maybeSingle();
    setSaving(false);

    if (error || !saved) {
      if (profileImagePath) {
        try {
          await removeFile(ARTIST_BUCKET, profileImagePath);
        } catch {
          // Keep the original save error visible; the orphan can be removed by an administrator later.
        }
      }
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
        <Field
          name="artist_name"
          label="Artist name"
          defaultValue={settings.artist_name}
          required
        />
        <div className="space-y-2">
          <Label htmlFor="artist_statement" className="eyebrow">
            Artist statement
          </Label>
          <Textarea
            id="artist_statement"
            name="artist_statement"
            rows={3}
            maxLength={300}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            className="rounded-none"
          />
          <p className="text-right text-xs text-muted-foreground">{statement.length} / 300</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio" className="eyebrow">
            Biography
          </Label>
          <Textarea
            id="bio"
            name="bio"
            rows={8}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="rounded-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {bio.length} / {BIO_MAX}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile_image" className="eyebrow">
            Portrait / hero image
          </Label>
          {settings.hero_image && (
            <img
              src={settings.hero_image}
              alt="Current portrait"
              className="h-28 w-28 object-cover"
            />
          )}
          <Input
            id="profile_image"
            name="profile_image"
            type="file"
            accept="image/*"
            className="rounded-none"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="whatsapp_number"
            label="WhatsApp number"
            defaultValue={settings.whatsapp_number}
          />
          <Field
            name="instagram_username"
            label="Instagram username"
            defaultValue={settings.instagram_username}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="email"
            label="Contact email"
            type="email"
            defaultValue={settings.contact_email}
          />
          <Field name="location" label="Location" defaultValue={settings.location} />
          <Field
            name="delivery_fee"
            label="Delivery fee (NPR)"
            type="number"
            defaultValue={settings.delivery_fee}
          />
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="rounded-none tracking-[0.12em] uppercase"
        >
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
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="eyebrow">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded-none"
      />
    </div>
  );
}
