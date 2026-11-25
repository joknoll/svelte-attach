// @vitest-environment jsdom
// The attachment test needs a DOM element to exercise listener registration and cleanup.
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cancelHaptic, createPattern, haptic, triggerHaptic } from "../src/index.ts";

afterEach(() => vi.unstubAllGlobals());

describe("haptic", () => {
  it("copies native patterns and rejects invalid durations", () => {
    const input = [20, 40, 20];
    expect(createPattern(input)).toEqual(input);
    expect(createPattern(input)).not.toBe(input);
    expect(createPattern("success")).toEqual([25, 60, 40]);
    expect(() => createPattern([-1])).toThrow(RangeError);
    expect(() => createPattern([Number.NaN])).toThrow(RangeError);
  });

  it("uses native vibration and reports support at call time", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    expect(triggerHaptic("light")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([10]);
    expect(cancelHaptic()).toBe(true);
    expect(vibrate).toHaveBeenLastCalledWith(0);
  });

  it("removes its event listener on attachment cleanup", async () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    const button = document.createElement("button");
    document.body.append(button);
    const cleanup = haptic({ pattern: "medium", event: "pointerdown" })(button);
    await Promise.resolve();
    button.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(vibrate).toHaveBeenCalledTimes(1);
    if (typeof cleanup === "function") cleanup();
    button.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(vibrate).toHaveBeenCalledTimes(1);
    button.remove();
  });
});
