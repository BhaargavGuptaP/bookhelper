import { describe, expect, it } from "vitest";
import { canTransition, isInteractive, isTerminal, lifecycleTransitions } from "./lifecycle.js";

describe("lifecycle FSM", () => {
  it("only allows transitions enumerated in lifecycleTransitions", () => {
    for (const [from, tos] of Object.entries(lifecycleTransitions)) {
      for (const to of tos) {
        expect(canTransition(from as keyof typeof lifecycleTransitions, to)).toBe(true);
      }
    }
  });

  it("rejects unenumerated transitions", () => {
    expect(canTransition("ready", "idle")).toBe(false);
    expect(canTransition("closed", "ready")).toBe(false);
    expect(canTransition("closed", "opening")).toBe(false);
  });

  it("classifies interactive vs terminal states", () => {
    expect(isInteractive("ready")).toBe(true);
    expect(isInteractive("opening")).toBe(false);
    expect(isTerminal("closed")).toBe(true);
    expect(isTerminal("ready")).toBe(false);
  });
});
