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
      admin_impersonation_log: {
        Row: {
          actor_user_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          target_user_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          target_user_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          target_user_id?: string
        }
        Relationships: []
      }
      ai_capacity_notices: {
        Row: {
          context_label: string | null
          created_at: string
          error_code: string | null
          id: string
          note: string | null
          providers: string[]
          resolved_at: string | null
          snapshot_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          context_label?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          note?: string | null
          providers?: string[]
          resolved_at?: string | null
          snapshot_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          context_label?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          note?: string | null
          providers?: string[]
          resolved_at?: string | null
          snapshot_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_capacity_notices_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "ai_pipeline_steps_deliverable_key_fkey"
            columns: ["deliverable_key"]
            isOneToOne: false
            referencedRelation: "deliverable_types_public"
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
          deep_assessment: string | null
          deep_assessment_generated_at: string | null
          deep_assessment_quality_score: number | null
          deep_assessment_status: string | null
          deliverable_key: string
          hero_image_error: string | null
          hero_image_path: string | null
          hero_image_prompt: string | null
          hero_image_started_at: string | null
          hero_image_status: string | null
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
          deep_assessment?: string | null
          deep_assessment_generated_at?: string | null
          deep_assessment_quality_score?: number | null
          deep_assessment_status?: string | null
          deliverable_key: string
          hero_image_error?: string | null
          hero_image_path?: string | null
          hero_image_prompt?: string | null
          hero_image_started_at?: string | null
          hero_image_status?: string | null
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
          deep_assessment?: string | null
          deep_assessment_generated_at?: string | null
          deep_assessment_quality_score?: number | null
          deep_assessment_status?: string | null
          deliverable_key?: string
          hero_image_error?: string | null
          hero_image_path?: string | null
          hero_image_prompt?: string | null
          hero_image_started_at?: string | null
          hero_image_status?: string | null
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
          {
            foreignKeyName: "attendee_deliverables_deliverable_key_fkey"
            columns: ["deliverable_key"]
            isOneToOne: false
            referencedRelation: "deliverable_types_public"
            referencedColumns: ["key"]
          },
        ]
      }
      attendee_documents: {
        Row: {
          created_at: string
          extracted_at: string | null
          extracted_text: string | null
          extraction_error: string | null
          extraction_started_at: string | null
          id: string
          kind: string
          mime_type: string | null
          original_name: string
          size_bytes: number | null
          snapshot_id: string | null
          source_venture_document_id: string | null
          storage_path: string
          used_in_brief: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_at?: string | null
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_started_at?: string | null
          id?: string
          kind: string
          mime_type?: string | null
          original_name: string
          size_bytes?: number | null
          snapshot_id?: string | null
          source_venture_document_id?: string | null
          storage_path: string
          used_in_brief?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_at?: string | null
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_started_at?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          original_name?: string
          size_bytes?: number | null
          snapshot_id?: string | null
          source_venture_document_id?: string | null
          storage_path?: string
          used_in_brief?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_documents_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_documents_source_venture_document_id_fkey"
            columns: ["source_venture_document_id"]
            isOneToOne: false
            referencedRelation: "venture_documents"
            referencedColumns: ["id"]
          },
        ]
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
      brain_indexing_jobs: {
        Row: {
          created_at: string
          embedded_chunks: number
          error_message: string | null
          failed_chunks: number
          finished_at: string | null
          id: string
          snapshot_id: string | null
          started_at: string | null
          status: string
          total_chunks: number
          total_sources: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedded_chunks?: number
          error_message?: string | null
          failed_chunks?: number
          finished_at?: string | null
          id?: string
          snapshot_id?: string | null
          started_at?: string | null
          status?: string
          total_chunks?: number
          total_sources?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedded_chunks?: number
          error_message?: string | null
          failed_chunks?: number
          finished_at?: string | null
          id?: string
          snapshot_id?: string | null
          started_at?: string | null
          status?: string
          total_chunks?: number
          total_sources?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_indexing_jobs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_materials: {
        Row: {
          byte_size: number | null
          chunk_count: number
          created_at: string
          doc_kind: string | null
          error_message: string | null
          extracted_text: string | null
          id: string
          key_points: Json
          mime_type: string | null
          snapshot_id: string | null
          source_type: string
          source_url: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          byte_size?: number | null
          chunk_count?: number
          created_at?: string
          doc_kind?: string | null
          error_message?: string | null
          extracted_text?: string | null
          id?: string
          key_points?: Json
          mime_type?: string | null
          snapshot_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          byte_size?: number | null
          chunk_count?: number
          created_at?: string
          doc_kind?: string | null
          error_message?: string | null
          extracted_text?: string | null
          id?: string
          key_points?: Json
          mime_type?: string | null
          snapshot_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_materials_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_logo_directions: {
        Row: {
          asset: Json
          attempt_count: number
          completed_at: string | null
          concept: Json
          created_at: string
          current_stage: string
          direction_name: string | null
          error_class: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          lease_expires_at: string | null
          lease_token: string | null
          logo_type: string | null
          preview_path: string | null
          render_error: string | null
          render_history: Json
          render_job_id: string | null
          render_path: string | null
          render_provider: string | null
          render_status: string
          retry_at: string | null
          review_attempts: number
          review_note: string | null
          review_passed: boolean | null
          review_score: Json
          run_id: string
          selected: boolean
          slot: number
          snapshot_id: string
          status: string
          svg_path: string | null
          updated_at: string
          vector_spec: Json
        }
        Insert: {
          asset?: Json
          attempt_count?: number
          completed_at?: string | null
          concept?: Json
          created_at?: string
          current_stage?: string
          direction_name?: string | null
          error_class?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          logo_type?: string | null
          preview_path?: string | null
          render_error?: string | null
          render_history?: Json
          render_job_id?: string | null
          render_path?: string | null
          render_provider?: string | null
          render_status?: string
          retry_at?: string | null
          review_attempts?: number
          review_note?: string | null
          review_passed?: boolean | null
          review_score?: Json
          run_id: string
          selected?: boolean
          slot: number
          snapshot_id: string
          status?: string
          svg_path?: string | null
          updated_at?: string
          vector_spec?: Json
        }
        Update: {
          asset?: Json
          attempt_count?: number
          completed_at?: string | null
          concept?: Json
          created_at?: string
          current_stage?: string
          direction_name?: string | null
          error_class?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_token?: string | null
          logo_type?: string | null
          preview_path?: string | null
          render_error?: string | null
          render_history?: Json
          render_job_id?: string | null
          render_path?: string | null
          render_provider?: string | null
          render_status?: string
          retry_at?: string | null
          review_attempts?: number
          review_note?: string | null
          review_passed?: boolean | null
          review_score?: Json
          run_id?: string
          selected?: boolean
          slot?: number
          snapshot_id?: string
          status?: string
          svg_path?: string | null
          updated_at?: string
          vector_spec?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_logo_directions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "brand_logo_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_logo_directions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_logo_runs: {
        Row: {
          business_profile: Json | null
          canceled_at: string | null
          completed_at: string | null
          completed_count: number
          craft_spec: Json | null
          created_at: string
          heartbeat_at: string | null
          id: string
          last_error: string | null
          reference_images: Json
          requested_count: number
          snapshot_id: string
          status: string
          strategy: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          business_profile?: Json | null
          canceled_at?: string | null
          completed_at?: string | null
          completed_count?: number
          craft_spec?: Json | null
          created_at?: string
          heartbeat_at?: string | null
          id?: string
          last_error?: string | null
          reference_images?: Json
          requested_count?: number
          snapshot_id: string
          status?: string
          strategy?: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          business_profile?: Json | null
          canceled_at?: string | null
          completed_at?: string | null
          completed_count?: number
          craft_spec?: Json | null
          created_at?: string
          heartbeat_at?: string | null
          id?: string
          last_error?: string | null
          reference_images?: Json
          requested_count?: number
          snapshot_id?: string
          status?: string
          strategy?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_logo_runs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_unlock_codes: {
        Row: {
          code_hash: string
          created_at: string
          revoked_at: string | null
          set_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          revoked_at?: string | null
          set_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          revoked_at?: string | null
          set_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bulk_unlock_grants: {
        Row: {
          granted_at: string
          id: string
          revoked_at: string | null
          snapshot_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          revoked_at?: string | null
          snapshot_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          revoked_at?: string | null
          snapshot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_unlock_grants_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
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
      deck_slide_override_history: {
        Row: {
          changed_by: string | null
          created_at: string
          deck_slug: string
          field: string
          id: string
          slide_id: string
          value_image_alt: string | null
          value_image_url: string | null
          value_text: string | null
          version: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          deck_slug: string
          field: string
          id?: string
          slide_id: string
          value_image_alt?: string | null
          value_image_url?: string | null
          value_text?: string | null
          version?: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          deck_slug?: string
          field?: string
          id?: string
          slide_id?: string
          value_image_alt?: string | null
          value_image_url?: string | null
          value_text?: string | null
          version?: number
        }
        Relationships: []
      }
      deck_slide_overrides: {
        Row: {
          created_at: string
          deck_slug: string
          field: string
          id: string
          slide_id: string
          updated_at: string
          updated_by: string | null
          value_image_alt: string | null
          value_image_url: string | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          deck_slug: string
          field: string
          id?: string
          slide_id: string
          updated_at?: string
          updated_by?: string | null
          value_image_alt?: string | null
          value_image_url?: string | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          deck_slug?: string
          field?: string
          id?: string
          slide_id?: string
          updated_at?: string
          updated_by?: string | null
          value_image_alt?: string | null
          value_image_url?: string | null
          value_text?: string | null
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
          bonus: boolean
          context_keys: string[] | null
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
          bonus?: boolean
          context_keys?: string[] | null
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
          bonus?: boolean
          context_keys?: string[] | null
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
      founder_brain_memory: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          kind: string
          metadata: Json
          snapshot_id: string | null
          source_ref: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          kind: string
          metadata?: Json
          snapshot_id?: string | null
          source_ref?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          kind?: string
          metadata?: Json
          snapshot_id?: string | null
          source_ref?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_brain_memory_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_brain_messages: {
        Row: {
          citations: Json
          content: string
          created_at: string
          id: string
          role: string
          snapshot_id: string | null
          user_id: string
        }
        Insert: {
          citations?: Json
          content: string
          created_at?: string
          id?: string
          role: string
          snapshot_id?: string | null
          user_id: string
        }
        Update: {
          citations?: Json
          content?: string
          created_at?: string
          id?: string
          role?: string
          snapshot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_brain_messages_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_brain_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          snapshot_id: string | null
          source: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          snapshot_id?: string | null
          source?: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          snapshot_id?: string | null
          source?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_brain_notes_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_video_wall: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          founder_name: string
          founder_role: string | null
          id: string
          is_live: boolean
          poster_bucket: string | null
          poster_path: string | null
          quote: string | null
          sort_order: number
          startup_name: string | null
          updated_at: string
          video_bucket: string
          video_path: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          founder_name: string
          founder_role?: string | null
          id?: string
          is_live?: boolean
          poster_bucket?: string | null
          poster_path?: string | null
          quote?: string | null
          sort_order?: number
          startup_name?: string | null
          updated_at?: string
          video_bucket?: string
          video_path: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          founder_name?: string
          founder_role?: string | null
          id?: string
          is_live?: boolean
          poster_bucket?: string | null
          poster_path?: string | null
          quote?: string | null
          sort_order?: number
          startup_name?: string | null
          updated_at?: string
          video_bucket?: string
          video_path?: string
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
      legal_setup_progress: {
        Row: {
          articles_control_number: string | null
          articles_filed_at: string | null
          business_name: string | null
          created_at: string
          ein: string | null
          ein_obtained_at: string | null
          entity_choice: string | null
          entity_state: string | null
          entity_state_source: string
          id: string
          name_reserved: boolean
          notes: string | null
          operating_agreement_generated_at: string | null
          operating_agreement_markdown: string | null
          registered_agent_choice: string | null
          registered_agent_name: string | null
          registered_agent_service: string | null
          snapshot_id: string | null
          steps_completed: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          articles_control_number?: string | null
          articles_filed_at?: string | null
          business_name?: string | null
          created_at?: string
          ein?: string | null
          ein_obtained_at?: string | null
          entity_choice?: string | null
          entity_state?: string | null
          entity_state_source?: string
          id?: string
          name_reserved?: boolean
          notes?: string | null
          operating_agreement_generated_at?: string | null
          operating_agreement_markdown?: string | null
          registered_agent_choice?: string | null
          registered_agent_name?: string | null
          registered_agent_service?: string | null
          snapshot_id?: string | null
          steps_completed?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          articles_control_number?: string | null
          articles_filed_at?: string | null
          business_name?: string | null
          created_at?: string
          ein?: string | null
          ein_obtained_at?: string | null
          entity_choice?: string | null
          entity_state?: string | null
          entity_state_source?: string
          id?: string
          name_reserved?: boolean
          notes?: string | null
          operating_agreement_generated_at?: string | null
          operating_agreement_markdown?: string | null
          registered_agent_choice?: string | null
          registered_agent_name?: string | null
          registered_agent_service?: string | null
          snapshot_id?: string | null
          steps_completed?: Json
          updated_at?: string
          user_id?: string
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
      private_session_bookings: {
        Row: {
          amount_cents: number
          business_idea: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          hold_expires_at: string | null
          id: string
          name: string
          notes: string | null
          payment_ref: string | null
          payment_status: string
          phone: string | null
          slot_id: string
          stage: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          business_idea?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          hold_expires_at?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_ref?: string | null
          payment_status?: string
          phone?: string | null
          slot_id: string
          stage?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          business_idea?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          hold_expires_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_ref?: string | null
          payment_status?: string
          phone?: string | null
          slot_id?: string
          stage?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_session_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "private_session_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      private_session_settings: {
        Row: {
          contact_email: string | null
          created_at: string
          hold_minutes: number
          id: number
          location_label: string
          price_cents: number
          updated_at: string
          weeks_ahead: number
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          hold_minutes?: number
          id?: number
          location_label?: string
          price_cents?: number
          updated_at?: string
          weeks_ahead?: number
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          hold_minutes?: number
          id?: number
          location_label?: string
          price_cents?: number
          updated_at?: string
          weeks_ahead?: number
        }
        Relationships: []
      }
      private_session_slots: {
        Row: {
          blocked_reason: string | null
          created_at: string
          end_time: string
          hold_expires_at: string | null
          id: string
          session_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          blocked_reason?: string | null
          created_at?: string
          end_time: string
          hold_expires_at?: string | null
          id?: string
          session_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          blocked_reason?: string | null
          created_at?: string
          end_time?: string
          hold_expires_at?: string | null
          id?: string
          session_date?: string
          start_time?: string
          status?: string
          updated_at?: string
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
          founders_hub_access: boolean
          founders_hub_granted_at: string | null
          founders_hub_granted_by: string | null
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
          founders_hub_access?: boolean
          founders_hub_granted_at?: string | null
          founders_hub_granted_by?: string | null
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
          founders_hub_access?: boolean
          founders_hub_granted_at?: string | null
          founders_hub_granted_by?: string | null
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
      social_brand_assets: {
        Row: {
          aspect_ratio: string | null
          asset_type: string
          color_mood: string | null
          created_at: string
          height: number | null
          id: string
          is_selected: boolean
          model_used: string | null
          platform: string | null
          prompt_used: string | null
          signed_url: string | null
          signed_url_expires_at: string | null
          storage_path: string
          updated_at: string
          user_id: string
          vibe: string | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          asset_type: string
          color_mood?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_selected?: boolean
          model_used?: string | null
          platform?: string | null
          prompt_used?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          storage_path: string
          updated_at?: string
          user_id: string
          vibe?: string | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          asset_type?: string
          color_mood?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_selected?: boolean
          model_used?: string | null
          platform?: string | null
          prompt_used?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          storage_path?: string
          updated_at?: string
          user_id?: string
          vibe?: string | null
          width?: number | null
        }
        Relationships: []
      }
      social_setup_brand: {
        Row: {
          banner_url: string | null
          brand_colors: string[] | null
          color_mood: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          logo_url: string | null
          long_bio: string | null
          short_bio: string | null
          updated_at: string
          user_id: string
          vibe: string | null
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          brand_colors?: string[] | null
          color_mood?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          logo_url?: string | null
          long_bio?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id: string
          vibe?: string | null
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          brand_colors?: string[] | null
          color_mood?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          logo_url?: string | null
          long_bio?: string | null
          short_bio?: string | null
          updated_at?: string
          user_id?: string
          vibe?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      social_setup_brand_package: {
        Row: {
          created_at: string
          identity: Json
          intake_input: Json
          launch_kit: Json
          model_used: string | null
          per_platform_bios: Json
          status: string
          tokens_used: number | null
          updated_at: string
          user_id: string
          visual_direction: Json
        }
        Insert: {
          created_at?: string
          identity?: Json
          intake_input?: Json
          launch_kit?: Json
          model_used?: string | null
          per_platform_bios?: Json
          status?: string
          tokens_used?: number | null
          updated_at?: string
          user_id: string
          visual_direction?: Json
        }
        Update: {
          created_at?: string
          identity?: Json
          intake_input?: Json
          launch_kit?: Json
          model_used?: string | null
          per_platform_bios?: Json
          status?: string
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
          visual_direction?: Json
        }
        Relationships: []
      }
      social_setup_progress: {
        Row: {
          account_created: boolean
          brand_package_approved: boolean
          created_at: string
          creative_ready: boolean
          email_verified: boolean
          id: string
          notes: string | null
          platform: string
          profile_completed: boolean
          skipped: boolean
          updated_at: string
          user_id: string
          zernio_connected: boolean
        }
        Insert: {
          account_created?: boolean
          brand_package_approved?: boolean
          created_at?: string
          creative_ready?: boolean
          email_verified?: boolean
          id?: string
          notes?: string | null
          platform: string
          profile_completed?: boolean
          skipped?: boolean
          updated_at?: string
          user_id: string
          zernio_connected?: boolean
        }
        Update: {
          account_created?: boolean
          brand_package_approved?: boolean
          created_at?: string
          creative_ready?: boolean
          email_verified?: boolean
          id?: string
          notes?: string | null
          platform?: string
          profile_completed?: boolean
          skipped?: boolean
          updated_at?: string
          user_id?: string
          zernio_connected?: boolean
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
      venture_brand_collateral: {
        Row: {
          created_at: string
          height: number | null
          id: string
          kind: string
          meta: Json
          mime_type: string
          name: string
          snapshot_id: string
          storage_path: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          kind: string
          meta?: Json
          mime_type?: string
          name: string
          snapshot_id: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          meta?: Json
          mime_type?: string
          name?: string
          snapshot_id?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      venture_brand_kits: {
        Row: {
          art_direction: Json | null
          contact_details: Json | null
          contact_details_suggested: Json | null
          contact_suggested_at: string | null
          contact_verified_at: string | null
          created_at: string
          dna: Json
          guide_markdown: string | null
          id: string
          ink_safe: Json
          locked_at: string | null
          logos: Json
          moodboard: Json
          palette: Json | null
          snapshot_id: string
          status: string
          step: number
          typography: Json | null
          updated_at: string
          user_id: string
          voice: Json | null
        }
        Insert: {
          art_direction?: Json | null
          contact_details?: Json | null
          contact_details_suggested?: Json | null
          contact_suggested_at?: string | null
          contact_verified_at?: string | null
          created_at?: string
          dna?: Json
          guide_markdown?: string | null
          id?: string
          ink_safe?: Json
          locked_at?: string | null
          logos?: Json
          moodboard?: Json
          palette?: Json | null
          snapshot_id: string
          status?: string
          step?: number
          typography?: Json | null
          updated_at?: string
          user_id: string
          voice?: Json | null
        }
        Update: {
          art_direction?: Json | null
          contact_details?: Json | null
          contact_details_suggested?: Json | null
          contact_suggested_at?: string | null
          contact_verified_at?: string | null
          created_at?: string
          dna?: Json
          guide_markdown?: string | null
          id?: string
          ink_safe?: Json
          locked_at?: string | null
          logos?: Json
          moodboard?: Json
          palette?: Json | null
          snapshot_id?: string
          status?: string
          step?: number
          typography?: Json | null
          updated_at?: string
          user_id?: string
          voice?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_brand_kits_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: true
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_content_ads: {
        Row: {
          art_direction: string
          aspect: string
          brand_kit_locked_at: string | null
          canvas_plan: Json | null
          created_at: string
          height: number | null
          id: string
          is_selected: boolean
          last_feedback: string | null
          last_headline: string | null
          last_logo_size: string | null
          last_regenerated_at: string | null
          model_used: string | null
          post_id: string
          prompt_used: string | null
          qa_notes: Json | null
          qa_status: string | null
          set_qa: Json | null
          signed_url: string | null
          signed_url_expires_at: string | null
          snapshot_id: string
          storage_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          art_direction: string
          aspect: string
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          height?: number | null
          id?: string
          is_selected?: boolean
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          last_regenerated_at?: string | null
          model_used?: string | null
          post_id: string
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          set_qa?: Json | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id: string
          storage_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          art_direction?: string
          aspect?: string
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          height?: number | null
          id?: string
          is_selected?: boolean
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          last_regenerated_at?: string | null
          model_used?: string | null
          post_id?: string
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          set_qa?: Json | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_content_ads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "venture_content_calendar_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_content_ads_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_content_calendar_posts: {
        Row: {
          asset_notes: string | null
          best_time: string | null
          body: string | null
          caption_variants: Json
          created_at: string
          cta: string | null
          day: string | null
          format: string | null
          hashtags: string[] | null
          hook: string | null
          id: string
          parsed_at: string
          pillar: string | null
          platform: string | null
          snapshot_id: string
          source_doc_id: string | null
          stage: string | null
          updated_at: string
          user_id: string
          week: number
        }
        Insert: {
          asset_notes?: string | null
          best_time?: string | null
          body?: string | null
          caption_variants?: Json
          created_at?: string
          cta?: string | null
          day?: string | null
          format?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id: string
          parsed_at?: string
          pillar?: string | null
          platform?: string | null
          snapshot_id: string
          source_doc_id?: string | null
          stage?: string | null
          updated_at?: string
          user_id: string
          week: number
        }
        Update: {
          asset_notes?: string | null
          best_time?: string | null
          body?: string | null
          caption_variants?: Json
          created_at?: string
          cta?: string | null
          day?: string | null
          format?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          parsed_at?: string
          pillar?: string | null
          platform?: string | null
          snapshot_id?: string
          source_doc_id?: string | null
          stage?: string | null
          updated_at?: string
          user_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "venture_content_calendar_posts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_content_progress: {
        Row: {
          art_direction: string | null
          campaign_arc: Json
          campaign_cards: Json
          created_at: string
          current_step: number
          default_aspects: string[] | null
          launch_status: Json | null
          poster_layout: string
          selected_weeks: number[] | null
          snapshot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          art_direction?: string | null
          campaign_arc?: Json
          campaign_cards?: Json
          created_at?: string
          current_step?: number
          default_aspects?: string[] | null
          launch_status?: Json | null
          poster_layout?: string
          selected_weeks?: number[] | null
          snapshot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          art_direction?: string | null
          campaign_arc?: Json
          campaign_cards?: Json
          created_at?: string
          current_step?: number
          default_aspects?: string[] | null
          launch_status?: Json | null
          poster_layout?: string
          selected_weeks?: number[] | null
          snapshot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_content_progress_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: true
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_creative_review_events: {
        Row: {
          actor_kind: string
          actor_name: string | null
          comment: string | null
          created_at: string
          from_state:
            | Database["public"]["Enums"]["creative_review_state"]
            | null
          id: string
          review_id: string
          to_state: Database["public"]["Enums"]["creative_review_state"]
        }
        Insert: {
          actor_kind: string
          actor_name?: string | null
          comment?: string | null
          created_at?: string
          from_state?:
            | Database["public"]["Enums"]["creative_review_state"]
            | null
          id?: string
          review_id: string
          to_state: Database["public"]["Enums"]["creative_review_state"]
        }
        Update: {
          actor_kind?: string
          actor_name?: string | null
          comment?: string | null
          created_at?: string
          from_state?:
            | Database["public"]["Enums"]["creative_review_state"]
            | null
          id?: string
          review_id?: string
          to_state?: Database["public"]["Enums"]["creative_review_state"]
        }
        Relationships: [
          {
            foreignKeyName: "venture_creative_review_events_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "venture_creative_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_creative_reviews: {
        Row: {
          asset_kind: string
          asset_ref: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          label: string | null
          last_comment: string | null
          preview_path: string | null
          published_at: string | null
          snapshot_id: string
          state: Database["public"]["Enums"]["creative_review_state"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          asset_kind: string
          asset_ref: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          label?: string | null
          last_comment?: string | null
          preview_path?: string | null
          published_at?: string | null
          snapshot_id: string
          state?: Database["public"]["Enums"]["creative_review_state"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          asset_kind?: string
          asset_ref?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          label?: string | null
          last_comment?: string | null
          preview_path?: string | null
          published_at?: string | null
          snapshot_id?: string
          state?: Database["public"]["Enums"]["creative_review_state"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_creative_reviews_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_document_types: {
        Row: {
          active: boolean
          category: string
          context_keys: string[] | null
          created_at: string
          dependencies: string[]
          description: string
          estimated_minutes: number
          free_tier: boolean
          icon: string | null
          intake_schema: Json | null
          model_tier: string
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          active?: boolean
          category: string
          context_keys?: string[] | null
          created_at?: string
          dependencies?: string[]
          description: string
          estimated_minutes?: number
          free_tier?: boolean
          icon?: string | null
          intake_schema?: Json | null
          model_tier?: string
          name: string
          sort_order: number
          type: string
        }
        Update: {
          active?: boolean
          category?: string
          context_keys?: string[] | null
          created_at?: string
          dependencies?: string[]
          description?: string
          estimated_minutes?: number
          free_tier?: boolean
          icon?: string | null
          intake_schema?: Json | null
          model_tier?: string
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      venture_documents: {
        Row: {
          blocked_reason: string | null
          content: string | null
          content_version_history: Json
          created_at: string
          deep_assessment: string | null
          deep_assessment_generated_at: string | null
          deep_assessment_quality_score: number | null
          deep_assessment_status: string | null
          document_type: string
          generation_attempts: number
          hero_image_error: string | null
          hero_image_path: string | null
          hero_image_prompt: string | null
          hero_image_started_at: string | null
          hero_image_status: string | null
          id: string
          intake_answers: Json | null
          intake_source: string | null
          last_error: string | null
          metadata: Json
          quality_score: number | null
          snapshot_id: string
          status: Database["public"]["Enums"]["venture_document_status"]
          updated_at: string
          version: number
          word_count: number | null
        }
        Insert: {
          blocked_reason?: string | null
          content?: string | null
          content_version_history?: Json
          created_at?: string
          deep_assessment?: string | null
          deep_assessment_generated_at?: string | null
          deep_assessment_quality_score?: number | null
          deep_assessment_status?: string | null
          document_type: string
          generation_attempts?: number
          hero_image_error?: string | null
          hero_image_path?: string | null
          hero_image_prompt?: string | null
          hero_image_started_at?: string | null
          hero_image_status?: string | null
          id?: string
          intake_answers?: Json | null
          intake_source?: string | null
          last_error?: string | null
          metadata?: Json
          quality_score?: number | null
          snapshot_id: string
          status?: Database["public"]["Enums"]["venture_document_status"]
          updated_at?: string
          version?: number
          word_count?: number | null
        }
        Update: {
          blocked_reason?: string | null
          content?: string | null
          content_version_history?: Json
          created_at?: string
          deep_assessment?: string | null
          deep_assessment_generated_at?: string | null
          deep_assessment_quality_score?: number | null
          deep_assessment_status?: string | null
          document_type?: string
          generation_attempts?: number
          hero_image_error?: string | null
          hero_image_path?: string | null
          hero_image_prompt?: string | null
          hero_image_started_at?: string | null
          hero_image_status?: string | null
          id?: string
          intake_answers?: Json | null
          intake_source?: string | null
          last_error?: string | null
          metadata?: Json
          quality_score?: number | null
          snapshot_id?: string
          status?: Database["public"]["Enums"]["venture_document_status"]
          updated_at?: string
          version?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_documents_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_generation_events: {
        Row: {
          attempt: number
          created_at: string
          document_type: string
          duration_ms: number | null
          error: string | null
          error_class: string | null
          id: string
          job_id: string | null
          mode: string | null
          model: string | null
          outcome: string
          phase: string | null
          snapshot_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          document_type: string
          duration_ms?: number | null
          error?: string | null
          error_class?: string | null
          id?: string
          job_id?: string | null
          mode?: string | null
          model?: string | null
          outcome: string
          phase?: string | null
          snapshot_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          document_type?: string
          duration_ms?: number | null
          error?: string | null
          error_class?: string | null
          id?: string
          job_id?: string | null
          mode?: string | null
          model?: string | null
          outcome?: string
          phase?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_generation_events_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_generation_failures: {
        Row: {
          attempt: number
          created_at: string
          document_type: string
          error: string | null
          id: string
          snapshot_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          document_type: string
          error?: string | null
          id?: string
          snapshot_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          document_type?: string
          error?: string | null
          id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_generation_failures_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_generation_jobs: {
        Row: {
          attempts: number
          cancel_requested: boolean
          circuit_breaker_open: boolean
          completed_at: string | null
          created_at: string
          current_document_type: string | null
          error: string | null
          heartbeat_at: string | null
          id: string
          progress_pct: number
          resume_count: number
          retry_remaining: number
          retry_round: number
          snapshot_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["venture_job_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          cancel_requested?: boolean
          circuit_breaker_open?: boolean
          completed_at?: string | null
          created_at?: string
          current_document_type?: string | null
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          progress_pct?: number
          resume_count?: number
          retry_remaining?: number
          retry_round?: number
          snapshot_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["venture_job_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          cancel_requested?: boolean
          circuit_breaker_open?: boolean
          completed_at?: string | null
          created_at?: string
          current_document_type?: string | null
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          progress_pct?: number
          resume_count?: number
          retry_remaining?: number
          retry_round?: number
          snapshot_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["venture_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_generation_jobs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_logo_sessions: {
        Row: {
          approved_rough: Json | null
          brief: Json
          created_at: string
          id: string
          inspiration: Json
          last_error: string | null
          snapshot_id: string
          status: string
          steps: Json
          traced: boolean
          updated_at: string
          user_id: string
          vector_path: string | null
          vector_svg: string | null
        }
        Insert: {
          approved_rough?: Json | null
          brief?: Json
          created_at?: string
          id?: string
          inspiration?: Json
          last_error?: string | null
          snapshot_id: string
          status?: string
          steps?: Json
          traced?: boolean
          updated_at?: string
          user_id: string
          vector_path?: string | null
          vector_svg?: string | null
        }
        Update: {
          approved_rough?: Json | null
          brief?: Json
          created_at?: string
          id?: string
          inspiration?: Json
          last_error?: string | null
          snapshot_id?: string
          status?: string
          steps?: Json
          traced?: boolean
          updated_at?: string
          user_id?: string
          vector_path?: string | null
          vector_svg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_logo_sessions_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_engagements: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          snapshot_id: string
          start_pref: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          snapshot_id: string
          start_pref?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          snapshot_id?: string
          start_pref?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_engagements_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_notes: {
        Row: {
          author_kind: string
          author_name: string | null
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_kind?: string
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_kind?: string
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "venture_ops_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_platform_requests: {
        Row: {
          audience: string | null
          contact: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          requested_by: string | null
          snapshot_id: string
          status: string
        }
        Insert: {
          audience?: string | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          requested_by?: string | null
          snapshot_id: string
          status?: string
        }
        Update: {
          audience?: string | null
          contact?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          requested_by?: string | null
          snapshot_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_platform_requests_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_state: {
        Row: {
          blended_rate_cents: number
          client_can_edit: boolean
          created_at: string
          delivery_mode: string | null
          delivery_mode_set_at: string | null
          delivery_mode_set_by: string | null
          intro_dismissed: boolean
          runway_started_at: string
          seeded_version: number
          snapshot_id: string
          updated_at: string
        }
        Insert: {
          blended_rate_cents?: number
          client_can_edit?: boolean
          created_at?: string
          delivery_mode?: string | null
          delivery_mode_set_at?: string | null
          delivery_mode_set_by?: string | null
          intro_dismissed?: boolean
          runway_started_at?: string
          seeded_version?: number
          snapshot_id: string
          updated_at?: string
        }
        Update: {
          blended_rate_cents?: number
          client_can_edit?: boolean
          created_at?: string
          delivery_mode?: string | null
          delivery_mode_set_at?: string | null
          delivery_mode_set_by?: string | null
          intro_dismissed?: boolean
          runway_started_at?: string
          seeded_version?: number
          snapshot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_state_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: true
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_tasks: {
        Row: {
          asset_keys: string[]
          assignee_name: string | null
          assignee_user_id: string | null
          category: string
          client_review_state: string
          committed_at: string | null
          completed_at: string | null
          created_at: string
          criticality: string
          day: number
          delivered_at: string | null
          delivery_status: string
          done_when: string
          due_at: string | null
          how: string[]
          id: string
          minutes: number | null
          needs: string[]
          owner_kind: string
          owner_name: string | null
          phase: number
          proof_url: string | null
          snapshot_id: string
          snoozed_until: string | null
          sort_order: number
          status: string
          task_key: string
          title: string
          unlocks: string[]
          updated_at: string
          why: string
          work_product_label: string | null
          work_product_url: string | null
        }
        Insert: {
          asset_keys?: string[]
          assignee_name?: string | null
          assignee_user_id?: string | null
          category?: string
          client_review_state?: string
          committed_at?: string | null
          completed_at?: string | null
          created_at?: string
          criticality?: string
          day?: number
          delivered_at?: string | null
          delivery_status?: string
          done_when?: string
          due_at?: string | null
          how?: string[]
          id?: string
          minutes?: number | null
          needs?: string[]
          owner_kind?: string
          owner_name?: string | null
          phase?: number
          proof_url?: string | null
          snapshot_id: string
          snoozed_until?: string | null
          sort_order?: number
          status?: string
          task_key: string
          title: string
          unlocks?: string[]
          updated_at?: string
          why?: string
          work_product_label?: string | null
          work_product_url?: string | null
        }
        Update: {
          asset_keys?: string[]
          assignee_name?: string | null
          assignee_user_id?: string | null
          category?: string
          client_review_state?: string
          committed_at?: string | null
          completed_at?: string | null
          created_at?: string
          criticality?: string
          day?: number
          delivered_at?: string | null
          delivery_status?: string
          done_when?: string
          due_at?: string | null
          how?: string[]
          id?: string
          minutes?: number | null
          needs?: string[]
          owner_kind?: string
          owner_name?: string | null
          phase?: number
          proof_url?: string | null
          snapshot_id?: string
          snoozed_until?: string | null
          sort_order?: number
          status?: string
          task_key?: string
          title?: string
          unlocks?: string[]
          updated_at?: string
          why?: string
          work_product_label?: string | null
          work_product_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_tasks_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_ops_updates: {
        Row: {
          author_kind: string
          author_name: string | null
          body: string
          created_at: string
          id: string
          snapshot_id: string
          task_id: string | null
          updated_at: string
          visible_to_client: boolean
        }
        Insert: {
          author_kind?: string
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          snapshot_id: string
          task_id?: string | null
          updated_at?: string
          visible_to_client?: boolean
        }
        Update: {
          author_kind?: string
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          snapshot_id?: string
          task_id?: string | null
          updated_at?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "venture_ops_updates_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_ops_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "venture_ops_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_shares: {
        Row: {
          chat_enabled: boolean
          created_at: string
          excluded_keys: string[]
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          map_enabled: boolean
          password_hash: string | null
          revoked_at: string | null
          slug: string | null
          snapshot_id: string
          title: string | null
          token: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          chat_enabled?: boolean
          created_at?: string
          excluded_keys?: string[]
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          map_enabled?: boolean
          password_hash?: string | null
          revoked_at?: string | null
          slug?: string | null
          snapshot_id: string
          title?: string | null
          token: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          chat_enabled?: boolean
          created_at?: string
          excluded_keys?: string[]
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          map_enabled?: boolean
          password_hash?: string | null
          revoked_at?: string | null
          slug?: string | null
          snapshot_id?: string
          title?: string | null
          token?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "venture_shares_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_snapshots: {
        Row: {
          brand_tokens: Json | null
          business_concept: string | null
          city: string | null
          company_name: string | null
          competitor_data: Json | null
          concept_iterations: Json
          concept_locked_at: string | null
          concept_status: string
          concept_summary: string | null
          country: string | null
          created_at: string
          differentiation_statement: string | null
          enrichment_progress: Json | null
          epiphany_runs: Json
          executive_metrics: Json | null
          executive_summary: string | null
          executive_summary_at: string | null
          extracted_data: Json | null
          founder_email: string | null
          founder_name: string | null
          founder_phone: string | null
          id: string
          industry: string | null
          is_favorite: boolean
          market_research: string | null
          market_scope: string | null
          overview_blurbs: Json | null
          region: string | null
          research_artifacts: Json | null
          research_brief: Json | null
          roadmap_content: string | null
          roadmap_coverage: Json | null
          roadmap_generated_at: string | null
          roadmap_quality_score: number | null
          roadmap_status: string | null
          roadmap_structure_version: number | null
          roadmap_word_count: number | null
          saved_enhancements: Json
          scene_brief: Json | null
          scene_brief_at: string | null
          scraped_content: string | null
          snapshot_brain: Json | null
          snapshot_brain_dirty: boolean
          snapshot_brain_updated_at: string | null
          source_materials: Json | null
          sourcing_profile: Json | null
          status: Database["public"]["Enums"]["venture_snapshot_status"]
          sub_industry: string | null
          track: string | null
          updated_at: string
          user_id: string
          value_proposition: string | null
          venture_timeline: Json | null
          venture_timeline_at: string | null
          venture_timeline_scenario: Json | null
          website_url: string | null
        }
        Insert: {
          brand_tokens?: Json | null
          business_concept?: string | null
          city?: string | null
          company_name?: string | null
          competitor_data?: Json | null
          concept_iterations?: Json
          concept_locked_at?: string | null
          concept_status?: string
          concept_summary?: string | null
          country?: string | null
          created_at?: string
          differentiation_statement?: string | null
          enrichment_progress?: Json | null
          epiphany_runs?: Json
          executive_metrics?: Json | null
          executive_summary?: string | null
          executive_summary_at?: string | null
          extracted_data?: Json | null
          founder_email?: string | null
          founder_name?: string | null
          founder_phone?: string | null
          id?: string
          industry?: string | null
          is_favorite?: boolean
          market_research?: string | null
          market_scope?: string | null
          overview_blurbs?: Json | null
          region?: string | null
          research_artifacts?: Json | null
          research_brief?: Json | null
          roadmap_content?: string | null
          roadmap_coverage?: Json | null
          roadmap_generated_at?: string | null
          roadmap_quality_score?: number | null
          roadmap_status?: string | null
          roadmap_structure_version?: number | null
          roadmap_word_count?: number | null
          saved_enhancements?: Json
          scene_brief?: Json | null
          scene_brief_at?: string | null
          scraped_content?: string | null
          snapshot_brain?: Json | null
          snapshot_brain_dirty?: boolean
          snapshot_brain_updated_at?: string | null
          source_materials?: Json | null
          sourcing_profile?: Json | null
          status?: Database["public"]["Enums"]["venture_snapshot_status"]
          sub_industry?: string | null
          track?: string | null
          updated_at?: string
          user_id: string
          value_proposition?: string | null
          venture_timeline?: Json | null
          venture_timeline_at?: string | null
          venture_timeline_scenario?: Json | null
          website_url?: string | null
        }
        Update: {
          brand_tokens?: Json | null
          business_concept?: string | null
          city?: string | null
          company_name?: string | null
          competitor_data?: Json | null
          concept_iterations?: Json
          concept_locked_at?: string | null
          concept_status?: string
          concept_summary?: string | null
          country?: string | null
          created_at?: string
          differentiation_statement?: string | null
          enrichment_progress?: Json | null
          epiphany_runs?: Json
          executive_metrics?: Json | null
          executive_summary?: string | null
          executive_summary_at?: string | null
          extracted_data?: Json | null
          founder_email?: string | null
          founder_name?: string | null
          founder_phone?: string | null
          id?: string
          industry?: string | null
          is_favorite?: boolean
          market_research?: string | null
          market_scope?: string | null
          overview_blurbs?: Json | null
          region?: string | null
          research_artifacts?: Json | null
          research_brief?: Json | null
          roadmap_content?: string | null
          roadmap_coverage?: Json | null
          roadmap_generated_at?: string | null
          roadmap_quality_score?: number | null
          roadmap_status?: string | null
          roadmap_structure_version?: number | null
          roadmap_word_count?: number | null
          saved_enhancements?: Json
          scene_brief?: Json | null
          scene_brief_at?: string | null
          scraped_content?: string | null
          snapshot_brain?: Json | null
          snapshot_brain_dirty?: boolean
          snapshot_brain_updated_at?: string | null
          source_materials?: Json | null
          sourcing_profile?: Json | null
          status?: Database["public"]["Enums"]["venture_snapshot_status"]
          sub_industry?: string | null
          track?: string | null
          updated_at?: string
          user_id?: string
          value_proposition?: string | null
          venture_timeline?: Json | null
          venture_timeline_at?: string | null
          venture_timeline_scenario?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      venture_social_assets: {
        Row: {
          art_direction: string
          asset_kind: string
          brand_kit_locked_at: string | null
          canvas_plan: Json | null
          created_at: string
          height: number
          id: string
          is_selected: boolean
          last_feedback: string | null
          last_headline: string | null
          last_logo_size: string | null
          last_regenerated_at: string | null
          model_used: string | null
          platform: string
          prompt_used: string | null
          qa_notes: Json | null
          qa_status: string | null
          signed_url: string | null
          signed_url_expires_at: string | null
          snapshot_id: string
          storage_path: string
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          art_direction: string
          asset_kind: string
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          height: number
          id?: string
          is_selected?: boolean
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          last_regenerated_at?: string | null
          model_used?: string | null
          platform: string
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id: string
          storage_path: string
          updated_at?: string
          user_id: string
          width: number
        }
        Update: {
          art_direction?: string
          asset_kind?: string
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          height?: number
          id?: string
          is_selected?: boolean
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          last_regenerated_at?: string | null
          model_used?: string | null
          platform?: string
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "venture_social_assets_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_social_progress: {
        Row: {
          art_direction: string | null
          created_at: string
          current_step: number
          goals: Json
          launch_status: Json
          selected_platforms: string[]
          snapshot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          art_direction?: string | null
          created_at?: string
          current_step?: number
          goals?: Json
          launch_status?: Json
          selected_platforms?: string[]
          snapshot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          art_direction?: string | null
          created_at?: string
          current_step?: number
          goals?: Json
          launch_status?: Json
          selected_platforms?: string[]
          snapshot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_social_progress_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: true
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_style_previews: {
        Row: {
          brand_kit_locked_at: string | null
          canvas_plan: Json | null
          created_at: string
          direction: string
          id: string
          last_feedback: string | null
          last_headline: string | null
          last_logo_size: string | null
          model_used: string | null
          prompt_used: string | null
          qa_notes: Json | null
          qa_status: string | null
          signed_url: string | null
          signed_url_expires_at: string | null
          snapshot_id: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          direction: string
          id?: string
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          model_used?: string | null
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_kit_locked_at?: string | null
          canvas_plan?: Json | null
          created_at?: string
          direction?: string
          id?: string
          last_feedback?: string | null
          last_headline?: string | null
          last_logo_size?: string | null
          model_used?: string | null
          prompt_used?: string | null
          qa_notes?: Json | null
          qa_status?: string | null
          signed_url?: string | null
          signed_url_expires_at?: string | null
          snapshot_id?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venture_tool_stack_status: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          snapshot_id: string
          status: string
          tool_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          snapshot_id: string
          status?: string
          tool_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          snapshot_id?: string
          status?: string
          tool_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_tool_stack_status_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "venture_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonials: {
        Row: {
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          founder_name: string
          founder_role: string | null
          id: string
          poster_bucket: string | null
          poster_path: string | null
          quote: string | null
          sort_order: number
          startup_name: string | null
          status: string
          updated_at: string
          video_bucket: string
          video_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          founder_name: string
          founder_role?: string | null
          id?: string
          poster_bucket?: string | null
          poster_path?: string | null
          quote?: string | null
          sort_order?: number
          startup_name?: string | null
          status?: string
          updated_at?: string
          video_bucket?: string
          video_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          founder_name?: string
          founder_role?: string | null
          id?: string
          poster_bucket?: string | null
          poster_path?: string | null
          quote?: string | null
          sort_order?: number
          startup_name?: string | null
          status?: string
          updated_at?: string
          video_bucket?: string
          video_path?: string
        }
        Relationships: []
      }
      workshop_audit_intakes: {
        Row: {
          answers: Json
          created_at: string
          file_urls: string[]
          id: string
          session_start: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
          workshop_slug: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          file_urls?: string[]
          id?: string
          session_start?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          workshop_slug: string
        }
        Update: {
          answers?: Json
          created_at?: string
          file_urls?: string[]
          id?: string
          session_start?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          workshop_slug?: string
        }
        Relationships: []
      }
      workshop_audits: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          created_at: string
          generated_at: string | null
          id: string
          intake_id: string | null
          model: string | null
          overall_grade: string | null
          prescribed_outcome: string | null
          report: Json | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
          workshop_slug: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          intake_id?: string | null
          model?: string | null
          overall_grade?: string | null
          prescribed_outcome?: string | null
          report?: Json | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workshop_slug: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          intake_id?: string | null
          model?: string | null
          overall_grade?: string | null
          prescribed_outcome?: string | null
          report?: Json | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workshop_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_audits_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "workshop_audit_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_hero_images: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          model: string | null
          pain_id: string
          prompt: string
          screens: boolean
          source: string
          status: string
          storage_path: string
          subject: string | null
          workshop_slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          model?: string | null
          pain_id: string
          prompt: string
          screens?: boolean
          source?: string
          status?: string
          storage_path: string
          subject?: string | null
          workshop_slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          model?: string | null
          pain_id?: string
          prompt?: string
          screens?: boolean
          source?: string
          status?: string
          storage_path?: string
          subject?: string | null
          workshop_slug?: string
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
      workshop_waitlist: {
        Row: {
          created_at: string
          email: string
          format: string
          id: string
          workshop_slug: string
        }
        Insert: {
          created_at?: string
          email: string
          format?: string
          id?: string
          workshop_slug: string
        }
        Update: {
          created_at?: string
          email?: string
          format?: string
          id?: string
          workshop_slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      deliverable_types_public: {
        Row: {
          active: boolean | null
          auto_runnable: boolean | null
          created_at: string | null
          default_model: string | null
          depends_on_keys: string[] | null
          description: string | null
          key: string | null
          label: string | null
          output_kind: string | null
          produces_context_key: string | null
          requires_context_keys: string[] | null
          schema_version: number | null
          sort_order: number | null
          stage_label: string | null
          stage_n: number | null
          tier_required: string | null
          user_can_trigger: boolean | null
        }
        Insert: {
          active?: boolean | null
          auto_runnable?: boolean | null
          created_at?: string | null
          default_model?: string | null
          depends_on_keys?: string[] | null
          description?: string | null
          key?: string | null
          label?: string | null
          output_kind?: string | null
          produces_context_key?: string | null
          requires_context_keys?: string[] | null
          schema_version?: number | null
          sort_order?: number | null
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
          user_can_trigger?: boolean | null
        }
        Update: {
          active?: boolean | null
          auto_runnable?: boolean | null
          created_at?: string | null
          default_model?: string | null
          depends_on_keys?: string[] | null
          description?: string | null
          key?: string | null
          label?: string | null
          output_kind?: string | null
          produces_context_key?: string | null
          requires_context_keys?: string[] | null
          schema_version?: number | null
          sort_order?: number | null
          stage_label?: string | null
          stage_n?: number | null
          tier_required?: string | null
          user_can_trigger?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_clear_bulk_unlock_default: { Args: never; Returns: undefined }
      admin_clear_user_bulk_unlock: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_confirm_private_session_booking: {
        Args: { _booking_id: string; _payment_ref: string }
        Returns: undefined
      }
      admin_release_private_session_booking: {
        Args: { _booking_id: string }
        Returns: undefined
      }
      admin_set_bulk_unlock_default: {
        Args: { _code: string }
        Returns: undefined
      }
      admin_set_private_session_slot_status: {
        Args: { _reason: string; _slot_id: string; _status: string }
        Returns: undefined
      }
      admin_set_user_bulk_unlock: {
        Args: { _code: string; _user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _action: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      append_brand_logo: {
        Args: { p_logo: Json; p_max?: number; p_snapshot_id: string }
        Returns: Json
      }
      confirm_private_session_booking: {
        Args: { _booking_id: string; _payment_ref: string }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      end_impersonation: { Args: { _id: string }; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_private_session_slots: { Args: never; Returns: undefined }
      get_upcoming_private_session_slots: {
        Args: never
        Returns: {
          end_time: string
          id: string
          session_date: string
          start_time: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_deliverable_types_public: {
        Args: never
        Returns: {
          active: boolean
          auto_runnable: boolean
          bonus: boolean
          created_at: string
          default_model: string
          depends_on_keys: string[]
          description: string
          key: string
          label: string
          output_kind: string
          produces_context_key: string
          requires_context_keys: string[]
          schema_version: number
          sort_order: number
          stage_label: string
          stage_n: number
          tier_required: string
          user_can_trigger: boolean
        }[]
      }
      match_founder_brain_memory:
        | {
            Args: {
              _user_id: string
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              kind: string
              similarity: number
              source_ref: string
              title: string
            }[]
          }
        | {
            Args: {
              _snapshot_id?: string
              _user_id: string
              match_count?: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              kind: string
              similarity: number
              source_ref: string
              title: string
            }[]
          }
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
      publish_brand_logo_direction: {
        Args: {
          p_asset: Json
          p_direction_id: string
          p_preview_path: string
          p_review_note: string
          p_review_passed: boolean
          p_review_score: Json
          p_run_id: string
          p_run_version: number
          p_svg_path: string
        }
        Returns: Json
      }
      purge_founder_generated_assets:
        | { Args: { _user_id: string }; Returns: Json }
        | { Args: { _snapshot_id?: string; _user_id: string }; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      release_expired_private_session_holds: { Args: never; Returns: number }
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
      reserve_private_session_slot: {
        Args: {
          _business_idea: string
          _email: string
          _name: string
          _notes: string
          _phone: string
          _slot_id: string
          _stage: string
        }
        Returns: {
          amount_cents: number
          booking_id: string
          hold_expires_at: string
        }[]
      }
      reset_founder_workspace: { Args: { _user_id: string }; Returns: string[] }
      start_impersonation: { Args: { _target: string }; Returns: string }
      sweep_stuck_generations: { Args: never; Returns: undefined }
      sync_cohort_seat_cache: {
        Args: { _cohort_id: string }
        Returns: undefined
      }
      venture_share_slug_available: {
        Args: { _slug: string }
        Returns: boolean
      }
      verify_bulk_unlock: {
        Args: { _code: string; _snapshot_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
      creative_review_state:
        | "draft"
        | "in_review"
        | "changes_requested"
        | "approved"
        | "ready_to_publish"
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
      venture_document_status:
        | "pending"
        | "generating"
        | "complete"
        | "failed"
        | "not_applicable"
      venture_job_status:
        | "queued"
        | "running"
        | "paused"
        | "completed"
        | "failed"
        | "canceled"
        | "completed_with_blockers"
      venture_snapshot_status:
        | "input"
        | "enriching"
        | "review"
        | "generating"
        | "complete"
        | "archived"
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
      creative_review_state: [
        "draft",
        "in_review",
        "changes_requested",
        "approved",
        "ready_to_publish",
      ],
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
      venture_document_status: [
        "pending",
        "generating",
        "complete",
        "failed",
        "not_applicable",
      ],
      venture_job_status: [
        "queued",
        "running",
        "paused",
        "completed",
        "failed",
        "canceled",
        "completed_with_blockers",
      ],
      venture_snapshot_status: [
        "input",
        "enriching",
        "review",
        "generating",
        "complete",
        "archived",
      ],
    },
  },
} as const
