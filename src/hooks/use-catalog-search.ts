import { useEffect, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { searchService } from "../services/search-service";
import type { CatalogResponse } from "../types/search";

export function useCatalogSearch(query: string, limit = 6, debounceMs = 300) {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    let active = true;

    if (trimmedQuery.length < 2) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      searchService.searchCatalog(trimmedQuery, limit)
        .then((response) => {
          if (active) setData(response);
        })
        .catch((err) => {
          if (active) setError(getSafeErrorMessage(err));
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, debounceMs);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, limit, debounceMs]);

  return {
    data,
    isLoading,
    error,
  };
}
