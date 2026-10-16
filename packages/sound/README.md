# @joknoll/svelte-attach-sound

Web Audio sound effects for Svelte 5 elements.

```bash
vp add @joknoll/svelte-attach-sound
```

```svelte
<script lang="ts">
  import { sound, useSound, Sound } from "@joknoll/svelte-attach-sound";
  import click from "./click.opus";

  const quietClick = useSound(click, ["click"], { volume: 0.4 });
  const notification = new Sound(click);
</script>

<button {@attach sound({ src: click, events: ["click"] })}>Click</button>
<button {@attach quietClick()}>Quiet click</button>
<button onclick={() => notification.play()}>Play manually</button>
```

`sound({ src, events, volume?, loop?, rate?, onError? })` creates one playback owner per attached element. `events` is `[playEvent, stopEvent?]`. Cleanup removes listeners, stops active playbacks, and cancels pending plays. An event-driven load or playback error reaches `onError`; otherwise it is logged.

`useSound(src, events, options?)` is a reusable attachment factory. Decoded audio is cached by URL across attachment instances. Failed loads leave the cache so a later play can retry.

`new Sound(src, options?)` is for imperative playback. `await play()` returns a handle that stops just that playback, or `null` when Web Audio is unavailable. Calls can overlap. `stop()` stops all current playbacks and cancels pending ones. `preload()` resolves to `true` when decoding succeeds, `false` when Web Audio is unavailable, and rejects on load errors.

`volume` must be between 0 and 1; `rate` must be positive. Both are validated when constructing a `Sound`.
