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
  pattern?: HapticPattern;
  event?: keyof HTMLElementEventMap;
}

/** Whether `navigator.vibrate` is callable at module evaluation time. */
export const isSupported: boolean =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

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
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
    ? navigator.vibrate(pattern)
    : false;
}

/** Requests cancellation of the current browser vibration, including requests made outside this package. */
export function cancelHaptic(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
    ? navigator.vibrate(0)
    : false;
}

/** Cleanup lets ongoing vibration continue because cancellation affects other callers. */
export function haptic(options: HapticOptions = {}): Attachment<HTMLElement> {
  const pattern = createPattern(options.pattern);
  return (element) => on(element, options.event ?? "click", () => triggerHaptic(pattern));
}
