import { render, screen } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { ResearchFieldsPage } from "./ResearchFieldsPage";
import type { User } from "../../types/auth";

const adminUser: User = {
  id: 99,
  name: "Admin Litera",
  student_number: "ADM001",
  email: "admin@litera.ac.id",
  study_program: "Teknik Informatika",
  class_name: "ADMIN",
  role: "admin",
  is_active: true,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

let mockUser: User | null = adminUser;

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const appContext: AppContextType = {
  page: { name: "fields" },
  navigate: vi.fn(),
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged: vi.fn(),
  isAdmin: true,
};

function renderPage() {
  return render(
    <AppContext.Provider value={appContext}>
      <ResearchFieldsPage />
    </AppContext.Provider>
  );
}

describe("ResearchFieldsPage", () => {
  beforeEach(() => {
    mockUser = adminUser;
    vi.restoreAllMocks();
  });

  it("renders fields from API and shows admin controls for admin users", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        items: [{
          id: 1,
          name: "Jaringan Komputer",
          slug: "jaringan-komputer",
          description: "Monitoring jaringan dan SNMP",
          icon: "Network",
          is_active: true,
          project_count: 2,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    renderPage();

    expect(screen.getByText(/memuat bidang penelitian/i)).toBeInTheDocument();
    expect(await screen.findByText("Jaringan Komputer")).toBeInTheDocument();
    expect(screen.getByTitle("Edit bidang")).toBeInTheDocument();
    expect(screen.getByTitle("Hapus bidang")).toBeInTheDocument();
  });

  it("hides admin controls for student users", async () => {
    mockUser = { ...adminUser, role: "student", id: 1 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        items: [{
          id: 1,
          name: "Internet of Things",
          slug: "iot",
          description: "Sensor dan embedded system",
          icon: "Cpu",
          is_active: true,
          project_count: 1,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    renderPage();

    expect(await screen.findByText("Internet of Things")).toBeInTheDocument();
    expect(screen.queryByTitle("Edit bidang")).not.toBeInTheDocument();
  });

  it("shows API error without falling back to mock data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Server gagal memuat bidang" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    ));

    renderPage();

    expect(await screen.findByText("Server gagal memuat bidang")).toBeInTheDocument();
    expect(screen.queryByText("Jaringan Komputer")).not.toBeInTheDocument();
  });
});
