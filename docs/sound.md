# Sound

Import from `@joknoll/svelte-attach/sound`.

## `sound(src, options?)`

Plays a sound when the attached element receives an event. `src` is a URL or a callback `(element, event) => URL` that chooses a sound when the event fires. Return `null` or `undefined` to skip playback.

| Option           | Default        | Effect                                                                             |
| ---------------- | -------------- | ---------------------------------------------------------------------------------- |
| `on`             | `"click"`      | Event that starts playback.                                                        |
| `stopOn`         | None           | Event that stops active playback and cancels pending playback for this attachment. |
| `onError(error)` | Logs a warning | Handles source selection, load, and playback errors.                               |
| `volume`         | `1`            | Volume from `0` to `1`.                                                            |
| `loop`           | `false`        | Repeats the sound until stopped.                                                   |
| `rate`           | `1`            | Playback speed. Must be finite and greater than `0`.                               |

You can attach one `sound(...)` result to multiple elements. Detaching from an element stops its active sounds and cancels its pending playbacks without affecting the others.

## Switch sounds

Choose a sound based on the checkbox's new state:

```svelte
<script lang="ts">
  import { sound } from "@joknoll/svelte-attach/sound";
  import switchOn from "./switch-on.opus";
  import switchOff from "./switch-off.opus";
</script>

<label>
  <input
    type="checkbox"
    role="switch"
    {@attach sound((input: HTMLInputElement) => (input.checked ? switchOn : switchOff), {
      on: "change",
    })}
  />
  Notifications
</label>
```

## `new Sound(src, options?)`

Use `Sound` for imperative playback. It accepts a URL and the `volume`, `loop`, and `rate` options. Invalid volume or rate throws a `RangeError` when creating a `Sound` or `sound(...)` attachment.

| Method      | Behavior                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `play()`    | Starts a playback and resolves to a handle with `stop()`, or `null` if Web Audio is unavailable or `stop()` canceled the pending start. Calls can overlap. Load and playback failures reject the promise. |
| `stop()`    | Stops all active playbacks on this instance and prevents pending ones from starting.                                                                                                                      |
| `preload()` | Fetches and decodes the sound without playing it. Resolves to `true` on success, `false` without Web Audio, and rejects on load failure.                                                                  |

Attachments and `Sound` instances share decoded audio by URL. A failed load can be retried. Start playback from a user interaction to satisfy browser autoplay restrictions.

## `isSupported()`

Returns whether `AudioContext` is available. It doesn't guarantee that the browser will allow playback.
