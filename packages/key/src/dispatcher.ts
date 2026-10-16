import { on } from "svelte/events";

export interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

const ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  del: "delete",
  space: " ",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  option: "alt",
  command: "meta",
  win: "meta",
  plus: "+",
  control: "ctrl",
};

const MODIFIERS = new Set(["ctrl", "shift", "alt", "meta", "cmd", "mod"]);

const ARIA_KEYS: Record<string, string> = {
  " ": "Space",
  "+": "Plus",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  escape: "Escape",
  enter: "Enter",
  delete: "Delete",
  backspace: "Backspace",
  tab: "Tab",
  pageup: "PageUp",
  pagedown: "PageDown",
};

export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
}

function normalizeKey(k: string): string {
  const lower = k.toLowerCase();
  return ALIASES[lower] ?? lower;
}

function parseShortcut(input: string): ParsedShortcut {
  const parts = input.split("+").map((part) => normalizeKey(part.trim()));
  if (parts.some((part) => !part)) throw new TypeError(`Invalid shortcut: ${input}`);
  const spec: ParsedShortcut = { key: "", ctrl: false, shift: false, alt: false, meta: false };
  for (const part of parts) {
    if (!MODIFIERS.has(part)) {
      if (spec.key) throw new TypeError(`Shortcut has more than one key: ${input}`);
      spec.key = part;
      continue;
    }
    if (part === "ctrl") spec.ctrl = true;
    else if (part === "shift") spec.shift = true;
    else if (part === "alt") spec.alt = true;
    else if (part === "meta" || part === "cmd") spec.meta = true;
    else if (part === "mod") {
      if (isMac()) spec.meta = true;
      else spec.ctrl = true;
    }
  }
  if (!spec.key) throw new TypeError(`Shortcut is missing a key: ${input}`);
  return spec;
}

function parseShortcutList(input: string): ParsedShortcut[] {
  const shortcuts = input.trim().split(/\s+/).filter(Boolean);
  if (shortcuts.length === 0) throw new TypeError("A shortcut is required.");
  return shortcuts.map(parseShortcut);
}

export function normalizeKeys(keys: string | string[]): string {
  return Array.isArray(keys) ? keys.join(" ") : keys;
}

export function formatAriaShortcuts(shortcuts: readonly ParsedShortcut[]): string {
  const combinations: string[] = [];
  for (const shortcut of shortcuts) {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push("Control");
    if (shortcut.shift) keys.push("Shift");
    if (shortcut.alt) keys.push("Alt");
    if (shortcut.meta) keys.push("Meta");

    const key = shortcut.key;
    keys.push(ARIA_KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : key));
    combinations.push(keys.join("+"));
  }
  return combinations.join(" ");
}

export function matches(e: KeyboardEvent, spec: ParsedShortcut): boolean {
  return (
    normalizeKey(e.key) === spec.key &&
    e.ctrlKey === spec.ctrl &&
    e.shiftKey === spec.shift &&
    e.altKey === spec.alt &&
    e.metaKey === spec.meta
  );
}

export function releasesShortcut(e: KeyboardEvent, spec: ParsedShortcut): boolean {
  const key = normalizeKey(e.key);
  return (
    key === spec.key ||
    (key === "ctrl" && spec.ctrl) ||
    (key === "shift" && spec.shift) ||
    (key === "alt" && spec.alt) ||
    (key === "meta" && spec.meta)
  );
}

export interface Registration {
  shortcuts: ParsedShortcut[];
  handler: (e: KeyboardEvent) => void;
  ignoreInputs: boolean;
  ignoreRepeat: boolean;
  node: HTMLElement;
  consume: boolean;
}

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const registrations = new Set<Registration>();
let stopListener: (() => void) | null = null;

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target;
  return (
    target instanceof HTMLElement && (IGNORED_TAGS.has(target.tagName) || target.isContentEditable)
  );
}

/** Ignore shortcuts inside marked ancestors unless the ancestor has focus. */
function inIgnoreZone(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  let ancestor = target.parentElement;
  while (ancestor) {
    if (ancestor.hasAttribute("data-keyshortcuts-ignore")) {
      return document.activeElement !== ancestor;
    }
    ancestor = ancestor.parentElement;
  }
  return false;
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.isComposing || e.key === "Dead") return;
  const ignoreZone = inIgnoreZone(e);
  const eligible = (reg: Registration): boolean => {
    if (reg.ignoreRepeat && e.repeat) return false;
    if (reg.ignoreInputs && isTyping(e)) return false;
    if (ignoreZone) return false;
    if (!reg.node.isConnected || reg.node.matches(":disabled") || reg.node.closest("[inert]")) {
      return false;
    }
    return reg.shortcuts.some((shortcut) => matches(e, shortcut));
  };

  for (const reg of registrations) {
    if (!reg.consume && eligible(reg)) reg.handler(e);
  }

  for (const reg of [...registrations].reverse()) {
    if (reg.consume && eligible(reg)) {
      reg.handler(e);
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

export function parseShortcuts(raw: string): ParsedShortcut[] {
  return parseShortcutList(raw);
}
