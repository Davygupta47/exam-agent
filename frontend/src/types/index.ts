export type UserRole = "student" | "faculty" | "teacher" | "admin" | "super_admin" | "hod";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  roll_no?: string | null;
  teacher_code?: string | null;
  student_id?: number | null;
  teacher_id?: number | null;
  designation?: string | null;
  department_id?: number | null;
}

export interface StudentProfile {
  id: number;
  name: string;
  autonomy_roll_no: string;
  college_roll_no: string;
  registration_no: string;
  current_semester: number;
  second_year_gpa?: number | null;
  photo_url?: string | null;
  bio?: string | null;
  address?: string | null;
  phone?: string | null;
  email: string;
  department_name: string;
  department_code: string;
  program_name: string;
  batch_label: string;
}

export interface TeacherProfile {
  id: number;
  teacher_code: string;
  name: string;
  initials?: string | null;
  email: string;
  phone?: string | null;
  designation: string;
  photo_url?: string | null;
  bio?: string | null;
  address?: string | null;
  department_name: string;
  department_code: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  credits: string | number;
  course_type: "THEORY" | "PRACTICAL" | "SESSIONAL";
  elective_type: string;
  is_elective?: boolean;
}

export interface FacultySummary {
  id: number;
  teacher_code: string;
  name: string;
  initials?: string | null;
  email: string;
  designation: string;
  photo_url?: string | null;
  department_name?: string;
}

export interface Notice {
  id: number;
  title: string;
  body: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}
