import { useCallback, useEffect, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { adminService } from "../services/admin-service";
import type { AdminDashboardResponse } from "../types/admin";

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await adminService.getDashboard());
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    adminService.getDashboard()
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err) => {
        if (active) setError(getSafeErrorMessage(err));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, isLoading, error, retry: load };
}
