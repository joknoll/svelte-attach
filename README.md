# svelte-attach

Small Svelte 5 attachment packages for keyboard shortcuts, sound effects, vibration, and gamepad buttons. Each package is published independently and can be installed on its own.

| Package                                              | Purpose                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| [`@joknoll/svelte-attach-key`](packages/key)         | Keyboard shortcuts and pressed state               |
| [`@joknoll/svelte-attach-sound`](packages/sound)     | Web Audio playback bound to DOM events             |
| [`@joknoll/svelte-attach-haptic`](packages/haptic)   | Web Vibration feedback bound to DOM events         |
| [`@joknoll/svelte-attach-gamepad`](packages/gamepad) | Standard gamepad buttons bound to focused elements |

The example site lives in [`examples/website`](examples/website).

## Development

```bash
vp install
vp run ready
vp run dev
```

`vp run ready` formats, lints, type-checks, tests, and builds the workspace. Package builds use Vite+ 1.2's `vp pack`.
