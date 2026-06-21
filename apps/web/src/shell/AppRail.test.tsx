import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppRail } from "./AppRail.js";
import { navDestinations } from "./navigation";

const usePathnameMock = vi.fn(() => "/");

vi.mock("next/navigation", async () => ({
  usePathname: () => usePathnameMock(),
}));

describe("<AppRail />", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/");
  });

  it("renders every top-level destination with an accessible name", () => {
    render(<AppRail />);
    for (const d of navDestinations) {
      expect(screen.getByRole("link", { name: d.label })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("marks Home as aria-current on /", () => {
    usePathnameMock.mockReturnValue("/");
    render(<AppRail />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current");
  });

  it("marks Library as aria-current on /library and nested routes", () => {
    usePathnameMock.mockReturnValue("/library/abc");
    render(<AppRail />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("labels the nav landmark 'Primary' so SR users can distinguish rails", () => {
    render(<AppRail />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeInTheDocument();
  });
});
