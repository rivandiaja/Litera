import { render, screen } from "@testing-library/react";
import { StatusDot, cn } from "./ui";

describe("shared UI utilities", () => {
  it("joins class names with falsy values ignored", () => {
    expect(cn("bg-white", false, "text-slate-900")).toBe("bg-white text-slate-900");
  });

  it("renders a stable indexing status label", () => {
    render(<StatusDot status="indexed" />);

    expect(screen.getByText("Terindeks")).toBeInTheDocument();
  });
});
