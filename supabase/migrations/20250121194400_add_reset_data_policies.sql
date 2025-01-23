-- Enable RLS on tables that might not have it
alter table quiz_attempts enable row level security;
alter table incorrect_responses enable row level security;
alter table bookmarks enable row level security;

-- Add policies to allow users to delete their own data
DROP POLICY IF EXISTS "Users can delete their own quiz attempts" ON quiz_attempts;
create policy "Users can delete their own quiz attempts"
  on quiz_attempts for delete
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own incorrect responses" ON incorrect_responses;
create policy "Users can delete their own incorrect responses"
  on incorrect_responses for delete
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Grant delete permissions to authenticated users
GRANT DELETE ON quiz_attempts TO authenticated;
GRANT DELETE ON incorrect_responses TO authenticated;
GRANT DELETE ON bookmarks TO authenticated;

-- Drop potentially conflicting views if they exist
DROP VIEW IF EXISTS user_quiz_progress;