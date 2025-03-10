-- Create a table for public profiles
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    unsubscribed boolean NOT NULL DEFAULT false
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by self." ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create Stripe Customer Table
CREATE TABLE stripe_customers (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  stripe_customer_id text UNIQUE
);
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create a table for "Contact Us" form submissions
CREATE TABLE contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at timestamp with time zone,
  full_name text,
  email text,
  message_body text
);
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Create or replace the function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Storage, skip if "avatars" bucket already exists
INSERT INTO storage.buckets (id, name)
  VALUES ('avatars', 'avatars')
  ON CONFLICT (id) DO NOTHING;

-- Set up access controls for storage
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Create enum types
CREATE TYPE question_flag_status AS ENUM ('pending', 'in_review', 'resolved', 'rejected');

-- Create tables
CREATE TABLE subjects (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE categories (
    id text PRIMARY KEY,
    subject_id text REFERENCES subjects(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id text REFERENCES categories(id) ON DELETE SET NULL,
    content text NOT NULL,
    image_url text,
    explanation text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

CREATE TABLE choices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    explanation text
);

CREATE TABLE quizzes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category_id text REFERENCES categories(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

CREATE TABLE quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    "order" integer NOT NULL,
    UNIQUE(quiz_id, question_id),
    UNIQUE(quiz_id, "order")
);

CREATE TABLE quiz_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    last_answered_question_id uuid REFERENCES questions(id) ON DELETE SET NULL,
    score numeric DEFAULT 0
);

CREATE TABLE incorrect_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    choice_id uuid REFERENCES choices(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE TABLE flagged_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    details text,
    status question_flag_status DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_flagged_questions_status ON flagged_questions(status);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incorrect_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_questions ENABLE ROW LEVEL SECURITY;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS Policies
-- Subjects
CREATE POLICY "Anyone can view subjects" ON subjects
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify subjects" ON subjects
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Categories
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON categories
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Questions
CREATE POLICY "Users can view active questions" ON questions
    FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Only admins can modify questions" ON questions
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Choices
CREATE POLICY "Users can view choices" ON choices
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify choices" ON choices
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Quizzes
CREATE POLICY "Users can view active quizzes" ON quizzes
    FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Only admins can modify quizzes" ON quizzes
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Quiz Questions
CREATE POLICY "Users can view quiz questions" ON quiz_questions
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify quiz questions" ON quiz_questions
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Quiz Attempts
CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Users can create their own attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own attempts" ON quiz_attempts
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Incorrect Responses
CREATE POLICY "Users can view their own incorrect responses" ON incorrect_responses
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own incorrect responses" ON incorrect_responses
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Bookmarks
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Flagged Questions
CREATE POLICY "Users can flag questions" ON flagged_questions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users cannot view flagged questions" ON flagged_questions
    FOR SELECT USING (false);

CREATE POLICY "Users cannot update flagged questions" ON flagged_questions
    FOR UPDATE USING (false);

CREATE POLICY "Admins can view all flagged questions" ON flagged_questions
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update flagged questions" ON flagged_questions
    FOR UPDATE USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_subjects
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER set_timestamp_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER set_timestamp_questions
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER set_timestamp_quizzes
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

-- Add missing INSERT policies

DROP POLICY IF EXISTS "Users can create quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Complete policy for users to manage their profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


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