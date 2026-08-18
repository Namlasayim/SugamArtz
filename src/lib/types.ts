export type Availability = "available" | "sold" | "reserved";

export interface Painting {
  id: string;
  artwork_code: string;
  title: string;
  price: number;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  category: string;
  description: string | null;
  story: string | null;
  images: string[];
  availability: Availability;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  artist_name: string;
  artist_statement: string;
  artist_bio: string | null;
  hero_image: string | null;
  whatsapp_number: string;
  instagram_username: string;
  contact_email: string;
  location: string;
  delivery_fee: number;
  currency: string;
}

export interface Order {
  id: string;
  order_code: string;
  painting_id: string | null;
  painting_title: string;
  artwork_code: string | null;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  province: string | null;
  district: string | null;
  municipality: string | null;
  address: string | null;
  landmark: string | null;
  instructions: string | null;
  price: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  admin_notes: string | null;
  created_at: string;
}

export interface CustomRequest {
  id: string;
  request_code: string;
  full_name: string;
  whatsapp: string | null;
  email: string | null;
  idea: string;
  preferred_size: string | null;
  budget: string | null;
  deadline: string | null;
  reference_image: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const ORDER_STAGES = [
  "placed",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Payment confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};