export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string
          district: string | null
          id: string
          instructions: string | null
          landmark: string | null
          municipality: string | null
          province: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id: string
          district?: string | null
          id?: string
          instructions?: string | null
          landmark?: string | null
          municipality?: string | null
          province?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string
          district?: string | null
          id?: string
          instructions?: string | null
          landmark?: string | null
          municipality?: string | null
          province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_settings: {
        Row: {
          artist_name: string
          bio: string | null
          delivery_fee: number
          email: string
          id: number
          instagram_username: string
          location: string
          profile_image_url: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          artist_name?: string
          bio?: string | null
          delivery_fee?: number
          email?: string
          id?: number
          instagram_username?: string
          location?: string
          profile_image_url?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          artist_name?: string
          bio?: string | null
          delivery_fee?: number
          email?: string
          id?: number
          instagram_username?: string
          location?: string
          profile_image_url?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_read: boolean
          message: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_read?: boolean
          message: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_read?: boolean
          message?: string
          phone?: string | null
        }
        Relationships: []
      }
      custom_request_images: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_request_images_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_requests: {
        Row: {
          admin_notes: string | null
          budget: string | null
          created_at: string
          deadline: string | null
          email: string | null
          id: string
          idea: string
          name: string
          preferred_size: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          budget?: string | null
          created_at?: string
          deadline?: string | null
          email?: string | null
          id?: string
          idea: string
          name: string
          preferred_size?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          budget?: string | null
          created_at?: string
          deadline?: string | null
          email?: string | null
          id?: string
          idea?: string
          name?: string
          preferred_size?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          artwork_id_snapshot: string | null
          created_at: string
          id: string
          order_id: string
          painting_id: string | null
          painting_price_snapshot: number
          painting_title_snapshot: string
        }
        Insert: {
          artwork_id_snapshot?: string | null
          created_at?: string
          id?: string
          order_id: string
          painting_id?: string | null
          painting_price_snapshot?: number
          painting_title_snapshot: string
        }
        Update: {
          artwork_id_snapshot?: string | null
          created_at?: string
          id?: string
          order_id?: string
          painting_id?: string | null
          painting_price_snapshot?: number
          painting_title_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_painting_id_fkey"
            columns: ["painting_id"]
            isOneToOne: false
            referencedRelation: "paintings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          admin_notes: string | null
          created_at: string
          customer_id: string | null
          delivery_fee: number
          id: string
          order_number: string
          payment_status: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_fee?: number
          id?: string
          order_number: string
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          admin_notes?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_fee?: number
          id?: string
          order_number?: string
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      painting_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          painting_id: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          painting_id: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          painting_id?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "painting_images_painting_id_fkey"
            columns: ["painting_id"]
            isOneToOne: false
            referencedRelation: "paintings"
            referencedColumns: ["id"]
          },
        ]
      }
      paintings: {
        Row: {
          artwork_id: string
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          height: number | null
          id: string
          medium: string | null
          price: number
          sort_order: number
          status: string
          story: string | null
          title: string
          updated_at: string
          width: number | null
          year: number | null
        }
        Insert: {
          artwork_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          height?: number | null
          id?: string
          medium?: string | null
          price?: number
          sort_order?: number
          status?: string
          story?: string | null
          title: string
          updated_at?: string
          width?: number | null
          year?: number | null
        }
        Update: {
          artwork_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          height?: number | null
          id?: string
          medium?: string | null
          price?: number
          sort_order?: number
          status?: string
          story?: string | null
          title?: string
          updated_at?: string
          width?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paintings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_custom_request_image: {
        Args: { _request_id: string; _storage_path: string }
        Returns: undefined
      }
      can_attach_custom_request_file: {
        Args: { _path: string }
        Returns: boolean
      }
      claim_admin: { Args: never; Returns: boolean }
      confirm_order_payment: { Args: { _order_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_guest_order: {
        Args: {
          _address: string
          _delivery_fee: number
          _district: string
          _email: string
          _instructions: string
          _landmark: string
          _municipality: string
          _name: string
          _painting_id: string
          _phone: string
          _province: string
          _whatsapp: string
        }
        Returns: {
          order_number: string
        }[]
      }
      track_order: {
        Args: { _order_number: string }
        Returns: {
          created_at: string
          items: string
          order_number: string
          payment_status: string
          status: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
