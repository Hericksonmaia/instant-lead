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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      evolution_instances: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          id: string
          instance_name: string
          workspace_id: string
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          id?: string
          instance_name: string
          workspace_id: string
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolution_instances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contact_id: string | null
          created_at: string | null
          event_source_url: string | null
          fbc: string | null
          fbp: string | null
          id: string
          ip_address: string | null
          link_id: string
          name: string | null
          phone: string | null
          redirected_to: string | null
          sale_currency: string | null
          sale_date: string | null
          sale_value: number | null
          sold: boolean | null
          user_agent: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          event_source_url?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          name?: string | null
          phone?: string | null
          redirected_to?: string | null
          sale_currency?: string | null
          sale_date?: string | null
          sale_value?: number | null
          sold?: boolean | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          event_source_url?: string | null
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          name?: string | null
          phone?: string | null
          redirected_to?: string | null
          sale_currency?: string | null
          sale_date?: string | null
          sale_value?: number | null
          sold?: boolean | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "redirect_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "redirect_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_tags: {
        Row: {
          created_at: string | null
          id: string
          link_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_tags_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "redirect_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          payload: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          payload?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          payload?: Json | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          label: string
          link_id: string
          order_index: number
          url: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          label: string
          link_id: string
          order_index?: number
          url: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          label?: string
          link_id?: string
          order_index?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "redirect_links"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      redirect_contacts: {
        Row: {
          created_at: string | null
          id: string
          link_id: string
          order_index: number
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_id: string
          order_index: number
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link_id?: string
          order_index?: number
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "redirect_contacts_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "redirect_links"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_links: {
        Row: {
          button_text: string | null
          capture_name: boolean | null
          capture_phone: boolean | null
          created_at: string | null
          description: string | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          headline: string | null
          id: string
          message_template: string | null
          mode: string
          name: string
          slug: string
          subtitle: string | null
          theme_bg_color: string | null
          theme_button_bg: string | null
          theme_button_text: string | null
          theme_font: string | null
          theme_text_color: string | null
          workspace_id: string
        }
        Insert: {
          button_text?: string | null
          capture_name?: boolean | null
          capture_phone?: boolean | null
          created_at?: string | null
          description?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          headline?: string | null
          id?: string
          message_template?: string | null
          mode: string
          name: string
          slug: string
          subtitle?: string | null
          theme_bg_color?: string | null
          theme_button_bg?: string | null
          theme_button_text?: string | null
          theme_font?: string | null
          theme_text_color?: string | null
          workspace_id: string
        }
        Update: {
          button_text?: string | null
          capture_name?: boolean | null
          capture_phone?: boolean | null
          created_at?: string | null
          description?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          headline?: string | null
          id?: string
          message_template?: string | null
          mode?: string
          name?: string
          slug?: string
          subtitle?: string | null
          theme_bg_color?: string | null
          theme_button_bg?: string | null
          theme_button_text?: string | null
          theme_font?: string | null
          theme_text_color?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redirect_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      redirect_state: {
        Row: {
          current_index: number | null
          link_id: string
          updated_at: string | null
        }
        Insert: {
          current_index?: number | null
          link_id: string
          updated_at?: string | null
        }
        Update: {
          current_index?: number | null
          link_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redirect_state_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: true
            referencedRelation: "redirect_links"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          message_content: string
          message_type: string
          phone_number: string
          raw_payload: Json
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message_content: string
          message_type: string
          phone_number: string
          raw_payload: Json
          timestamp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message_content?: string
          message_type?: string
          phone_number?: string
          raw_payload?: Json
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          evolution_instance_name: string | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          id: string
          name: string
          owner_id: string
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          id?: string
          name: string
          owner_id: string
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance_name?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          id?: string
          name?: string
          owner_id?: string
          timezone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_link_contacts: {
        Args: { p_link_id: string }
        Returns: {
          contact_id: string
          phone: string
        }[]
      }
      get_menu_items: {
        Args: { p_link_id: string }
        Returns: {
          icon: string
          item_id: string
          label: string
          order_index: number
          url: string
        }[]
      }
      get_next_contact: { Args: { p_link_id: string }; Returns: string }
      get_redirect_data: {
        Args: { p_slug: string }
        Returns: {
          button_text: string
          capture_name: boolean
          capture_phone: boolean
          description: string
          headline: string
          link_id: string
          message_template: string
          mode: string
          name: string
          subtitle: string
          theme_bg_color: string
          theme_button_bg: string
          theme_button_text: string
          theme_font: string
          theme_text_color: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_link_queue: { Args: { p_link_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
