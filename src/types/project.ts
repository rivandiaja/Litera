import type { PaginatedResponse } from "./pagination";

export type ProjectVisibility = "public" | "private";

export interface ProjectOwner {
  id: number;
  name: string;
  email: string;
  student_number: string;
}

export interface ProjectField {
  id: number;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
}

export interface ResearchProject {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  visibility: ProjectVisibility;
  owner: ProjectOwner;
  field: ProjectField;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  research_field_id: number;
  title: string;
  description?: string;
  keywords?: string[];
  visibility?: ProjectVisibility;
}

export type ProjectListResponse = PaginatedResponse<ResearchProject>;
