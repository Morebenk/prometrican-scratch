-- Sample Quiz Data
-- Subjects (keep text IDs)
INSERT INTO subjects (id, name, description) VALUES
  ('math', 'Mathematics', 'Basic mathematics concepts'),
  ('prog', 'Programming', 'Introduction to programming');

-- Categories (keep text IDs)
INSERT INTO categories (id, subject_id, name, description) VALUES
  ('math-algebra', 'math', 'Basic Algebra', 'Fundamental algebraic concepts'),
  ('prog-python', 'prog', 'Python Basics', 'Introduction to Python programming');

-- Quizzes (now using UUIDs)
INSERT INTO quizzes (id, category_id, title, description, is_active) VALUES
  ('7d35e4a7-8b7a-4b3d-8476-21a9f5d8c7a1', 'math-algebra', 'Simple Equations', 'Practice solving basic equations', true),
  ('a2c3e8b6-4d1f-4e9a-8473-5a6f9b1b3e8c', 'prog-python', 'Python Variables', 'Learn about Python variables', true);

-- Questions (now using UUIDs)
INSERT INTO questions (id, category_id, text, content, is_active) VALUES
  ('c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 'math-algebra', 'Basic Linear Equation 1', 'Solve for x: 2x + 4 = 8', true),
  ('d58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 'math-algebra', 'Basic Linear Equation 2', 'Solve for x: 3x = 15', true),
  ('e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', 'prog-python', 'Python Expression Evaluation', 'What is the value of x after: x = 5 + 3 * 2?', true),
  ('f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', 'prog-python', 'Python Variable Naming', 'Which of these is a valid variable name in Python?', true);

-- Link questions to quizzes (now using UUIDs)
INSERT INTO quiz_questions (id, quiz_id, question_id, "order") VALUES
  ('1a2b3c4d-5e6f-4a3b-8c9d-0e1f2a3b4c5d', '7d35e4a7-8b7a-4b3d-8476-21a9f5d8c7a1', 'c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 1),
  ('2b3c4d5e-6f7a-4b3c-9d8e-0f1a2b3c4d5e', '7d35e4a7-8b7a-4b3d-8476-21a9f5d8c7a1', 'd58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 2),
  ('3c4d5e6f-7a8b-4c3d-9e8f-0a1b2c3d4e5f', 'a2c3e8b6-4d1f-4e9a-8473-5a6f9b1b3e8c', 'e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', 1),
  ('4d5e6f7a-8b9c-4d3e-9f0a-1b2c3d4e5f6a', 'a2c3e8b6-4d1f-4e9a-8473-5a6f9b1b3e8c', 'f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', 2);

-- Choices (now using UUIDs)
INSERT INTO choices (id, question_id, content, is_correct) VALUES
  -- Choices for algebra question 1
  ('a1b2c3d4-e5f6-4a3b-8c9d-0e1f2a3b4c5d', 'c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 'x = 2', true),
  ('b2c3d4e5-f6a7-4b3c-9d8e-0f1a2b3c4d5e', 'c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 'x = 4', false),
  ('c3d4e5f6-a7b8-4c3d-9e8f-0a1b2c3d4e5f', 'c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 'x = 6', false),
  ('d4e5f6a7-b8c9-4d3e-9f0a-1b2c3d4e5f6a', 'c47a8b9d-1e5f-4a3e-9b2d-6c8f9e1a2b3d', 'x = 8', false),

  -- Choices for algebra question 2
  ('e5f6a7b8-c9d0-4e3f-8a9b-0c1d2e3f4a5b', 'd58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 'x = 5', true),
  ('f6a7b8c9-d0e1-4f3a-8b4c-5d6e7f8a9b0c', 'd58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 'x = 3', false),
  ('a7b8c9d0-e1f2-4a3b-8c9d-0e1f2a3b4c5d', 'd58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 'x = 7', false),
  ('b8c9d0e1-f2a3-4b3c-9d8e-0f1a2b3c4d5e', 'd58b9c0e-2f6a-4b8c-9d3e-7a0f1b2c3d4e', 'x = 10', false),

  -- Choices for Python question 1
  ('c9d0e1f2-a3b4-4c3d-9e8f-0a1b2c3d4e5f', 'e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', '11', true),
  ('d0e1f2a3-b4c5-4d3e-9f0a-1b2c3d4e5f6a', 'e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', '16', false),
  ('e1f2a3b4-c5d6-4e3f-8a9b-0c1d2e3f4a5b', 'e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', '13', false),
  ('f2a3b4c5-d6e7-4f3a-8b4c-5d6e7f8a9b0c', 'e69d0f1a-2b3c-4d5e-8f7a-9b0c1d2e3f4a', '21', false),

  -- Choices for Python question 2
  ('a3b4c5d6-e7f8-4a3b-8c9d-0e1f2a3b4c5d', 'f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', 'my_variable', true),
  ('b4c5d6e7-f8a9-4b3c-9d8e-0f1a2b3c4d5e', 'f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', '123variable', false),
  ('c5d6e7f8-a9b0-4c3d-9e8f-0a1b2c3d4e5f', 'f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', 'my-variable', false),
  ('d6e7f8a9-b0c1-4d3e-9f0a-1b2c3d4e5f6a', 'f7a8b9c0-d1e2-4f3a-8b4c-5d6e7f8a9b0c', 'class', false);