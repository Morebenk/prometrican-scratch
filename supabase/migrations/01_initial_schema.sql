-- Enable PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin check function
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

-- Create enum types
CREATE TYPE question_flag_status AS ENUM ('pending', 'in_review', 'resolved', 'rejected');

-- Create base tables
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

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
    text text NOT NULL,
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
    score numeric DEFAULT 0,
    UNIQUE(user_id, quiz_id, started_at)
);

CREATE TABLE incorrect_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    choice_id uuid REFERENCES choices(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(quiz_attempt_id, question_id)
);

CREATE TABLE bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE TABLE system_settings (
    id serial PRIMARY KEY,
    settings jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Create flagged_questions table with proper structure from the start
CREATE TABLE flagged_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    reported_by_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    reason text NOT NULL,
    details text,
    status question_flag_status NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now() NOT NULL,
    reviewed_at timestamptz,
    CONSTRAINT flagged_questions_status_check 
        CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected'))
);

-- Create indexes for performance
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_flagged_questions_status ON flagged_questions(status);
CREATE INDEX idx_flagged_questions_reported_by ON flagged_questions(reported_by_id);
CREATE INDEX idx_flagged_questions_reviewed_by ON flagged_questions(reviewed_by_id);
CREATE INDEX idx_flagged_questions_question ON flagged_questions(question_id);

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

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
