import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { CollectionDetailPage } from "./CollectionDetailPage";
import type { User } from "../../types/auth";

const ownerUser: User = {
  id: 1,
  name: "Arif Budiman",
  student_number: "2021001234",
  email: "arif@mahasiswa.ac.id",
  study_program: "Teknik Informatika",
  class_name: "TI-4A",
  role: "student",
  is_active: true,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

let mockUser: User | null = ownerUser;

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}));

const navigate = vi.fn();
const appContext: AppContextType = {
  page: { name: "collection", collectionId: "1" },
  navigate,
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  isAdmin: false,
};

const projectPayload = {
  id: 1,
  title: "Perancangan Network Monitoring System",
  description: "Koleksi literatur jaringan",
  keywords: ["SNMP", "OLT"],
  visibility: "public",
  owner: { id: 1, name: "Arif Budiman", email: "arif@mahasiswa.ac.id", student_number: "2021001234" },
  field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
  document_count: 0,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

function renderPage() {
  return render(
    <AppContext.Provider value={appContext}>
      <CollectionDetailPage collectionId="1" />
    </AppContext.Provider>
  );
}

describe("CollectionDetailPage", () => {
  beforeEach(() => {
    mockUser = ownerUser;
    navigate.mockReset();
    vi.restoreAllMocks();
  });

  it("renders project detail from API and shows owner actions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(projectPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    renderPage();

    expect(await screen.findByRole("heading", { name: "Perancangan Network Monitoring System" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit koleksi/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hapus/i })).toBeInTheDocument();
  });

  it("hides owner actions for non-owner students", async () => {
    mockUser = { ...ownerUser, id: 2, email: "siti@mahasiswa.ac.id", name: "Siti Rahayu" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(projectPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    renderPage();

    expect(await screen.findByRole("heading", { name: "Perancangan Network Monitoring System" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit koleksi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hapus/i })).not.toBeInTheDocument();
  });

  it("confirms and sends delete request for owners", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(projectPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /hapus/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      "http://127.0.0.1:8000/api/v1/projects/1",
      expect.objectContaining({ method: "DELETE" })
    ));
    expect(navigate).toHaveBeenCalledWith({ name: "dashboard" });
  });
});
