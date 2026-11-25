import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";

/** CONTRACT: Entries alternate vibration and pause durations in milliseconds, starting with vibration. */
export const patterns = {
  light: [10],
  medium: [25],
  heavy: [45],
  soft: [35],
  rigid: [12],
  selection: [8],
  success: [25, 60, 40],
  warning: [35, 70, 35],
  error: [35, 35, 35, 35, 35],
  nudge: [50, 60, 30],
  buzz: [300],
} as const satisfies Record<string, readonly number[]>;

export type HapticPreset = keyof typeof patterns;
export type HapticPattern = HapticPreset | number | readonly number[];

export interface HapticOptions {
  /** Event that triggers the vibration. Defaults to `"click"`. */
  on?: keyof HTMLElementEventMap;
}

/** Whether `navigator.vibrate` exists. The browser can still decline a request. */
export function isSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Returns a mutable copy. Empty patterns and negative or non-finite durations throw a RangeError. */
export function createPattern(input: HapticPattern = "medium"): number[] {
  const values =
    typeof input === "string" ? patterns[input] : typeof input === "number" ? [input] : input;
  if (!values || values.length === 0) {
    throw new RangeError("A haptic pattern must contain at least one duration.");
  }
  for (const duration of values) {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError("Haptic durations must be finite, non-negative numbers.");
    }
  }
  return [...values];
}

/** For valid patterns, false means the API is unavailable or the browser declined the request. */
export function triggerHaptic(input: HapticPattern = "medium"): boolean {
  const pattern = createPattern(input);
  return isSupported() ? navigator.vibrate(pattern) : false;
}

/** Requests cancellation of the current browser vibration, including requests made outside this package. */
export function cancelHaptic(): boolean {
  return isSupported() ? navigator.vibrate(0) : false;
}

/**
 * Vibrates when the element receives `on` (default `"click"`). Detaching lets an ongoing
 * vibration finish because cancellation would affect other callers.
 *
 * @example
 * ```svelte
 * <button {@attach haptic("selection", { on: "pointerdown" })}>Select</button>
 * ```
 */
export function haptic(
  pattern: HapticPattern = "medium",
  options: HapticOptions = {},
): Attachment<HTMLElement> {
  const durations = createPattern(pattern);
  const event = options.on ?? "click";
  return (element) => on(element, event, () => triggerHaptic(durations));
}
