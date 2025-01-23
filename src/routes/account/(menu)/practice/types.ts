// Database table types
export interface DbQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  completed_at?: string | null;
  last_answered_question_id?: string | null;
  score: number;
}

// Application types
export interface Subject {
  id: string;
  name: string;
  description: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  total_questions: number;
  status: QuizStatus; // Track quiz status for UI
}

export interface Category {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  quizzes: Quiz[];
  completion: number;
}

// Quiz status for UI rendering
export enum QuizStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Database types for data loading
export interface DatabaseCategory {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  quizzes: DatabaseQuiz[];
}

export interface DatabaseQuiz {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean | null;
}

// Quiz page types
export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  category: {
    id: string;
    name: string;
    subject_id: string;
    subject: {
      id: string;
      name: string;
    };
  };
}

export interface QuizQuestion extends DbQuestion {
  order: number;
  isBookmarked: boolean;
  incorrectChoices: string[];
}

export interface DbQuestion {
  id: string;
  content: string;
  explanation: string | null;
  image_url: string | null;
  choices: DbChoice[];
}

export interface DbChoice {
  id: string;
  content: string;
  is_correct: boolean;
  explanation: string | null;
}
