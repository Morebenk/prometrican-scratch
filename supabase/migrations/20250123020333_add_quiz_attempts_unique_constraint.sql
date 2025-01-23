-- Delete duplicate quiz attempts, keeping only the latest attempt for each user/quiz combination
WITH latest_attempts AS (
  SELECT DISTINCT ON (user_id, quiz_id) id
  FROM quiz_attempts
  ORDER BY user_id, quiz_id, started_at DESC
),
duplicates AS (
  DELETE FROM quiz_attempts
  WHERE id NOT IN (SELECT id FROM latest_attempts)
)

-- Add unique constraint to prevent multiple attempts per user per quiz
ALTER TABLE quiz_attempts
ADD CONSTRAINT quiz_attempts_user_quiz_unique UNIQUE (user_id, quiz_id);

-- Update RLS policies to enforce constraint
ALTER POLICY "Users can create their own quiz attempts" ON quiz_attempts
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE user_id = auth.uid()
    AND quiz_id = quiz_attempts.quiz_id
    AND id != quiz_attempts.id
  )
);