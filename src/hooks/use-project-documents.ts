import { useCallback, useEffect, useMemo, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { documentService } from "../services/document-service";
import type { DocumentRead } from "../types/document";
import type { PaginationMeta } from "../types/pagination";
import { useIndexingPolling } from "./use-indexing-polling";

interface LoadOptions {
  silent?: boolean;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  page_size: 100,
  total: 0,
  total_pages: 0,
};

export function useProjectDocuments(projectId: number | null, refreshKey = 0) {
  const [documents, setDocuments] = useState<DocumentRead[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (options: LoadOptions = {}) => {
    if (!projectId) {
      setDocuments([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    if (!options.silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await documentService.listProjectDocuments(projectId, { page: 1, page_size: 100 });
      setDocuments(response.items);
      setPagination(response.pagination);
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments, refreshKey]);

  const hasIndexingInProgress = useMemo(
    () => documents.some((document) => document.index_status === "pending" || document.index_status === "processing"),
    [documents]
  );

  useIndexingPolling({
    enabled: Boolean(projectId && hasIndexingInProgress),
    intervalMs: 3_000,
    onPoll: () => loadDocuments({ silent: true }),
  });

  return {
    documents,
    pagination,
    isLoading,
    error,
    refresh: loadDocuments,
    hasIndexingInProgress,
  };
}
