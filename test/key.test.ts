// @vitest-environment jsdom
// The attachments dispatch real keyboard events through window listeners.
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { formatHint, hotkey, pressed } from "../src/key/index.ts";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

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

describe("matching across layouts", () => {
  function fires(keys: string, init: KeyboardEventInit, target: EventTarget = window): boolean {
    const onTrigger = vi.fn();
    const off = hotkey(keys, { onTrigger })(button());
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, ...init }));
    off?.();
    return onTrigger.mock.calls.length > 0;
  }

  it("ignores the Shift that types a symbol, but not Ctrl", () => {
    expect(fires("?", { key: "?", code: "Slash", shiftKey: true })).toBe(true);
    expect(fires("shift+?", { key: "?", code: "Slash", shiftKey: true })).toBe(true);
    expect(fires("?", { key: "?", code: "Slash", shiftKey: true, ctrlKey: true })).toBe(false);
    // AZERTY types digits with Shift.
    expect(fires("5", { key: "5", code: "Digit5", shiftKey: true })).toBe(true);
  });

  it("keeps Shift significant for letters", () => {
    expect(fires("k", { key: "K", code: "KeyK", shiftKey: true })).toBe(false);
    expect(fires("shift+k", { key: "K", code: "KeyK", shiftKey: true })).toBe(true);
  });

  it("matches letters and digits by physical key when the layout types something else", () => {
    expect(fires("shift+5", { key: "%", code: "Digit5", shiftKey: true })).toBe(true);
    expect(fires("5", { key: "%", code: "Digit5", shiftKey: true })).toBe(false);
    // AZERTY digit row, Cyrillic, and Option on Apple layouts.
    expect(fires("1", { key: "&", code: "Digit1" })).toBe(true);
    expect(fires("k", { key: "л", code: "KeyK" })).toBe(true);
    expect(fires("alt+k", { key: "˚", code: "KeyK", altKey: true })).toBe(true);
    expect(fires("alt+e", { key: "Dead", code: "KeyE", altKey: true })).toBe(true);
    expect(fires("e", { key: "Dead", code: "KeyE" })).toBe(false);
  });

  it("does not fall back when the key types another ASCII letter", () => {
    // AZERTY: the key in the US "A" position types "q".
    expect(fires("a", { key: "q", code: "KeyA" })).toBe(false);
    expect(fires("q", { key: "q", code: "KeyA" })).toBe(true);
  });

  it("accepts AltGr, and Option on Apple devices, for symbols", () => {
    const altGr = { key: "@", code: "KeyQ", ctrlKey: true, altKey: true, modifierAltGraph: true };
    expect(fires("@", altGr)).toBe(true);
    expect(fires("@", { key: "@", code: "KeyQ", altKey: true })).toBe(false);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Macintosh");
    expect(fires("@", { key: "@", code: "KeyL", altKey: true })).toBe(true);
  });

  it("only lets text-entry controls block hotkeys", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const text = document.createElement("input");
    const host = document.createElement("div");
    const shadowInput = document.createElement("input");
    host.attachShadow({ mode: "open" }).append(shadowInput);
    document.body.append(checkbox, text, host);

    expect(fires("k", { key: "k", code: "KeyK" }, checkbox)).toBe(true);
    expect(fires("k", { key: "k", code: "KeyK" }, text)).toBe(false);
    expect(fires("k", { key: "k", code: "KeyK" }, shadowInput)).toBe(false);
  });

  it("releases held state by physical key when Shift is released first", () => {
    const element = button();
    const off = pressed("?")(element);
    press({ key: "?", code: "Slash", shiftKey: true });
    expect(element.classList.contains("is-pressed")).toBe(true);
    press({ key: "Shift", code: "ShiftLeft" }, "keyup");
    expect(element.classList.contains("is-pressed")).toBe(true);
    press({ key: "/", code: "Slash" }, "keyup");
    expect(element.classList.contains("is-pressed")).toBe(false);
    off?.();
  });
});
