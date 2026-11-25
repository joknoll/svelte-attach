---
name: update-deps
description: Update dependencies with vp, verify migrations, and find code the new releases could simplify.
disable-model-invocation: true
---

## Rules

- Preserve user edits. Try one out-of-range upgrade or coupled group at a time.
- Keep shared versions in the catalog. Let `vp migrate` align the Vite+ pins.
- Apply small, documented fixes that preserve behavior. Ask before changing
  public behavior, raising runtime or peer minimums, or making a broad rewrite.
- Don't weaken checks or add overrides to force an upgrade through. Leave
  Node.js, pnpm, and the global `vp` CLI unchanged unless requested.
- **Hold: TypeScript in `example/`.** Stay on 6.x until the example's Svelte
  tooling, especially `svelte-check`, documents 7.x support. Then try the
  existing `catalog:` entry and run `vp run example#check`. Leave the root on 7.x.

## Update

1. **Baseline**
   - Work from the repo root. Check `git status --short`, `package.json`,
     `example/package.json`, and `pnpm-workspace.yaml`.
   - Run `vp install --frozen-lockfile`, then `vp run ready`. If either fails,
     report it and stop before changing versions.

2. **Scan**
   - Run `vp outdated -r --format list`, then run it again with `--compatible`
     to see updates within the declared ranges.
   - Exit `1` can mean updates were found. Check the output before treating it
     as an error.

3. **Update in range**
   - Run `vp update -r -- --depth 0 --include-workspace-root`, or target named
     packages if a rule limits the batch.
   - Review the diff and run `vp run ready`. If the batch fails, split it and
     keep the updates that pass.

4. **Try newer versions**
   - Check holds. Read release notes for the full version jump, including
     skipped majors, and check Node and peer requirements.
   - Run `vp update <package>@<version>`, or edit the catalog and run
     `vp install`. For the project toolchain, follow **Vite+** below.
   - Apply allowed fixes. Run targeted checks, then `vp run ready`. Smoke-test
     affected example behavior and verify declared minimums when relevant.
   - If a trial fails or can't be verified, undo only that trial, run
     `vp install --frozen-lockfile`, and continue with unrelated upgrades.

5. **Verify the final set**
   - Run `vp run ready` with all retained upgrades in place.

6. **Explore new features**
   - Read the release notes from the old version to the new one for each
     upgrade you kept. Look for APIs, defaults, or tooling that could remove
     workarounds, simplify state or cleanup, or improve the example's design.
     Confirm the feature and its minimum version in upstream docs.
   - Search for what the feature would replace: old APIs, config, or code that
     solves the same problem. Check files touched during migration for
     workarounds the new release makes obsolete.
   - Read the matching code, callers, and tests. Report the file, what you'd
     replace, why it's better, and how you'd verify it. Note any support
     trade-offs. Skip ideas without a concrete fit and don't apply them unless requested.

## Vite+

Run `vp --version` to see the global CLI and local `vite-plus` versions.
If the global CLI is newer and matches the project release you want to try,
read its release notes and run:

```sh
vp migrate --no-interactive
vp install
vp toolchain
vp run ready
```

Review the catalog and lockfile diff. Don't update the `vite` alias on its
own or pass `--full` for a version bump.

Use `vp upgrade --check` to check the global CLI. If the target project
release needs a newer CLI, report that before proceeding. Run `vp upgrade`
or `vp upgrade <version>` only when requested. A worktree doesn't isolate
the global change. If the CLI upgrade causes a regression, use
`vp upgrade --rollback`.

## Report

List version changes and migrations kept, checks run, and anything you
couldn't verify. Say what would unblock each active hold or deferred upgrade.
Report local `vite-plus` and global `vp` separately. Keep feature ideas separate
from the changes you made.

## Releases

- [Vite+](https://github.com/voidzero-dev/vite-plus/releases) · [Project upgrade](https://viteplus.dev/guide/upgrade-project) · [CLI upgrade](https://viteplus.dev/guide/upgrade)
- [Svelte](https://github.com/sveltejs/svelte/releases) · [SvelteKit](https://github.com/sveltejs/kit/releases) · [Svelte tooling](https://github.com/sveltejs/language-tools/releases)
- [TypeScript](https://github.com/microsoft/TypeScript/releases) · [jsdom](https://github.com/jsdom/jsdom/releases)
