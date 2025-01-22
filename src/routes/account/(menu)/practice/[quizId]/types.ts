export interface Choice {
  id: string;
  content: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  content: string;
  image_url: string | null;
  explanation: string | null;
  choices: Choice[];
  isBookmarked?: boolean;
  incorrectChoices: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
}

export interface QuizAttempt {
  id: string;
  last_answered_question_id?: string;
  completed_at?: string;
  score?: number;
}

// Type for data passed from server to client
export interface PageData {
  quiz: Quiz;
  questions: Question[];
  attempt: QuizAttempt;
}
