# @joknoll/svelte-attach-haptic

Native Web Vibration feedback for Svelte 5 elements.

```bash
vp add @joknoll/svelte-attach-haptic
```

```svelte
<script lang="ts">
  import { haptic, triggerHaptic } from "@joknoll/svelte-attach-haptic";
</script>

<button {@attach haptic({ pattern: "selection", event: "pointerdown" })}>
  Select
</button>
<button onclick={() => triggerHaptic("success")}>Saved</button>
```

`haptic({ pattern = "medium", event = "click" })` triggers vibration when the element receives an event and removes its listener on cleanup. The pattern can be a preset name, one duration in milliseconds, or a native sequence of alternating vibration and pause durations. Available presets are `light`, `medium`, `heavy`, `soft`, `rigid`, `selection`, `success`, `warning`, `error`, `nudge`, and `buzz`.

`createPattern(input)` returns a validated copy of the native duration sequence. Empty, negative, or non-finite durations are rejected. `triggerHaptic(input)` and `cancelHaptic()` return the browser's success boolean, or `false` when vibration is unavailable. `cancelHaptic()` stops the device's current vibration, including one started outside this package.

The Web Vibration API controls timing, not physical intensity. Support varies by browser and device; use vibration as an optional complement to visible feedback.
