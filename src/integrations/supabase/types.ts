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
      leads: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          link_id: string
          name: string | null
          phone: string | null
          redirected_to: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          name?: string | null
          phone?: string | null
          redirected_to?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          name?: string | null
          phone?: string | null
          redirected_to?: string | null
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
          headline: string | null
          id: string
          message_template: string | null
          mode: string
          name: string
          slug: string
          subtitle: string | null
          workspace_id: string
        }
        Insert: {
          button_text?: string | null
          capture_name?: boolean | null
          capture_phone?: boolean | null
          created_at?: string | null
          headline?: string | null
          id?: string
          message_template?: string | null
          mode: string
          name: string
          slug: string
          subtitle?: string | null
          workspace_id: string
        }
        Update: {
          button_text?: string | null
          capture_name?: boolean | null
          capture_phone?: boolean | null
          created_at?: string | null
          headline?: string | null
          id?: string
          message_template?: string | null
          mode?: string
          name?: string
          slug?: string
          subtitle?: string | null
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
      workspaces: {
        Row: {
          created_at: string | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          id: string
          name: string
          owner_id: string
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          id?: string
          name: string
          owner_id: string
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
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
      get_next_contact: { Args: { p_link_id: string }; Returns: string }
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
