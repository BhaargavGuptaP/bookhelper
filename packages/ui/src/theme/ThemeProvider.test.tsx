import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ThemeProvider, useTheme, resolveAppTheme, themeStorageKey } from "./ThemeProvider.js";

function ThemeReadout(): React.JSX.Element {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <output data-testid="pref">{preference}</output>
      <output data-testid="resolved">{resolved}</output>
      <button type="button" onClick={() => setPreference("dark")}>
        go-dark
      </button>
      <button type="button" onClick={() => setPreference("high-contrast")}>
        go-hc
      </button>
    </div>
  );
}

describe("resolveAppTheme()", () => {
  it("maps system→dark when OS prefers dark", () => {
    expect(resolveAppTheme("system", true)).toBe("dark");
    expect(resolveAppTheme("system", false)).toBe("light");
  });

  it("passes through explicit choices", () => {
    expect(resolveAppTheme("dark", false)).toBe("dark");
    expect(resolveAppTheme("light", true)).toBe("light");
    expect(resolveAppTheme("high-contrast", false)).toBe("high-contrast");
  });
});

describe("<ThemeProvider />", () => {
  it("defaults preference=system and writes data-theme on <html>", async () => {
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("pref")).toHaveTextContent("system");
    // jsdom matchMedia stub → matches=false → resolved=light
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("persists explicit selections to localStorage and updates <html>", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("go-dark"));
    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByText("go-hc"));
    expect(window.localStorage.getItem(themeStorageKey)).toBe("high-contrast");
    expect(document.documentElement.getAttribute("data-theme")).toBe("high-contrast");
  });

  it("rehydrates from localStorage on mount", async () => {
    window.localStorage.setItem(themeStorageKey, "high-contrast");
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );
    // The effect runs after mount; assert after a microtask flush.
    await act(async () => {});
    expect(screen.getByTestId("pref")).toHaveTextContent("high-contrast");
    expect(screen.getByTestId("resolved")).toHaveTextContent("high-contrast");
  });

  it("ignores garbage stored values defensively", async () => {
    window.localStorage.setItem(themeStorageKey, "neon");
    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId("pref")).toHaveTextContent("system");
  });

  it("throws a useful error when useTheme() is used outside the provider", () => {
    // Suppress the React-thrown error so it doesn't pollute test output.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThemeReadout />)).toThrow(/useTheme/);
    spy.mockRestore();
  });
});
