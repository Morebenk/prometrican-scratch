export interface Subject {
  id: string
  name: string
  description: string | null
}

export interface Category {
  id: string
  subject_id: string
  name: string
  description: string | null
  quizzes: Quiz[]
  completion: number
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  category_id: string
  completion: number
  total_questions: number
  completed_questions: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  completed_at: string | null
  score: number
}
