import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "./format";
import type { Painting } from "./types";

export interface OrderCustomerInput {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  province: string;
  district: string;
  municipality: string;
  address: string;
  landmark: string;
  instructions: string;
}

export interface PlacedOrder {
  orderNumber: string;
  message: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface StoredOrderConfirmation {
  orderNumber: string;
  paintingTitle: string;
  message: string;
  copied: boolean;
}

const CONFIRMATION_PREFIX = "gallery:order-confirmation:";

export async function placeOrder(
  painting: Painting,
  input: OrderCustomerInput,
  deliveryFee: number,
): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc("place_guest_order", {
    _name: input.name,
    _phone: input.phone,
    _whatsapp: input.whatsapp || null,
    _email: input.email || null,
    _province: input.province || null,
    _district: input.district || null,
    _municipality: input.municipality || null,
    _address: input.address || null,
    _landmark: input.landmark || null,
    _instructions: input.instructions || null,
    _painting_id: painting.id,
    _delivery_fee: Number(deliveryFee ?? 0),
  } as never);
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    order_number: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
  }>;
  const row = rows[0];
  if (!row?.order_number) throw new Error("Order could not be created.");

  const subtotal = Number(row.subtotal);
  const actualDeliveryFee = Number(row.delivery_fee);
  const total = Number(row.total);
  if (![subtotal, actualDeliveryFee, total].every(Number.isFinite)) {
    throw new Error("The order total could not be verified.");
  }
  return {
    orderNumber: row.order_number,
    message: orderMessage(row.order_number, painting, input, actualDeliveryFee, total),
    subtotal,
    deliveryFee: actualDeliveryFee,
    total,
  };
}

export function orderMessage(
  orderNumber: string,
  painting: Painting,
  input: OrderCustomerInput,
  deliveryFee = 0,
  total = Number(painting.price) + Number(deliveryFee),
) {
  return [
    "Hello! I would like to purchase this painting.",
    "",
    `Order ID: ${orderNumber}`,
    `Painting: ${painting.title}`,
    `Artwork ID: ${painting.artwork_code}`,
    `Price: ${formatPrice(painting.price)}`,
    `Delivery fee: ${formatPrice(deliveryFee)}`,
    `Total: ${formatPrice(total)}`,
    "",
    "Customer:",
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `WhatsApp: ${input.whatsapp || "—"}`,
    `Email: ${input.email || "—"}`,
    "",
    "Delivery:",
    `Province: ${input.province || "—"}`,
    `District: ${input.district || "—"}`,
    `Municipality: ${input.municipality || "—"}`,
    `Address: ${input.address || "—"}`,
    `Landmark: ${input.landmark || "—"}`,
    `Instructions: ${input.instructions || "—"}`,
    "",
    "Please confirm the order and payment details.",
  ].join("\n");
}

export function saveOrderConfirmation(confirmation: StoredOrderConfirmation) {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(
      `${CONFIRMATION_PREFIX}${confirmation.orderNumber}`,
      JSON.stringify(confirmation),
    );
    return true;
  } catch {
    // Keep the order dialog open so it can show the full message if storage is unavailable.
    return false;
  }
}

export function loadOrderConfirmation(orderNumber: string): StoredOrderConfirmation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${CONFIRMATION_PREFIX}${orderNumber}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredOrderConfirmation>;
    if (
      parsed.orderNumber !== orderNumber ||
      typeof parsed.paintingTitle !== "string" ||
      typeof parsed.message !== "string" ||
      typeof parsed.copied !== "boolean"
    ) {
      return null;
    }
    return parsed as StoredOrderConfirmation;
  } catch {
    return null;
  }
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
