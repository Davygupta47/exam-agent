import { z } from 'zod';

export const loginSchema = z.object({
  role: z.enum(['student', 'faculty', 'admin']),
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

export const studentProfileUpdateSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
});

export const facultyProfileUpdateSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
});

export const electiveSelectionSchema = z.object({
  semester: z.number().int().min(1).max(8),
  elective_type: z.string().min(1),
  pref_1_id: z.number().int().positive(),
  pref_2_id: z.number().int().positive(),
  pref_3_id: z.number().int().positive(),
});

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  college_roll_no: z.string().min(3, 'College roll number is required'),
  autonomy_roll_no: z.string().min(3, 'Autonomy roll number is required'),
  registration_no: z.string().min(3, 'Registration number is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  department_id: z.number().int().positive(),
  current_semester: z.number().int().min(1).max(8).default(5),
  second_year_gpa: z.number().min(0).max(10).optional().nullable(),
});

export const createTeacherSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  teacher_code: z.string().min(2, 'Teacher code is required'),
  initials: z.string().max(10).optional().nullable(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  department_id: z.number().int().positive(),
  designation: z.string().min(2, 'Designation is required'),
});
