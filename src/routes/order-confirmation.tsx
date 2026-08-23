import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/site/Section";
import { SiteShell } from "@/components/site/SiteShell";
import { copyToClipboard, loadOrderConfirmation, type StoredOrderConfirmation } from "@/lib/orders";
import { useSettings, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? search["code"].trim() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Request Sent — Artist Studio" },
      {
        name: "description",
        content:
          "Your painting order request was created. Copy the message and send it to the artist on WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { code } = Route.useSearch();
  const { settings } = useSettings();
  const [confirmation, setConfirmation] = useState<StoredOrderConfirmation | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    const saved = loadOrderConfirmation(code);
    setConfirmation(saved);
    setCopied(saved?.copied ?? false);
  }, [code]);

  const messageLink = confirmation
    ? whatsappLink(settings.whatsapp_number, confirmation.message)
    : null;

  async function copyMessage() {
    if (!confirmation) return;
    const ok = await copyToClipboard(confirmation.message);
    setCopied(ok || copied);
    toast[ok ? "success" : "error"](
      ok ? "Order message copied." : "Please copy the message manually.",
    );
  }

  return (
    <SiteShell>
      <Section className="pt-16 pb-24 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-clay text-background">
            <Check className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="eyebrow mt-8">Order request sent</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Thank you</h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Your request is recorded. The artist will contact you on WhatsApp to confirm payment and
            delivery.
          </p>

          {code ? (
            <div className="mt-8 border border-border p-6 sm:p-8">
              <p className="eyebrow">Order number</p>
              <p className="mt-2 break-all font-display text-2xl">{code}</p>
              <Link
                to="/track-order"
                search={{ code }}
                className="mt-3 inline-block border-b border-foreground/30 text-xs tracking-[0.12em] uppercase"
              >
                Track this order
              </Link>
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-border p-6 text-sm text-muted-foreground">
              Your order number is not available in this browser. Check the confirmation message or
              contact the artist.
            </div>
          )}

          {confirmation ? (
            <div className="mt-8">
              <p className="eyebrow">
                {copied ? "Message copied to your clipboard" : "Send this message to the artist"}
              </p>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap border border-border bg-canvas p-4 text-xs leading-relaxed">
                {confirmation.message}
              </pre>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={copyMessage}
                  className="rounded-none tracking-[0.12em] uppercase"
                >
                  <Copy className="mr-2 h-4 w-4" strokeWidth={1.5} /> Copy message
                </Button>
                {messageLink && (
                  <Button asChild className="rounded-none tracking-[0.12em] uppercase">
                    <a href={messageLink} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.5} /> Open WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">
              Keep your order number so you can check its status later.
            </p>
          )}

          <Button
            asChild
            variant="outline"
            className="mt-10 rounded-none tracking-[0.12em] uppercase"
          >
            <Link to="/gallery">Return to gallery</Link>
          </Button>
        </div>
      </Section>
    </SiteShell>
  );
}
