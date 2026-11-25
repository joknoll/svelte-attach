import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";
import { register } from "./dispatcher.ts";
import {
  formatAria,
  matches,
  parseShortcuts,
  releases,
  type ParsedShortcut,
  type Shortcut,
} from "./shortcut.ts";

export { formatHint } from "./shortcut.ts";
export type { Shortcut } from "./shortcut.ts";

export interface HotkeyOptions<E extends HTMLElement = HTMLElement> {
  /** Replaces the default `element.click()`. */
  onTrigger?: (element: E, event: KeyboardEvent) => void;
  /** Added when this hotkey fires and removed when the shortcut is released. */
  pressedClass?: string;
  /** Defaults to true. */
  preventDefault?: boolean;
  stopPropagation?: boolean;
  /**
   * Defaults to true: shortcuts are ignored while a text field, select, radio, range or editable
   * element has focus. Checkboxes and buttons do not block them.
   */
  ignoreInputs?: boolean;
  /** Defaults to true. */
  ignoreRepeat?: boolean;
}

export interface PressedOptions {
  /** Defaults to `"is-pressed"`. */
  className?: string;
  /** Defaults to true. */
  ignoreInputs?: boolean;
}

interface HeldState {
  press(event: KeyboardEvent, shortcuts: readonly ParsedShortcut[]): void;
  stop(): void;
}

function trackHeld(element: HTMLElement, className: string): HeldState {
  // Maps each held shortcut to the `code` of the key that started it. Releasing Shift before `/`
  // makes the keyup report "/" instead of "?", so the physical key is what identifies it.
  const active = new Map<ParsedShortcut, string>();
  // Only removes a class this tracker added, so classes set elsewhere survive.
  const release = (event?: KeyboardEvent): void => {
    if (active.size === 0) return;
    for (const [shortcut, code] of active) {
      if (!event || (code !== "" && event.code === code) || releases(event, shortcut)) {
        active.delete(shortcut);
      }
    }
    if (active.size === 0) element.classList.remove(className);
  };
  const offUp = on(window, "keyup", release);
  // Keyup never arrives when focus leaves the window mid-press.
  const offBlur = on(window, "blur", () => release());

  return {
    press(event, shortcuts) {
      for (const shortcut of shortcuts) {
        if (matches(event, shortcut)) active.set(shortcut, event.code);
      }
      element.classList.add(className);
    },
    stop() {
      offUp();
      offBlur();
      release();
    },
  };
}

/**
 * Clicks the element, or calls `onTrigger`, when a shortcut is pressed anywhere on the page.
 * When several attached elements share a shortcut, the most recently attached eligible one runs.
 * Sets `aria-keyshortcuts` and restores the previous value on detach.
 *
 * @example
 * ```svelte
 * <button {@attach hotkey("mod+s", { pressedClass: "active" })} onclick={save}>Save</button>
 * ```
 */
export function hotkey<const S extends string, E extends HTMLElement = HTMLElement>(
  keys: Shortcut<S> | readonly Shortcut<S>[],
  options: HotkeyOptions<E> = {},
): Attachment<E> {
  const {
    onTrigger,
    pressedClass,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
    ignoreRepeat = true,
  } = options;
  const shortcuts = parseShortcuts(keys);
  const aria = formatAria(shortcuts);

  return (element) => {
    const held = pressedClass ? trackHeld(element, pressedClass) : undefined;
    // FIXME: Restoring prior ARIA leaves stale shortcuts when overlapping hotkeys detach out of order.
    const previousAria = element.getAttribute("aria-keyshortcuts");
    element.setAttribute("aria-keyshortcuts", aria);

    const unregister = register({
      element,
      shortcuts,
      consume: true,
      ignoreInputs,
      ignoreRepeat,
      handler: (event) => {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        held?.press(event, shortcuts);
        if (onTrigger) onTrigger(element, event);
        else element.click();
      },
    });

    return () => {
      unregister();
      held?.stop();
      if (previousAria === null) element.removeAttribute("aria-keyshortcuts");
      else element.setAttribute("aria-keyshortcuts", previousAria);
    };
  };
}

/**
 * Adds a class while a shortcut is held, without triggering anything. A lone modifier such as
 * `"mod"` or `"shift"` is a valid shortcut here. Use `hotkey`'s `pressedClass` for elements
 * that also activate.
 */
export function pressed<const S extends string>(
  keys: Shortcut<S> | readonly Shortcut<S>[],
  options: PressedOptions = {},
): Attachment<HTMLElement> {
  const { className = "is-pressed", ignoreInputs = true } = options;
  const shortcuts = parseShortcuts(keys);

  return (element) => {
    const held = trackHeld(element, className);
    const unregister = register({
      element,
      shortcuts,
      consume: false,
      ignoreInputs,
      ignoreRepeat: true,
      handler: (event) => held.press(event, shortcuts),
    });
    return () => {
      unregister();
      held.stop();
    };
  };
}
