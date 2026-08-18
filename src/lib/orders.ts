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
}

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

  const rows = (data ?? []) as Array<{ order_number: string }>;
  const orderNumber = rows[0]?.order_number;
  if (!orderNumber) throw new Error("Order could not be created.");

  return {
    orderNumber,
    message: orderMessage(orderNumber, painting, input),
  };
}

export function orderMessage(orderNumber: string, painting: Painting, input: OrderCustomerInput) {
  return [
    "Hello! I would like to purchase this painting.",
    "",
    `Order ID: ${orderNumber}`,
    `Painting: ${painting.title}`,
    `Artwork ID: ${painting.artwork_code}`,
    `Price: ${formatPrice(painting.price)}`,
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

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
