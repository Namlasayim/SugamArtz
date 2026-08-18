import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMessages, useRefresh } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const { data: messages = [], isLoading } = useMessages();
  const refresh = useRefresh();

  async function setRead(id: string, is_read: boolean) {
    const { error } = await supabase.from("contact_messages").update({ is_read } as never).eq("id", id);
    if (error) {
      toast.error("Could not update the message.");
      return;
    }
    refresh(["admin-messages"]);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete the message.");
      return;
    }
    toast.success("Message deleted.");
    refresh(["admin-messages"]);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Messages</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <div className="space-y-4">
        {messages.map((m) => (
          <article key={m.id} className="bg-background p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{m.full_name}</h2>
                <p className="eyebrow mt-1">
                  {formatDate(m.created_at)} · {m.email ?? "no email"} · {m.phone ?? "no phone"}
                </p>
              </div>
              {!m.is_read && (
                <span className="bg-clay px-2 py-1 text-[0.625rem] tracking-[0.2em] text-background uppercase">
                  New
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{m.message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-none" onClick={() => setRead(m.id, !m.is_read)}>
                Mark as {m.is_read ? "unread" : "read"}
              </Button>
              {m.email && (
                <Button asChild variant="outline" size="sm" className="rounded-none">
                  <a href={`mailto:${m.email}`}>Reply by email</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="rounded-none text-destructive" onClick={() => remove(m.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
        {!isLoading && messages.length === 0 && (
          <p className="bg-background p-10 text-center text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>
    </div>
  );
}