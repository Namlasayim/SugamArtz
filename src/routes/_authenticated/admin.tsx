import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { markAllNotificationsRead, useIsAdmin, useNotifications, useRefresh } from "@/lib/admin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Dashboard — Artist Admin" },
      {
        name: "description",
        content: "Private dashboard for managing paintings, orders and enquiries.",
      },
      { property: "og:title", content: "Studio Dashboard" },
      { property: "og:description", content: "Private dashboard for the artist." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/paintings", label: "Paintings" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/requests", label: "Commissions" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/settings", label: "Settings" },
];

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const { data: isAdmin, isLoading } = useIsAdmin(user.id);
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login" as string });
  }

  useEffect(() => {
    if (isLoading || isAdmin !== false) return;
    toast.error("This account does not have studio access.");
    void supabase.auth
      .signOut()
      .then(() => navigate({ to: "/admin/login" as string, replace: true }));
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return <p className="p-16 text-center text-sm text-muted-foreground">Checking access…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="p-16 text-center text-sm text-muted-foreground">Redirecting to sign in…</p>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <div>
            <p className="eyebrow">Studio dashboard</p>
            <p className="font-display text-xl">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsRead();
                refresh(["admin-notifications"]);
              }}
              className="inline-flex items-center gap-2 text-xs tracking-[0.12em] text-muted-foreground uppercase"
              aria-label="Mark all notifications as read"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} /> {unread} new
            </button>
            <Button variant="outline" size="sm" onClick={signOut} className="rounded-none">
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 lg:px-10">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              activeProps={{ className: "border-foreground text-foreground" }}
              className="border-b-2 border-transparent px-3 py-3 text-xs tracking-[0.12em] whitespace-nowrap text-muted-foreground uppercase"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
