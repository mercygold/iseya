export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          subscription_status: string;
          subscription_plan: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          organization_id: string | null;
          organization_access_type: string | null;
          organization_verified_at: string | null;
          role: string | null;
          app_role: string | null;
          account_type: string;
          resume_download_credits: number;
          optimization_credits: number;
          document_exports_used: number;
          optimization_credits_used: number;
          saved_versions_count: number;
          processed_stripe_event_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          subscription_status?: string;
          subscription_plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          organization_id?: string | null;
          organization_access_type?: string | null;
          organization_verified_at?: string | null;
          role?: string | null;
          app_role?: string | null;
          account_type?: string;
          resume_download_credits?: number;
          optimization_credits?: number;
          document_exports_used?: number;
          optimization_credits_used?: number;
          saved_versions_count?: number;
          processed_stripe_event_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          subscription_status?: string;
          subscription_plan?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          organization_id?: string | null;
          organization_access_type?: string | null;
          organization_verified_at?: string | null;
          role?: string | null;
          app_role?: string | null;
          account_type?: string;
          resume_download_credits?: number;
          optimization_credits?: number;
          document_exports_used?: number;
          optimization_credits_used?: number;
          saved_versions_count?: number;
          processed_stripe_event_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          type: string;
          email_domain: string;
          access_code: string;
          plan: string;
          seats_allowed: number;
          seats_used: number;
          status: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          email_domain: string;
          access_code: string;
          plan?: string;
          seats_allowed?: number;
          seats_used?: number;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          email_domain?: string;
          access_code?: string;
          plan?: string;
          seats_allowed?: number;
          seats_used?: number;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
      };
      recruiter_profiles: {
        Row: {
          user_id: string;
          company_name: string;
          recruiter_name: string;
          work_email: string;
          company_website: string | null;
          company_location: string | null;
          industry: string | null;
          company_size: string | null;
          hiring_focus: string | null;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string;
          recruiter_name?: string;
          work_email?: string;
          company_website?: string | null;
          company_location?: string | null;
          industry?: string | null;
          company_size?: string | null;
          hiring_focus?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          company_name?: string;
          recruiter_name?: string;
          work_email?: string;
          company_website?: string | null;
          company_location?: string | null;
          industry?: string | null;
          company_size?: string | null;
          hiring_focus?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_posts: {
        Row: {
          id: string;
          recruiter_id: string;
          job_title: string;
          company_name: string;
          location: string;
          workplace_type: string;
          employment_type: string;
          salary_range: string | null;
          role_summary: string;
          responsibilities: string;
          requirements: string;
          skills: string[];
          application_deadline: string | null;
          application_url: string | null;
          status: string;
          applicants_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recruiter_id: string;
          job_title: string;
          company_name: string;
          location?: string;
          workplace_type?: string;
          employment_type?: string;
          salary_range?: string | null;
          role_summary?: string;
          responsibilities?: string;
          requirements?: string;
          skills?: string[];
          application_deadline?: string | null;
          application_url?: string | null;
          status?: string;
          applicants_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recruiter_id?: string;
          job_title?: string;
          company_name?: string;
          location?: string;
          workplace_type?: string;
          employment_type?: string;
          salary_range?: string | null;
          role_summary?: string;
          responsibilities?: string;
          requirements?: string;
          skills?: string[];
          application_deadline?: string | null;
          application_url?: string | null;
          status?: string;
          applicants_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_id: string;
          recruiter_id: string;
          status: string;
          candidate_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_id: string;
          recruiter_id: string;
          status?: string;
          candidate_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_id?: string;
          recruiter_id?: string;
          status?: string;
          candidate_snapshot?: Json;
          created_at?: string;
        };
      };
      job_alert_subscriptions: {
        Row: {
          id: string;
          candidate_id: string | null;
          email: string;
          title_query: string;
          location_query: string;
          employment_type: string;
          remote_only: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id?: string | null;
          email: string;
          title_query?: string;
          location_query?: string;
          employment_type?: string;
          remote_only?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string | null;
          email?: string;
          title_query?: string;
          location_query?: string;
          employment_type?: string;
          remote_only?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_role: string | null;
          content_json: Json;
          template: string | null;
          theme: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_role?: string | null;
          content_json?: Json;
          template?: string | null;
          theme?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          target_role?: string | null;
          content_json?: Json;
          template?: string | null;
          theme?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          version_name: string;
          content_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          version_name: string;
          content_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          version_name?: string;
          content_json?: Json;
          created_at?: string;
        };
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          export_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          export_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          export_type?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
        };
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          prompt_type: string;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          prompt_type: string;
          tokens_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          prompt_type?: string;
          tokens_used?: number;
          created_at?: string;
        };
      };
    };
  };
};
