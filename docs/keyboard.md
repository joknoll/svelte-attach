# Keyboard

Add keyboard shortcuts to Svelte elements. Use `hotkey` to activate an element, `pressed` to show when keys are held, and `formatHint` to display the shortcut.

```ts
import { hotkey, pressed, formatHint } from "@joknoll/svelte-attach/key";
```

## API

### `hotkey`

```ts
function hotkey<const S extends string, E extends HTMLElement = HTMLElement>(
  keys: Shortcut<S> | readonly Shortcut<S>[],
  options?: HotkeyOptions<E>,
): Attachment<E>;
```

Clicks the element even when it doesn't have focus. If multiple eligible hotkeys match, the last attached one wins. It sets `aria-keyshortcuts` and restores the previous value on detach.

| Param                     | Description                                                                                      | Default           |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ----------------- |
| `keys`                    | A shortcut or an array of alternatives. See [Keys](#keys).                                       | Required          |
| `options.onTrigger`       | Callback `(element, event)` that replaces the click.                                             | `element.click()` |
| `options.pressedClass`    | Class to add until release or window blur.                                                       | None              |
| `options.preventDefault`  | Prevent the key event's default action.                                                          | `true`            |
| `options.stopPropagation` | Stop the key event from propagating.                                                             | `false`           |
| `options.ignoreRepeat`    | Ignore repeated keydown events.                                                                  | `true`            |
| `options.ignoreInputs`    | Skip text fields, selects, radios, sliders, and editable content, but not checkboxes or buttons. | `true`            |

Both `hotkey` and `pressed` skip IME composition and disabled or inert targets. Add `data-keyshortcuts-ignore` to a container to suppress shortcuts while a child has focus.

### `pressed`

```ts
function pressed<const S extends string>(
  keys: Shortcut<S> | readonly Shortcut<S>[],
  options?: PressedOptions,
): Attachment<HTMLElement>;
```

Adds a class while the shortcut is held without triggering a click. Use a lone modifier like `"shift"` to highlight a key cap.

| Param                  | Description                                                | Default        |
| ---------------------- | ---------------------------------------------------------- | -------------- |
| `keys`                 | A shortcut or an array of alternatives. See [Keys](#keys). | Required       |
| `options.className`    | Class to add while held.                                   | `"is-pressed"` |
| `options.ignoreInputs` | Skip the same inputs as `hotkey`.                          | `true`         |

### `formatHint`

```ts
function formatHint<const S extends string>(keys: Shortcut<S> | readonly Shortcut<S>[]): string;
```

Returns a display label for one or more [shortcuts](#keys). `"mod+k"` becomes `⌘ K` on Apple devices or `Ctrl + K` elsewhere, including on the server. Alternatives are joined with `/`.

### Keys

Join modifiers and a key with `+`, as in `"ctrl+shift+k"`. Pass an array for alternatives, such as `["j", "arrowdown"]`. Names are case-insensitive.

- **Modifiers:** `ctrl` (`control`), `shift`, `alt` (`option`), `meta` (`cmd`, `command`, `win`), and `mod` (Meta on Apple devices, Control elsewhere).
- **Keys:** Single characters, `f1` to `f12`, `escape` (`esc`), `enter` (`return`), `tab`, `space`, `plus`, `backspace`, `delete` (`del`), `insert`, `home`, `end`, `pageup`, and `pagedown`. Write `space` and `plus` instead of the literal characters.
- **Arrows:** `arrowup`, `arrowdown`, `arrowleft`, and `arrowright`, or `up`, `down`, `left`, and `right`.

TypeScript checks shortcut literals. Invalid shortcuts throw a `TypeError` at runtime.

## Shortcut hint

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
