export type Availability = "available" | "sold" | "archived";

export interface PaintingImage {
  id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
}

export interface Painting {
  id: string;
  artwork_code: string;
  title: string;
  price: number;
  medium: string | null;
  width: number | null;
  height: number | null;
  dimensions: string | null;
  year: number | null;
  category_id: string | null;
  category: string;
  description: string | null;
  story: string | null;
  images: string[];
  imageRows: PaintingImage[];
  availability: Availability;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
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

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
}

export interface Address {
  province: string | null;
  district: string | null;
  municipality: string | null;
  address: string | null;
  landmark: string | null;
  instructions: string | null;
}

export interface OrderItem {
  id: string;
  painting_id: string | null;
  painting_title_snapshot: string;
  painting_price_snapshot: number;
  artwork_id_snapshot: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  address_id: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  customers: Customer | null;
  addresses: Address | null;
  order_items: OrderItem[];
}

export interface CustomRequest {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  idea: string;
  preferred_size: string | null;
  budget: string | null;
  deadline: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  custom_request_images: { id: string; storage_path: string; image_url: string | null }[];
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
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const ORDER_STAGES = [
  "pending_confirmation",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  pending_confirmation: "Order placed",
  confirmed: "Payment confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const REQUEST_STATUSES = ["new", "contacted", "in_progress", "completed", "cancelled"] as const;

export const REQUEST_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
