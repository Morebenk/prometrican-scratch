export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contact_requests: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          message_body: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          message_body?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          message_body?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      choices: {
        Row: {
          id: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          explanation: string | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          explanation?: string | null;
        };
        Update: {
          id?: string;
          question_id?: string;
          content?: string;
          is_correct?: boolean;
          explanation?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string | null;
          unsubscribed: boolean;
          email: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string | null;
          unsubscribed?: boolean;
          email?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string | null;
          unsubscribed?: boolean;
          email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          subject_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_subject_id_fkey";
            columns: ["subject_id"];
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          category_id: string | null;
          content: string;
          image_url: string | null;
          explanation: string | null;
          created_at: string;
          updated_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          content: string;
          image_url?: string | null;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          content?: string;
          image_url?: string | null;
          explanation?: string | null;
          created_at?: string;
          updated_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category_id: string;
          created_at: string;
          updated_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category_id: string;
          created_at?: string;
          updated_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category_id?: string;
          created_at?: string;
          updated_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_id: string;
          order: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_id: string;
          order: number;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_id?: string;
          order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_questions_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_customers: {
        Row: {
          stripe_customer_id: string;
          updated_at: Date | null;
          user_id: string;
        };
        Insert: {
          stripe_customer_id: string;
          updated_at?: Date | null;
          user_id: string;
        };
        Update: {
          stripe_customer_id?: string;
          updated_at?: Date | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          started_at: string;
          completed_at: string | null;
          last_answered_question_id: string | null;
          score: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          started_at?: string;
          completed_at?: string | null;
          last_answered_question_id?: string | null;
          score?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          started_at?: string;
          completed_at?: string | null;
          last_answered_question_id?: string | null;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      flagged_questions: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          reason: string;
          details: string | null;
          status: Database["public"]["Enums"]["question_flag_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          reason: string;
          details?: string | null;
          status?: Database["public"]["Enums"]["question_flag_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string;
          reason?: string;
          details?: string | null;
          status?: Database["public"]["Enums"]["question_flag_status"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flagged_questions_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flagged_questions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      question_flag_status: "pending" | "in_review" | "resolved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type DateString = string;
