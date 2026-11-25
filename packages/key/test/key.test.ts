// @vitest-environment jsdom
// The attachments register DOM listeners and mutate element attributes and classes.
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { formatHint, hotkey, pressed } from "../src/index.ts";

afterEach(() => document.body.replaceChildren());

describe("key attachments", () => {
  it("uses the latest matching hotkey and restores the previous one on cleanup", () => {
    const first = document.createElement("button");
    const second = document.createElement("button");
    document.body.append(first, second);
    const firstClick = vi.spyOn(first, "click");
    const secondClick = vi.spyOn(second, "click");
    const offFirst = hotkey("k")(first);
    const offSecond = hotkey("k")(second);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(firstClick).not.toHaveBeenCalled();
    expect(secondClick).toHaveBeenCalledOnce();
    expect(second.getAttribute("aria-keyshortcuts")).toBe("K");

    if (typeof offSecond === "function") offSecond();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(firstClick).toHaveBeenCalledOnce();
    expect(second.hasAttribute("aria-keyshortcuts")).toBe(false);
    if (typeof offFirst === "function") offFirst();
  });

  it("tracks pressed state while ignoring composition", () => {
    const button = document.createElement("button");
    document.body.append(button);
    const off = pressed("ctrl+k")(button);
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        isComposing: true,
      }),
    );
    expect(button.classList.contains("is-pressed")).toBe(false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    expect(button.classList.contains("is-pressed")).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "Control" }));
    expect(button.classList.contains("is-pressed")).toBe(false);
    if (typeof off === "function") off();
  });

  it("rejects shortcuts with missing or multiple keys", () => {
    expect(() => formatHint("ctrl+")).toThrow(TypeError);
    expect(() => formatHint("ctrl+s+x")).toThrow(TypeError);
  });
});
