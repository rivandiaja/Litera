import type { PaginationMeta } from "./pagination";
import type { ProjectVisibility } from "./project";

export type IndexStatus = "pending" | "processing" | "indexed" | "failed";

export interface DocumentStatsRead {
  total_terms: number;
  indexed_page_count: number;
  updated_at: string;
}

export interface ProjectDocumentSummary {
  id: number;
  title: string;
  visibility: ProjectVisibility;
}

export interface DocumentRead {
  id: number;
  research_project_id: number;
  title: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  total_pages: number;
  index_status: IndexStatus;
  index_message: string | null;
  indexed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentRead {
  owner: {
    id: number;
    name: string;
    email: string;
    student_number: string;
  };
  project: ProjectDocumentSummary;
  field: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    is_active: boolean;
  };
  stats: DocumentStatsRead | null;
}

export interface DocumentListResponse {
  items: DocumentRead[];
  pagination: PaginationMeta;
}

export interface DocumentUploadItem {
  original_filename: string;
  accepted: boolean;
  document_id: number | null;
  index_status: IndexStatus | null;
  file_size: number | null;
  error: string | null;
}

export interface DocumentUploadResponse {
  items: DocumentUploadItem[];
  accepted_count: number;
  failed_count: number;
}

export interface DocumentListParams {
  page?: number;
  page_size?: number;
  status?: IndexStatus;
  search?: string;
}

export interface DocumentUpdatePayload {
  title: string;
}
