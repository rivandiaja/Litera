import { apiRequest } from "../lib/api-client";
import type { FieldListResponse, FieldPayload, ResearchField } from "../types/field";

export interface FieldListParams {
  page?: number;
  page_size?: number;
  search?: string;
  include_inactive?: boolean;
}

function toQuery(params: FieldListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const fieldService = {
  list(params?: FieldListParams) {
    return apiRequest<FieldListResponse>(`/fields${toQuery(params)}`);
  },

  get(id: number) {
    return apiRequest<ResearchField>(`/fields/${id}`);
  },

  create(payload: FieldPayload) {
    return apiRequest<ResearchField>("/fields", {
      method: "POST",
      body: {
        description: "",
        icon: "BookOpen",
        is_active: true,
        ...payload,
      },
    });
  },

  update(id: number, payload: Partial<FieldPayload>) {
    return apiRequest<ResearchField>(`/fields/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number) {
    return apiRequest<void>(`/fields/${id}`, {
      method: "DELETE",
    });
  },
};
