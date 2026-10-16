# @joknoll/svelte-attach-key

Keyboard shortcuts for Svelte 5 elements.

```bash
vp add @joknoll/svelte-attach-key
```

```svelte
<script lang="ts">
  import { hotkey, pressed, formatHint } from "@joknoll/svelte-attach-key";
</script>

<button
  title={formatHint("mod+k")}
  {@attach hotkey("mod+k")}
  {@attach pressed("mod+k")}
>
  Open command menu
</button>
```

`hotkey(keys, onTrigger?, options?)` invokes the callback or clicks the attached element. It sets `aria-keyshortcuts` and restores the previous value on cleanup. Pass an array for alternatives, such as `["j", "arrowdown"]`. `mod` means Meta on Apple devices and Control elsewhere. When two attached elements claim the same shortcut, the most recently attached one wins; removing it restores the previous one.

`pressed(keys, className = "is-pressed")` adds a class while a shortcut is held. Keys are explicit so this attachment does not depend on the order of other attachments or an ARIA attribute.

`formatHint(keys)` formats shortcuts for display. Invalid shortcuts, such as a missing key or multiple ordinary keys in one combination, throw `TypeError`.

Hotkeys are global. They ignore repeated keys, IME composition, editable targets, disabled elements, and elements inside an inert subtree by default. `data-keyshortcuts-ignore` on a container suppresses hotkeys while focus is inside it. The options `preventDefault`, `stopPropagation`, `ignoreInputs`, and `ignoreRepeat` control dispatch behavior.
