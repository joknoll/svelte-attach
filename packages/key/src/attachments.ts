import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";
import {
  register,
  parseShortcuts,
  matches,
  normalizeKeys,
  releasesShortcut,
  formatAriaShortcuts,
} from "./dispatcher.ts";
import type { ParsedShortcut } from "./dispatcher.ts";

export interface HotkeyOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  ignoreInputs?: boolean;
  ignoreRepeat?: boolean;
}

export type HotkeyTrigger = (e: KeyboardEvent, node: HTMLElement) => void;

/**
 * Attachment that fires `onTrigger` (or `node.click()`) when one of `keys` is pressed.
 * Sets `aria-keyshortcuts` on the element and restores the prior value on cleanup.
 *
 * @example
 * ```svelte
 * <button {@attach hotkey("mod+s", save)}>Save</button>
 * ```
 */
export function hotkey(
  keys: string | string[],
  onTrigger?: HotkeyTrigger,
  options?: HotkeyOptions,
): Attachment<HTMLElement> {
  return (node: HTMLElement) => {
    const {
      preventDefault = true,
      stopPropagation = false,
      ignoreInputs = true,
      ignoreRepeat = true,
    } = options ?? {};

    const raw = normalizeKeys(keys);
    const shortcuts = parseShortcuts(raw);
    const prevAria = node.getAttribute("aria-keyshortcuts");
    node.setAttribute("aria-keyshortcuts", formatAriaShortcuts(shortcuts));

    const unregister = register({
      node,
      consume: true,
      shortcuts,
      handler: (e: KeyboardEvent) => {
        if (preventDefault) e.preventDefault();
        if (stopPropagation) e.stopPropagation();
        if (onTrigger) onTrigger(e, node);
        else node.click();
      },
      ignoreInputs,
      ignoreRepeat,
    });

    return () => {
      unregister();
      if (prevAria === null) node.removeAttribute("aria-keyshortcuts");
      else node.setAttribute("aria-keyshortcuts", prevAria);
    };
  };
}

/**
 * Attachment that adds `className` while one of `keys` is held, removes it on keyup.
 *
 * @example
 * ```svelte
 * <button {@attach hotkey("mod+s", save)} {@attach pressed("mod+s")}>Save</button>
 * ```
 */
export function pressed(
  keys: string | string[],
  className = "is-pressed",
): Attachment<HTMLElement> {
  return (node: HTMLElement) => {
    const shortcuts = parseShortcuts(normalizeKeys(keys));
    const active = new Set<ParsedShortcut>();

    const clear = () => {
      active.clear();
      node.classList.remove(className);
    };

    const offDown = register({
      node,
      consume: false,
      shortcuts,
      handler: (event) => {
        for (const shortcut of shortcuts) {
          if (matches(event, shortcut)) active.add(shortcut);
        }
        node.classList.add(className);
      },
      ignoreInputs: true,
      ignoreRepeat: true,
    });

    const offUp = on(window, "keyup", (event: KeyboardEvent) => {
      for (const shortcut of active) {
        if (releasesShortcut(event, shortcut)) active.delete(shortcut);
      }
      if (active.size === 0) node.classList.remove(className);
    });

    const offBlur = on(window, "blur", clear);

    return () => {
      offDown();
      offUp();
      offBlur();
      clear();
    };
  };
}
