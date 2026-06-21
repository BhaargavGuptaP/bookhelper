import { describe, expect, it } from "vitest";
import { isEditableTarget, resolveReaderIntent, type KeyChord } from "./keyboard.js";

const NONE: Omit<KeyChord, "key"> = {
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

function chord(key: string, over: Partial<KeyChord> = {}): KeyChord {
  return { ...NONE, key, ...over };
}

describe("resolveReaderIntent", () => {
  it("maps navigation keys", () => {
    expect(resolveReaderIntent(chord("ArrowRight"))).toBe("next-page");
    expect(resolveReaderIntent(chord("ArrowDown"))).toBe("next-page");
    expect(resolveReaderIntent(chord("PageDown"))).toBe("next-page");
    expect(resolveReaderIntent(chord("ArrowLeft"))).toBe("previous-page");
    expect(resolveReaderIntent(chord("ArrowUp"))).toBe("previous-page");
    expect(resolveReaderIntent(chord("PageUp"))).toBe("previous-page");
    expect(resolveReaderIntent(chord("Home"))).toBe("first-page");
    expect(resolveReaderIntent(chord("End"))).toBe("last-page");
  });

  it("maps Space / Shift+Space to page turns", () => {
    expect(resolveReaderIntent(chord(" "))).toBe("next-page");
    expect(resolveReaderIntent(chord(" ", { shiftKey: true }))).toBe("previous-page");
  });

  it("maps Cmd/Ctrl zoom shortcuts", () => {
    expect(resolveReaderIntent(chord("=", { metaKey: true }))).toBe("zoom-in");
    expect(resolveReaderIntent(chord("+", { ctrlKey: true }))).toBe("zoom-in");
    expect(resolveReaderIntent(chord("-", { metaKey: true }))).toBe("zoom-out");
    expect(resolveReaderIntent(chord("0", { ctrlKey: true }))).toBe("zoom-reset");
  });

  it("does not hijack other modified keys", () => {
    expect(resolveReaderIntent(chord("s", { metaKey: true }))).toBeNull();
    expect(resolveReaderIntent(chord("a", { ctrlKey: true }))).toBeNull();
  });

  it("maps single-key affordances and dismiss/focus", () => {
    expect(resolveReaderIntent(chord("o"))).toBe("toggle-toc");
    expect(resolveReaderIntent(chord("t"))).toBe("cycle-theme");
    expect(resolveReaderIntent(chord("f"))).toBe("toggle-focus-mode");
    expect(resolveReaderIntent(chord("F11"))).toBe("toggle-focus-mode");
    expect(resolveReaderIntent(chord("Escape"))).toBe("dismiss");
    expect(resolveReaderIntent(chord("z"))).toBeNull();
  });
});

describe("isEditableTarget", () => {
  it("detects form fields and contenteditable", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const div = document.createElement("div");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(div)).toBe(false);
    expect(isEditableTarget(editable)).toBe(true);
    expect(isEditableTarget(null)).toBe(false);
  });
});
