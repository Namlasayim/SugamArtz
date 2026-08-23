import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { confirmPayment, useOrders, useRefresh } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STAGES, STAGE_LABELS, type Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const { data: orders = [], isLoading } = useOrders();
  const refresh = useRefresh();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const titles = o.order_items.map((i) => i.painting_title_snapshot).join(" ");
    return `${o.order_number} ${o.customers?.name ?? ""} ${titles} ${o.customers?.phone ?? ""}`
      .toLowerCase()
      .includes(term);
  });

  async function update(order: Order, patch: Record<string, unknown>) {
    const { error } = await supabase
      .from("orders")
      .update(patch as never)
      .eq("id", order.id);
    if (error) {
      toast.error("Could not update the order.");
      return;
    }
    toast.success("Order updated.");
    refresh(["admin-orders", "admin-notifications", "paintings"]);
  }

  async function markPaid(order: Order) {
    try {
      await confirmPayment(order.id);
      toast.success("Payment recorded and the order confirmed.");
      refresh(["admin-orders", "admin-notifications", "paintings"]);
    } catch {
      toast.error("Could not record the payment.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">Orders</h1>
        <span className="text-sm text-muted-foreground">{rows.length} shown</span>
        <div className="ml-auto flex gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders"
            aria-label="Search orders"
            className="w-48 rounded-none bg-background"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger
              className="w-44 rounded-none bg-background"
              aria-label="Filter by status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {[...ORDER_STAGES, "cancelled"].map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}

      <div className="space-y-4">
        {rows.map((o) => (
          <article key={o.id} className="bg-background p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="eyebrow">
                  {o.order_number} · {formatDate(o.created_at)}
                </p>
                <h2 className="mt-1 font-display text-xl">
                  {o.order_items.map((i) => i.painting_title_snapshot).join(", ") || "Order"}
                </h2>
              </div>
              <div className="text-right">
                <p className="font-display text-lg">{formatPrice(Number(o.total))}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(Number(o.subtotal))} + {formatPrice(Number(o.delivery_fee))} delivery
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                {o.customers?.name ?? "—"} · {o.customers?.phone ?? "—"}
              </p>
              <p>{o.customers?.email ?? "No email"}</p>
              <p className="sm:col-span-2">
                {[
                  o.addresses?.address,
                  o.addresses?.municipality,
                  o.addresses?.district,
                  o.addresses?.province,
                ]
                  .filter(Boolean)
                  .join(", ") || "No address"}
              </p>
              {o.addresses?.instructions && (
                <p className="sm:col-span-2">Note: {o.addresses.instructions}</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
                Payment: {o.payment_status === "paid" ? "Received" : "Pending"}
              </span>
              {o.payment_status !== "paid" && o.status !== "cancelled" && (
                <Button
                  size="sm"
                  className="rounded-none tracking-[0.12em] uppercase"
                  onClick={() => markPaid(o)}
                >
                  Mark payment received
                </Button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Select value={o.status} onValueChange={(v) => update(o, { status: v })}>
                <SelectTrigger className="rounded-none" aria-label="Order status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...ORDER_STAGES, "cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <NoteEditor
                value={o.admin_notes}
                onSave={(admin_notes) => update(o, { admin_notes })}
              />
            </div>
          </article>
        ))}
        {!isLoading && rows.length === 0 && (
          <p className="bg-background p-10 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        )}
      </div>
    </div>
  );
}

function NoteEditor({ value, onSave }: { value: string | null; onSave: (value: string) => void }) {
  const [note, setNote] = useState(value ?? "");
  return (
    <div className="flex gap-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Private note"
        aria-label="Private note"
        className="rounded-none"
      />
      <Button variant="outline" className="rounded-none" onClick={() => onSave(note)}>
        Save
      </Button>
    </div>
  );
}
