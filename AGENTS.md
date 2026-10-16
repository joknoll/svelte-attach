Use `vp` instead of npm or pnpm, `vpx` instead of npx, and `uv` instead of direct Python or pip.

This workspace publishes four independent Svelte attachment packages from `packages/`. The example site is in `examples/website`. Keep browser APIs guarded for SSR, and make each attachment clean up the listeners and work it owns.

After changing dependencies, run `vp install`. Validate changes with `vp run ready`, which checks, tests, and builds the workspace.
