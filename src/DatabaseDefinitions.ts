export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contact_requests: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          message_body: string | null
          updated_at: Date | null
        }
        Insert: {
          id?: string
          full_name?: string | null
          email?: string | null
          message_body?: string | null
          updated_at?: Date | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          message_body?: string | null
          updated_at?: Date | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          unsubscribed: boolean
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          unsubscribed: boolean
          updated_at?: Date | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          unsubscribed: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          stripe_customer_id: string
          updated_at: Date | null
          user_id: string
        }
        Insert: {
          stripe_customer_id: string
          updated_at?: Date | null
          user_id: string
        }
        Update: {
          stripe_customer_id?: string
          updated_at?: Date | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: Date | null
          updated_at: Date | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: Date | null
          updated_at?: Date | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: Date | null
          updated_at?: Date | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          subject_id: string
          name: string
          description: string | null
          created_at: Date | null
          updated_at: Date | null
        }
        Insert: {
          id?: string
          subject_id: string
          name: string
          description?: string | null
          created_at?: Date | null
          updated_at?: Date | null
        }
        Update: {
          id?: string
          subject_id?: string
          name?: string
          description?: string | null
          created_at?: Date | null
          updated_at?: Date | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          id: string
          category_id: string | null
          content: string
          image_url: string | null
          explanation: string | null
          created_at: Date | null
          updated_at: Date | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          content: string
          image_url?: string | null
          explanation?: string | null
          created_at?: Date | null
          updated_at?: Date | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          category_id?: string | null
          content?: string
          image_url?: string | null
          explanation?: string | null
          created_at?: Date | null
          updated_at?: Date | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      choices: {
        Row: {
          id: string
          question_id: string
          content: string
          is_correct: boolean
          explanation: string | null
        }
        Insert: {
          id?: string
          question_id: string
          content: string
          is_correct?: boolean
          explanation?: string | null
        }
        Update: {
          id?: string
          question_id?: string
          content?: string
          is_correct?: boolean
          explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          category_id: string
          created_at: Date | null
          updated_at: Date | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category_id: string
          created_at?: Date | null
          updated_at?: Date | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category_id?: string
          created_at?: Date | null
          updated_at?: Date | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_id: string
          order: number
        }
        Insert: {
          id?: string
          quiz_id: string
          question_id: string
          order: number
        }
        Update: {
          id?: string
          quiz_id?: string
          question_id?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          started_at: Date | null
          completed_at: Date | null
          last_answered_question_id: string | null
          score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          started_at?: Date | null
          completed_at?: Date | null
          last_answered_question_id?: string | null
          score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          started_at?: Date | null
          completed_at?: Date | null
          last_answered_question_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_last_answered_question_id_fkey"
            columns: ["last_answered_question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      incorrect_responses: {
        Row: {
          id: string
          user_id: string
          question_id: string
          choice_id: string
          created_at: Date | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          choice_id: string
          created_at?: Date | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          choice_id?: string
          created_at?: Date | null
        }
        Relationships: [
          {
            foreignKeyName: "incorrect_responses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incorrect_responses_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incorrect_responses_choice_id_fkey"
            columns: ["choice_id"]
            referencedRelation: "choices"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          question_id: string
          created_at: Date | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          created_at?: Date | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          created_at?: Date | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_questions: {
        Row: {
          id: string
          question_id: string
          user_id: string
          reason: string
          details: string | null
          status: Database["public"]["Enums"]["question_flag_status"]
          created_at: Date | null
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          reason: string
          details?: string | null
          status?: Database["public"]["Enums"]["question_flag_status"]
          created_at?: Date | null
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          reason?: string
          details?: string | null
          status?: Database["public"]["Enums"]["question_flag_status"]
          created_at?: Date | null
        }
        Relationships: [
          {
            foreignKeyName: "flagged_questions_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_questions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
      question_flag_status: "pending" | "in_review" | "resolved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
