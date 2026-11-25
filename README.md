# @joknoll/svelte-attach

Svelte attachments to add keyboard shortcuts, sound effects, vibration, and gamepad controls to Svelte 5 components.

[Try the examples](https://joknoll.github.io/svelte-attach/)

## Usage

Requires Svelte `5.55.0` or later.

### Keyboard

```svelte
<script lang="ts">
  import { hotkey } from "@joknoll/svelte-attach/key";
</script>

<button popovertarget="shortcuts" {@attach hotkey("mod+k")}>
  Show shortcuts
</button>

<div id="shortcuts" popover>Press Escape to close.</div>
```

Press `⌘K` on Apple devices or `Ctrl+K` elsewhere to open the popover. The button doesn’t need focus.

### Sound

```svelte
<script lang="ts">
  import { sound } from "@joknoll/svelte-attach/sound";
  import click from "./click.opus";
</script>

<button {@attach sound(click)}>Play sound</button>
```

Sound plays on `click` by default. Set `on` to use a different event.

Use sound sparingly for meaningful moments, like completing a task. Avoid playing it on every click or keystroke, and let users mute it.

### Vibration

```svelte
<script lang="ts">
  import { haptic } from "@joknoll/svelte-attach/haptic";
</script>

<button {@attach haptic("light")}>Try vibration</button>
```

The button vibrates the device on click if the browser and device support vibration.

Use a brief pulse to confirm a deliberate action, like snapping an item into place. Avoid buzzing during repeated actions like scrolling or typing. Keep visible feedback so the interaction works without vibration.

### Gamepad

```svelte
<script lang="ts">
  import { gamepadButton } from "@joknoll/svelte-attach/gamepad";
</script>

<button popovertarget="gamepad-help" {@attach gamepadButton("A")}>
  Show controls
</button>

<div id="gamepad-help" popover>Press Escape to close.</div>
```

Focus the button, then press `A` on a standard-mapped gamepad to open the popover.

[Full documentation](docs/)
