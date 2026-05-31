import { apiRequest } from "../lib/api-client";
import type { MyDashboardResponse, RepositoryStats } from "../types/dashboard";

export const dashboardService = {
  getMyDashboard() {
    return apiRequest<MyDashboardResponse>("/dashboard/me");
  },

  getRepositoryStats() {
    return apiRequest<RepositoryStats>("/dashboard/repository-stats");
  },
};
