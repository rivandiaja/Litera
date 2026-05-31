import { clearStoredToken, setStoredToken } from "../lib/auth-storage";
import { adminService } from "./admin-service";

describe("adminService", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
  });

  it("serializes admin user filters and sends the bearer token", async () => {
    setStoredToken("admin-token");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        items: [],
        pagination: { page: 2, page_size: 8, total: 0, total_pages: 0 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await adminService.listUsers({
      search: "siti",
      role: "student",
      is_active: false,
      page: 2,
      page_size: 8,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/admin/users?search=siti&role=student&is_active=false&page=2&page_size=8",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("updates active status without exposing password or role mutation fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: 2,
        name: "Siti Rahma",
        student_number: "2021002",
        email: "siti@mahasiswa.ac.id",
        study_program: "Teknik Informatika",
        class_name: "TI-4A",
        role: "student",
        is_active: false,
        projects_count: 1,
        documents_count: 2,
        created_at: "2026-01-01T00:00:00",
        updated_at: "2026-01-01T00:00:00",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await adminService.updateUser(2, { is_active: false });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/admin/users/2");
    expect(request.method).toBe("PATCH");
    expect(JSON.parse(String(request.body))).toEqual({ is_active: false });
  });

  it("maps backend errors through ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    ));

    await expect(adminService.getDashboard()).rejects.toMatchObject({
      status: 403,
      message: "Admin access required",
    });
  });
});
