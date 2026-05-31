import type { IndexStatus, DocumentStatsRead } from "./document";
import type { ProjectVisibility } from "./project";

export interface DashboardSummary {
  projects_count: number;
  documents_count: number;
  indexed_documents_count: number;
  pending_documents_count: number;
  processing_documents_count: number;
  failed_documents_count: number;
  indexed_pages_count: number;
  search_history_count: number;
}

export interface RepositoryStats {
  fields_count: number;
  public_projects_count: number;
  public_documents_count: number;
  contributors_count: number;
  indexed_pages_count: number;
}

export interface DashboardFieldSummary {
  id: number;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
}

export interface DashboardOwnerSummary {
  id: number;
  name: string;
  email: string;
  student_number: string;
}

export interface DashboardProjectSummary {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  visibility: ProjectVisibility;
  field: DashboardFieldSummary;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardDocumentSummary {
  id: number;
  title: string;
  original_filename: string;
  file_size: number;
  total_pages: number;
  index_status: IndexStatus;
  index_message: string | null;
  indexed_at: string | null;
  project: DashboardProjectSummary;
  field: DashboardFieldSummary;
  owner: DashboardOwnerSummary;
  created_at: string;
  updated_at: string;
  stats?: DocumentStatsRead | null;
}

export interface DashboardSearchSummary {
  id: number;
  query: string;
  research_field_id: number | null;
  research_project_id: number | null;
  result_count: number;
  created_at: string;
}

export interface MyDashboardResponse {
  summary: DashboardSummary;
  recent_projects: DashboardProjectSummary[];
  recent_documents: DashboardDocumentSummary[];
  recent_searches: DashboardSearchSummary[];
}
