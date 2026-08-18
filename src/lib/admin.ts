import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppNotification, ContactMessage, CustomRequest, Order } from "./types";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/** Ensures the signed-in user has a profile row. The role column is set by the database. */
export async function ensureProfile(userId: string, name?: string | null) {
  const { data } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  if (data) return;
  await supabase.from("profiles").insert({ user_id: userId, name: name ?? null } as never);
}

export function useIsAdmin(userId?: string) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as { role?: string } | null)?.role === "admin";
    },
  });
}

const ORDER_SELECT =
  "*, customers(id, name, email, phone, whatsapp), addresses(province, district, municipality, address, landmark, instructions), order_items(id, painting_id, painting_title_snapshot, painting_price_snapshot, artwork_id_snapshot)";

export function useOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });
}

export function useCustomRequests() {
  return useQuery({
    queryKey: ["admin-custom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_requests")
        .select("*, custom_request_images(id, storage_path, image_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomRequest[];
    },
  });
}

export function useMessages() {
  return useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ContactMessage[];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AppNotification[];
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return (keys: string[]) => keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] }));
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read: true } as never).eq("id", id);
}

export async function markAllNotificationsRead() {
  await supabase.from("notifications").update({ read: true } as never).eq("read", false);
}

/** Payment is verified manually by the artist; the database performs the paid → confirmed → sold cascade. */
export async function confirmPayment(orderId: string) {
  const { error } = await supabase.rpc("confirm_order_payment", { _order_id: orderId });
  if (error) throw error;
}
