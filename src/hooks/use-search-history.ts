import { useCallback, useEffect, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { searchService } from "../services/search-service";
import type { SearchHistoryResponse } from "../types/search";

export function useSearchHistory(page = 1, pageSize = 10) {
  const [data, setData] = useState<SearchHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchService.getSearchHistory({ page, page_size: pageSize });
      setData(response);
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const clear = useCallback(async () => {
    await searchService.clearSearchHistory();
    await load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    retry: load,
    clear,
  };
}
