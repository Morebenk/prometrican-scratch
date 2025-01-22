import type { Database } from "../../DatabaseDefinitions";

export interface Stats {
  totalUsers: number;
  totalQuestions: number;
  totalQuizzes: number;
  pendingFlags: number;
  recentAttempts: number;
}

// Database Types
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbQuestion = Database["public"]["Tables"]["questions"]["Row"];
export type DbQuiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type DbFlaggedQuestion =
  Database["public"]["Tables"]["flagged_questions"]["Row"];
export type DbQuizAttempt =
  Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type DbSubject = Database["public"]["Tables"]["subjects"]["Row"];
export type DbCategory = Database["public"]["Tables"]["categories"]["Row"];

// Extended Admin Types
export interface AdminUser extends DbProfile {
  email: string;
  created_at: string;
  is_admin: boolean;
}

// Frontend Types
export type Subject = DbSubject;
export type Category = DbCategory;
export type Question = DbQuestion;
export type Quiz = DbQuiz;
export type Profile = DbProfile;
export type FlaggedQuestion = DbFlaggedQuestion;
export type QuizAttempt = DbQuizAttempt;

// Enum Types
export type QuestionFlagStatus =
  Database["public"]["Enums"]["question_flag_status"];

// Form Types
export interface FormState<T> {
  values: T;
  errors?: Record<string, string>;
  error?: string;
  success?: boolean;
}
