export interface DbIncorrectResponse {
  id?: string;
  user_id: string;
  quiz_attempt_id: string;
  question_id: string;
  choice_id: string;
  created_at?: string;
}

export interface IncorrectResponsePayload {
  questionId: string;
  choiceId: string;
  quizAttemptId: string;
}
