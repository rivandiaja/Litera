const FALLBACK_MESSAGE = "Terjadi kendala saat menghubungi server Litera.";

function normalizeDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") {
      return first.msg;
    }
  }
  if (detail && typeof detail === "object" && "message" in detail && typeof detail.message === "string") {
    return detail.message;
  }
  return FALLBACK_MESSAGE;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static fromResponse(status: number, payload: unknown) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : payload;
    return new ApiError(status, normalizeDetail(detail), detail);
  }

  static network() {
    return new ApiError(0, "Tidak dapat terhubung ke server Litera. Pastikan backend berjalan.");
  }
}

export function getSafeErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return FALLBACK_MESSAGE;
}
