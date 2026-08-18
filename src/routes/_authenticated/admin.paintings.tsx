import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePaintings, useCategories, paintingImage, PAINTING_BUCKET } from "@/lib/paintings";
import { useRefresh } from "@/lib/admin";
import { uploadFile } from "@/lib/storage";
import { formatPrice } from "@/lib/format";
import type { Painting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { data: paintings = [], isLoading } = usePaintings({ includeArchived: true });
  const refresh = useRefresh();
  const [editing, setEditing] = useState<Painting | "new" | null>(null);

  async function remove(p: Painting) {
    if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    const paths = p.imageRows.map((i) => i.storage_path).filter(Boolean) as string[];
    const { error } = await supabase.from("paintings").delete().eq("id", p.id);
    if (error) {
      toast.error("Could not delete the painting.");
      return;
    }
    if (paths.length) await supabase.storage.from(PAINTING_BUCKET).remove(paths);
    toast.success("Painting deleted.");
    refresh(["paintings"]);
  }

  async function quickUpdate(p: Painting, patch: Record<string, unknown>) {
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
        {paintings.map((p) => {
          const image = paintingImage(p);
          return (
            <article key={p.id} className="flex flex-wrap items-center gap-5 bg-background p-4">
              {image ? (
                <img src={image} alt={p.title} className="h-20 w-20 shrink-0 object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-dashed border-border text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  No image
                </div>
              )}
              <div className="min-w-48 flex-1">
                <p className="eyebrow">{p.artwork_code} · {p.category}</p>
                <h2 className="mt-1 font-display text-lg">{p.title}</h2>
                <p className="text-sm text-muted-foreground">{formatPrice(Number(p.price))}</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={p.availability} onValueChange={(v) => quickUpdate(p, { status: v })}>
                  <SelectTrigger className="w-36 rounded-none" aria-label="Availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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
          );
        })}
        {!isLoading && paintings.length === 0 && (
          <p className="bg-background p-10 text-center text-sm text-muted-foreground">
            No paintings yet. Add your first artwork.
          </p>
        )}
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
  const { data: categories = [] } = useCategories();
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
      category_id: get("category_id") || null,
      medium: get("medium") || null,
      width: get("width") ? Number(get("width")) : null,
      height: get("height") ? Number(get("height")) : null,
      year: get("year") ? Number(get("year")) : null,
      description: get("description") || null,
      story: get("story") || null,
      status: get("status") || "available",
      featured: data.get("featured") === "on",
    };

    setSaving(true);
    let paintingId = painting?.id ?? null;

    if (painting) {
      const { error } = await supabase.from("paintings").update(payload as never).eq("id", painting.id);
      if (error) {
        setSaving(false);
        toast.error("Could not save the painting.");
        return;
      }
    } else {
      const { data: row, error } = await supabase
        .from("paintings")
        .insert(payload as never)
        .select("id")
        .single();
      if (error || !row) {
        setSaving(false);
        toast.error("Could not save the painting.");
        return;
      }
      paintingId = (row as { id: string }).id;
    }

    const files = data.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (paintingId && files.length) {
      let index = painting?.imageRows.length ?? 0;
      for (const file of files) {
        try {
          const path = await uploadFile(PAINTING_BUCKET, file, `${paintingId}/`);
          await supabase
            .from("painting_images")
            .insert({ painting_id: paintingId, storage_path: path, sort_order: index } as never);
          index += 1;
        } catch {
          toast.error(`Could not upload ${file.name}.`);
        }
      }
    }

    setSaving(false);
    toast.success(painting ? "Painting updated." : "Painting added.");
    onSaved();
  }

  async function removeImage(imageId: string, path: string | null) {
    const { error } = await supabase.from("painting_images").delete().eq("id", imageId);
    if (error) {
      toast.error("Could not remove the image.");
      return;
    }
    if (path) await supabase.storage.from(PAINTING_BUCKET).remove([path]);
    toast.success("Image removed.");
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
            <Field name="title" label="Title" defaultValue={painting?.title ?? ""} required />
            <Field name="price" label="Price (NPR)" type="number" defaultValue={painting?.price ?? ""} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category_id" className="eyebrow">
                Category
              </Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={painting?.category_id ?? ""}
                className="h-9 w-full border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field name="medium" label="Medium" defaultValue={painting?.medium ?? ""} />
            <Field name="year" label="Year" type="number" defaultValue={painting?.year ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="width" label="Width (cm)" type="number" defaultValue={painting?.width ?? ""} />
            <Field name="height" label="Height (cm)" type="number" defaultValue={painting?.height ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="status" className="eyebrow">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={painting?.availability ?? "available"}
                className="h-9 w-full border border-input bg-transparent px-3 text-sm"
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 text-xs tracking-[0.12em] uppercase">
            <input type="checkbox" name="featured" defaultChecked={painting?.featured ?? false} />
            Featured on the home page
          </label>
          <TextField name="description" label="Short description" defaultValue={painting?.description ?? ""} rows={3} />
          <TextField name="story" label="Story behind the work" defaultValue={painting?.story ?? ""} rows={3} />

          {painting && painting.imageRows.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow">Current images</p>
              <div className="flex flex-wrap gap-3">
                {painting.imageRows.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.image_url} alt="" className="h-20 w-20 object-cover" />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removeImage(img.id, img.storage_path)}
                      className="absolute top-0 right-0 bg-background/90 p-1 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="images" className="eyebrow">
              Add images
            </Label>
            <Input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="rounded-none"
            />
          </div>

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
  defaultValue?: string | number | null;
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
        defaultValue={defaultValue ?? ""}
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
