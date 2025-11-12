import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name?: string;
  role?: 'student' | 'admin' | 'lecturer';
  level?: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    role?: 'student' | 'admin' | 'lecturer';
    level?: string;
    [key: string]: any;
  };
};

export type Course = {
  id: string;
  course_code: string;
  course_title: string;
  level: string;
  lecturer_id?: string;
  created_at: string;
  lecturer?: User;
};

export type TimetableEntry = {
  id: string;
  course_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  created_at: string;
  course?: Course;
};

export type Announcement = {
  id: string;
  message: string;
  level?: string;
  posted_by?: string;
  created_at: string;
  author?: User;
};
