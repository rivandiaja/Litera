import { apiRequest } from "../lib/api-client";
import type {
  AdminDashboardResponse,
  AdminDocumentListParams,
  AdminDocumentListResponse,
  AdminIndexingParams,
  AdminIndexingResponse,
  AdminProjectListParams,
  AdminProjectListResponse,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserRead,
  AdminUserUpdatePayload,
} from "../types/admin";

function toQuery(params: object = {}) {
  const query = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const adminService = {
  getDashboard() {
    return apiRequest<AdminDashboardResponse>("/admin/dashboard");
  },

  listUsers(params?: AdminUserListParams) {
    return apiRequest<AdminUserListResponse>(`/admin/users${toQuery(params)}`);
  },

  updateUser(userId: number, payload: AdminUserUpdatePayload) {
    return apiRequest<AdminUserRead>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  listProjects(params?: AdminProjectListParams) {
    return apiRequest<AdminProjectListResponse>(`/admin/projects${toQuery(params)}`);
  },

  listDocuments(params?: AdminDocumentListParams) {
    return apiRequest<AdminDocumentListResponse>(`/admin/documents${toQuery(params)}`);
  },

  listIndexing(params?: AdminIndexingParams) {
    return apiRequest<AdminIndexingResponse>(`/admin/indexing${toQuery(params)}`);
  },
};
