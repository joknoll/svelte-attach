import { on } from "svelte/events";
import { matches, type ParsedShortcut } from "./shortcut.ts";

export interface Registration {
  element: HTMLElement;
  shortcuts: readonly ParsedShortcut[];
  handler: (event: KeyboardEvent) => void;
  ignoreInputs: boolean;
  ignoreRepeat: boolean;
  // Consuming registrations compete and only the newest eligible one runs. Others all observe.
  consume: boolean;
}

// Radio and range inputs stay guarded because they use arrow, Home and End keys themselves.
const NON_TEXT_INPUTS = new Set([
  "checkbox",
  "button",
  "submit",
  "reset",
  "image",
  "color",
  "file",
]);
const registrations = new Set<Registration>();
let stopListener: (() => void) | null = null;

function isTyping(event: KeyboardEvent): boolean {
  // The window sees a shadow host as the target, so look at the innermost element instead.
  const target = event.composedPath()[0];
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

function inIgnoreZone(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  // CONTRACT: Starting above the target lets a focused ignore zone receive shortcuts itself.
  // Only the nearest marked ancestor decides whether to suppress them.
  let ancestor = target.parentElement;
  while (ancestor) {
    if (ancestor.hasAttribute("data-keyshortcuts-ignore")) {
      return document.activeElement !== ancestor;
    }
    ancestor = ancestor.parentElement;
  }
  return false;
}

function handleKeydown(event: KeyboardEvent): void {
  // A dead key starts an accented character. With Option held on Apple layouts it is a
  // shortcut instead, and `matches` identifies it by its physical key.
  if (event.isComposing || (event.key === "Dead" && !event.altKey)) return;
  const ignoreZone = inIgnoreZone(event);
  const eligible = (reg: Registration): boolean => {
    if (reg.ignoreRepeat && event.repeat) return false;
    if (reg.ignoreInputs && isTyping(event)) return false;
    if (ignoreZone) return false;
    const { element } = reg;
    if (!element.isConnected || element.matches(":disabled") || element.closest("[inert]")) {
      return false;
    }
    return reg.shortcuts.some((shortcut) => matches(event, shortcut));
  };

  for (const reg of registrations) {
    if (!reg.consume && eligible(reg)) reg.handler(event);
  }

  // Sets iterate in insertion order, so reversing makes the newest attachment win.
  for (const reg of [...registrations].reverse()) {
    if (reg.consume && eligible(reg)) {
      reg.handler(event);
      return;
    }
  }
}

export function register(reg: Registration): () => void {
  if (registrations.size === 0) stopListener = on(window, "keydown", handleKeydown);
  registrations.add(reg);
  return () => {
    registrations.delete(reg);
    if (registrations.size === 0 && stopListener) {
      stopListener();
      stopListener = null;
    }
  };
}
