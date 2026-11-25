# Gamepad

Import from `@joknoll/svelte-attach/gamepad`.

## `gamepadButton(button, options?)`

Clicks the attached element on a new press of a standard-mapped gamepad button. The element itself must have focus when the press is detected. Holding a button and then moving focus onto the element doesn't activate it. Disabled or inert elements and hidden pages don't activate.

| Option                    | Default             | Effect                                                        |
| ------------------------- | ------------------- | ------------------------------------------------------------- |
| `onTrigger(element, pad)` | `element.click()`   | Replaces the click. Receives the `Gamepad` that triggered it. |
| `padIndex`                | First occupied slot | Selects a slot by its non-negative integer index.             |

An unknown button name or invalid `padIndex` throws a `RangeError` when creating the attachment.

## `isButtonPressed(button, padIndex?)`

Reads the current button state without requiring element focus. Returns `false` if the API is unavailable, the slot is empty, or the selected gamepad doesn't use the `standard` mapping. If `padIndex` is omitted, only the first occupied slot is checked, even if a later slot has a standard-mapped device.

## `isSupported()`

Checks whether `navigator.getGamepads` exists. It doesn't check for connected devices or permission. A Permissions Policy can still cause `isButtonPressed` to throw.

## Buttons

`GamepadButtonMap` maps the following names to standard button positions. `ButtonName` is the union of those names. Labels printed on controllers may differ.

| Position               | Names                         |
| ---------------------- | ----------------------------- |
| Face buttons           | `A`, `B`, `X`, `Y`            |
| Shoulders and triggers | `LB`, `RB`, `LT`, `RT`        |
| Stick presses          | `L3`, `R3`                    |
| Directional pad        | `UP`, `DOWN`, `LEFT`, `RIGHT` |
| System buttons         | `SELECT`, `START`, `HOME`     |
