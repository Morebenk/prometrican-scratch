// Database table types that match the schema
export interface DbQuizAttempt {
  id: string // Required by database
  user_id: string
  quiz_id: string
  started_at: Date
  completed_at?: Date | null
  last_answered_question_id?: string | null
  score: number
}

export interface DbQuestion {
  id: string
  content: string
  explanation: string | null
  image_url: string | null
  choices: DbChoice[]
}

export interface DbChoice {
  id: string
  content: string
  is_correct: boolean
  explanation: string | null
}

// Application types
export interface QuizData {
  id: string
  title: string
  description: string | null
  category: {
    id: string
    name: string
    subject_id: string
    subject: {
      id: string
      name: string
    }
  }
}

export interface QuizQuestion extends DbQuestion {
  order: number
  isBookmarked: boolean
  incorrectChoices: string[]
}

// Response types
export interface BookmarkResponse {
  success: boolean
}

export interface QuizAttemptUpdateResponse {
  success: boolean
}

export interface IncorrectResponsesResponse {
  incorrectChoices: string[]
}
