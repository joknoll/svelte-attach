# @joknoll/svelte-attach

Svelte 5 attachments for keyboard shortcuts, sound effects, vibration, and gamepad buttons. Each feature has its own import path, so you only load what you use.

```bash
vp add @joknoll/svelte-attach
```

| Import                           | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `@joknoll/svelte-attach/key`     | Keyboard shortcuts and held state               |
| `@joknoll/svelte-attach/sound`   | Web Audio playback bound to DOM events          |
| `@joknoll/svelte-attach/haptic`  | Web Vibration feedback bound to DOM events      |
| `@joknoll/svelte-attach/gamepad` | Standard gamepad buttons that activate elements |

Every attachment has the same shape: `name(primary, options?)`. The first argument is the one thing you always need, and everything optional, including callbacks, goes in the options object. Callbacks receive the element first. Invalid arguments throw when the attachment is created, not when an event fires. Attachments that need a browser API do nothing during server rendering, and `isSupported()` reports whether that API exists.

## Keyboard shortcuts

```svelte
<script lang="ts">
  import { hotkey, pressed, formatHint } from "@joknoll/svelte-attach/key";
</script>

<button title={formatHint("mod+k")} {@attach hotkey("mod+k", { pressedClass: "is-pressed" })}>
  Open command menu
</button>

<kbd {@attach pressed("shift")}>Shift</kbd>
```

`hotkey(keys, options?)` clicks the attached element when a shortcut is pressed anywhere on the page. Options:

- **`onTrigger(element, event)`:** called instead of the click.
- **`pressedClass`:** a class kept on the element from activation until the shortcut is released.
- **`preventDefault`, `stopPropagation`, `ignoreInputs`, `ignoreRepeat`:** control dispatch. `preventDefault`, `ignoreInputs` and `ignoreRepeat` default to `true`.

`hotkey` also sets `aria-keyshortcuts` and restores the previous value on cleanup. When two attached elements claim the same shortcut, the most recently attached one wins, and removing it restores the previous one.

A shortcut is zero or more modifiers followed by one key, joined with `+`, such as `"ctrl+shift+k"`. Pass an array for alternatives, such as `["j", "arrowdown"]`.

- **Modifiers:** `ctrl`, `shift`, `alt`, `meta`, and `mod`, which means Meta on Apple devices and Control elsewhere. `control`, `option`, `cmd`, `command`, and `win` are accepted as aliases.
- **Keys:**
  - any single character
  - `f1` to `f12`
  - `escape`, `enter`, `tab`, `space`, `plus`, `backspace`, `delete`, `insert`, `home`, `end`, `pageup`, `pagedown`
  - the arrows `arrowup` / `up`, `arrowdown` / `down`, `arrowleft` / `left`, `arrowright` / `right`
  - `esc`, `return` and `del` as aliases
- **Errors:** shortcut literals are checked by TypeScript, so `hotkey("ctrl+esacpe")` fails to compile with `Unknown key "esacpe"`. Shortcuts held in a `string` variable are checked at runtime and throw a `TypeError`.

How keys match across keyboard layouts:

- **Symbols:** write the character, such as `"?"` or `"@"`. The Shift, AltGr, or (on Apple devices) Option needed to type it is ignored unless the shortcut names it, while Ctrl and Meta must still match.
- **Letters and digits:** `"k"` also matches the physical K key when the layout types something else there, such as Cyrillic `л` or `˚` from Option+K on a Mac. So `alt+k` works on macOS, and `shift+5` matches the key that types `%`. A key that types another Latin letter is not a fallback: on AZERTY, `"a"` matches the key labelled A, not the one in the US A position.
- **Shift with letters:** Shift always counts for letters, so `"k"` does not fire on Shift+K.

`pressed(keys, { className = "is-pressed", ignoreInputs = true })` adds a class while a shortcut is held, without triggering anything. A lone modifier such as `"mod"` or `"shift"` is a valid shortcut here, which suits key caps in a hint.

`formatHint(keys)` formats shortcuts for display: `mod+s` becomes `⌘ S` on Apple devices and `Ctrl + S` elsewhere. On the server it renders the non-Apple form.

Hotkeys ignore repeated keys, IME composition, disabled elements, and elements inside an inert subtree. They also ignore keys typed into focused text fields, selects, radio buttons, range sliders and editable elements, including those inside a shadow root. Checkboxes and buttons do not block them. `data-keyshortcuts-ignore` on a container suppresses hotkeys while focus is inside it.

## Sound

```svelte
<script lang="ts">
  import { sound, Sound } from "@joknoll/svelte-attach/sound";
  import click from "./click.opus";
  import switchOn from "./switch-on.opus";
  import switchOff from "./switch-off.opus";

  const quietClick = sound(click, { volume: 0.4 });
  const notification = new Sound(click);
</script>

<button {@attach sound(click)}>Click</button>
<button {@attach quietClick}>Quiet click</button>
<button onclick={() => notification.play()}>Play manually</button>
<input
  type="checkbox"
  role="switch"
  aria-label="Sound switch"
  {@attach sound((input: HTMLInputElement) => (input.checked ? switchOn : switchOff), {
    on: "change",
  })}
/>
```

`sound(src, options?)` plays a sound when the element receives the `on` event, which defaults to `"click"`.

- **`src`:** a URL, or `(element, event) => URL` to choose a sound when the event fires. Return `null` or `undefined` to skip playback.
- **Stopping:** the `stopOn` event and attachment cleanup stop every playback the attachment started and cancel pending ones.
- **Errors:** selection, load, and playback errors reach `onError`; without it they are logged.
- **Other options:** `volume` (0 to 1), `loop`, and `rate` (greater than 0).
- **Reuse:** one `sound(...)` result can be attached to many elements.
- **Caching:** decoded audio is cached by URL across all attachments and `Sound` instances, and a failed load leaves the cache so a later play can retry.

`new Sound(src, options?)` is for imperative playback.

- **`await play()`:** returns a handle that stops just that playback. It returns `null` when Web Audio is unavailable or `stop()` ran before playback started, and rejects on load errors. Calls can overlap.
- **`stop()`:** stops all current playbacks and cancels pending ones.
- **`preload()`:** resolves to `true` when decoding succeeds and to `false` when Web Audio is unavailable.

## Vibration

```svelte
<script lang="ts">
  import { haptic, triggerHaptic } from "@joknoll/svelte-attach/haptic";
</script>

<button {@attach haptic("selection", { on: "pointerdown" })}>Select</button>
<button onclick={() => triggerHaptic("success")}>Saved</button>
```

`haptic(pattern = "medium", { on = "click" })` vibrates when the element receives the event and removes its listener on cleanup. A pattern can take three forms:

- **Preset name:** `light`, `medium`, `heavy`, `soft`, `rigid`, `selection`, `success`, `warning`, `error`, `nudge`, or `buzz`.
- **Single duration:** one number, in milliseconds.
- **Sequence:** an array of alternating vibration and pause durations.

`createPattern(input)` returns a validated copy of the duration sequence, and rejects empty, negative, or non-finite durations. `triggerHaptic(input)` and `cancelHaptic()` return the browser's success boolean, or `false` when vibration is unavailable. `cancelHaptic()` stops the device's current vibration, including one started outside this package.

The Web Vibration API controls timing, not physical intensity. Support varies by browser and device, so use vibration as an optional complement to visible feedback.

## Gamepad

```svelte
<script lang="ts">
  import { gamepadButton } from "@joknoll/svelte-attach/gamepad";
</script>

<button {@attach gamepadButton("A")} onclick={() => console.log("activated")}>
  Focus me, then press A
</button>
```

`gamepadButton(button, options?)` clicks the attached element on a new press, **only while it has focus**.

- **`onTrigger(element, pad)`:** replaces the click.
- **`padIndex`:** selects a gamepad slot. By default the first connected pad is used.
- **Polling:** disabled elements are ignored, all attachments share one animation-frame poller, and polling stops when the last attachment is removed.

`isButtonPressed(button, padIndex?)` reads the current state once. It returns `false` on the server, when no gamepad is connected, or when the pad does not report the standard mapping. `GamepadButtonMap` and `ButtonName` name the standard button positions:

- the face buttons `A`, `B`, `X`, `Y`
- the shoulders and triggers `LB`, `RB`, `LT`, `RT`
- the stick presses `L3` and `R3`
- the directional buttons `UP`, `DOWN`, `LEFT`, `RIGHT`
- `SELECT`, `START`, and `HOME`

## Development

The example site lives in [`examples/website`](examples/website).

```bash
vp install
vp run ready
vp run dev
```

`vp run ready` formats, lints, and type-checks, builds the package, runs the tests, and checks and builds the example site.
