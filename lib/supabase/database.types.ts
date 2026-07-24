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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_edit_log: {
        Row: {
          client_id: string
          created_at: string
          edited_by: string | null
          field_name: string
          id: number
          new_value: Json | null
          old_value: Json | null
          source: string
        }
        Insert: {
          client_id: string
          created_at?: string
          edited_by?: string | null
          field_name: string
          id?: number
          new_value?: Json | null
          old_value?: Json | null
          source?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          edited_by?: string | null
          field_name?: string
          id?: number
          new_value?: Json | null
          old_value?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_edit_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_edit_log_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_phone_index: {
        Row: {
          client_id: string
          phone: string
        }
        Insert: {
          client_id: string
          phone: string
        }
        Update: {
          client_id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_phone_index_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_timeline: {
        Row: {
          bought_categories: string[] | null
          branch_id: string
          buy_status: Database["public"]["Enums"]["buy_status"] | null
          client_id: string
          created_at: string
          crm_name: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          order_categories: string[] | null
          product_requirement: string | null
          reference_number: string | null
          remark: string | null
          salesperson_id: string | null
          seen_categories: string[] | null
        }
        Insert: {
          bought_categories?: string[] | null
          branch_id: string
          buy_status?: Database["public"]["Enums"]["buy_status"] | null
          client_id: string
          created_at?: string
          crm_name?: string | null
          event_date: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          order_categories?: string[] | null
          product_requirement?: string | null
          reference_number?: string | null
          remark?: string | null
          salesperson_id?: string | null
          seen_categories?: string[] | null
        }
        Update: {
          bought_categories?: string[] | null
          branch_id?: string
          buy_status?: Database["public"]["Enums"]["buy_status"] | null
          client_id?: string
          created_at?: string
          crm_name?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          order_categories?: string[] | null
          product_requirement?: string | null
          reference_number?: string | null
          remark?: string | null
          salesperson_id?: string | null
          seen_categories?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_timeline_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          anniversary: string | null
          beverage: string | null
          billing_phone: string | null
          city: string | null
          city_other: string | null
          client_id: string
          client_potential_category: string | null
          community: string | null
          community_other: string | null
          country: string | null
          dob: string | null
          first_visit_date: string | null
          gender: string | null
          gift_history: Json | null
          google_review_status: string | null
          high_potential_reason: string | null
          instagram_status: string | null
          last_bought_categories: string[] | null
          last_branch_id: string | null
          last_buy_status: Database["public"]["Enums"]["buy_status"] | null
          last_crm_name: string | null
          last_order_categories: string[] | null
          last_product_requirement: string | null
          last_remark: string | null
          last_salesperson_id: string | null
          last_seen_categories: string[] | null
          last_visit_date: string | null
          next_visit_date: string | null
          other_known_phones: string[] | null
          other_names: string[] | null
          pincode: string | null
          primary_name: string
          primary_phone: string
          profile_updated_at: string
          profile_updated_by: string | null
          referral_status: string | null
          secondary_phone: string | null
          snack: string | null
          state: string | null
          sugar: string | null
          testimonial_status: string | null
          total_non_purchase_visits: number
          total_order_visits: number
          total_purchase_visits: number
          total_repair_visits: number
          total_visits: number
        }
        Insert: {
          address?: string | null
          anniversary?: string | null
          beverage?: string | null
          billing_phone?: string | null
          city?: string | null
          city_other?: string | null
          client_id?: string
          client_potential_category?: string | null
          community?: string | null
          community_other?: string | null
          country?: string | null
          dob?: string | null
          first_visit_date?: string | null
          gender?: string | null
          gift_history?: Json | null
          google_review_status?: string | null
          high_potential_reason?: string | null
          instagram_status?: string | null
          last_bought_categories?: string[] | null
          last_branch_id?: string | null
          last_buy_status?: Database["public"]["Enums"]["buy_status"] | null
          last_crm_name?: string | null
          last_order_categories?: string[] | null
          last_product_requirement?: string | null
          last_remark?: string | null
          last_salesperson_id?: string | null
          last_seen_categories?: string[] | null
          last_visit_date?: string | null
          next_visit_date?: string | null
          other_known_phones?: string[] | null
          other_names?: string[] | null
          pincode?: string | null
          primary_name: string
          primary_phone: string
          profile_updated_at?: string
          profile_updated_by?: string | null
          referral_status?: string | null
          secondary_phone?: string | null
          snack?: string | null
          state?: string | null
          sugar?: string | null
          testimonial_status?: string | null
          total_non_purchase_visits?: number
          total_order_visits?: number
          total_purchase_visits?: number
          total_repair_visits?: number
          total_visits?: number
        }
        Update: {
          address?: string | null
          anniversary?: string | null
          beverage?: string | null
          billing_phone?: string | null
          city?: string | null
          city_other?: string | null
          client_id?: string
          client_potential_category?: string | null
          community?: string | null
          community_other?: string | null
          country?: string | null
          dob?: string | null
          first_visit_date?: string | null
          gender?: string | null
          gift_history?: Json | null
          google_review_status?: string | null
          high_potential_reason?: string | null
          instagram_status?: string | null
          last_bought_categories?: string[] | null
          last_branch_id?: string | null
          last_buy_status?: Database["public"]["Enums"]["buy_status"] | null
          last_crm_name?: string | null
          last_order_categories?: string[] | null
          last_product_requirement?: string | null
          last_remark?: string | null
          last_salesperson_id?: string | null
          last_seen_categories?: string[] | null
          last_visit_date?: string | null
          next_visit_date?: string | null
          other_known_phones?: string[] | null
          other_names?: string[] | null
          pincode?: string | null
          primary_name?: string
          primary_phone?: string
          profile_updated_at?: string
          profile_updated_by?: string | null
          referral_status?: string | null
          secondary_phone?: string | null
          snack?: string | null
          state?: string | null
          sugar?: string | null
          testimonial_status?: string | null
          total_non_purchase_visits?: number
          total_order_visits?: number
          total_purchase_visits?: number
          total_repair_visits?: number
          total_visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_last_branch_id_fkey"
            columns: ["last_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_last_salesperson_id_fkey"
            columns: ["last_salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_profile_updated_by_fkey"
            columns: ["profile_updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_allocation: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          crm_name: string
          id: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          crm_name: string
          id?: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          crm_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_allocation_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_daily_availability: {
        Row: {
          branch_id: string
          created_at: string
          crm_name: string
          date: string
          id: string
          is_available: boolean
        }
        Insert: {
          branch_id: string
          created_at?: string
          crm_name: string
          date: string
          id?: string
          is_available?: boolean
        }
        Update: {
          branch_id?: string
          created_at?: string
          crm_name?: string
          date?: string
          id?: string
          is_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "crm_daily_availability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string
          client_timeline_id: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          client_timeline_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          client_timeline_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "documents_client_timeline_id_client_id_fkey"
            columns: ["client_timeline_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_timeline"
            referencedColumns: ["id", "client_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_queue: {
        Row: {
          assigned_crm_name: string | null
          branch_id: string
          client_id: string | null
          client_name: string
          created_at: string
          full_form_timestamp: string | null
          id: string
          mobile: string
          remark: string | null
          status: string
          token: string
        }
        Insert: {
          assigned_crm_name?: string | null
          branch_id: string
          client_id?: string | null
          client_name: string
          created_at?: string
          full_form_timestamp?: string | null
          id?: string
          mobile: string
          remark?: string | null
          status?: string
          token: string
        }
        Update: {
          assigned_crm_name?: string | null
          branch_id?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          full_form_timestamp?: string | null
          id?: string
          mobile?: string
          remark?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_queue_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      lookup_beverages: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_cities: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_communities: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_gifts: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_not_bought_reasons: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_product_categories: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      lookup_snacks: {
        Row: {
          active: boolean
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
        }
        Relationships: []
      }
      not_bought_followups: {
        Row: {
          branch_id: string | null
          call_response: string | null
          client_id: string
          created_at: string
          entered_by: string
          id: string
          next_followup_date: string | null
          reference_number: string | null
          remark: string | null
          source_timeline_id: string | null
          source_visit_form_id: string | null
          status: string
        }
        Insert: {
          branch_id?: string | null
          call_response?: string | null
          client_id: string
          created_at?: string
          entered_by: string
          id?: string
          next_followup_date?: string | null
          reference_number?: string | null
          remark?: string | null
          source_timeline_id?: string | null
          source_visit_form_id?: string | null
          status: string
        }
        Update: {
          branch_id?: string | null
          call_response?: string | null
          client_id?: string
          created_at?: string
          entered_by?: string
          id?: string
          next_followup_date?: string | null
          reference_number?: string | null
          remark?: string | null
          source_timeline_id?: string | null
          source_visit_form_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "not_bought_followups_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "not_bought_followups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "not_bought_followups_source_timeline_id_fkey"
            columns: ["source_timeline_id"]
            isOneToOne: false
            referencedRelation: "client_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "not_bought_followups_source_visit_form_id_fkey"
            columns: ["source_visit_form_id"]
            isOneToOne: false
            referencedRelation: "visit_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "not_bought_followups_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      not_bought_history: {
        Row: {
          call_response: string | null
          created_at: string
          followup_id: string
          id: string
          previous_status: string | null
          remark: string | null
          status: string
          updated_by: string | null
        }
        Insert: {
          call_response?: string | null
          created_at?: string
          followup_id: string
          id?: string
          previous_status?: string | null
          remark?: string | null
          status: string
          updated_by?: string | null
        }
        Update: {
          call_response?: string | null
          created_at?: string
          followup_id?: string
          id?: string
          previous_status?: string | null
          remark?: string | null
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "not_bought_history_followup_id_fkey"
            columns: ["followup_id"]
            isOneToOne: false
            referencedRelation: "not_bought_followups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "not_bought_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_calling: {
        Row: {
          created_at: string
          id: string
          next_followup_date: string | null
          referral_id: string
          remark: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_followup_date?: string | null
          referral_id: string
          remark?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          next_followup_date?: string | null
          referral_id?: string
          remark?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_calling_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          crm_name: string | null
          given_by_client_id: string
          id: string
          referral_name: string
          referral_number: string
          salesperson_id: string
        }
        Insert: {
          created_at?: string
          crm_name?: string | null
          given_by_client_id: string
          id?: string
          referral_name: string
          referral_number: string
          salesperson_id: string
        }
        Update: {
          created_at?: string
          crm_name?: string | null
          given_by_client_id?: string
          id?: string
          referral_name?: string
          referral_number?: string
          salesperson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_given_by_client_id_fkey"
            columns: ["given_by_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "referrals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean
          branch_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_forms: {
        Row: {
          additional_fields: Json
          bridal_or_non_bridal: string | null
          category_details: Json
          client_timeline_id: string
          communication_preference: string | null
          companions: Json
          created_at: string
          google_review_asked: boolean | null
          google_review_no_reason: string | null
          google_review_proof_url: string | null
          id: string
          instagram_asked: boolean | null
          instagram_no_reason: string | null
          instagram_proof_url: string | null
          occupation: string | null
          occupation_other: string | null
          referrals_asked: boolean | null
          referrals_no_reason: string | null
          referrals_proof_url: string | null
          testimonial_asked: boolean | null
          testimonial_no_reason: string | null
          testimonial_proof_url: string | null
          thank_you_note_asked: boolean | null
          thank_you_note_no_reason: string | null
          thank_you_note_proof_url: string | null
          updated_at: string
          wedding_month: number | null
          wedding_year: number | null
        }
        Insert: {
          additional_fields?: Json
          bridal_or_non_bridal?: string | null
          category_details?: Json
          client_timeline_id: string
          communication_preference?: string | null
          companions?: Json
          created_at?: string
          google_review_asked?: boolean | null
          google_review_no_reason?: string | null
          google_review_proof_url?: string | null
          id?: string
          instagram_asked?: boolean | null
          instagram_no_reason?: string | null
          instagram_proof_url?: string | null
          occupation?: string | null
          occupation_other?: string | null
          referrals_asked?: boolean | null
          referrals_no_reason?: string | null
          referrals_proof_url?: string | null
          testimonial_asked?: boolean | null
          testimonial_no_reason?: string | null
          testimonial_proof_url?: string | null
          thank_you_note_asked?: boolean | null
          thank_you_note_no_reason?: string | null
          thank_you_note_proof_url?: string | null
          updated_at?: string
          wedding_month?: number | null
          wedding_year?: number | null
        }
        Update: {
          additional_fields?: Json
          bridal_or_non_bridal?: string | null
          category_details?: Json
          client_timeline_id?: string
          communication_preference?: string | null
          companions?: Json
          created_at?: string
          google_review_asked?: boolean | null
          google_review_no_reason?: string | null
          google_review_proof_url?: string | null
          id?: string
          instagram_asked?: boolean | null
          instagram_no_reason?: string | null
          instagram_proof_url?: string | null
          occupation?: string | null
          occupation_other?: string | null
          referrals_asked?: boolean | null
          referrals_no_reason?: string | null
          referrals_proof_url?: string | null
          testimonial_asked?: boolean | null
          testimonial_no_reason?: string | null
          testimonial_proof_url?: string | null
          thank_you_note_asked?: boolean | null
          thank_you_note_no_reason?: string | null
          thank_you_note_proof_url?: string | null
          updated_at?: string
          wedding_month?: number | null
          wedding_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_forms_client_timeline_id_fkey"
            columns: ["client_timeline_id"]
            isOneToOne: false
            referencedRelation: "client_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_entry_queue: {
        Args: { p_assigned_crm_name?: string; p_branch_id?: string; p_client_name: string; p_mobile: string }
        Returns: { token: string; client_id: string | null; client_type: string }[]
      }
      create_client_with_phone: {
        Args: {
          p_branch_id?: string
          p_gender?: string
          p_primary_name: string
          p_primary_phone: string
        }
        Returns: string
      }
      current_user_branch_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_profile: {
        Args: never
        Returns: {
          branch_name: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      is_branch_manager: { Args: { row_branch_id: string }; Returns: boolean }
      is_branch_staff: { Args: { row_branch_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_user_in_current_branch: {
        Args: { row_user_id: string }
        Returns: boolean
      }
      search_clients: {
        Args: { result_limit?: number; search_text: string }
        Returns: {
          client_id: string
          last_branch_name: string
          last_visit_date: string
          matched_phone: string
          primary_name: string
          primary_phone: string
        }[]
      }
      submit_walkin_visit: {
        Args: { p_payload: Json }
        Returns: { client_id: string; timeline_id: string; reference_number: string }[]
      }
      update_not_bought_followup: {
        Args: { p_call_response: string; p_followup_id: string; p_next_followup_date?: string; p_remark?: string }
        Returns: Database["public"]["Tables"]["not_bought_followups"]["Row"]
      }
    }
    Enums: {
      buy_status:
        | "ORDER_PLACED"
        | "ORDER_PICKUP"
        | "REPAIR_PLACED"
        | "REPAIR_PICKUP"
        | "PRODUCT_RETURN"
        | "PRODUCT_EXCHANGE"
        | "STORE_VISIT"
        | "PRICE_CALCULATION"
        | "YES"
        | "NO"
        | "YES_AND_ORDER_PLACED"
        | "ORDER_PLACED_AND_BUYING_NEW_PRODUCT"
        | "ORDER_PLACED_AND_MAKING_NEW_ORDER"
        | "ORDER_PICKUP_AND_BUYING_NEW_PRODUCT"
        | "ORDER_PICKUP_AND_MAKING_NEW_ORDER"
        | "REPAIR_PLACED_AND_BUYING_NEW_PRODUCT"
        | "REPAIR_PLACED_AND_MAKING_NEW_ORDER"
        | "REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT"
        | "REPAIR_PICKUP_AND_MAKING_NEW_ORDER"
      event_type:
        | "UPSALE_VISIT"
        | "READY_PRODUCT_PURCHASE"
        | "ORDER_PLACED_VISIT"
        | "ORDER_PICKUP_VISIT"
        | "REPAIR_PLACED_VISIT"
        | "REPAIR_PICKUP_VISIT"
        | "PRODUCT_RETURN_VISIT"
        | "PRODUCT_EXCHANGE_VISIT"
        | "NON_PURCHASE_VISIT"
        | "STORE_VISIT"
        | "PRICE_CALCULATION_VISIT"
        | "VISIT"
      user_role: "super_admin" | "branch_manager" | "salesperson"
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
      buy_status: [
        "ORDER_PLACED",
        "ORDER_PICKUP",
        "REPAIR_PLACED",
        "REPAIR_PICKUP",
        "PRODUCT_RETURN",
        "PRODUCT_EXCHANGE",
        "STORE_VISIT",
        "PRICE_CALCULATION",
        "YES",
        "NO",
        "YES_AND_ORDER_PLACED",
        "ORDER_PLACED_AND_BUYING_NEW_PRODUCT",
        "ORDER_PLACED_AND_MAKING_NEW_ORDER",
        "ORDER_PICKUP_AND_BUYING_NEW_PRODUCT",
        "ORDER_PICKUP_AND_MAKING_NEW_ORDER",
        "REPAIR_PLACED_AND_BUYING_NEW_PRODUCT",
        "REPAIR_PLACED_AND_MAKING_NEW_ORDER",
        "REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT",
        "REPAIR_PICKUP_AND_MAKING_NEW_ORDER",
      ],
      event_type: [
        "UPSALE_VISIT",
        "READY_PRODUCT_PURCHASE",
        "ORDER_PLACED_VISIT",
        "ORDER_PICKUP_VISIT",
        "REPAIR_PLACED_VISIT",
        "REPAIR_PICKUP_VISIT",
        "PRODUCT_RETURN_VISIT",
        "PRODUCT_EXCHANGE_VISIT",
        "NON_PURCHASE_VISIT",
        "STORE_VISIT",
        "PRICE_CALCULATION_VISIT",
        "VISIT",
      ],
      user_role: ["super_admin", "branch_manager", "salesperson"],
    },
  },
} as const
