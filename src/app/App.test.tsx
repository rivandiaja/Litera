import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the login screen smoke test", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /masuk ke litera/i })).toBeInTheDocument();
    expect(screen.getByText(/selamat datang kembali/i)).toBeInTheDocument();
  });
});
