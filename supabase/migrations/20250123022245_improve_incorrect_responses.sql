-- First clean up existing data that might cause conflicts
DELETE FROM incorrect_responses;

-- Add quiz_attempt_id column and update table structure
ALTER TABLE incorrect_responses ADD COLUMN quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE;

-- Make the combination of attempt, question, and choice unique
ALTER TABLE incorrect_responses 
DROP CONSTRAINT IF EXISTS incorrect_responses_pkey,
ADD CONSTRAINT incorrect_responses_unique UNIQUE (quiz_attempt_id, question_id, choice_id);

-- Update RLS policies to enforce constraints
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
        -- Only allow new responses if the attempt is not completed
        AND qa.completed_at IS NULL
    )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS incorrect_responses_attempt_idx ON incorrect_responses(quiz_attempt_id);

-- Create view for user difficulty analysis
CREATE OR REPLACE VIEW user_question_difficulty AS
SELECT 
    q.id AS question_id,
    q.content,
    u.id AS user_id,
    COUNT(DISTINCT ir.quiz_attempt_id) AS attempt_count,
    COUNT(DISTINCT ir.choice_id) AS incorrect_choice_count
FROM questions q
CROSS JOIN auth.users u
LEFT JOIN incorrect_responses ir ON ir.question_id = q.id
LEFT JOIN quiz_attempts qa ON qa.id = ir.quiz_attempt_id AND qa.user_id = u.id
GROUP BY q.id, q.content, u.id;