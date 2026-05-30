import { apiRequest } from "../lib/api-client";
import type { ProjectListResponse, ProjectPayload, ProjectVisibility, ResearchProject } from "../types/project";

export interface ProjectListParams {
  page?: number;
  page_size?: number;
  search?: string;
  field_id?: number;
  visibility?: ProjectVisibility;
  owner_id?: number;
  sort_by?: "newest" | "oldest" | "title_asc" | "title_desc";
}

function toQuery(params: ProjectListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const projectService = {
  list(params?: ProjectListParams) {
    return apiRequest<ProjectListResponse>(`/projects${toQuery(params)}`);
  },

  listMine(params?: ProjectListParams) {
    return apiRequest<ProjectListResponse>(`/projects/me${toQuery(params)}`);
  },

  get(id: number) {
    return apiRequest<ResearchProject>(`/projects/${id}`);
  },

  create(payload: ProjectPayload) {
    return apiRequest<ResearchProject>("/projects", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: Partial<ProjectPayload>) {
    return apiRequest<ResearchProject>(`/projects/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number) {
    return apiRequest<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};
