import { useCallback, useEffect, useState } from "react";
import { getSafeErrorMessage } from "../lib/api-error";
import { dashboardService } from "../services/dashboard-service";
import type { MyDashboardResponse } from "../types/dashboard";

export function useMyDashboard() {
  const [data, setData] = useState<MyDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await dashboardService.getMyDashboard());
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
    dashboardService.getMyDashboard()
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
