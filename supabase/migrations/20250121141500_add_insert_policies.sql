-- Add missing INSERT policies

-- Incorrect Responses
DROP POLICY IF EXISTS "Users can create incorrect responses" ON incorrect_responses;
CREATE POLICY "Users can create incorrect responses" ON incorrect_responses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update existing policies to ensure proper insert permissions
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add explicit insert policy for flagged questions
DROP POLICY IF EXISTS "Users can create flagged questions" ON flagged_questions;
CREATE POLICY "Users can create flagged questions" ON flagged_questions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Grant insert permissions
GRANT INSERT ON incorrect_responses TO authenticated;
GRANT INSERT ON bookmarks TO authenticated;
GRANT INSERT ON flagged_questions TO authenticated;