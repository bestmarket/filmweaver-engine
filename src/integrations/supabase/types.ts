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
      app_users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          email_normalized: string
          id: string
          last_login_at: string | null
          password_hash: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          email_normalized: string
          id?: string
          last_login_at?: string | null
          password_hash: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          email_normalized?: string
          id?: string
          last_login_at?: string | null
          password_hash?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["provider_kind"]
          metadata: Json
          mime_type: string | null
          project_id: string | null
          shot_id: string | null
          size_bytes: number | null
          storage_path: string
          storage_provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["provider_kind"]
          metadata?: Json
          mime_type?: string | null
          project_id?: string | null
          shot_id?: string | null
          size_bytes?: number | null
          storage_path: string
          storage_provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["provider_kind"]
          metadata?: Json
          mime_type?: string | null
          project_id?: string | null
          shot_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          storage_provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_shot_id_fkey"
            columns: ["shot_id"]
            isOneToOne: false
            referencedRelation: "shots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          context: Json
          created_at: string
          id: string
          outcome: string
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          outcome?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          context?: Json
          created_at?: string
          id?: string
          outcome?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          appearance: Json
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          user_id: string
          voice_profile: Json
        }
        Insert: {
          appearance?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          user_id: string
          voice_profile?: Json
        }
        Update: {
          appearance?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          voice_profile?: Json
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_consumed: number
          lifetime_granted: number
          reserved: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_consumed?: number
          lifetime_granted?: number
          reserved?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_consumed?: number
          lifetime_granted?: number
          reserved?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          idempotency_key: string | null
          job_id: string | null
          kind: Database["public"]["Enums"]["credit_entry_kind"]
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          job_id?: string | null
          kind: Database["public"]["Enums"]["credit_entry_kind"]
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          job_id?: string | null
          kind?: Database["public"]["Enums"]["credit_entry_kind"]
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_tx_job_fk"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempt_count: number
          created_at: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          input: Json
          job_type: string
          max_attempts: number
          output: Json | null
          priority: number
          project_id: string | null
          provider_kind: Database["public"]["Enums"]["provider_kind"] | null
          provider_metadata: Json
          provider_name: string | null
          reserved_credits: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          input?: Json
          job_type: string
          max_attempts?: number
          output?: Json | null
          priority?: number
          project_id?: string | null
          provider_kind?: Database["public"]["Enums"]["provider_kind"] | null
          provider_metadata?: Json
          provider_name?: string | null
          reserved_credits?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          input?: Json
          job_type?: string
          max_attempts?: number
          output?: Json | null
          priority?: number
          project_id?: string | null
          provider_kind?: Database["public"]["Enums"]["provider_kind"] | null
          provider_metadata?: Json
          provider_name?: string | null
          reserved_credits?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          attributes: Json
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          aspect_ratio: string
          created_at: string
          id: string
          project_id: string
          status: string
          synopsis: string | null
          target_duration_seconds: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string
          id?: string
          project_id: string
          status?: string
          synopsis?: string | null
          target_duration_seconds?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          synopsis?: string | null
          target_duration_seconds?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          genre: string | null
          id: string
          logline: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genre?: string | null
          id?: string
          logline?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          genre?: string | null
          id?: string
          logline?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_configurations: {
        Row: {
          created_at: string
          credential_env_var: string | null
          enabled: boolean
          id: string
          is_default: boolean
          kind: Database["public"]["Enums"]["provider_kind"]
          model: string | null
          provider_name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          credential_env_var?: string | null
          enabled?: boolean
          id?: string
          is_default?: boolean
          kind: Database["public"]["Enums"]["provider_kind"]
          model?: string | null
          provider_name: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          credential_env_var?: string | null
          enabled?: boolean
          id?: string
          is_default?: boolean
          kind?: Database["public"]["Enums"]["provider_kind"]
          model?: string | null
          provider_name?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      provider_usage: {
        Row: {
          created_at: string
          credits_charged: number
          id: string
          job_id: string | null
          kind: Database["public"]["Enums"]["provider_kind"]
          latency_ms: number | null
          model: string | null
          provider_configuration_id: string | null
          provider_name: string
          succeeded: boolean
          unit_type: string
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_charged?: number
          id?: string
          job_id?: string | null
          kind: Database["public"]["Enums"]["provider_kind"]
          latency_ms?: number | null
          model?: string | null
          provider_configuration_id?: string | null
          provider_name: string
          succeeded?: boolean
          unit_type?: string
          units?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits_charged?: number
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["provider_kind"]
          latency_ms?: number | null
          model?: string | null
          provider_configuration_id?: string | null
          provider_name?: string
          succeeded?: boolean
          unit_type?: string
          units?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_provider_configuration_id_fkey"
            columns: ["provider_configuration_id"]
            isOneToOne: false
            referencedRelation: "provider_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          heading: string
          id: string
          location_id: string | null
          movie_id: string
          project_id: string
          script: string | null
          sequence_index: number
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          heading: string
          id?: string
          location_id?: string | null
          movie_id: string
          project_id: string
          script?: string | null
          sequence_index?: number
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          heading?: string
          id?: string
          location_id?: string | null
          movie_id?: string
          project_id?: string
          script?: string | null
          sequence_index?: number
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          revoked_at: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shots: {
        Row: {
          camera_movement: string | null
          created_at: string
          dialogue: string | null
          duration_seconds: number | null
          id: string
          project_id: string
          prompt: string | null
          scene_id: string
          sequence_index: number
          shot_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          camera_movement?: string | null
          created_at?: string
          dialogue?: string | null
          duration_seconds?: number | null
          id?: string
          project_id: string
          prompt?: string | null
          scene_id: string
          sequence_index?: number
          shot_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          camera_movement?: string | null
          created_at?: string
          dialogue?: string | null
          duration_seconds?: number | null
          id?: string
          project_id?: string
          prompt?: string | null
          scene_id?: string
          sequence_index?: number
          shot_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shots_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_customer_id: string | null
          id: string
          monthly_credits: number
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_customer_id?: string | null
          id?: string
          monthly_credits?: number
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_customer_id?: string | null
          id?: string
          monthly_credits?: number
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "USER" | "ADMIN"
      credit_entry_kind: "GRANT" | "RESERVE" | "RELEASE" | "CONSUME" | "ADJUST"
      job_status:
        | "QUEUED"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
        | "RETRYING"
      provider_kind: "LLM" | "IMAGE" | "VIDEO" | "VOICE" | "MUSIC" | "STORAGE"
      user_status: "ACTIVE" | "SUSPENDED"
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
      app_role: ["USER", "ADMIN"],
      credit_entry_kind: ["GRANT", "RESERVE", "RELEASE", "CONSUME", "ADJUST"],
      job_status: [
        "QUEUED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "RETRYING",
      ],
      provider_kind: ["LLM", "IMAGE", "VIDEO", "VOICE", "MUSIC", "STORAGE"],
      user_status: ["ACTIVE", "SUSPENDED"],
    },
  },
} as const
