import { apiRequest } from "../lib/api-client";
import type {
  CatalogResponse,
  SearchHistoryParams,
  SearchHistoryResponse,
  SearchParams,
  SearchResponse,
} from "../types/search";

function toQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) query.set(key, trimmed);
      return;
    }
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const searchService = {
  searchLiterature(params: SearchParams) {
    return apiRequest<SearchResponse>(`/search${toQuery({
      ...params,
      q: params.q.trim(),
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      sort_by: params.sort_by ?? "relevance",
    })}`);
  },

  searchCatalog(query: string, limit = 8) {
    return apiRequest<CatalogResponse>(`/search/catalog${toQuery({ q: query.trim(), limit })}`);
  },

  getSearchHistory(params: SearchHistoryParams = {}) {
    return apiRequest<SearchHistoryResponse>(`/search/history${toQuery({
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    })}`);
  },

  clearSearchHistory() {
    return apiRequest<void>("/search/history", {
      method: "DELETE",
    });
  },
};
