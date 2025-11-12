-- Demo data for Datalink Class Planner
-- Run this in your Supabase SQL editor to populate demo accounts and data

-- Create demo users (passwords are hashed version of "password")
INSERT INTO users (email, password, full_name, role, level) VALUES
  ('admin@test.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Admin User', 'admin', NULL),
  ('student@test.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'John Doe', 'student', '100 ICT'),
  ('student2@test.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Jane Smith', 'student', '200 Business'),
  ('lecturer1@test.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Dr. Sarah Johnson', 'lecturer', NULL),
  ('lecturer2@test.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Prof. Michael Brown', 'lecturer', NULL)
ON CONFLICT (email) DO NOTHING;

-- Get lecturer IDs for course assignment
DO $$
DECLARE
  lecturer1_id uuid;
  lecturer2_id uuid;
  course1_id uuid;
  course2_id uuid;
  course3_id uuid;
  course4_id uuid;
BEGIN
  SELECT id INTO lecturer1_id FROM users WHERE email = 'lecturer1@test.com';
  SELECT id INTO lecturer2_id FROM users WHERE email = 'lecturer2@test.com';

  -- Create demo courses for Level 100 ICT
  INSERT INTO courses (course_code, course_title, level, lecturer_id) VALUES
    ('ICT101', 'Introduction to Computing', '100 ICT', lecturer1_id),
    ('ICT102', 'Programming Fundamentals', '100 ICT', lecturer1_id),
    ('ICT103', 'Database Systems', '100 ICT', lecturer2_id),
    ('BUS201', 'Business Management', '200 Business', lecturer2_id),
    ('BUS202', 'Marketing Principles', '200 Business', lecturer1_id)
  ON CONFLICT (course_code) DO NOTHING
  RETURNING id;

  -- Get course IDs
  SELECT id INTO course1_id FROM courses WHERE course_code = 'ICT101';
  SELECT id INTO course2_id FROM courses WHERE course_code = 'ICT102';
  SELECT id INTO course3_id FROM courses WHERE course_code = 'ICT103';
  SELECT id INTO course4_id FROM courses WHERE course_code = 'BUS201';

  -- Create timetable entries
  INSERT INTO timetable (course_id, day_of_week, start_time, end_time, room) VALUES
    (course1_id, 'Monday', '08:00', '10:00', 'Room 101'),
    (course1_id, 'Wednesday', '08:00', '10:00', 'Room 101'),
    (course2_id, 'Monday', '10:30', '12:30', 'Lab 201'),
    (course2_id, 'Friday', '10:30', '12:30', 'Lab 201'),
    (course3_id, 'Tuesday', '14:00', '16:00', 'Room 105'),
    (course3_id, 'Thursday', '14:00', '16:00', 'Room 105'),
    (course4_id, 'Monday', '09:00', '11:00', 'Room 301'),
    (course4_id, 'Wednesday', '13:00', '15:00', 'Room 301')
  ON CONFLICT DO NOTHING;

  -- Create demo announcements
  INSERT INTO announcements (message, level, posted_by) VALUES
    ('Welcome to the new semester! Classes begin next week.', NULL, (SELECT id FROM users WHERE email = 'admin@test.com')),
    ('ICT Lab orientation for Level 100 students on Friday at 2 PM.', '100 ICT', (SELECT id FROM users WHERE email = 'admin@test.com')),
    ('Business department meeting scheduled for Thursday.', '200 Business', (SELECT id FROM users WHERE email = 'admin@test.com')),
    ('Library hours extended during exam period.', NULL, (SELECT id FROM users WHERE email = 'admin@test.com'))
  ON CONFLICT DO NOTHING;

END $$;
