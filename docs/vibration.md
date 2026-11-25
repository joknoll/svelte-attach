# Vibration

Add vibration feedback on supported devices. Attach it to an element event or trigger it from code.

```ts
import { haptic, triggerHaptic, cancelHaptic } from "@joknoll/svelte-attach/haptic";
```

## API

### `haptic`

```ts
function haptic(pattern?: HapticPattern, options?: HapticOptions): Attachment<HTMLElement>;
```

Vibrates when the attached element receives an event. Detaching lets the current vibration finish.

| Param        | Description                                                 | Default    |
| ------------ | ----------------------------------------------------------- | ---------- |
| `pattern`    | A preset, duration, or sequence. See [Patterns](#patterns). | `"medium"` |
| `options.on` | Event that triggers vibration.                              | `"click"`  |

### Patterns

```ts
type HapticPreset = keyof typeof patterns;
type HapticPattern = HapticPreset | number | readonly number[];
```

Pass a preset name, a duration in milliseconds, or a sequence. `[25, 60, 40]` vibrates for 25 ms, pauses for 60 ms, then vibrates for 40 ms. Patterns control timing, not intensity.

The `patterns` export includes `light`, `medium` (the default), `heavy`, `soft`, `rigid`, `selection`, `success`, `warning`, `error`, `nudge`, and `buzz`.

`haptic`, `createPattern`, and `triggerHaptic` throw a `RangeError` for empty patterns or negative or non-finite durations.

### `createPattern`

```ts
function createPattern(input?: HapticPattern): number[];
```

Returns a mutable copy of the durations. Defaults to `"medium"`.

### `triggerHaptic`

```ts
function triggerHaptic(input?: HapticPattern): boolean;
```

Requests vibration. Defaults to `"medium"`. Returns the browser's result, or `false` if the API is unavailable.

### `cancelHaptic`

```ts
function cancelHaptic(): boolean;
```

Requests cancellation of the current vibration, even if another caller started it. Returns the browser's result, or `false` if the API is unavailable.

### `isSupported`

```ts
function isSupported(): boolean;
```

Returns `true` if `navigator.vibrate` exists. The browser can still decline a vibration request.
