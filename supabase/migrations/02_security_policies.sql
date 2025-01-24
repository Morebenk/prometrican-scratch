-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Content policies (subjects, categories, questions, choices)
CREATE POLICY "Anyone can view subjects"
    ON subjects FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify subjects"
    ON subjects FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify categories"
    ON categories FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view active questions"
    ON questions FOR SELECT
    USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can modify questions"
    ON questions FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view choices"
    ON choices FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify choices"
    ON choices FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Quiz related policies
CREATE POLICY "Users can view active quizzes"
    ON quizzes FOR SELECT
    USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can modify quizzes"
    ON quizzes FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view quiz questions"
    ON quiz_questions FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify quiz questions"
    ON quiz_questions FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- User interaction policies
CREATE POLICY "Users can view their own attempts"
    ON quiz_attempts FOR SELECT
    USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create their own attempts"
    ON quiz_attempts FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attempts"
    ON quiz_attempts FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own incorrect responses"
    ON incorrect_responses FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create incorrect responses"
    ON incorrect_responses FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own incorrect responses"
    ON incorrect_responses FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Bookmark policies
CREATE POLICY "Users can view their own bookmarks"
    ON bookmarks FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own bookmarks"
    ON bookmarks FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Flagged questions policies
CREATE POLICY "Flagged questions viewable by admins"
    ON flagged_questions FOR SELECT
    USING (exists (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ));

CREATE POLICY "Flagged questions insertable by authenticated users"
    ON flagged_questions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Flagged questions updatable by admins"
    ON flagged_questions FOR UPDATE
    USING (exists (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ));

-- Grant necessary permissions to authenticated users
GRANT INSERT ON incorrect_responses TO authenticated;
GRANT INSERT ON bookmarks TO authenticated;
GRANT INSERT ON flagged_questions TO authenticated;