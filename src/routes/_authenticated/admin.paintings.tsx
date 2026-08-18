import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePaintings, paintingImage } from "@/lib/paintings";
import { useRefresh } from "@/lib/admin";
import { formatPrice, generateCode } from "@/lib/format";
import type { Painting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/paintings")({
  component: AdminPaintings,
});

function AdminPaintings() {
  const { data: paintings = [], isLoading } = usePaintings();
  const refresh = useRefresh();
  const [editing, setEditing] = useState<Painting | "new" | null>(null);

  async function remove(p: Painting) {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("paintings").delete().eq("id", p.id);
    if (error) {
      toast.error("Could not delete the painting.");
      return;
    }
    toast.success("Painting deleted.");
    refresh(["paintings"]);
  }

  async function quickUpdate(p: Painting, patch: Partial<Painting>) {
    const { error } = await supabase.from("paintings").update(patch as never).eq("id", p.id);
    if (error) {
      toast.error("Could not update the painting.");
      return;
    }
    refresh(["paintings"]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Paintings</h1>
        <Button onClick={() => setEditing("new")} className="rounded-none tracking-[0.12em] uppercase">
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} /> Add painting
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid gap-4">
        {paintings.map((p) => (
          <article key={p.id} className="flex flex-wrap items-center gap-5 bg-background p-4">
            <img src={paintingImage(p)} alt={p.title} className="h-20 w-20 shrink-0 object-cover" />
            <div className="min-w-48 flex-1">
              <p className="eyebrow">{p.artwork_code} · {p.category}</p>
              <h2 className="mt-1 font-display text-lg">{p.title}</h2>
              <p className="text-sm text-muted-foreground">{formatPrice(Number(p.price))}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={p.availability} onValueChange={(v) => quickUpdate(p, { availability: v as Painting["availability"] })}>
                <SelectTrigger className="w-36 rounded-none" aria-label="Availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs tracking-[0.12em] uppercase">
                <Switch checked={p.featured} onCheckedChange={(v) => quickUpdate(p, { featured: v })} />
                Featured
              </label>
              <Button variant="outline" size="icon" className="rounded-none" aria-label="Edit" onClick={() => setEditing(p)}>
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none text-destructive"
                aria-label="Delete"
                onClick={() => remove(p)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <PaintingDialog
          painting={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh(["paintings"]);
          }}
        />
      )}
    </div>
  );
}

function PaintingDialog({
  painting,
  onClose,
  onSaved,
}: {
  painting: Painting | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const title = get("title");
    const price = Number(get("price"));
    if (title.length < 2 || !Number.isFinite(price) || price <= 0) {
      toast.error("A title and a valid price are required.");
      return;
    }

    const payload = {
      title,
      price,
      category: get("category") || "Landscape",
      medium: get("medium") || null,
      dimensions: get("dimensions") || null,
      year: get("year") ? Number(get("year")) : null,
      description: get("description") || null,
      story: get("story") || null,
      images: get("images")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      availability: get("availability") || "available",
      artwork_code: painting?.artwork_code ?? generateCode("ART"),
    };

    setSaving(true);
    const { error } = painting
      ? await supabase.from("paintings").update(payload as never).eq("id", painting.id)
      : await supabase.from("paintings").insert(payload as never);
    setSaving(false);

    if (error) {
      toast.error("Could not save the painting.");
      return;
    }
    toast.success(painting ? "Painting updated." : "Painting added.");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {painting ? "Edit painting" : "Add painting"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="title" label="Title" defaultValue={painting?.title} required />
            <Field name="price" label="Price (NPR)" type="number" defaultValue={painting?.price} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="category" label="Category" defaultValue={painting?.category} />
            <Field name="medium" label="Medium" defaultValue={painting?.medium ?? ""} />
            <Field name="dimensions" label="Dimensions" defaultValue={painting?.dimensions ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="year" label="Year" type="number" defaultValue={painting?.year ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="availability" className="eyebrow">
                Availability
              </Label>
              <select
                id="availability"
                name="availability"
                defaultValue={painting?.availability ?? "available"}
                className="h-9 w-full border border-input bg-transparent px-3 text-sm"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
          <TextField name="description" label="Short description" defaultValue={painting?.description ?? ""} rows={3} />
          <TextField name="story" label="Story behind the work" defaultValue={painting?.story ?? ""} rows={3} />
          <TextField
            name="images"
            label="Image URLs (one per line)"
            defaultValue={(painting?.images ?? []).join("\n")}
            rows={3}
          />
          <Button type="submit" disabled={saving} className="w-full rounded-none tracking-[0.12em] uppercase">
            {saving ? "Saving…" : "Save painting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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

function TextField({
  name,
  label,
  defaultValue,
  rows,
}: {
  name: string;
  label: string;
  defaultValue?: string;
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