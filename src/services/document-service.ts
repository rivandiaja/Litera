import { apiRequest, getApiBaseUrl } from "../lib/api-client";
import type {
  DocumentDetail,
  DocumentListParams,
  DocumentListResponse,
  DocumentRead,
  DocumentUpdatePayload,
  DocumentUploadResponse,
} from "../types/document";

function toQuery(params: DocumentListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function getDocumentFileUrl(documentId: number) {
  return `${getApiBaseUrl()}/documents/${documentId}/file`;
}

async function openPdfBlob(blob: Blob, filename?: string) {
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(pdfBlob);
  const openedWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

  if (!openedWindow) {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename || "litera-document.pdf";
    anchor.rel = "noopener noreferrer";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return objectUrl;
}

export const documentService = {
  listProjectDocuments(projectId: number, params?: DocumentListParams) {
    return apiRequest<DocumentListResponse>(`/projects/${projectId}/documents${toQuery(params)}`);
  },

  uploadProjectDocuments(projectId: number, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return apiRequest<DocumentUploadResponse>(`/projects/${projectId}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  getDocument(documentId: number) {
    return apiRequest<DocumentDetail>(`/documents/${documentId}`);
  },

  fetchDocumentFileBlob(documentId: number) {
    return apiRequest<Blob>(`/documents/${documentId}/file`, {
      responseType: "blob",
    });
  },

  async openDocumentFile(documentId: number, filename?: string) {
    const blob = await this.fetchDocumentFileBlob(documentId);
    return openPdfBlob(blob, filename);
  },

  updateDocumentTitle(documentId: number, payload: DocumentUpdatePayload) {
    return apiRequest<DocumentRead>(`/documents/${documentId}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deleteDocument(documentId: number) {
    return apiRequest<void>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  reindexDocument(documentId: number) {
    return apiRequest<DocumentRead>(`/documents/${documentId}/reindex`, {
      method: "POST",
    });
  },
};
