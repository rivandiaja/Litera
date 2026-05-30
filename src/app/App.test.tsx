import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the login screen smoke test", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: /masuk ke litera/i })).toBeInTheDocument();
    expect(screen.getByText(/selamat datang kembali/i)).toBeInTheDocument();
  });
});
