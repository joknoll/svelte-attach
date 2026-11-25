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
 * The most recently attached eligible match runs, clicking the element by default.
 * A single attachment sets `aria-keyshortcuts` and restores the original value on detach.
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
    // FIXME: Restoring prior ARIA leaves stale shortcuts when overlapping hotkeys detach out of order.
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

/** Adds a class while a shortcut is held. Releasing a key or modifier, or blurring the window, clears it. */
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
