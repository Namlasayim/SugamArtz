import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Search } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STAGES, STAGE_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { useSettings, whatsappLink } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TrackedOrder = {
  order_number: string;
  items: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const Route = createFileRoute("/track-order")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? (search["code"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Painting Delivery Status" },
      {
        name: "description",
        content:
          "Enter your order code to see the current status of your painting: confirmed, preparing, shipped or delivered.",
      },
      { property: "og:title", content: "Track Your Order" },
      { property: "og:description", content: "Check the delivery status of your painting order." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { code } = Route.useSearch();
  const { settings } = useSettings();
  const [value, setValue] = useState(code ?? "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "missing">("idle");

  async function lookup(raw: string) {
    const trimmed = raw.trim();
    if (trimmed.length < 4) return;
    setState("loading");
    const { data, error } = await supabase.rpc("track_order", { _order_number: trimmed });
    const row = (data as TrackedOrder[] | null)?.[0] ?? null;
    if (error || !row) {
      setOrder(null);
      setState("missing");
      return;
    }
    setOrder(row);
    setState("idle");
  }

  useEffect(() => {
    if (code) void lookup(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const cancelled = order?.status === "cancelled";
  const currentIndex = order ? ORDER_STAGES.indexOf(order.status as (typeof ORDER_STAGES)[number]) : -1;

  return (
    <SiteShell>
      <Section className="pt-14 sm:pt-20">
        <p className="eyebrow">Order status</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">Track your order</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Enter the order code you received when you placed your order (it looks like ART-ORDER-2026-0001).
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookup(value);
          }}
          className="mt-8 flex max-w-md gap-3"
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ART-ORDER-2026-0001"
            aria-label="Order code"
            className="rounded-none uppercase"
          />
          <Button type="submit" className="rounded-none tracking-[0.12em] uppercase">
            <Search className="mr-2 h-4 w-4" strokeWidth={1.5} /> Track
          </Button>
        </form>

        {state === "loading" && <p className="mt-8 text-sm text-muted-foreground">Looking up your order…</p>}

        {state === "missing" && (
          <div className="mt-8 max-w-md border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              No order found with that code. Check the spelling, or message the artist on{" "}
              <a
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noreferrer"
                className="border-b border-foreground/30"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        )}

        {order && (
          <div className="mt-12 max-w-2xl border border-border p-6 sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-6">
              <div>
                <p className="eyebrow">Order {order.order_number}</p>
                <h2 className="mt-2 font-display text-2xl">{order.items}</h2>
              </div>
              <p className="text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>
            </div>

            <p className="mt-6 text-sm">
              <span className="text-muted-foreground">Payment:</span>{" "}
              <span>{order.payment_status === "paid" ? "Payment confirmed" : "Payment pending"}</span>
            </p>

            {cancelled ? (
              <p className="mt-6 border border-destructive/40 p-4 text-sm text-destructive">
                This order was cancelled. Contact the artist if this is unexpected.
              </p>
            ) : (
              <ol className="mt-8 space-y-6">
                {ORDER_STAGES.map((stage, i) => {
                  const reached = i <= currentIndex;
                  return (
                    <li key={stage} className="flex gap-4">
                      <span
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          reached ? "border-clay bg-clay text-background" : "border-border text-transparent",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <div>
                        <p className={cn("text-sm", !reached && "text-muted-foreground")}>
                          {STAGE_LABELS[stage]}
                        </p>
                        {i === currentIndex && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {formatDate(order.updated_at)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </Section>
    </SiteShell>
  );
}