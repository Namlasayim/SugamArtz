import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaintings } from "@/lib/paintings";
import { useCustomRequests, useMessages, useNotifications, useOrders } from "@/lib/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: paintings = [] } = usePaintings();
  const { data: orders = [] } = useOrders();
  const { data: requests = [] } = useCustomRequests();
  const { data: messages = [] } = useMessages();
  const { data: notifications = [] } = useNotifications();

  const revenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    { label: "Paintings", value: String(paintings.length) },
    { label: "Available", value: String(paintings.filter((p) => p.availability === "available").length) },
    { label: "Sold", value: String(paintings.filter((p) => p.availability === "sold").length) },
    { label: "Pending orders", value: String(orders.filter((o) => o.status === "pending_confirmation").length) },
    { label: "Revenue", value: formatPrice(revenue) },
    { label: "Commissions", value: String(requests.filter((r) => r.status === "new").length) },
    { label: "Unread messages", value: String(messages.filter((m) => !m.is_read).length) },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-px bg-border sm:grid-cols-3 lg:grid-cols-7">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-5">
            <p className="eyebrow">{s.label}</p>
            <p className="mt-2 font-display text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Recent orders" href="/admin/orders">
          {orders.slice(0, 6).map((o) => (
            <li key={o.id} className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-sm last:border-0">
              <span>
                <span className="text-muted-foreground">{o.order_number}</span> ·{" "}
                {o.order_items.map((i) => i.painting_title_snapshot).join(", ")}
              </span>
              <span className="shrink-0 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                {STAGE_LABELS[o.status] ?? o.status}
              </span>
            </li>
          ))}
          {orders.length === 0 && <li className="py-3 text-sm text-muted-foreground">No orders yet.</li>}
        </Panel>

        <Panel title="Activity" href="/admin/requests">
          {notifications.slice(0, 6).map((n) => (
            <li key={n.id} className="border-b border-border py-3 text-sm last:border-0">
              <p>{n.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
            </li>
          ))}
          {notifications.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">Nothing new yet.</li>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-background p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        <Link to={href} className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
          View all
        </Link>
      </div>
      <ul className="mt-4">{children}</ul>
    </section>
  );
}