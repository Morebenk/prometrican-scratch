-- Add quiz_attempt_id column
ALTER TABLE incorrect_responses 
ADD COLUMN quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE;

-- Set quiz_attempt_id for existing records (use the most recent attempt)
WITH latest_attempts AS (
  SELECT DISTINCT ON (user_id, quiz_id) id, user_id, quiz_id
  FROM quiz_attempts
  ORDER BY user_id, quiz_id, started_at DESC
)
UPDATE incorrect_responses ir
SET quiz_attempt_id = la.id
FROM latest_attempts la
JOIN quiz_attempts qa ON qa.id = la.id
WHERE ir.user_id = la.user_id
AND qa.quiz_id IN (
  SELECT quiz_id 
  FROM quiz_questions 
  WHERE question_id = ir.question_id
);

-- Make quiz_attempt_id required after migration
ALTER TABLE incorrect_responses 
ALTER COLUMN quiz_attempt_id SET NOT NULL;