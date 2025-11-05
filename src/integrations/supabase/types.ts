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
      audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_wallet: string
          created_at: string
          id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_wallet: string
          created_at?: string
          id?: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_wallet?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      fund_splits: {
        Row: {
          created_at: string
          creator_funds_lamports: number
          id: string
          lottery_funds_lamports: number
          operator_funds_lamports: number
          referral_code: string | null
          referral_type: string
          referrer_earnings_lamports: number
          total_lamports: number
          transaction_signature: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          creator_funds_lamports?: number
          id?: string
          lottery_funds_lamports?: number
          operator_funds_lamports?: number
          referral_code?: string | null
          referral_type: string
          referrer_earnings_lamports?: number
          total_lamports: number
          transaction_signature: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          creator_funds_lamports?: number
          id?: string
          lottery_funds_lamports?: number
          operator_funds_lamports?: number
          referral_code?: string | null
          referral_type?: string
          referrer_earnings_lamports?: number
          total_lamports?: number
          transaction_signature?: string
          wallet_address?: string
        }
        Relationships: []
      }
      lottery_draws: {
        Row: {
          created_at: string | null
          draw_date: string
          end_date: string
          id: string
          jackpot_lamports: number | null
          lottery_type: Database["public"]["Enums"]["lottery_type"]
          start_date: string
          status: string
          total_pool_lamports: number | null
          total_tickets_sold: number | null
        }
        Insert: {
          created_at?: string | null
          draw_date: string
          end_date: string
          id?: string
          jackpot_lamports?: number | null
          lottery_type: Database["public"]["Enums"]["lottery_type"]
          start_date: string
          status?: string
          total_pool_lamports?: number | null
          total_tickets_sold?: number | null
        }
        Update: {
          created_at?: string | null
          draw_date?: string
          end_date?: string
          id?: string
          jackpot_lamports?: number | null
          lottery_type?: Database["public"]["Enums"]["lottery_type"]
          start_date?: string
          status?: string
          total_pool_lamports?: number | null
          total_tickets_sold?: number | null
        }
        Relationships: []
      }
      lottery_fund_balances: {
        Row: {
          created_at: string
          creator_share_lamports: number
          draw_id: string | null
          id: string
          lottery_pool_lamports: number
          lottery_type: string
          operator_share_lamports: number
          paid_to_winners_lamports: number
          referrer_share_lamports: number
          total_collected_lamports: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_share_lamports?: number
          draw_id?: string | null
          id?: string
          lottery_pool_lamports?: number
          lottery_type: string
          operator_share_lamports?: number
          paid_to_winners_lamports?: number
          referrer_share_lamports?: number
          total_collected_lamports?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_share_lamports?: number
          draw_id?: string | null
          id?: string
          lottery_pool_lamports?: number
          lottery_type?: string
          operator_share_lamports?: number
          paid_to_winners_lamports?: number
          referrer_share_lamports?: number
          total_collected_lamports?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_fund_balances_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "lottery_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_tickets: {
        Row: {
          created_at: string | null
          draw_id: string
          id: string
          is_bonus: boolean | null
          referral_code: string | null
          ticket_code: string
          transaction_signature: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          draw_id: string
          id?: string
          is_bonus?: boolean | null
          referral_code?: string | null
          ticket_code: string
          transaction_signature?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          draw_id?: string
          id?: string
          is_bonus?: boolean | null
          referral_code?: string | null
          ticket_code?: string
          transaction_signature?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_tickets_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "lottery_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_winners: {
        Row: {
          created_at: string | null
          draw_id: string
          id: string
          paid_at: string | null
          prize_lamports: number
          prize_tier: string
          show_on_wall_of_fame: boolean | null
          ticket_id: string
          transaction_signature: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          draw_id: string
          id?: string
          paid_at?: string | null
          prize_lamports: number
          prize_tier: string
          show_on_wall_of_fame?: boolean | null
          ticket_id: string
          transaction_signature?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          draw_id?: string
          id?: string
          paid_at?: string | null
          prize_lamports?: number
          prize_tier?: string
          show_on_wall_of_fame?: boolean | null
          ticket_id?: string
          transaction_signature?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_winners_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "lottery_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lottery_winners_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "lottery_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_transactions: {
        Row: {
          amount_lamports: number
          id: string
          processed_at: string
          ticket_count: number
          transaction_signature: string
          wallet_address: string
        }
        Insert: {
          amount_lamports: number
          id?: string
          processed_at?: string
          ticket_count: number
          transaction_signature: string
          wallet_address: string
        }
        Update: {
          amount_lamports?: number
          id?: string
          processed_at?: string
          ticket_count?: number
          transaction_signature?: string
          wallet_address?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          wallet_address: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          wallet_address: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          created_at: string
          id: string
          pending_lamports: number
          total_earned_lamports: number
          updated_at: string
          wallet_address: string
          withdrawn_lamports: number
        }
        Insert: {
          created_at?: string
          id?: string
          pending_lamports?: number
          total_earned_lamports?: number
          updated_at?: string
          wallet_address: string
          withdrawn_lamports?: number
        }
        Update: {
          created_at?: string
          id?: string
          pending_lamports?: number
          total_earned_lamports?: number
          updated_at?: string
          wallet_address?: string
          withdrawn_lamports?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_wallet: string
          referrer_wallet: string
          tickets_purchased: number
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_wallet: string
          referrer_wallet: string
          tickets_purchased?: number
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_wallet?: string
          referrer_wallet?: string
          tickets_purchased?: number
        }
        Relationships: []
      }
      sol_price_cache: {
        Row: {
          id: string
          price_usd: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          price_usd: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          price_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      test_lottery_runs: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          lottery_type: string
          started_at: string | null
          status: string
          stopped_at: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          lottery_type: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          lottery_type?: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
        }
        Relationships: []
      }
      test_mode_state: {
        Row: {
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          bonus_tickets: number
          created_at: string
          id: string
          ticket_count: number
          transaction_signature: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          bonus_tickets?: number
          created_at?: string
          id?: string
          ticket_count?: number
          transaction_signature?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          bonus_tickets?: number
          created_at?: string
          id?: string
          ticket_count?: number
          transaction_signature?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          wallet_address?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          id: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_connections: {
        Row: {
          connection_count: number
          created_at: string
          id: string
          last_connected: string
          wallet_address: string
          wallet_name: string | null
        }
        Insert: {
          connection_count?: number
          created_at?: string
          id?: string
          last_connected?: string
          wallet_address: string
          wallet_name?: string | null
        }
        Update: {
          connection_count?: number
          created_at?: string
          id?: string
          last_connected?: string
          wallet_address?: string
          wallet_name?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount_lamports: number
          created_at: string
          id: string
          processed_at: string | null
          status: string
          transaction_signature: string | null
          wallet_address: string
        }
        Insert: {
          amount_lamports: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          transaction_signature?: string | null
          wallet_address: string
        }
        Update: {
          amount_lamports?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          transaction_signature?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_wallet: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _wallet: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      lottery_type: "monthly" | "weekly" | "daily"
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
      app_role: ["admin", "moderator", "user"],
      lottery_type: ["monthly", "weekly", "daily"],
    },
  },
} as const
