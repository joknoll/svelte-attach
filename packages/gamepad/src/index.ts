import type { Attachment } from "svelte/attachments";
import { GamepadButtonMap, type ButtonName } from "./buttons.ts";
import { isButtonPressed, registerButton, type GamepadButtonOptions } from "./polling.ts";

export { GamepadButtonMap, isButtonPressed };
export type { ButtonName, GamepadButtonOptions };

export const isSupported: boolean =
  typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";

/** Activates a focused element when a standard gamepad button is newly pressed. */
export function gamepadButton(
  button: ButtonName,
  options: GamepadButtonOptions = {},
): Attachment<HTMLElement> {
  return (element) => registerButton(element, button, options);
}
