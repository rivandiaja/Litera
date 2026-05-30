import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/auth-storage";
import type { User } from "../types/auth";

const demoUser: User = {
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

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.isAuthenticated ? auth.user?.name : "anon"}</span>
      <button onClick={() => auth.login({ email: "arif@mahasiswa.ac.id", password: "StudentDemo123!" })}>login</button>
      <button onClick={auth.logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
  });

  it("stores token on login and clears it on logout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "token-1", token_type: "bearer", user: demoUser }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText("anon");

    fireEvent.click(screen.getByRole("button", { name: "login" }));
    await screen.findByText("Arif Budiman");
    expect(getStoredToken()).toBe("token-1");

    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    expect(screen.getByText("anon")).toBeInTheDocument();
    expect(getStoredToken()).toBeNull();
  });

  it("loads an existing token through /auth/me", async () => {
    setStoredToken("existing-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(demoUser), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    render(<AuthProvider><Probe /></AuthProvider>);

    await screen.findByText("Arif Budiman");
    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/auth/me",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
  });

  it("clears an invalid existing token", async () => {
    setStoredToken("expired-token");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Token invalid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    ));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(getStoredToken()).toBeNull());
    expect(screen.getByText("anon")).toBeInTheDocument();
  });
});
