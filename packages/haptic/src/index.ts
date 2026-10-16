import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";

/** Timing patterns accepted by the Web Vibration API, in milliseconds. */
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

export const isSupported: boolean =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/** Resolves a preset or validates a native vibration pattern. */
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

/** Returns false when vibration is unavailable or the browser declines it. */
export function triggerHaptic(input: HapticPattern = "medium"): boolean {
  const pattern = createPattern(input);
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
    ? navigator.vibrate(pattern)
    : false;
}

/** Cancels the current device vibration, including vibrations started elsewhere. */
export function cancelHaptic(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
    ? navigator.vibrate(0)
    : false;
}

/** Triggers a native vibration pattern when an element receives an event. */
export function haptic(options: HapticOptions = {}): Attachment<HTMLElement> {
  const pattern = createPattern(options.pattern);
  return (element) => on(element, options.event ?? "click", () => triggerHaptic(pattern));
}
