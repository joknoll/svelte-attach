import type { Attachment } from "svelte/attachments";

/** CONTRACT: Standard Gamepad API indices denote physical button positions. */
export const GamepadButtonMap = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
  HOME: 16,
} as const;

export type ButtonName = keyof typeof GamepadButtonMap;

export interface GamepadButtonOptions<E extends HTMLElement = HTMLElement> {
  /** Replaces the default `element.click()`. */
  onTrigger?: (element: E, pad: Gamepad) => void;
  /** Gamepad slot to read. Defaults to the first occupied slot. */
  padIndex?: number;
}

interface Registration {
  element: HTMLElement;
  button: ButtonName;
  trigger: (pad: Gamepad) => void;
  padIndex: number | undefined;
  pressed: boolean;
}

const registrations = new Set<Registration>();
let frame = 0;

/** API availability only. Permissions Policy can still block access. */
export function isSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";
}

function connectedPad(pads: readonly (Gamepad | null)[], index?: number): Gamepad | null {
  const pad = index === undefined ? pads.find((entry) => entry !== null) : pads[index];
  return pad?.mapping === "standard" ? pad : null;
}

/** Uses the first occupied slot by default and returns false for a nonstandard mapping. */
export function isButtonPressed(button: ButtonName, padIndex?: number): boolean {
  if (!isSupported()) return false;
  const pad = connectedPad(navigator.getGamepads(), padIndex);
  return pad?.buttons[GamepadButtonMap[button]]?.pressed ?? false;
}

function poll(): void {
  try {
    // FIXME: If Permissions Policy blocks gamepad access, this throws again on every frame.
    const pads = navigator.getGamepads();
    for (const registration of registrations) {
      const { element, button, trigger, padIndex } = registration;
      const pad = connectedPad(pads, padIndex);
      const pressed = pad?.buttons[GamepadButtonMap[button]]?.pressed ?? false;
      const newlyPressed = pressed && !registration.pressed;
      // Track presses without focus so focusing while a button is held does not activate.
      registration.pressed = pressed;
      // FIXME: A focused shadow-root element is skipped because the document reports its host.
      if (
        newlyPressed &&
        pad &&
        document.visibilityState !== "hidden" &&
        element.isConnected &&
        element === document.activeElement &&
        !element.matches(":disabled") &&
        !element.closest("[inert]")
      ) {
        trigger(pad);
      }
    }
  } finally {
    // FIXME: A callback that replaces the last registration can start a second polling loop.
    frame = registrations.size > 0 ? requestAnimationFrame(poll) : 0;
  }
}

/**
 * Clicks the element, or calls `onTrigger`, when a standard gamepad button is newly pressed
 * while the element itself has focus.
 *
 * @example
 * ```svelte
 * <button {@attach gamepadButton("A")} onclick={confirm}>Confirm</button>
 * ```
 */
export function gamepadButton<E extends HTMLElement = HTMLElement>(
  button: ButtonName,
  options: GamepadButtonOptions<E> = {},
): Attachment<E> {
  if (!Object.hasOwn(GamepadButtonMap, button)) {
    throw new RangeError(`Unknown gamepad button: ${String(button)}`);
  }
  const { onTrigger, padIndex } = options;
  if (padIndex !== undefined && (!Number.isInteger(padIndex) || padIndex < 0)) {
    throw new RangeError("Gamepad padIndex must be a non-negative integer.");
  }

  return (element) => {
    if (!isSupported() || typeof requestAnimationFrame !== "function") return;

    const registration: Registration = {
      element,
      button,
      trigger: (pad) => (onTrigger ? onTrigger(element, pad) : element.click()),
      padIndex,
      pressed: false,
    };
    registrations.add(registration);
    if (registrations.size === 1) frame = requestAnimationFrame(poll);

    return () => {
      registrations.delete(registration);
      if (registrations.size === 0) cancelAnimationFrame(frame);
    };
  };
}
