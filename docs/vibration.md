# Vibration

Import from `@joknoll/svelte-attach/haptic`.

## `haptic(pattern?, options?)`

Vibrates when the attached element receives `options.on`, which defaults to `"click"`. The default pattern is `"medium"`. Detaching removes the listener and lets any ongoing vibration finish.

## Patterns

A `HapticPattern` is a preset name, a duration in milliseconds, or an array of alternating vibration and pause durations starting with vibration. For example, `[25, 60, 40]` vibrates for 25 ms, pauses for 60 ms, then vibrates for 40 ms.

The `patterns` export contains the presets: `light`, `medium`, `heavy`, `soft`, `rigid`, `selection`, `success`, `warning`, `error`, `nudge`, and `buzz`. These change timing, not physical intensity.

## Helpers

| Function                | Behavior                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `createPattern(input?)` | Returns a mutable copy of the duration sequence. Defaults to `"medium"`.                     |
| `triggerHaptic(input?)` | Requests vibration. Defaults to `"medium"`.                                                  |
| `cancelHaptic()`        | Requests cancellation of the current vibration, even if it was started outside this package. |
| `isSupported()`         | Checks whether `navigator.vibrate` exists.                                                   |

`createPattern`, `triggerHaptic`, and `haptic` throw a `RangeError` for empty patterns or negative or non-finite durations. `triggerHaptic` and `cancelHaptic` return `false` when the API is unavailable; otherwise they return the browser's result. The browser can decline a request even when it supports the API.
