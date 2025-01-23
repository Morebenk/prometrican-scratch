import type { QuizWithCategory } from "../types";
import type { DbQuizAttempt } from "../../types";

export interface QuizAnswer {
  question: {
    id: string;
    content: string;
    explanation: string | null;
    image_url: string | null;
    choices: {
      id: string;
      content: string;
      is_correct: boolean;
      explanation: string | null;
    }[];
  };
  selected_choice: {
    id: string;
    content: string;
    is_correct: boolean;
    explanation: string | null;
  };
}

export interface PageData {
  quiz: QuizWithCategory;
  attempt: DbQuizAttempt;
  answers: QuizAnswer[];
}

interface Params {
  quizId: string;
}

interface Locals {
  user: {
    id: string;
  } | null;
  supabase: any;
  session: any;
}

export interface PageServerLoad {
  (props: { params: Params; locals: Locals }): Promise<PageData>;
}

interface QuestionChoice {
  id: string;
  content: string;
  is_correct: boolean;
  explanation: string | null;
}
