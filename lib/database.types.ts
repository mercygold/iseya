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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
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
