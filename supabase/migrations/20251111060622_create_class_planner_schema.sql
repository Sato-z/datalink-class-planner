/*
  # Datalink Class Planner Database Schema

  ## Overview
  This migration creates the complete database schema for the Datalink Class Planner system,
  a university timetable management application.

  ## New Tables

  ### 1. users
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User login email
  - `password` (text) - Hashed password
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'student', 'admin', or 'lecturer'
  - `level` (text, nullable) - Student level (e.g., '100 ICT', '200 Business')
  - `created_at` (timestamp) - Account creation timestamp

  ### 2. courses
  - `id` (uuid, primary key) - Unique course identifier
  - `course_code` (text, unique) - Course code (e.g., 'ICT101')
  - `course_title` (text) - Full course name
  - `level` (text) - Target level (e.g., '100 ICT')
  - `lecturer_id` (uuid, foreign key) - Reference to lecturer user
  - `created_at` (timestamp) - Record creation timestamp

  ### 3. timetable
  - `id` (uuid, primary key) - Unique timetable entry identifier
  - `course_id` (uuid, foreign key) - Reference to course
  - `day_of_week` (text) - Day (Monday-Friday)
  - `start_time` (time) - Class start time
  - `end_time` (time) - Class end time
  - `room` (text) - Room number/name
  - `created_at` (timestamp) - Record creation timestamp

  ### 4. announcements
  - `id` (uuid, primary key) - Unique announcement identifier
  - `message` (text) - Announcement content
  - `level` (text, nullable) - Target level (null = all students)
  - `posted_by` (uuid, foreign key) - Admin who posted
  - `created_at` (timestamp) - Post timestamp

  ## Security
  - Enables Row Level Security (RLS) on all tables
  - Students can view their own profile and level-appropriate data
  - Admin can manage all data
  - Lecturers can view courses they teach

  ## Important Notes
  - Password hashing should be handled at the application level
  - Level format: '{year} {department}' (e.g., '100 ICT', '200 Business')
  - Time format uses PostgreSQL time type for schedule management
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'admin', 'lecturer')),
  level text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  course_title text NOT NULL,
  level text NOT NULL,
  lecturer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  level text,
  posted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view courses for their level"
  ON courses FOR SELECT
  TO authenticated
  USING (
    level IN (
      SELECT users.level FROM users WHERE users.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'lecturer')
    )
  );

CREATE POLICY "Admin can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view timetable for accessible courses"
  ON timetable FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = timetable.course_id
      AND (
        courses.level IN (
          SELECT users.level FROM users WHERE users.id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'lecturer')
        )
      )
    )
  );

CREATE POLICY "Admin can manage timetable"
  ON timetable FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Students can view relevant announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    announcements.level IS NULL
    OR
    announcements.level IN (
      SELECT users.level FROM users WHERE users.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'lecturer')
    )
  );

CREATE POLICY "Admin can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_timetable_course_id ON timetable(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_level ON announcements(level);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
