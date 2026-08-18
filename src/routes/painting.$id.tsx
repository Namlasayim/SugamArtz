import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePainting, usePaintings, paintingImage } from "@/lib/paintings";
import { useSettings, whatsappLink } from "@/lib/site";
import { useWishlist } from "@/lib/wishlist";
import { formatPrice, generateCode } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/painting/$id")({
  head: () => ({
    meta: [
      { title: "Painting — Original Artwork from the Studio" },
      {
        name: "description",
        content:
          "View this original painting in detail: medium, dimensions, the story behind it, and how to order it directly from the artist.",
      },
      { property: "og:title", content: "Painting — Original Artwork from the Studio" },
      { property: "og:description", content: "An original painting available directly from the artist." },
    ],
  }),
  component: PaintingPage,
});

function PaintingPage() {
  const { id } = Route.useParams();
  const { data: painting, isLoading } = usePainting(id);
  const { data: all = [] } = usePaintings();
  const { settings } = useSettings();
  const { has, toggle } = useWishlist();
  const [active, setActive] = useState(0);

  if (isLoading) {
    return (
      <SiteShell>
        <Section className="py-32 text-center text-sm text-muted-foreground">Loading painting…</Section>
      </SiteShell>
    );
  }

  if (!painting) {
    return (
      <SiteShell>
        <Section className="py-32 text-center">
          <h1 className="font-display text-3xl">Painting not found</h1>
          <Button asChild className="mt-8 rounded-none tracking-[0.12em] uppercase">
            <Link to="/gallery">Back to gallery</Link>
          </Button>
        </Section>
      </SiteShell>
    );
  }

  const images = painting.images?.length ? painting.images : [paintingImage(painting)];
  const isSold = painting.availability === "sold";
  const related = all
    .filter((p) => p.id !== painting.id && p.category === painting.category)
    .slice(0, 3);
  const saved = has(painting.id);

  return (
    <SiteShell>
      <Section className="pt-8 sm:pt-12">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Gallery
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <div className="relative bg-canvas">
              <img
                src={images[active] ?? images[0]}
                alt={`${painting.title} — ${painting.medium ?? "original painting"}`}
                className="w-full object-contain"
              />
              {isSold && (
                <span className="absolute top-4 left-4 bg-ink px-3 py-1 text-[0.6875rem] tracking-[0.2em] text-background uppercase">
                  Sold
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                    className={cn(
                      "h-20 w-20 overflow-hidden border transition-opacity",
                      i === active ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">{painting.category}</p>
            <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{painting.title}</h1>
            <p className="mt-4 font-display text-2xl text-clay">
              {formatPrice(Number(painting.price), settings.currency)}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-y-4 border-y border-border py-6 text-sm">
              <Detail label="Medium" value={painting.medium} />
              <Detail label="Dimensions" value={painting.dimensions} />
              <Detail label="Year" value={painting.year ? String(painting.year) : null} />
              <Detail label="Artwork ID" value={painting.artwork_code} />
            </dl>

            {painting.description && (
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{painting.description}</p>
            )}
            {painting.story && (
              <div className="mt-6 border-l-2 border-gold pl-5">
                <p className="eyebrow">Story behind the work</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{painting.story}</p>
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              {isSold ? (
                <Button asChild size="lg" className="rounded-none px-8 tracking-[0.12em] uppercase">
                  <Link to="/custom">Request something similar</Link>
                </Button>
              ) : (
                <OrderDialog painting={painting} />
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => toggle(painting.id)}
                className="rounded-none border-foreground/25 tracking-[0.12em] uppercase"
              >
                <Heart className={cn("mr-2 h-4 w-4", saved && "fill-clay text-clay")} strokeWidth={1.5} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none border-foreground/25 tracking-[0.12em] uppercase"
              >
                <a
                  href={whatsappLink(
                    settings.whatsapp_number,
                    `Hello, I'd like to ask about "${painting.title}" (${painting.artwork_code}).`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} /> Ask
                </a>
              </Button>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Delivery across Nepal {formatPrice(Number(settings.delivery_fee), settings.currency)} · Payment
              confirmed personally with the artist over WhatsApp.
            </p>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section className="pt-24 sm:pt-32">
          <h2 className="font-display text-3xl">You may also like</h2>
          <div className="mt-10 grid gap-x-8 gap-y-12 grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PaintingCard key={p.id} painting={p} />
            ))}
          </div>
        </Section>
      )}
    </SiteShell>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-foreground">{value ?? "—"}</dd>
    </div>
  );
}

type Painting = NonNullable<ReturnType<typeof usePainting>["data"]>;

function OrderDialog({ painting }: { painting: Painting }) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const price = Number(painting.price);
  const fee = Number(settings.delivery_fee);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();

    const full_name = get("full_name");
    const phone = get("phone");
    const address = get("address");
    if (full_name.length < 2 || phone.length < 7 || address.length < 4) {
      toast.error("Please fill in your name, phone and full address.");
      return;
    }

    setSaving(true);
    const order_code = generateCode("ORD");
    const { error } = await supabase.from("orders").insert({
      order_code,
      painting_id: painting.id,
      painting_title: painting.title,
      artwork_code: painting.artwork_code,
      full_name,
      phone,
      whatsapp: get("whatsapp") || phone,
      email: get("email") || null,
      province: get("province") || null,
      district: get("district") || null,
      municipality: get("municipality") || null,
      address,
      landmark: get("landmark") || null,
      instructions: get("instructions") || null,
      price,
      delivery_fee: fee,
      total: price + fee,
    } as never);
    setSaving(false);

    if (error) {
      toast.error("Could not place the order. Please try again.");
      return;
    }

    const message = [
      `Namaste! I'd like to order a painting.`,
      ``,
      `Order: ${order_code}`,
      `Painting: ${painting.title} (${painting.artwork_code})`,
      `Price: ${formatPrice(price, settings.currency)}`,
      `Delivery: ${formatPrice(fee, settings.currency)}`,
      `Total: ${formatPrice(price + fee, settings.currency)}`,
      ``,
      `Name: ${full_name}`,
      `Phone: ${phone}`,
      `Address: ${address}${get("district") ? `, ${get("district")}` : ""}`,
    ].join("\n");

    window.open(whatsappLink(settings.whatsapp_number, message), "_blank", "noopener");
    setOpen(false);
    toast.success(`Order ${order_code} created — continue on WhatsApp.`);
    navigate({ to: "/track-order", search: { code: order_code } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-none px-8 tracking-[0.12em] uppercase">
          Order this painting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Order “{painting.title}”</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field name="full_name" label="Full name" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Phone" type="tel" required />
            <Field name="whatsapp" label="WhatsApp (if different)" type="tel" />
          </div>
          <Field name="email" label="Email" type="email" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="province" label="Province" />
            <Field name="district" label="District" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="municipality" label="Municipality / City" />
            <Field name="landmark" label="Landmark" />
          </div>
          <Field name="address" label="Full address" required />
          <div className="space-y-2">
            <Label htmlFor="instructions" className="eyebrow">
              Delivery instructions
            </Label>
            <Textarea id="instructions" name="instructions" rows={3} maxLength={500} className="rounded-none" />
          </div>

          <div className="space-y-1 border-y border-border py-4 text-sm">
            <Row label="Painting" value={formatPrice(price, settings.currency)} />
            <Row label="Delivery" value={formatPrice(fee, settings.currency)} />
            <Row label="Total" value={formatPrice(price + fee, settings.currency)} strong />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="w-full rounded-none tracking-[0.12em] uppercase"
          >
            <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {saving ? "Placing order…" : "Confirm & continue on WhatsApp"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No online payment. The artist confirms payment and delivery with you personally.
          </p>
        </form>
      </DialogContent>
    </Dialog>
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
      <Input id={name} name={name} type={type} required={required} maxLength={200} className="rounded-none" />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "font-display text-lg")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}