# @joknoll/svelte-attach-gamepad

Standard gamepad buttons for Svelte 5 elements.

```bash
vp add @joknoll/svelte-attach-gamepad
```

```svelte
<script lang="ts">
  import { gamepadButton } from "@joknoll/svelte-attach-gamepad";
</script>

<button {@attach gamepadButton("A")} onclick={() => console.log("activated")}>
  Focus me, then press A
</button>
```

`gamepadButton(button, options?)` clicks the attached element on a new press **only while it has focus**. It ignores disabled elements, uses one shared animation-frame poller, and stops polling when the last attachment is removed. `options.padIndex` selects a specific gamepad slot; by default the first connected pad is used. `options.onPress(pad, element)` replaces the default click action.

`isButtonPressed(button, padIndex?)` reads the current state once. It returns `false` on the server, when no gamepad is connected, or when the pad does not report the standard mapping. `GamepadButtonMap` and `ButtonName` expose the named button positions, including `A`, `B`, `X`, `Y`, shoulders, triggers, stick presses, directional buttons, and `HOME`.
