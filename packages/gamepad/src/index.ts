import type { Attachment } from "svelte/attachments";
import { GamepadButtonMap, type ButtonName } from "./buttons.ts";
import { isButtonPressed, registerButton, type GamepadButtonOptions } from "./polling.ts";

export { GamepadButtonMap, isButtonPressed };
export type { ButtonName, GamepadButtonOptions };

/** API availability is checked at import time. Permissions Policy can still block access. */
export const isSupported: boolean =
  typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";

/** A new press clicks the focused element itself unless `onPress` is provided. */
export function gamepadButton(
  button: ButtonName,
  options: GamepadButtonOptions = {},
): Attachment<HTMLElement> {
  return (element) => registerButton(element, button, options);
}
