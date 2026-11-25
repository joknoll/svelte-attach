type Modifier = "ctrl" | "shift" | "alt" | "meta";

const MODIFIERS = {
  ctrl: "ctrl",
  control: "ctrl",
  shift: "shift",
  alt: "alt",
  option: "alt",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  win: "meta",
  mod: "mod",
} as const satisfies Record<string, Modifier | "mod">;

// Keys are stored as lowercase `KeyboardEvent.key` values so matching is a string comparison.
// CONTRACT: `aria` follows the key names used by `aria-keyshortcuts`.
const NAMED_KEYS = {
  escape: { aria: "Escape", label: "Esc" },
  enter: { aria: "Enter", label: "Enter" },
  tab: { aria: "Tab", label: "Tab" },
  " ": { aria: "Space", label: "Space" },
  "+": { aria: "Plus", label: "+" },
  backspace: { aria: "Backspace", label: "Backspace" },
  delete: { aria: "Delete", label: "Delete" },
  insert: { aria: "Insert", label: "Insert" },
  home: { aria: "Home", label: "Home" },
  end: { aria: "End", label: "End" },
  pageup: { aria: "PageUp", label: "PageUp" },
  pagedown: { aria: "PageDown", label: "PageDown" },
  arrowup: { aria: "ArrowUp", label: "Up" },
  arrowdown: { aria: "ArrowDown", label: "Down" },
  arrowleft: { aria: "ArrowLeft", label: "Left" },
  arrowright: { aria: "ArrowRight", label: "Right" },
} as const;

// Space and plus cannot be written literally because whitespace is trimmed and `+` separates parts.
const KEY_ALIASES = {
  space: " ",
  plus: "+",
  esc: "escape",
  return: "enter",
  del: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
} as const satisfies Record<string, keyof typeof NAMED_KEYS>;

const MODIFIER_LABELS: Record<Modifier, { aria: string; mac: string; other: string }> = {
  ctrl: { aria: "Control", mac: "⌃", other: "Ctrl" },
  shift: { aria: "Shift", mac: "⇧", other: "Shift" },
  alt: { aria: "Alt", mac: "⌥", other: "Alt" },
  meta: { aria: "Meta", mac: "⌘", other: "Win" },
};

const MODIFIER_ORDER: readonly Modifier[] = ["ctrl", "shift", "alt", "meta"];
const FUNCTION_KEY = /^f([1-9]|1[0-2])$/;

type NamedKey = Exclude<keyof typeof NAMED_KEYS, " " | "+"> | keyof typeof KEY_ALIASES;
type FunctionKey = `f${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type IsCharacter<S extends string> = S extends `${infer First}${infer Rest}`
  ? Rest extends ""
    ? First extends " " | "+"
      ? false
      : true
    : false
  : false;
type IsModifier<S extends string> = Lowercase<S> extends keyof typeof MODIFIERS ? true : false;
type IsKey<S extends string> = Lowercase<S> extends NamedKey | FunctionKey ? true : IsCharacter<S>;

type CheckParts<
  Whole extends string,
  Rest extends string,
> = Rest extends `${infer Part}+${infer Tail}`
  ? IsModifier<Part> extends true
    ? CheckParts<Whole, Tail>
    : Part extends ""
      ? `Empty part in "${Whole}"; write + as "plus"`
      : `"${Part}" in "${Whole}" is not a modifier; the key goes last`
  : IsKey<Rest> extends true
    ? Whole
    : IsModifier<Rest> extends true
      ? Whole
      : Rest extends ""
        ? `Shortcut "${Whole}" is missing a key`
        : `Unknown key "${Rest}" in "${Whole}"`;

/**
 * Resolves to `S` for a valid shortcut literal and to an error message otherwise.
 * A plain `string` passes and is validated at runtime instead.
 */
export type Shortcut<S extends string> = S extends unknown
  ? string extends S
    ? S
    : CheckParts<S, S>
  : never;

export interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
}

function own<T extends object>(table: T, key: string): key is Extract<keyof T, string> {
  return Object.hasOwn(table, key);
}

function resolveModifier(name: string): Modifier | undefined {
  if (!own(MODIFIERS, name)) return undefined;
  const modifier = MODIFIERS[name];
  if (modifier !== "mod") return modifier;
  return isMac() ? "meta" : "ctrl";
}

/** Maps `KeyboardEvent.key` to the stored form, so `Control` and `ctrl` compare equal. */
export function eventKey(key: string): string {
  const lower = key.toLowerCase();
  return own(MODIFIERS, lower) ? (resolveModifier(lower) ?? lower) : lower;
}

function resolveKey(name: string): string | undefined {
  if (own(KEY_ALIASES, name)) return KEY_ALIASES[name];
  if (own(NAMED_KEYS, name)) return name;
  if (FUNCTION_KEY.test(name)) return name;
  if (name.length === 1) return name;
  return undefined;
}

function parseShortcut(input: string): ParsedShortcut {
  const parts = input.split("+").map((part) => part.trim().toLowerCase());
  if (parts.some((part) => !part)) {
    throw new TypeError(`Empty part in "${input}"; write + as "plus"`);
  }
  const spec: ParsedShortcut = { key: "", ctrl: false, shift: false, alt: false, meta: false };
  const last = parts.length - 1;
  for (const [index, part] of parts.entries()) {
    const modifier = resolveModifier(part);
    if (modifier) {
      spec[modifier] = true;
      // A lone trailing modifier is the key itself, as in `pressed("shift")`.
      if (index === last) spec.key = modifier;
      continue;
    }
    if (index !== last) {
      throw new TypeError(`"${part}" in "${input}" is not a modifier; the key goes last`);
    }
    const key = resolveKey(part);
    if (!key) throw new TypeError(`Unknown key "${part}" in "${input}"`);
    spec.key = key;
  }
  return spec;
}

export function parseShortcuts(keys: string | readonly string[]): ParsedShortcut[] {
  const list = typeof keys === "string" ? [keys] : keys;
  if (list.length === 0) throw new TypeError("At least one shortcut is required.");
  return list.map(parseShortcut);
}

function isModifierKey(key: string): key is Modifier {
  return (MODIFIER_ORDER as readonly string[]).includes(key);
}

function keyName(key: string, field: "aria" | "label"): string {
  if (own(NAMED_KEYS, key)) return NAMED_KEYS[key][field];
  return key.toUpperCase();
}

export function formatAria(shortcuts: readonly ParsedShortcut[]): string {
  return shortcuts
    .map((shortcut) => {
      const names = MODIFIER_ORDER.filter((mod) => shortcut[mod]).map(
        (mod) => MODIFIER_LABELS[mod].aria,
      );
      if (!isModifierKey(shortcut.key)) names.push(keyName(shortcut.key, "aria"));
      return names.join("+");
    })
    .join(" ");
}

/**
 * Displays `mod+s` as `⌘ S` on Apple devices and `Ctrl + S` elsewhere, and joins alternatives
 * with ` / `. Throws a `TypeError` for a malformed shortcut.
 */
export function formatHint<const S extends string>(
  keys: Shortcut<S> | readonly Shortcut<S>[],
): string {
  const mac = isMac();
  return parseShortcuts(keys)
    .map((shortcut) => {
      const parts = MODIFIER_ORDER.filter((mod) => shortcut[mod]).map(
        (mod) => MODIFIER_LABELS[mod][mac ? "mac" : "other"],
      );
      if (!isModifierKey(shortcut.key)) parts.push(keyName(shortcut.key, "label"));
      return parts.join(mac ? " " : " + ");
    })
    .join(" / ");
}

export function matches(event: KeyboardEvent, spec: ParsedShortcut): boolean {
  return (
    eventKey(event.key) === spec.key &&
    event.ctrlKey === spec.ctrl &&
    event.shiftKey === spec.shift &&
    event.altKey === spec.alt &&
    event.metaKey === spec.meta
  );
}

/** True when releasing this key ends the shortcut: its key or any of its modifiers. */
export function releases(event: KeyboardEvent, spec: ParsedShortcut): boolean {
  const key = eventKey(event.key);
  return key === spec.key || (isModifierKey(key) && spec[key]);
}
