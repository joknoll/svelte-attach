Use `vp` instead of npm or pnpm, `vpx` instead of npx, and `uv` instead of direct Python or pip.

This repository publishes one package, `@joknoll/svelte-attach`, with four subpath entries: `/key` (`src/key/`), `/sound` (`src/sound.ts`), `/haptic` (`src/haptic.ts`), and `/gamepad` (`src/gamepad.ts`). Tests live in `test/`. The example site is in `examples/website` and consumes the built package from `dist/`. Keep browser APIs guarded for SSR, and make each attachment clean up the listeners and work it owns.

Every attachment factory takes `(primary, options?)`. Callbacks receive the element first, invalid arguments throw when the factory is called, and browser-API modules export an `isSupported()` function.

After changing dependencies, run `vp install`. Validate changes with `vp run ready`, which checks, builds, tests, and builds the example site.
