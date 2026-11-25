# Gamepad

Use a standard-mapped gamepad to activate focused Svelte elements. Read button state directly when you don't need to activate an element.

```ts
import { gamepadButton, isButtonPressed, isSupported } from "@joknoll/svelte-attach/gamepad";
```

## API

### `gamepadButton`

```ts
function gamepadButton<E extends HTMLElement = HTMLElement>(
  button: ButtonName,
  options?: GamepadButtonOptions<E>,
): Attachment<E>;
```

Clicks the attached element on a new button press, but only if that element has focus. Moving focus while the button is held doesn't trigger a click. Disabled or inert elements and hidden pages don't activate.

| Param               | Description                                        | Default             |
| ------------------- | -------------------------------------------------- | ------------------- |
| `button`            | A standard-mapped [button name](#buttons).         | Required            |
| `options.onTrigger` | Callback `(element, pad)` that replaces the click. | `element.click()`   |
| `options.padIndex`  | A non-negative integer gamepad slot.               | First occupied slot |

Unknown button names and invalid slot indices throw a `RangeError` when you create the attachment.

### `isButtonPressed`

```ts
function isButtonPressed(button: ButtonName, padIndex?: number): boolean;
```

Reads a button without requiring focus. Returns `false` if the API is unavailable or the chosen slot has no standard-mapped gamepad.

| Param      | Description                                | Default             |
| ---------- | ------------------------------------------ | ------------------- |
| `button`   | A standard-mapped [button name](#buttons). | Required            |
| `padIndex` | The gamepad slot to read.                  | First occupied slot |

### `isSupported`

```ts
function isSupported(): boolean;
```

Returns `true` if `navigator.getGamepads` exists. A Permissions Policy can still block access and cause `isButtonPressed` to throw.

### Buttons

```ts
type ButtonName = keyof typeof GamepadButtonMap;
```

`GamepadButtonMap` maps these names to standard button indices. They refer to physical positions, not the labels printed on your controller:

- Face: `A`, `B`, `X`, `Y`
- Shoulders and triggers: `LB`, `RB`, `LT`, `RT`
- Stick clicks: `L3`, `R3`
- D-pad: `UP`, `DOWN`, `LEFT`, `RIGHT`
- System: `SELECT`, `START`, `HOME`
