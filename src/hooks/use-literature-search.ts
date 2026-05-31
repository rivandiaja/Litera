import { useCallback, useEffect, useMemo, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { searchService } from "../services/search-service";
import type { SearchParams, SearchResponse } from "../types/search";

export function useLiteratureSearch(params: SearchParams) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedParams = useMemo(() => ({
    q: params.q.trim(),
    research_field_id: params.research_field_id,
    research_project_id: params.research_project_id,
    owner_id: params.owner_id,
    page: params.page ?? 1,
    page_size: params.page_size ?? 10,
    sort_by: params.sort_by ?? "relevance",
  }), [
    params.q,
    params.research_field_id,
    params.research_project_id,
    params.owner_id,
    params.page,
    params.page_size,
    params.sort_by,
  ]);

  const load = useCallback(async () => {
    if (normalizedParams.q.length < 2) {
      setData(null);
      setError("Masukkan minimal 2 karakter untuk mencari literatur.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await searchService.searchLiterature(normalizedParams);
      setData(response);
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [normalizedParams]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    retry: load,
  };
}
