-- Enable RLS on tables that might not have it
alter table quiz_attempts enable row level security;
alter table incorrect_responses enable row level security;
alter table bookmarks enable row level security;

-- Add policies to allow users to delete their own data
create policy "Users can delete their own quiz attempts"
  on quiz_attempts for delete
  using (auth.uid() = user_id);

create policy "Users can delete their own incorrect responses"
  on incorrect_responses for delete
  using (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);