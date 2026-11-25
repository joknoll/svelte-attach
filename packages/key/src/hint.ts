import { isMac, normalizeKeys, parseShortcuts } from "./dispatcher.ts";

const MOD_LABELS: Record<string, [mac: string, pc: string]> = {
  ctrl: ["⌃", "Ctrl"],
  shift: ["⇧", "Shift"],
  alt: ["⌥", "Alt"],
  meta: ["⌘", "Win"],
};

const KEY_LABELS: Record<string, string> = {
  " ": "Space",
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
  escape: "Esc",
  enter: "Enter",
  delete: "Delete",
  backspace: "Backspace",
  tab: "Tab",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

/**
 * Displays `mod+s` as `⌘ S` on Apple devices and `Ctrl + S` elsewhere.
 * Joins alternatives with ` / ` and throws a `TypeError` for malformed combinations.
 */
export function formatHint(shortcut: string | string[]): string {
  const mac = isMac();
  return parseShortcuts(normalizeKeys(shortcut))
    .map((combo) => {
      const parts: string[] = [];
      for (const mod of ["ctrl", "shift", "alt", "meta"] as const) {
        if (combo[mod]) parts.push(MOD_LABELS[mod][mac ? 0 : 1]);
      }
      const key = combo.key;
      parts.push(KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key));
      return parts.join(mac ? " " : " + ");
    })
    .join(" / ");
}
