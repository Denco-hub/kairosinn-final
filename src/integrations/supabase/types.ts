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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_rooms: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          room_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          room_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_rooms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          group_id: string
          guest_email: string | null
          guest_name: string
          guest_phone: string
          id: string
          notes: string | null
          num_guests: number
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          group_id: string
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          id?: string
          notes?: string | null
          num_guests?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          group_id?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          id?: string
          notes?: string | null
          num_guests?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_user_id: string | null
          created_at: string
          guest_name: string | null
          guest_phone: string | null
          guest_session_id: string | null
          id: string
          read_by_recipient: boolean
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_user_id?: string | null
          created_at?: string
          guest_name?: string | null
          guest_phone?: string | null
          guest_session_id?: string | null
          id?: string
          read_by_recipient?: boolean
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_user_id?: string | null
          created_at?: string
          guest_name?: string | null
          guest_phone?: string | null
          guest_session_id?: string | null
          id?: string
          read_by_recipient?: boolean
          sender_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          booking_id: string | null
          comment: string | null
          created_at: string
          guest_name: string
          id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_name: string
          id?: string
          rating: number
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      role_passkeys: {
        Row: {
          passkey: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          passkey: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          passkey?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_name: string
          group_id: string | null
          id: string
          image_url: string | null
          is_bookable_individually: boolean
          price_per_night: number
          room_number: string
          room_type: Database["public"]["Enums"]["room_type"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_bookable_individually?: boolean
          price_per_night: number
          room_number: string
          room_type?: Database["public"]["Enums"]["room_type"]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name?: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_bookable_individually?: boolean
          price_per_night?: number
          room_number?: string
          room_type?: Database["public"]["Enums"]["room_type"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          payment_date: string
          payment_method: string
          receipt_number: string
          recorded_by: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          recorded_by: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          recorded_by?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
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
      daily_financial_summary: {
        Row: {
          day: string
          total_payments: number
          total_expenses: number
          net_revenue: number
          cash_take: number
          mobile_money_take: number
          payments_count: number
          expenses_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      check_in_guest: {
        Args: { _booking_id: string }
        Returns: {
          booking_id: string
        }
      }
      check_out_guest: {
        Args: { _booking_id: string }
        Returns: {
          booking_id: string
        }
      }
      create_booking_atomic: {
        Args: {
          _user_id: string | null
          _group_id: string
          _guest_name: string
          _guest_phone: string
          _guest_email: string | null
          _check_in: string
          _check_out: string
          _num_guests: number
          _notes: string | null
          _room_ids: string[]
        }
        Returns: {
          booking_id: string
          total_price: number
          nights: number
        }
      }
      create_walkin_booking: {
        Args: {
          _guest_name: string
          _guest_phone: string
          _guest_email: string | null
          _notes: string | null
          _check_in: string
          _check_out: string
          _room_ids: string[]
          _amount: number
          _payment_method: string
          _auto_check_in: boolean
        }
        Returns: {
          booking_id: string
        }
      }
      get_room_rack_status: {
        Args: Record<string, never>
        Returns: {
          room_id: string
          room_number: string
          display_name: string | null
          room_type: string | null
          status: "vacant" | "occupied" | "arriving_today" | "maintenance"
          booking_id: string | null
          guest_name: string | null
          arrives_at: string | null
          departs_at: string | null
        }[]
      }
      get_unavailable_room_ids: {
        Args: { _check_in: string; _check_out: string }
        Returns: {
          room_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      claim_staff_passkey: {
        Args: { _passkey: string }
        Returns: { role: string }
      }
    }
    Enums: {
      app_role:
        | "guest"
        | "staff"
        | "manager"
        | "owner"
        | "accountant"
        | "receptionist"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "checked_in"
        | "checked_out"
      room_type: "standard" | "family_suite"
      transaction_type: "payment" | "expense" | "refund"
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
      app_role: [
        "guest",
        "staff",
        "manager",
        "owner",
        "accountant",
        "receptionist",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "checked_in",
        "checked_out",
      ],
      room_type: ["standard", "family_suite"],
      transaction_type: ["payment", "expense", "refund"],
    },
  },
} as const
