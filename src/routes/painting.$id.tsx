import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { PaintingCard } from "@/components/site/PaintingCard";
import { usePainting, usePaintings } from "@/lib/paintings";
import { useSettings, whatsappLink } from "@/lib/site";
import { useWishlist } from "@/lib/wishlist";
import { formatPrice } from "@/lib/format";
import { copyToClipboard, placeOrder, type OrderCustomerInput } from "@/lib/orders";
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

  const images = painting.images ?? [];
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
              {images.length > 0 ? (
                <img
                  src={images[active] ?? images[0]}
                  alt={`${painting.title} — ${painting.medium ?? "original painting"}`}
                  className="w-full object-contain"
                />
              ) : (
                <div className="flex aspect-4/5 w-full items-center justify-center border border-dashed border-border">
                  <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Image coming soon</p>
                </div>
              )}
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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placed, setPlaced] = useState<{ orderNumber: string; message: string; copied: boolean } | null>(null);

  const price = Number(painting.price);
  const fee = Number(settings.delivery_fee);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();

    const input: OrderCustomerInput = {
      name: get("full_name"),
      phone: get("phone"),
      whatsapp: get("whatsapp") || get("phone"),
      email: get("email"),
      province: get("province"),
      district: get("district"),
      municipality: get("municipality"),
      address: get("address"),
      landmark: get("landmark"),
      instructions: get("instructions"),
    };

    if (input.name.length < 2 || input.phone.length < 7 || input.address.length < 4) {
      toast.error("Please fill in your name, phone and full address.");
      return;
    }

    setSaving(true);
    try {
      const result = await placeOrder(painting, input, fee);
      const copied = await copyToClipboard(result.message);
      setPlaced({ ...result, copied });
      toast.success("Order request sent.");
      if (copied) {
        window.open(
          whatsappLink(settings.whatsapp_number, result.message),
          "_blank",
          "noopener",
        );
      }
    } catch {
      toast.error("Could not place the order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function reset(next: boolean) {
    setOpen(next);
    if (!next) setPlaced(null);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-none px-8 tracking-[0.12em] uppercase">
          Order this painting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {placed ? "Order request sent" : `Order \u201C${painting.title}\u201D`}
          </DialogTitle>
        </DialogHeader>

        {placed ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              The artist will contact you on WhatsApp to confirm payment and delivery.
            </p>
            <p className="border border-border p-4 text-sm">
              Order number <span className="font-display text-lg">{placed.orderNumber}</span>
              <br />
              <Link to="/track-order" search={{ code: placed.orderNumber }} className="border-b border-foreground/30 text-xs tracking-[0.12em] uppercase">
                Track this order
              </Link>
            </p>
            <div>
              <p className="eyebrow">
                {placed.copied ? "Message copied to your clipboard" : "Copy this message to the artist"}
              </p>
              <pre className="mt-3 max-h-56 overflow-auto border border-border bg-canvas p-4 text-xs whitespace-pre-wrap">
                {placed.message}
              </pre>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-none tracking-[0.12em] uppercase"
                onClick={async () => {
                  const ok = await copyToClipboard(placed.message);
                  toast[ok ? "success" : "error"](ok ? "Copied." : "Please copy the message manually.");
                }}
              >
                Copy message
              </Button>
              <Button asChild className="rounded-none tracking-[0.12em] uppercase">
                <a
                  href={whatsappLink(settings.whatsapp_number, placed.message)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} /> Open WhatsApp
                </a>
              </Button>
            </div>
          </div>
        ) : (
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
              {saving ? "Sending request\u2026" : "Send order request"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              No online payment. The artist confirms payment and delivery with you personally.
            </p>
          </form>
        )}
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