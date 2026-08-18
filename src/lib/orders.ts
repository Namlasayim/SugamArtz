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
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp || null,
      email: input.email || null,
    } as never)
    .select("id")
    .single();
  if (customerError) throw customerError;

  const customerId = (customer as { id: string }).id;

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .insert({
      customer_id: customerId,
      province: input.province || null,
      district: input.district || null,
      municipality: input.municipality || null,
      address: input.address || null,
      landmark: input.landmark || null,
      instructions: input.instructions || null,
    } as never)
    .select("id")
    .single();
  if (addressError) throw addressError;

  const subtotal = Number(painting.price);
  const total = subtotal + Number(deliveryFee ?? 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      address_id: (address as { id: string }).id,
      order_number: "pending",
      status: "pending_confirmation",
      payment_status: "pending",
      subtotal,
      delivery_fee: Number(deliveryFee ?? 0),
      total,
    } as never)
    .select("id, order_number")
    .single();
  if (orderError) throw orderError;

  const placed = order as { id: string; order_number: string };

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: placed.id,
    painting_id: painting.id,
    painting_title_snapshot: painting.title,
    painting_price_snapshot: subtotal,
    artwork_id_snapshot: painting.artwork_code,
  } as never);
  if (itemError) throw itemError;

  return {
    orderNumber: placed.order_number,
    message: orderMessage(placed.order_number, painting, input),
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
