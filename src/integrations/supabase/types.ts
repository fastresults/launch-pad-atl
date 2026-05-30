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
      application_notes: {
        Row: {
          application_id: string
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          kind: string
        }
        Insert: {
          application_id: string
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          kind?: string
        }
        Update: {
          application_id?: string
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "founder_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      attendee_business_brief: {
        Row: {
          business_model: string | null
          completed_at: string | null
          completeness_score: number
          created_at: string
          id: string
          inspiration_brands: string | null
          offer_description: string | null
          one_line_pitch: string | null
          origin_story: string | null
          pricing_idea: string | null
          problem_statement: string | null
          target_customer: string | null
          twelve_month_vision: string | null
          unique_insight: string | null
          updated_at: string
          user_id: string
          voice_transcripts: Json
        }
        Insert: {
          business_model?: string | null
          completed_at?: string | null
          completeness_score?: number
          created_at?: string
          id?: string
          inspiration_brands?: string | null
          offer_description?: string | null
          one_line_pitch?: string | null
          origin_story?: string | null
          pricing_idea?: string | null
          problem_statement?: string | null
          target_customer?: string | null
          twelve_month_vision?: string | null
          unique_insight?: string | null
          updated_at?: string
          user_id: string
          voice_transcripts?: Json
        }
        Update: {
          business_model?: string | null
          completed_at?: string | null
          completeness_score?: number
          created_at?: string
          id?: string
          inspiration_brands?: string | null
          offer_description?: string | null
          one_line_pitch?: string | null
          origin_story?: string | null
          pricing_idea?: string | null
          problem_statement?: string | null
          target_customer?: string | null
          twelve_month_vision?: string | null
          unique_insight?: string | null
          updated_at?: string
          user_id?: string
          voice_transcripts?: Json
        }
        Relationships: []
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
      attendee_filing_info: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_purpose: string | null
          city: string | null
          country: string | null
          created_at: string
          dob: string | null
          id: string
          legal_first_name: string | null
          legal_last_name: string | null
          llc_name: string | null
          postal_code: string | null
          registered_agent_address: string | null
          registered_agent_name: string | null
          ssn_full: string | null
          ssn_last4: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_purpose?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          llc_name?: string | null
          postal_code?: string | null
          registered_agent_address?: string | null
          registered_agent_name?: string | null
          ssn_full?: string | null
          ssn_last4?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_purpose?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          llc_name?: string | null
          postal_code?: string | null
          registered_agent_address?: string | null
          registered_agent_name?: string | null
          ssn_full?: string | null
          ssn_last4?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendee_founder_memory: {
        Row: {
          block_n: number | null
          bullets: string[]
          content_hash: string
          created_at: string
          field_keys: string[]
          id: string
          model: string | null
          qa: Json
          source: string
          source_key: string
          summary: string | null
          superseded_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_n?: number | null
          bullets?: string[]
          content_hash: string
          created_at?: string
          field_keys?: string[]
          id?: string
          model?: string | null
          qa?: Json
          source: string
          source_key: string
          summary?: string | null
          superseded_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_n?: number | null
          bullets?: string[]
          content_hash?: string
          created_at?: string
          field_keys?: string[]
          id?: string
          model?: string | null
          qa?: Json
          source?: string
          source_key?: string
          summary?: string | null
          superseded_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendee_founder_profile: {
        Row: {
          created_at: string
          extracted: Json
          extracted_at: string | null
          id: string
          linkedin_url: string | null
          raw_text: string | null
          right_person_reason: string | null
          source: string | null
          source_file_path: string | null
          unfair_advantage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted?: Json
          extracted_at?: string | null
          id?: string
          linkedin_url?: string | null
          raw_text?: string | null
          right_person_reason?: string | null
          source?: string | null
          source_file_path?: string | null
          unfair_advantage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted?: Json
          extracted_at?: string | null
          id?: string
          linkedin_url?: string | null
          raw_text?: string | null
          right_person_reason?: string | null
          source?: string | null
          source_file_path?: string | null
          unfair_advantage?: string | null
          updated_at?: string
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
      attendee_market_profile: {
        Row: {
          archetype: string[]
          channels: string[]
          created_at: string
          customer_type: string | null
          geography: string | null
          id: string
          industry: string | null
          market_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archetype?: string[]
          channels?: string[]
          created_at?: string
          customer_type?: string | null
          geography?: string | null
          id?: string
          industry?: string | null
          market_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archetype?: string[]
          channels?: string[]
          created_at?: string
          customer_type?: string | null
          geography?: string | null
          id?: string
          industry?: string | null
          market_note?: string | null
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
      attendee_stage_intake: {
        Row: {
          completed_at: string | null
          created_at: string
          deliverable_key: string
          id: string
          intake: Json
          updated_at: string
          user_id: string
          voice_transcripts: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deliverable_key: string
          id?: string
          intake?: Json
          updated_at?: string
          user_id: string
          voice_transcripts?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deliverable_key?: string
          id?: string
          intake?: Json
          updated_at?: string
          user_id?: string
          voice_transcripts?: Json
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          cohort_date: string
          cohort_display_floor_pct: number
          cohort_honest_threshold_pct: number
          cohort_price_cents: number
          cohort_seats: number
          cohort_warming_boost: number
          created_at: string
          end_time: string
          founders_display_floor_pct: number
          founders_honest_threshold_pct: number
          founders_price_cents: number
          founders_seats: number
          founders_warming_boost: number
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
          cohort_display_floor_pct?: number
          cohort_honest_threshold_pct?: number
          cohort_price_cents?: number
          cohort_seats?: number
          cohort_warming_boost?: number
          created_at?: string
          end_time?: string
          founders_display_floor_pct?: number
          founders_honest_threshold_pct?: number
          founders_price_cents?: number
          founders_seats?: number
          founders_warming_boost?: number
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
          cohort_display_floor_pct?: number
          cohort_honest_threshold_pct?: number
          cohort_price_cents?: number
          cohort_seats?: number
          cohort_warming_boost?: number
          created_at?: string
          end_time?: string
          founders_display_floor_pct?: number
          founders_honest_threshold_pct?: number
          founders_price_cents?: number
          founders_seats?: number
          founders_warming_boost?: number
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
          auto_runnable: boolean
          created_at: string
          default_model: string
          depends_on_keys: string[] | null
          description: string | null
          key: string
          label: string
          output_kind: string
          output_schema: Json | null
          produces_context_key: string | null
          prompt_template: string | null
          requires_context_keys: string[]
          schema_version: number
          sort_order: number
          stage_label: string | null
          stage_n: number | null
          tier_required: string | null
          user_can_trigger: boolean
        }
        Insert: {
          active?: boolean
          auto_runnable?: boolean
          created_at?: string
          default_model?: string
          depends_on_keys?: string[] | null
          description?: string | null
          key: string
          label: string
          output_kind?: string
          output_schema?: Json | null
          produces_context_key?: string | null
          prompt_template?: string | null
          requires_context_keys?: string[]
          schema_version?: number
          sort_order?: number
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
          user_can_trigger?: boolean
        }
        Update: {
          active?: boolean
          auto_runnable?: boolean
          created_at?: string
          default_model?: string
          depends_on_keys?: string[] | null
          description?: string | null
          key?: string
          label?: string
          output_kind?: string
          output_schema?: Json | null
          produces_context_key?: string | null
          prompt_template?: string | null
          requires_context_keys?: string[]
          schema_version?: number
          sort_order?: number
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
          user_can_trigger?: boolean
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      founder_applications: {
        Row: {
          about_startup: string
          about_you: string
          can_attend: boolean
          cohort_id: string | null
          converted_registration_id: string | null
          created_at: string
          email: string
          id: string
          industry: string
          linkedin_url: string | null
          name: string
          phone: string | null
          referral_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stage: string
          status: string
          status_changed_at: string
          updated_at: string
          why_now: string
        }
        Insert: {
          about_startup: string
          about_you: string
          can_attend?: boolean
          cohort_id?: string | null
          converted_registration_id?: string | null
          created_at?: string
          email: string
          id?: string
          industry: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage: string
          status?: string
          status_changed_at?: string
          updated_at?: string
          why_now: string
        }
        Update: {
          about_startup?: string
          about_you?: string
          can_attend?: boolean
          cohort_id?: string | null
          converted_registration_id?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stage?: string
          status?: string
          status_changed_at?: string
          updated_at?: string
          why_now?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          last_activity_at: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          last_activity_at?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          last_activity_at?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_messages: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          direction: string
          id: string
          inquiry_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          direction: string
          id?: string
          inquiry_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          direction?: string
          id?: string
          inquiry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
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
      member_intakes: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          one_line_idea: string
          reviewed_at: string | null
          reviewer_id: string | null
          startup_name: string | null
          startup_type: string
          status: string
          submitted_at: string
          supporting_info: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          one_line_idea: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          startup_name?: string | null
          startup_type: string
          status?: string
          submitted_at?: string
          supporting_info?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          one_line_idea?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          startup_name?: string | null
          startup_type?: string
          status?: string
          submitted_at?: string
          supporting_info?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_via: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          member_status: string
          rejected_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_via?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          member_status?: string
          rejected_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_via?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          member_status?: string
          rejected_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          assigned_tier: string | null
          business_idea: string
          cohort_id: string | null
          created_at: string
          email: string
          id: string
          industry: string
          name: string
          paid_at: string | null
          phone: string | null
          price_paid_cents: number | null
          referral_source: string | null
          stage: string
          status: string
          tier_interest: string | null
          user_id: string | null
        }
        Insert: {
          assigned_tier?: string | null
          business_idea: string
          cohort_id?: string | null
          created_at?: string
          email: string
          id?: string
          industry: string
          name: string
          paid_at?: string | null
          phone?: string | null
          price_paid_cents?: number | null
          referral_source?: string | null
          stage: string
          status?: string
          tier_interest?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_tier?: string | null
          business_idea?: string
          cohort_id?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string
          name?: string
          paid_at?: string | null
          phone?: string | null
          price_paid_cents?: number | null
          referral_source?: string | null
          stage?: string
          status?: string
          tier_interest?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      promote_application: { Args: { _app_id: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reserve_cohort_seat: {
        Args: {
          _cohort_id: string
          _registration_id: string
          _requested_tier: string
        }
        Returns: {
          assigned_tier: string
          price_cents: number
        }[]
      }
      sync_cohort_seat_cache: {
        Args: { _cohort_id: string }
        Returns: undefined
      }
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
