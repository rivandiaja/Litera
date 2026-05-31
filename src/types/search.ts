export type SearchSort = "relevance" | "newest" | "title_asc" | "title_desc";

export interface SearchFilters {
  research_field_id: number | null;
  research_project_id: number | null;
  owner_id: number | null;
}

export interface SearchPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface SearchSummary {
  id: number;
  name: string;
}

export interface SearchProjectSummary {
  id: number;
  title: string;
}

export interface SearchResultItem {
  document_id: number;
  title: string;
  original_filename: string;
  score: number;
  relevance_percent: number;
  total_pages: number;
  relevant_pages: number[];
  best_page: number | null;
  snippet: string;
  matched_terms: string[];
  project: SearchProjectSummary;
  field: SearchSummary;
  owner: SearchSummary;
  created_at: string;
}

export interface SearchResponse {
  query: string;
  processed_terms: string[];
  filters: SearchFilters;
  pagination: SearchPagination;
  results: SearchResultItem[];
}

export interface SearchParams {
  q: string;
  research_field_id?: number | null;
  research_project_id?: number | null;
  owner_id?: number | null;
  page?: number;
  page_size?: number;
  sort_by?: SearchSort;
}

export interface CatalogFieldItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

export interface CatalogProjectItem {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  visibility: string;
  owner: SearchSummary;
  field: SearchSummary;
}

export interface CatalogResponse {
  query: string;
  fields: CatalogFieldItem[];
  projects: CatalogProjectItem[];
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  filters: SearchFilters;
  result_count: number;
  created_at: string;
}

export interface SearchHistoryResponse {
  items: SearchHistoryItem[];
  pagination: SearchPagination;
}

export interface SearchHistoryParams {
  page?: number;
  page_size?: number;
}
