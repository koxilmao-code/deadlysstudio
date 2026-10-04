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
      ab_tests: {
        Row: {
          asset_type: Database["public"]["Enums"]["ab_asset"]
          clicks_a: number
          clicks_b: number
          created_at: string
          engaged_a: number
          engaged_b: number
          game_id: string
          id: string
          impressions_a: number
          impressions_b: number
          name: string
          status: string
          test_number: number
          updated_at: string
          user_id: string
          variant_a: string
          variant_b: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["ab_asset"]
          clicks_a?: number
          clicks_b?: number
          created_at?: string
          engaged_a?: number
          engaged_b?: number
          game_id: string
          id?: string
          impressions_a?: number
          impressions_b?: number
          name: string
          status?: string
          test_number?: never
          updated_at?: string
          user_id: string
          variant_a: string
          variant_b: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["ab_asset"]
          clicks_a?: number
          clicks_b?: number
          created_at?: string
          engaged_a?: number
          engaged_b?: number
          game_id?: string
          id?: string
          impressions_a?: number
          impressions_b?: number
          name?: string
          status?: string
          test_number?: never
          updated_at?: string
          user_id?: string
          variant_a?: string
          variant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      change_logs: {
        Row: {
          action: string
          changed_by: string | null
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_request_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string | null
          request_id: string
          status: Database["public"]["Enums"]["creative_status"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["creative_status"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["creative_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "creative_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "creative_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_requests: {
        Row: {
          assigned_to: string | null
          brief: Json
          created_at: string
          deliverable_url: string | null
          expected_delivery: string | null
          game_id: string
          id: string
          kind: Database["public"]["Enums"]["creative_kind"]
          preferred_date: string | null
          request_number: number
          revision_note: string | null
          staff_message: string | null
          status: Database["public"]["Enums"]["creative_status"]
          tier_at_submit: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          brief?: Json
          created_at?: string
          deliverable_url?: string | null
          expected_delivery?: string | null
          game_id: string
          id?: string
          kind: Database["public"]["Enums"]["creative_kind"]
          preferred_date?: string | null
          request_number?: number
          revision_note?: string | null
          staff_message?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          tier_at_submit: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          brief?: Json
          created_at?: string
          deliverable_url?: string | null
          expected_delivery?: string | null
          game_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["creative_kind"]
          preferred_date?: string | null
          request_number?: number
          revision_note?: string | null
          staff_message?: string | null
          status?: Database["public"]["Enums"]["creative_status"]
          tier_at_submit?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_metric_snapshots: {
        Row: {
          avg_session_seconds: number | null
          captured_at: string
          ccu: number | null
          d1_retention: number | null
          d30_retention: number | null
          d7_retention: number | null
          dislikes: number | null
          favorites: number | null
          game_id: string
          id: string
          is_public_metric: boolean
          likes: number | null
          new_players: number | null
          paying_users: number | null
          purchases: number | null
          returning_players: number | null
          revenue: number | null
          source: string
          visits: number | null
        }
        Insert: {
          avg_session_seconds?: number | null
          captured_at?: string
          ccu?: number | null
          d1_retention?: number | null
          d30_retention?: number | null
          d7_retention?: number | null
          dislikes?: number | null
          favorites?: number | null
          game_id: string
          id?: string
          is_public_metric?: boolean
          likes?: number | null
          new_players?: number | null
          paying_users?: number | null
          purchases?: number | null
          returning_players?: number | null
          revenue?: number | null
          source: string
          visits?: number | null
        }
        Update: {
          avg_session_seconds?: number | null
          captured_at?: string
          ccu?: number | null
          d1_retention?: number | null
          d30_retention?: number | null
          d7_retention?: number | null
          dislikes?: number | null
          favorites?: number | null
          game_id?: string
          id?: string
          is_public_metric?: boolean
          likes?: number | null
          new_players?: number | null
          paying_users?: number | null
          purchases?: number | null
          returning_players?: number | null
          revenue?: number | null
          source?: string
          visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_metric_snapshots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_review_submissions: {
        Row: {
          contact_email: string
          context: string | null
          created_at: string
          game_stage: string
          game_url: string
          id: string
          primary_goal: string
          studio_name: string
        }
        Insert: {
          contact_email: string
          context?: string | null
          created_at?: string
          game_stage: string
          game_url: string
          id?: string
          primary_goal: string
          studio_name: string
        }
        Update: {
          contact_email?: string
          context?: string | null
          created_at?: string
          game_stage?: string
          game_url?: string
          id?: string
          primary_goal?: string
          studio_name?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          external_game_id: string
          genre: string
          id: string
          is_public: boolean
          metadata: Json
          name: string
          platform: Database["public"]["Enums"]["game_platform"]
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          external_game_id: string
          genre?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          name: string
          platform?: Database["public"]["Enums"]["game_platform"]
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          external_game_id?: string
          genre?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          name?: string
          platform?: Database["public"]["Enums"]["game_platform"]
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_name: string
          contact_email: string
          created_at: string
          id: string
          note: string
          profile_url: string
          role_slug: string
        }
        Insert: {
          applicant_name: string
          contact_email: string
          created_at?: string
          id?: string
          note: string
          profile_url: string
          role_slug: string
        }
        Update: {
          applicant_name?: string
          contact_email?: string
          created_at?: string
          id?: string
          note?: string
          profile_url?: string
          role_slug?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          category: string
          compatibility: Database["public"]["Enums"]["platform_compat"]
          contact_url: string | null
          created_at: string
          description: string
          game_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price_usd: number
          seller_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          compatibility?: Database["public"]["Enums"]["platform_compat"]
          contact_url?: string | null
          created_at?: string
          description: string
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_usd?: number
          seller_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          compatibility?: Database["public"]["Enums"]["platform_compat"]
          contact_url?: string | null
          created_at?: string
          description?: string
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_usd?: number
          seller_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_public: boolean
          services: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_public?: boolean
          services?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_public?: boolean
          services?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rbx_snapshots: {
        Row: {
          captured_at: string
          down_votes: number
          favorites: number
          id: number
          playing: number
          universe_id: number
          up_votes: number
          visits: number
        }
        Insert: {
          captured_at?: string
          down_votes?: number
          favorites?: number
          id?: number
          playing?: number
          universe_id: number
          up_votes?: number
          visits?: number
        }
        Update: {
          captured_at?: string
          down_votes?: number
          favorites?: number
          id?: number
          playing?: number
          universe_id?: number
          up_votes?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "rbx_snapshots_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "rbx_universes"
            referencedColumns: ["universe_id"]
          },
        ]
      }
      rbx_universes: {
        Row: {
          created_at_rbx: string | null
          creator_name: string | null
          first_seen: string
          genre: string | null
          icon_url: string | null
          last_polled: string
          max_players: number | null
          name: string
          price: number | null
          root_place_id: number | null
          thumb_url: string | null
          universe_id: number
          updated_at_rbx: string | null
        }
        Insert: {
          created_at_rbx?: string | null
          creator_name?: string | null
          first_seen?: string
          genre?: string | null
          icon_url?: string | null
          last_polled?: string
          max_players?: number | null
          name: string
          price?: number | null
          root_place_id?: number | null
          thumb_url?: string | null
          universe_id: number
          updated_at_rbx?: string | null
        }
        Update: {
          created_at_rbx?: string | null
          creator_name?: string | null
          first_seen?: string
          genre?: string | null
          icon_url?: string | null
          last_polled?: string
          max_players?: number | null
          name?: string
          price?: number | null
          root_place_id?: number | null
          thumb_url?: string | null
          universe_id?: number
          updated_at_rbx?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          note_type: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          note_type?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          note_type?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          common_mistakes: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          difficulty: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          role_category: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          assigned_to?: string | null
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          role_category?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          assigned_to?: string | null
          common_mistakes?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          role_category?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wiki_pages: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wiki_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wiki_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_game_metrics: {
        Row: {
          captured_at: string | null
          ccu: number | null
          dislikes: number | null
          favorites: number | null
          game_id: string | null
          likes: number | null
          visits: number | null
        }
        Insert: {
          captured_at?: string | null
          ccu?: number | null
          dislikes?: number | null
          favorites?: number | null
          game_id?: string | null
          likes?: number | null
          visits?: number | null
        }
        Update: {
          captured_at?: string | null
          ccu?: number | null
          dislikes?: number | null
          favorites?: number | null
          game_id?: string | null
          likes?: number | null
          visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_metric_snapshots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      credit_allowance: {
        Args: {
          _kind: Database["public"]["Enums"]["creative_kind"]
          _tier: Database["public"]["Enums"]["plan_tier"]
        }
        Returns: number
      }
      credit_window_start: { Args: { _uid: string }; Returns: string }
      effective_tier: {
        Args: { _uid: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      get_credit_usage: {
        Args: never
        Returns: {
          allowance: number
          kind: Database["public"]["Enums"]["creative_kind"]
          used: number
          window_start: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tier: {
        Args: { _min: Database["public"]["Enums"]["plan_tier"]; _uid: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      request_creative_revision: {
        Args: { _note: string; _request_id: string }
        Returns: undefined
      }
      submit_creative_request: {
        Args: {
          _brief: Json
          _game_id: string
          _kind: Database["public"]["Enums"]["creative_kind"]
          _preferred_date: string
        }
        Returns: {
          assigned_to: string | null
          brief: Json
          created_at: string
          deliverable_url: string | null
          expected_delivery: string | null
          game_id: string
          id: string
          kind: Database["public"]["Enums"]["creative_kind"]
          preferred_date: string | null
          request_number: number
          revision_note: string | null
          staff_message: string | null
          status: Database["public"]["Enums"]["creative_status"]
          tier_at_submit: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "creative_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      tier_rank: {
        Args: { _t: Database["public"]["Enums"]["plan_tier"] }
        Returns: number
      }
    }
    Enums: {
      ab_asset: "thumbnail" | "icon" | "title" | "promo" | "trailer"
      app_role: "admin" | "staff" | "user"
      creative_kind: "thumbnail" | "trailer"
      creative_status:
        | "submitted"
        | "reviewing"
        | "in_progress"
        | "awaiting_info"
        | "ready_for_review"
        | "revision_requested"
        | "completed"
      game_platform: "roblox" | "uefn"
      plan_tier: "free" | "starter" | "premium" | "enterprise"
      platform_compat: "roblox" | "uefn" | "multi"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "open" | "claimed" | "in_progress" | "done"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      ab_asset: ["thumbnail", "icon", "title", "promo", "trailer"],
      app_role: ["admin", "staff", "user"],
      creative_kind: ["thumbnail", "trailer"],
      creative_status: [
        "submitted",
        "reviewing",
        "in_progress",
        "awaiting_info",
        "ready_for_review",
        "revision_requested",
        "completed",
      ],
      game_platform: ["roblox", "uefn"],
      plan_tier: ["free", "starter", "premium", "enterprise"],
      platform_compat: ["roblox", "uefn", "multi"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["open", "claimed", "in_progress", "done"],
    },
  },
} as const
