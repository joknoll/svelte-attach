import { GamepadButtonMap, type ButtonName } from "./buttons.ts";

export interface GamepadButtonOptions {
  padIndex?: number;
  onPress?: (pad: Gamepad, element: HTMLElement) => void;
}

interface Registration {
  element: HTMLElement;
  button: ButtonName;
  options: GamepadButtonOptions;
  pressed: boolean;
}

const registrations = new Set<Registration>();
let frame = 0;

function connectedPad(pads: readonly (Gamepad | null)[], index?: number): Gamepad | null {
  const pad = index === undefined ? pads.find((entry) => entry !== null) : pads[index];
  return pad?.mapping === "standard" ? pad : null;
}

export function isButtonPressed(button: ButtonName, padIndex?: number): boolean {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
    return false;
  }
  const pad = connectedPad(navigator.getGamepads(), padIndex);
  return pad?.buttons[GamepadButtonMap[button]]?.pressed ?? false;
}

function poll(): void {
  try {
    const pads = navigator.getGamepads();
    for (const registration of registrations) {
      const { element, button, options } = registration;
      const pad = connectedPad(pads, options.padIndex);
      const pressed = pad?.buttons[GamepadButtonMap[button]]?.pressed ?? false;
      const newlyPressed = pressed && !registration.pressed;
      registration.pressed = pressed;
      if (
        newlyPressed &&
        pad &&
        document.visibilityState !== "hidden" &&
        element.isConnected &&
        element === document.activeElement &&
        !element.matches(":disabled") &&
        !element.closest("[inert]")
      ) {
        if (options.onPress) options.onPress(pad, element);
        else element.click();
      }
    }
  } finally {
    frame = registrations.size > 0 ? requestAnimationFrame(poll) : 0;
  }
}

export function registerButton(
  element: HTMLElement,
  button: ButtonName,
  options: GamepadButtonOptions,
): () => void {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.getGamepads !== "function" ||
    typeof requestAnimationFrame !== "function"
  ) {
    return () => {};
  }

  const registration: Registration = { element, button, options, pressed: false };
  registrations.add(registration);
  if (registrations.size === 1) frame = requestAnimationFrame(poll);

  return () => {
    registrations.delete(registration);
    if (registrations.size === 0) cancelAnimationFrame(frame);
  };
}
