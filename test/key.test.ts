// @vitest-environment jsdom
// The attachments dispatch real keyboard events through window listeners.
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { formatHint, hotkey, pressed } from "../src/key/index.ts";

afterEach(() => document.body.replaceChildren());

function press(init: KeyboardEventInit, type: "keydown" | "keyup" = "keydown"): void {
  window.dispatchEvent(new KeyboardEvent(type, init));
}

function button(): HTMLButtonElement {
  const element = document.createElement("button");
  document.body.append(element);
  return element;
}

describe("hotkey", () => {
  it("uses the latest matching hotkey and restores the previous one on cleanup", () => {
    const first = button();
    const second = button();
    const firstClick = vi.spyOn(first, "click");
    const secondClick = vi.spyOn(second, "click");
    const offFirst = hotkey("k")(first);
    const offSecond = hotkey("k")(second);

    press({ key: "k" });
    expect(firstClick).not.toHaveBeenCalled();
    expect(secondClick).toHaveBeenCalledOnce();
    expect(second.getAttribute("aria-keyshortcuts")).toBe("K");

    offSecond?.();
    press({ key: "k" });
    expect(firstClick).toHaveBeenCalledOnce();
    expect(second.hasAttribute("aria-keyshortcuts")).toBe(false);
    offFirst?.();
  });

  it("passes the element first to onTrigger instead of clicking", () => {
    const element = button();
    const click = vi.spyOn(element, "click");
    const onTrigger = vi.fn();
    const off = hotkey("shift+enter", { onTrigger })(element);

    press({ key: "Enter", shiftKey: true });
    expect(onTrigger).toHaveBeenCalledWith(element, expect.any(KeyboardEvent));
    expect(click).not.toHaveBeenCalled();
    off?.();
  });

  it("applies pressedClass only to the hotkey that fired, until release", () => {
    const loser = button();
    const winner = button();
    const offLoser = hotkey("mod+k", { pressedClass: "active" })(loser);
    const offWinner = hotkey("mod+k", { pressedClass: "active" })(winner);

    press({ key: "k", ctrlKey: true });
    expect(winner.classList.contains("active")).toBe(true);
    expect(loser.classList.contains("active")).toBe(false);

    press({ key: "Control" }, "keyup");
    expect(winner.classList.contains("active")).toBe(false);
    offWinner?.();
    offLoser?.();
  });

  it("formats named keys for ARIA and display", () => {
    const element = button();
    const off = hotkey(["f5", "home", "ctrl+end", "shift+space"])(element);
    expect(element.getAttribute("aria-keyshortcuts")).toBe("F5 Home Control+End Shift+Space");
    expect(formatHint(["f5", "ctrl+plus", "esc"])).toBe("F5 / Ctrl + + / Esc");
    off?.();
  });

  it("rejects malformed shortcuts at compile time and at runtime", () => {
    // @ts-expect-error unknown key name
    expect(() => hotkey("ctrl+esacpe")).toThrow('Unknown key "esacpe"');
    // @ts-expect-error the key must come last
    expect(() => hotkey("s+ctrl")).toThrow(TypeError);
    // @ts-expect-error + is written as "plus"
    expect(() => formatHint("ctrl++")).toThrow(TypeError);
    // @ts-expect-error missing key
    expect(() => formatHint("ctrl+")).toThrow(TypeError);
    expect(() => formatHint([])).toThrow(TypeError);

    const dynamic: string = "ctrl+nope";
    expect(() => hotkey(dynamic)).toThrow('Unknown key "nope"');
  });
});

describe("pressed", () => {
  it("tracks held state while ignoring composition", () => {
    const element = button();
    const off = pressed("ctrl+k")(element);
    press({ key: "k", ctrlKey: true, isComposing: true });
    expect(element.classList.contains("is-pressed")).toBe(false);
    press({ key: "k", ctrlKey: true });
    expect(element.classList.contains("is-pressed")).toBe(true);
    press({ key: "Control" }, "keyup");
    expect(element.classList.contains("is-pressed")).toBe(false);
    off?.();
  });

  it("accepts a lone modifier and leaves classes it did not add", () => {
    const kbd = document.createElement("kbd");
    kbd.classList.add("held");
    document.body.append(kbd);
    const off = pressed("shift", { className: "held" })(kbd);

    press({ key: "a" }, "keyup");
    expect(kbd.classList.contains("held")).toBe(true);
    off?.();
    expect(kbd.classList.contains("held")).toBe(true);

    kbd.classList.remove("held");
    const offAgain = pressed("shift", { className: "held" })(kbd);
    press({ key: "Shift", shiftKey: true });
    expect(kbd.classList.contains("held")).toBe(true);
    press({ key: "Shift" }, "keyup");
    expect(kbd.classList.contains("held")).toBe(false);
    offAgain?.();
  });
});
