-- First remove any duplicate records that would violate the unique constraint
DELETE FROM incorrect_responses a USING incorrect_responses b
WHERE a.quiz_attempt_id = b.quiz_attempt_id 
  AND a.question_id = b.question_id 
  AND a.choice_id = b.choice_id
  AND a.ctid < b.ctid;

-- Drop existing constraint if it exists
ALTER TABLE incorrect_responses 
DROP CONSTRAINT IF EXISTS incorrect_responses_unique;

-- Add proper unique constraint
ALTER TABLE incorrect_responses 
ADD CONSTRAINT incorrect_responses_unique 
UNIQUE (quiz_attempt_id, question_id, choice_id);

-- Update RLS policies to enforce constraint
DROP POLICY IF EXISTS "Users can manage their incorrect responses" ON incorrect_responses;
CREATE POLICY "Users can manage their incorrect responses" ON incorrect_responses
USING (
    EXISTS (
        SELECT 1 FROM quiz_attempts qa
        WHERE qa.id = quiz_attempt_id
        AND qa.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quiz_attempts qa
        WHERE qa.id = quiz_attempt_id
        AND qa.user_id = auth.uid()
        AND qa.completed_at IS NULL
    )
);