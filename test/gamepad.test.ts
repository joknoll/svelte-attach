// @vitest-environment jsdom
// The attachment tests use DOM focus and element clicks.
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { gamepadButton, isButtonPressed } from "../src/gamepad.ts";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function pad(buttons: boolean[], mapping = "standard"): Gamepad {
  return {
    mapping,
    buttons: buttons.map((pressed) => ({ pressed })),
  } as unknown as Gamepad;
}

describe("gamepad", () => {
  it("reads the first connected standard pad and rejects unknown mappings", () => {
    const buttons = Array(17).fill(false) as boolean[];
    buttons[0] = true;
    const current = pad(buttons);
    vi.stubGlobal("navigator", { getGamepads: () => [null, current] });
    expect(isButtonPressed("A")).toBe(true);
    expect(isButtonPressed("A", 0)).toBe(false);
    expect(isButtonPressed("HOME")).toBe(false);
    vi.stubGlobal("navigator", { getGamepads: () => [pad(buttons, "")] });
    expect(isButtonPressed("A")).toBe(false);
  });

  it("clicks a focused element once per press and stops polling on cleanup", () => {
    const buttons = Array(17).fill(false) as boolean[];
    vi.stubGlobal("navigator", { getGamepads: () => [pad(buttons)] });
    const queue: FrameRequestCallback[] = [];
    const request = vi.fn((callback: FrameRequestCallback) => {
      queue.push(callback);
      return queue.length;
    });
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    const click = vi.spyOn(button, "click");
    const cleanup = gamepadButton("A")(button);
    const frame = () => queue.shift()?.(0);

    frame();
    buttons[0] = true;
    frame();
    frame();
    expect(click).toHaveBeenCalledTimes(1);
    buttons[0] = false;
    frame();
    buttons[0] = true;
    frame();
    expect(click).toHaveBeenCalledTimes(2);

    if (typeof cleanup === "function") cleanup();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("passes the element first to onTrigger instead of clicking", () => {
    const buttons = Array(17).fill(false) as boolean[];
    vi.stubGlobal("navigator", { getGamepads: () => [pad(buttons)] });
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      queue.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    const click = vi.spyOn(button, "click");
    const onTrigger = vi.fn();
    const cleanup = gamepadButton("B", { onTrigger })(button);

    queue.shift()?.(0);
    buttons[1] = true;
    queue.shift()?.(0);
    expect(onTrigger).toHaveBeenCalledWith(
      button,
      expect.objectContaining({ mapping: "standard" }),
    );
    expect(click).not.toHaveBeenCalled();
    if (typeof cleanup === "function") cleanup();
  });

  it("activates an unfocused element only when it opts out of focus", () => {
    const buttons = Array(17).fill(false) as boolean[];
    vi.stubGlobal("navigator", { getGamepads: () => [pad(buttons)] });
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      queue.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const focusOnly = document.createElement("button");
    const anywhere = document.createElement("button");
    document.body.append(focusOnly, anywhere);
    const focusOnlyClick = vi.spyOn(focusOnly, "click");
    const anywhereClick = vi.spyOn(anywhere, "click");
    const cleanups = [
      gamepadButton("A")(focusOnly),
      gamepadButton("A", { requireFocus: false })(anywhere),
    ];

    queue.shift()?.(0);
    buttons[0] = true;
    queue.shift()?.(0);
    expect(focusOnlyClick).not.toHaveBeenCalled();
    expect(anywhereClick).toHaveBeenCalledOnce();
    for (const cleanup of cleanups) if (typeof cleanup === "function") cleanup();
  });

  it("activates one element per press: the focused one, else the newest", () => {
    const buttons = Array(17).fill(false) as boolean[];
    vi.stubGlobal("navigator", { getGamepads: () => [pad(buttons)] });
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      queue.push(callback),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const [older, focused, newer] = ["older", "focused", "newer"].map((name) => {
      const button = document.createElement("button");
      button.textContent = name;
      document.body.append(button);
      return button;
    });
    const clicks = [older, focused, newer].map((button) => vi.spyOn(button, "click"));
    const cleanups = [
      gamepadButton("A", { requireFocus: false })(older),
      gamepadButton("A")(focused),
      gamepadButton("A", { requireFocus: false })(newer),
    ];
    const press = () => {
      buttons[0] = false;
      queue.shift()?.(0);
      buttons[0] = true;
      queue.shift()?.(0);
    };

    focused.focus();
    press();
    expect(clicks.map((click) => click.mock.calls.length)).toEqual([0, 1, 0]);

    focused.blur();
    press();
    expect(clicks.map((click) => click.mock.calls.length)).toEqual([0, 1, 1]);
    for (const cleanup of cleanups) if (typeof cleanup === "function") cleanup();
  });

  it("validates arguments when the attachment is created", () => {
    // @ts-expect-error unknown button name
    expect(() => gamepadButton("Z")).toThrow(RangeError);
    expect(() => gamepadButton("A", { padIndex: -1 })).toThrow(RangeError);
  });
});
