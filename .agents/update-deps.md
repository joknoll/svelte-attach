# Dependency updates

## Holds

- Keep `example/` on TypeScript 6 until SvelteKit and `svelte-check` both document 7.x support and their published peer ranges allow it. Experimental `--tsgo` fixes don't lift the hold. Then try the existing `catalog:` entry and run `vp run example#check`. Leave the root on 7.x.
- Leave pnpm and global `vp` unchanged unless requested. Don't raise published Node or peer minimums without approval.

## Node

- Compare the root `devEngines.runtime` pin with the latest stable Node from `vp env list-remote node --sort desc`. Ignore prereleases. If the supported newer version fits the toolchain, read the release notes and run `vp env pin <version> --target dev-engines --force` from the root. This is the contributor and CI pin inherited by the example and Pages; don't change `engines.node` or the machine-wide default. Report a toolchain blocker rather than forcing the pin.
- Check the catalog's `@types/node` against the pinned major even if Node did not change. If the major differs, pick the latest typings for the pinned major and run `vp install`. After a runtime or typings change, check `vp env current` and `vp -C example env current`, run a frozen install, and verify the trial before updating other dependencies.

## Vite+

When the global CLI is newer and matches the project release being tried, read that release's notes, then run `vp migrate --no-interactive`, `vp install`, `vp toolchain`, and `vp run ready`. Review the catalog and lockfile. Don't update the alias separately or use `--full` for a version bump. `vp upgrade --check` can check the global CLI; only upgrade it if requested. A worktree doesn't isolate the global CLI.

## Checks

- Baseline: `vp run ready` after the frozen install. Final: `vp run --no-cache ready` after the frozen install.
- Focused trials: `vp test --run` for jsdom alone; `vp check` and `vp run example#check` for typings alone. Use `vp run ready` for Node, Vite+, or broad changes.
- If Node, build tooling, or example behavior changed, build from `example/` with `BASE_PATH=/svelte-attach vp build`. Serve the output under `/svelte-attach/` and check navigation, assets, and page errors in a browser. The usual `ready` build does not exercise that subpath.
