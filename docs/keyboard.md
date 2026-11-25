# Keyboard

Import from `@joknoll/svelte-attach/key`.

## `hotkey(keys, options?)`

Clicks the attached element when a shortcut is pressed, even if the element doesn't have focus. If several eligible attachments match, the most recently attached one wins. The attachment sets `aria-keyshortcuts` on the element and saves its previous value for cleanup.

| Option                      | Default           | Effect                                                                                                                                      |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `onTrigger(element, event)` | `element.click()` | Replaces the click. Receives a `KeyboardEvent`.                                                                                             |
| `pressedClass`              | None              | Adds a class from activation until release or window blur.                                                                                  |
| `preventDefault`            | `true`            | Cancels the matching key event's default action.                                                                                            |
| `stopPropagation`           | `false`           | Calls `stopPropagation()` on the matching key event.                                                                                        |
| `ignoreInputs`              | `true`            | Ignores shortcuts in text fields, selects, radio buttons, range inputs, and editable content. Checkboxes and buttons don't block shortcuts. |
| `ignoreRepeat`              | `true`            | Ignores repeated `keydown` events while a key is held.                                                                                      |

Both keyboard attachments ignore IME composition and skip disabled, detached, or inert elements. Use `data-keyshortcuts-ignore` on a container to suppress shortcuts when a descendant has focus, such as in a dialog with its own key handling.

## `pressed(keys, options?)`

Adds a class while a shortcut is held without clicking the element or taking precedence over a `hotkey`. A lone modifier such as `"shift"` works for highlighting a key cap. `className` defaults to `"is-pressed"` and `ignoreInputs` defaults to `true`.

## `formatHint(keys)`

Formats shortcuts for display. `formatHint("mod+s")` returns `⌘ S` on Apple devices and `Ctrl + S` elsewhere, including on the server. Alternatives are joined with `/`.

## Shortcut hint

Use the same shortcut for the label and the held state:

```svelte
<script lang="ts">
  import { formatHint, pressed } from "@joknoll/svelte-attach/key";

  const shortcut = "mod+k";
</script>

<kbd {@attach pressed(shortcut)}>{formatHint(shortcut)}</kbd>

<style>
  kbd:global(.is-pressed) {
    font-weight: bold;
  }
</style>
```

## Shortcut syntax

Join modifiers and a key with `+`, as in `"ctrl+shift+k"`, or pass an array of alternatives such as `["j", "arrowdown"]`. Names are case-insensitive.

- Modifiers: `ctrl` (`control`), `shift`, `alt` (`option`), `meta` (`cmd`, `command`, `win`), and `mod` (Meta on Apple devices, Control elsewhere).
- Keys: single characters, `f1` through `f12`, `escape` (`esc`), `enter` (`return`), `tab`, `space`, `plus`, `backspace`, `delete` (`del`), `insert`, `home`, `end`, `pageup`, and `pagedown`.
- Arrows: `arrowup`, `arrowdown`, `arrowleft`, and `arrowright`, or `up`, `down`, `left`, and `right`.

Use `plus` and `space` rather than literal `+` and space characters. `Shortcut<S>` checks string literals in TypeScript. Malformed shortcuts throw a `TypeError` at runtime when passed to an attachment factory or `formatHint`.
