export type UserRole = "admin" | "student";

export interface User {
  id: number;
  name: string;
  student_number: string;
  email: string;
  study_program: string;
  class_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  student_number: string;
  email: string;
  password: string;
  study_program: string;
  class_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}
