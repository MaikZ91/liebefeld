export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_suggestions: {
        Row: {
          activity: string
          category: string
          created_at: string | null
          id: string
          link: string | null
          time_of_day: string
          weather: string
        }
        Insert: {
          activity: string
          category: string
          created_at?: string | null
          id?: string
          link?: string | null
          time_of_day: string
          weather: string
        }
        Update: {
          activity?: string
          category?: string
          created_at?: string | null
          id?: string
          link?: string | null
          time_of_day?: string
          weather?: string
        }
        Relationships: []
      }
      chat_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          avatar: string | null
          created_at: string
          event_date: string | null
          event_id: string | null
          event_image_url: string | null
          event_location: string | null
          event_title: string | null
          group_id: string
          id: string
          media_url: string | null
          reactions: Json | null
          read_by: string[] | null
          sender: string
          text: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          event_date?: string | null
          event_id?: string | null
          event_image_url?: string | null
          event_location?: string | null
          event_title?: string | null
          group_id: string
          id?: string
          media_url?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          sender: string
          text: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          event_date?: string | null
          event_id?: string | null
          event_image_url?: string | null
          event_location?: string | null
          event_title?: string | null
          group_id?: string
          id?: string
          media_url?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          sender?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_queries: {
        Row: {
          created_at: string
          id: string
          query: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          category: string
          city: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_paid: boolean | null
          likes: number | null
          link: string | null
          location: string | null
          organizer: string | null
          rsvp_maybe: number | null
          rsvp_no: number | null
          rsvp_yes: number | null
          source: string | null
          time: string
          title: string
        }
        Insert: {
          category: string
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          likes?: number | null
          link?: string | null
          location?: string | null
          organizer?: string | null
          rsvp_maybe?: number | null
          rsvp_no?: number | null
          rsvp_yes?: number | null
          source?: string | null
          time: string
          title: string
        }
        Update: {
          category?: string
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          likes?: number | null
          link?: string | null
          location?: string | null
          organizer?: string | null
          rsvp_maybe?: number | null
          rsvp_no?: number | null
          rsvp_yes?: number | null
          source?: string | null
          time?: string
          title?: string
        }
        Relationships: []
      }
      location_coordinates: {
        Row: {
          city: string
          created_at: string
          display_name: string | null
          id: string
          lat: number
          lng: number
          location: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          display_name?: string | null
          id?: string
          lat: number
          lng: number
          location: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          display_name?: string | null
          id?: string
          lat?: number
          lng?: number
          location?: string
          updated_at?: string
        }
        Relationships: []
      }
      perfect_day_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          recipient: string
          sender: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient: string
          sender: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient?: string
          sender?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          current_checkin_timestamp: string | null
          current_live_location_lat: number | null
          current_live_location_lng: number | null
          current_status_message: string | null
          favorite_locations: string[] | null
          hobbies: string[] | null
          id: string
          interests: string[] | null
          last_online: string | null
          username: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          current_checkin_timestamp?: string | null
          current_live_location_lat?: number | null
          current_live_location_lng?: number | null
          current_status_message?: string | null
          favorite_locations?: string[] | null
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          last_online?: string | null
          username: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          current_checkin_timestamp?: string | null
          current_live_location_lat?: number | null
          current_live_location_lng?: number | null
          current_status_message?: string | null
          favorite_locations?: string[] | null
          hobbies?: string[] | null
          id?: string
          interests?: string[] | null
          last_online?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      unique_locations: {
        Row: {
          location: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_perfect_day_subscription: {
        Args: { p_username: string }
        Returns: boolean
      }
      generate_daily_perfect_day_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_perfect_day_subscription: {
        Args: { p_username: string; p_subscribe: boolean }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
