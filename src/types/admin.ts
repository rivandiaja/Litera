import type { DashboardDocumentSummary, DashboardFieldSummary, DashboardOwnerSummary } from "./dashboard";
import type { IndexStatus, DocumentStatsRead } from "./document";
import type { PaginationMeta } from "./pagination";
import type { ProjectVisibility } from "./project";
import type { UserRole } from "./auth";

export interface IndexingBreakdown {
  pending: number;
  processing: number;
  indexed: number;
  failed: number;
}

export interface AdminDashboardSummary {
  users_count: number;
  active_users_count: number;
  fields_count: number;
  active_fields_count: number;
  projects_count: number;
  documents_count: number;
  indexed_documents_count: number;
  pending_documents_count: number;
  processing_documents_count: number;
  failed_documents_count: number;
  indexed_pages_count: number;
}

export interface AdminDashboardResponse {
  summary: AdminDashboardSummary;
  indexing_breakdown: IndexingBreakdown;
  recent_uploads: DashboardDocumentSummary[];
  failed_documents: DashboardDocumentSummary[];
}

export interface AdminUserRead {
  id: number;
  name: string;
  student_number: string;
  email: string;
  study_program: string;
  class_name: string;
  role: UserRole;
  is_active: boolean;
  projects_count: number;
  documents_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUserListResponse {
  items: AdminUserRead[];
  pagination: PaginationMeta;
}

export interface AdminProjectRead {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  visibility: ProjectVisibility;
  owner: DashboardOwnerSummary;
  field: DashboardFieldSummary;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProjectListResponse {
  items: AdminProjectRead[];
  pagination: PaginationMeta;
}

export interface AdminDocumentRead extends DashboardDocumentSummary {
  stats: DocumentStatsRead | null;
}

export interface AdminDocumentListResponse {
  items: AdminDocumentRead[];
  pagination: PaginationMeta;
}

export interface AdminIndexingResponse {
  summary: IndexingBreakdown;
  items: AdminDocumentRead[];
  pagination: PaginationMeta;
}

export interface AdminUserUpdatePayload {
  is_active?: boolean;
}

export type AdminDocumentSort = "newest" | "oldest" | "title_asc" | "title_desc";

export interface AdminUserListParams {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminProjectListParams {
  search?: string;
  research_field_id?: number;
  owner_id?: number;
  visibility?: ProjectVisibility;
  page?: number;
  page_size?: number;
  sort_by?: AdminDocumentSort;
}

export interface AdminDocumentListParams {
  search?: string;
  index_status?: IndexStatus;
  research_field_id?: number;
  research_project_id?: number;
  owner_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: AdminDocumentSort;
}

export interface AdminIndexingParams {
  search?: string;
  index_status?: IndexStatus;
  page?: number;
  page_size?: number;
}
