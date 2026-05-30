import type { PaginatedResponse } from "./pagination";

export interface ResearchField {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface FieldPayload {
  name: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export type FieldListResponse = PaginatedResponse<ResearchField>;
