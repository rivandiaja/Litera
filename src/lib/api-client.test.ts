import { apiRequest } from "./api-client";
import { setStoredToken, clearStoredToken } from "./auth-storage";

describe("apiRequest", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
  });

  it("uses the configured API base URL and sends bearer token", async () => {
    setStoredToken("abc123");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/fields");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/fields",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer abc123");
  });

  it("maps non-2xx JSON errors into ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    ));

    await expect(apiRequest("/auth/me")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
  });

  it("maps network failures into safe UI errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(apiRequest("/fields")).rejects.toMatchObject({
      status: 0,
      message: "Tidak dapat terhubung ke server Litera. Pastikan backend berjalan.",
    });
  });
});
