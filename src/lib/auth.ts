import { supabase } from './supabase';
import * as CryptoJS from 'crypto-js';

export async function hashPassword(password: string): Promise<string> {
  return CryptoJS.SHA256(password).toString();
}

export async function loginUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', hashedPassword)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Invalid email or password');
  }

  return data;
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'admin' | 'lecturer',
  level?: string
) {
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password: hashedPassword,
        full_name: fullName,
        role,
        level,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
