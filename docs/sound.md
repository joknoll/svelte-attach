# Sound

Play sound effects in response to user actions. Attach `sound` to an element to play on an event, or use `Sound` to start and stop playback from code.

```ts
import { sound, Sound, isSupported } from "@joknoll/svelte-attach/sound";
```

## API

### `sound`

```ts
function sound<E extends HTMLElement = HTMLElement>(
  src: SoundSource<E>,
  options?: SoundAttachmentOptions,
): Attachment<E>;
```

Plays audio when the attached element receives an event. Detaching stops that element's active sounds and cancels pending starts.

| Param             | Description                                                                        | Default       |
| ----------------- | ---------------------------------------------------------------------------------- | ------------- |
| `src`             | A URL or `(element, event) => url`. Return `null` or `undefined` to skip playback. | Required      |
| `options.on`      | Event that starts playback.                                                        | `"click"`     |
| `options.stopOn`  | Event that stops active sounds and cancels pending starts.                         | None          |
| `options.onError` | Callback `(error)` for source selection, load, or playback errors.                 | Log a warning |

See also [Playback options](#playback-options).

### `Sound`

```ts
declare class Sound {
  constructor(src: string, options?: SoundOptions);
  play(): Promise<Playback | null>;
  stop(): void;
  preload(): Promise<boolean>;
}
```

Plays audio from a URL using the [playback options](#playback-options). Call `play()` from a user interaction to avoid autoplay restrictions.

- `play()` starts an independent playback and resolves to a `Playback` handle whose `stop()` stops only that sound. It resolves to `null` if Web Audio is unavailable or `Sound.stop()` canceled the pending start. It rejects if loading or starting playback fails.
- `stop()` stops all playbacks on the instance and cancels pending starts.
- `preload()` decodes the audio without playing it. It resolves to `true` on success, `false` without Web Audio, and rejects if loading or decoding fails.

### Playback options

Both `sound` and `Sound` accept these options:

| Param            | Description                                  | Default |
| ---------------- | -------------------------------------------- | ------- |
| `options.volume` | Volume from `0` to `1`.                      | `1`     |
| `options.loop`   | Repeat the sound until stopped.              | `false` |
| `options.rate`   | Playback speed, finite and greater than `0`. | `1`     |

Invalid volume or rate throws a `RangeError` when you create either one.

Decoded audio is shared by URL.

### `isSupported`

```ts
function isSupported(): boolean;
```

Returns `true` if `AudioContext` exists. The browser can still block playback.

## Switch sounds

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
