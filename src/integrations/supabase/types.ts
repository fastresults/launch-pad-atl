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
      ai_pipeline_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          options: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["pipeline_run_status"]
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          options?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["pipeline_run_status"]
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          options?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["pipeline_run_status"]
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_pipeline_steps: {
        Row: {
          created_at: string
          deliverable_key: string
          error: string | null
          finished_at: string | null
          id: string
          input_snapshot: Json | null
          model: string | null
          raw_output: Json | null
          run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["pipeline_step_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverable_key: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_snapshot?: Json | null
          model?: string | null
          raw_output?: Json | null
          run_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["pipeline_step_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          deliverable_key?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input_snapshot?: Json | null
          model?: string | null
          raw_output?: Json | null
          run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["pipeline_step_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_pipeline_steps_deliverable_key_fkey"
            columns: ["deliverable_key"]
            isOneToOne: false
            referencedRelation: "deliverable_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "ai_pipeline_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      attendee_deliverables: {
        Row: {
          admin_edited_at: string | null
          admin_edited_by: string | null
          ai_generated_at: string | null
          approved_at: string | null
          approved_by: string | null
          content_ai: Json | null
          content_current: Json | null
          content_source: Database["public"]["Enums"]["deliverable_content_source"]
          created_at: string
          deliverable_key: string
          id: string
          last_run_id: string | null
          publish_at: string | null
          publish_status: Database["public"]["Enums"]["deliverable_publish_status"]
          published_at: string | null
          review_status: Database["public"]["Enums"]["deliverable_review_status"]
          reviewer_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_edited_at?: string | null
          admin_edited_by?: string | null
          ai_generated_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content_ai?: Json | null
          content_current?: Json | null
          content_source?: Database["public"]["Enums"]["deliverable_content_source"]
          created_at?: string
          deliverable_key: string
          id?: string
          last_run_id?: string | null
          publish_at?: string | null
          publish_status?: Database["public"]["Enums"]["deliverable_publish_status"]
          published_at?: string | null
          review_status?: Database["public"]["Enums"]["deliverable_review_status"]
          reviewer_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_edited_at?: string | null
          admin_edited_by?: string | null
          ai_generated_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content_ai?: Json | null
          content_current?: Json | null
          content_source?: Database["public"]["Enums"]["deliverable_content_source"]
          created_at?: string
          deliverable_key?: string
          id?: string
          last_run_id?: string | null
          publish_at?: string | null
          publish_status?: Database["public"]["Enums"]["deliverable_publish_status"]
          published_at?: string | null
          review_status?: Database["public"]["Enums"]["deliverable_review_status"]
          reviewer_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_deliverables_deliverable_key_fkey"
            columns: ["deliverable_key"]
            isOneToOne: false
            referencedRelation: "deliverable_types"
            referencedColumns: ["key"]
          },
        ]
      }
      attendee_documents: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          original_name: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          original_name: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          original_name?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      attendee_goals: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          horizon: number
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          horizon: number
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          horizon?: number
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendee_profiles: {
        Row: {
          background: string | null
          business_model: string | null
          business_name: string | null
          competitors: string[] | null
          created_at: string
          current_revenue: number | null
          full_name: string | null
          funding_raised: number | null
          headline: string | null
          id: string
          industry: string | null
          intake_completed_at: string | null
          monthly_burn: number | null
          primary_goal: string | null
          problem_solved: string | null
          projections: Json | null
          runway_months: number | null
          skills: string[] | null
          stage: string | null
          target_market: string | null
          time_commitment_hours: number | null
          updated_at: string
          user_id: string
          value_prop: string | null
        }
        Insert: {
          background?: string | null
          business_model?: string | null
          business_name?: string | null
          competitors?: string[] | null
          created_at?: string
          current_revenue?: number | null
          full_name?: string | null
          funding_raised?: number | null
          headline?: string | null
          id?: string
          industry?: string | null
          intake_completed_at?: string | null
          monthly_burn?: number | null
          primary_goal?: string | null
          problem_solved?: string | null
          projections?: Json | null
          runway_months?: number | null
          skills?: string[] | null
          stage?: string | null
          target_market?: string | null
          time_commitment_hours?: number | null
          updated_at?: string
          user_id: string
          value_prop?: string | null
        }
        Update: {
          background?: string | null
          business_model?: string | null
          business_name?: string | null
          competitors?: string[] | null
          created_at?: string
          current_revenue?: number | null
          full_name?: string | null
          funding_raised?: number | null
          headline?: string | null
          id?: string
          industry?: string | null
          intake_completed_at?: string | null
          monthly_burn?: number | null
          primary_goal?: string | null
          problem_solved?: string | null
          projections?: Json | null
          runway_months?: number | null
          skills?: string[] | null
          stage?: string | null
          target_market?: string | null
          time_commitment_hours?: number | null
          updated_at?: string
          user_id?: string
          value_prop?: string | null
        }
        Relationships: []
      }
      attendee_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_key: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_key: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_key?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          cohort_date: string
          created_at: string
          end_time: string
          id: string
          seats_left: number | null
          sort_order: number
          start_time: string
          status: string
          tz: string
          updated_at: string
          venue_address: string
          venue_city: string
          venue_name: string
          venue_postal: string
          venue_region: string
        }
        Insert: {
          cohort_date: string
          created_at?: string
          end_time?: string
          id: string
          seats_left?: number | null
          sort_order?: number
          start_time?: string
          status?: string
          tz?: string
          updated_at?: string
          venue_address?: string
          venue_city?: string
          venue_name?: string
          venue_postal?: string
          venue_region?: string
        }
        Update: {
          cohort_date?: string
          created_at?: string
          end_time?: string
          id?: string
          seats_left?: number | null
          sort_order?: number
          start_time?: string
          status?: string
          tz?: string
          updated_at?: string
          venue_address?: string
          venue_city?: string
          venue_name?: string
          venue_postal?: string
          venue_region?: string
        }
        Relationships: []
      }
      deliverable_revisions: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          deliverable_id: string
          deliverable_key: string
          id: string
          notes: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          deliverable_id: string
          deliverable_key: string
          id?: string
          notes?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          deliverable_id?: string
          deliverable_key?: string
          id?: string
          notes?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_revisions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "attendee_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_types: {
        Row: {
          active: boolean
          created_at: string
          default_model: string
          depends_on_keys: string[] | null
          description: string | null
          key: string
          label: string
          output_schema: Json | null
          prompt_template: string | null
          schema_version: number
          sort_order: number
          stage_label: string | null
          stage_n: number | null
          tier_required: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_model?: string
          depends_on_keys?: string[] | null
          description?: string | null
          key: string
          label: string
          output_schema?: Json | null
          prompt_template?: string | null
          schema_version?: number
          sort_order?: number
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          default_model?: string
          depends_on_keys?: string[] | null
          description?: string | null
          key?: string
          label?: string
          output_schema?: Json | null
          prompt_template?: string | null
          schema_version?: number
          sort_order?: number
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          ai_error: string | null
          ai_status: Database["public"]["Enums"]["media_ai_status"]
          ai_summary: string | null
          ai_tags: string[]
          ai_transcript: string | null
          created_at: string
          created_by: string | null
          description: string | null
          folder_id: string | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          mime_type: string
          original_name: string
          owner_user_id: string | null
          pushed_at: string | null
          pushed_by: string | null
          pushed_from_asset_id: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          size_bytes: number
          storage_bucket: string
          storage_path: string
          tags: string[]
          thumbnail_path: string | null
          title: string | null
          updated_at: string
          upload_status: string
        }
        Insert: {
          ai_error?: string | null
          ai_status?: Database["public"]["Enums"]["media_ai_status"]
          ai_summary?: string | null
          ai_tags?: string[]
          ai_transcript?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          mime_type: string
          original_name: string
          owner_user_id?: string | null
          pushed_at?: string | null
          pushed_by?: string | null
          pushed_from_asset_id?: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          size_bytes?: number
          storage_bucket: string
          storage_path: string
          tags?: string[]
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          upload_status?: string
        }
        Update: {
          ai_error?: string | null
          ai_status?: Database["public"]["Enums"]["media_ai_status"]
          ai_summary?: string | null
          ai_tags?: string[]
          ai_transcript?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          mime_type?: string
          original_name?: string
          owner_user_id?: string | null
          pushed_at?: string | null
          pushed_by?: string | null
          pushed_from_asset_id?: string | null
          scope?: Database["public"]["Enums"]["media_scope"]
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          tags?: string[]
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_pushed_from_asset_id_fkey"
            columns: ["pushed_from_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collection_items: {
        Row: {
          added_at: string
          asset_id: string
          collection_id: string
        }
        Insert: {
          added_at?: string
          asset_id: string
          collection_id: string
        }
        Update: {
          added_at?: string
          asset_id?: string
          collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_collection_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "media_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          owner_user_id: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          scope?: Database["public"]["Enums"]["media_scope"]
          updated_at?: string
        }
        Relationships: []
      }
      media_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_user_id: string | null
          parent_id: string | null
          path: string
          scope: Database["public"]["Enums"]["media_scope"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          parent_id?: string | null
          path?: string
          scope: Database["public"]["Enums"]["media_scope"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          parent_id?: string | null
          path?: string
          scope?: Database["public"]["Enums"]["media_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_push_log: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string | null
          source_asset_id: string | null
          target_asset_id: string | null
          target_user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          source_asset_id?: string | null
          target_asset_id?: string | null
          target_user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          source_asset_id?: string | null
          target_asset_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_push_log_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_push_log_target_asset_id_fkey"
            columns: ["target_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
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
      workshop_registrations: {
        Row: {
          business_idea: string
          cohort_id: string | null
          created_at: string
          email: string
          id: string
          industry: string
          name: string
          phone: string | null
          referral_source: string | null
          stage: string
          status: string
          tier_interest: string | null
        }
        Insert: {
          business_idea: string
          cohort_id?: string | null
          created_at?: string
          email: string
          id?: string
          industry: string
          name: string
          phone?: string | null
          referral_source?: string | null
          stage: string
          status?: string
          tier_interest?: string | null
        }
        Update: {
          business_idea?: string
          cohort_id?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string
          name?: string
          phone?: string | null
          referral_source?: string | null
          stage?: string
          status?: string
          tier_interest?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      deliverable_content_source: "ai" | "admin_override"
      deliverable_publish_status:
        | "unpublished"
        | "scheduled"
        | "published"
        | "unpublished_manual"
      deliverable_review_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "changes_requested"
      media_ai_status: "pending" | "processing" | "ready" | "failed" | "skipped"
      media_scope: "master" | "user"
      media_type: "document" | "image" | "audio" | "video" | "other"
      pipeline_run_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "partial"
      pipeline_step_status:
        | "pending"
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
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
      app_role: ["super_admin", "admin", "user"],
      deliverable_content_source: ["ai", "admin_override"],
      deliverable_publish_status: [
        "unpublished",
        "scheduled",
        "published",
        "unpublished_manual",
      ],
      deliverable_review_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "changes_requested",
      ],
      media_ai_status: ["pending", "processing", "ready", "failed", "skipped"],
      media_scope: ["master", "user"],
      media_type: ["document", "image", "audio", "video", "other"],
      pipeline_run_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "partial",
      ],
      pipeline_step_status: [
        "pending",
        "queued",
        "running",
        "completed",
        "failed",
        "skipped",
      ],
    },
  },
} as const
