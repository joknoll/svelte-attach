---
name: update-deps
description: Update dependencies with vp, verify migrations, and find code the new releases could simplify.
disable-model-invocation: true
---

## Rules

- Preserve user edits. Try one out-of-range upgrade or coupled group at a time.
  Before each trial, save the current state of the files it may change, including
  manifests and the lockfile. Roll back to that state, not to `HEAD`.
- Keep shared versions in the catalog. If `vp update` moves a root-only
  dependency there, keep it in its existing manifest unless the version needs
  to be shared. Let `vp migrate` align the Vite+ pins.
- Apply small, documented fixes that preserve behavior. Ask before changing
  public behavior, raising consumer runtime or peer minimums, or making a broad
  rewrite. The root Node dev/CI pin is managed separately below.
- Don't weaken checks or add overrides to force an upgrade through. Leave
  pnpm and the global `vp` CLI unchanged unless requested.
- **Hold: TypeScript in `example/`.** Stay on 6.x until both SvelteKit and
  `svelte-check` document 7.x support and their published TypeScript peer ranges
  allow it. Experimental `--tsgo` fixes don't lift the hold. Then try the
  existing `catalog:` entry and run `vp run example#check`. Leave the root on 7.x.

## Update

1. **Baseline**
   - Work from the repo root. Check `git status --short`, `package.json`,
     `example/package.json`, and `pnpm-workspace.yaml`.
   - Run `vp install --frozen-lockfile`, then `vp run ready`. If either fails,
     report it and stop before changing versions.

2. **Reconcile Node.js and its typings**
   - Follow **Node.js** below before evaluating other dependency upgrades.

3. **Scan**
   - Run `vp outdated -r --format list`, then run it again with `--compatible`
     to see updates within the declared ranges.
   - Exit `1` can mean updates were found. Check the output before treating it
     as an error.

4. **Update in range**
   - Run `vp update -r -- --depth 0 --include-workspace-root`, or target named
     packages if a rule limits the batch.
   - Review the manifest and lockfile diff. Keep the original range when the
     resolved version didn't change. If you restore a range, refresh the
     lockfile with `vp install`.
   - Run `vp run ready`. If the batch fails, split it and keep the updates that
     pass.

5. **Try newer versions**
   - Check holds. Read release notes for the full version jump, including
     skipped majors, and check peer requirements and compatibility with the
     root Node pin.
   - Run `vp update <package>@<version>`, or edit its existing declaration and
     run `vp install`. For the project toolchain, follow **Vite+** below.
   - Apply allowed fixes. Run targeted checks, then `vp run ready`. Smoke-test
     affected example behavior and verify declared minimums when relevant.
   - If a trial fails or can't be verified, undo only that trial, run
     `vp install --frozen-lockfile`, and continue with unrelated upgrades.

6. **Verify the final set**
   - Run `vp install --frozen-lockfile` and `vp run --no-cache ready` with all
     retained upgrades in place.
   - If Node or build tooling changed, also build from `example/` with
     `BASE_PATH=/svelte-attach vp build`, as the Pages workflow does. Serve the
     output under `/svelte-attach/` and check navigation, asset loads, and page
     errors in a browser. The normal `ready` build doesn't exercise the subpath.

7. **Explore new features**
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

## Node.js

- Compare the root `devEngines.runtime` pin with the newest stable release
  from `vp env list-remote node --sort desc`. Ignore prereleases. Before
  repinning, read the release notes for the version jump and check the
  toolchain's Node requirements. If the toolchain blocks the release, report
  the blocker and keep the current pin.
- For a supported newer release, run
  `vp env pin <version> --target dev-engines --force` from the root. This is
  the contributor and CI pin, inherited by `example/` and Pages. Don't change
  consumer-facing `engines.node` or the machine-wide Node default.
- Compare `@types/node` in the catalog with the pinned Node major even if the
  pin was already current. If they differ, select the latest typings for the
  pinned major and run `vp install`.
- Check `vp env current` and `vp -C example env current` against the root pin.
  If Node or its typings changed, apply allowed fixes, run
  `vp install --frozen-lockfile` and `vp run ready`, and roll back only the
  trial if it can't be verified.

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

- **Versions:** Use a table with `Package / Scope | From | To | Latest | Note`
  for upgrades kept, active holds, and deferred trials. Fill in `Latest` only
  when it differs from `To`. Say what would unblock each hold or deferral.
  Include Node.js. List local `vite-plus` and global `vp` separately.
- **Migrations:** Point to the files changed and explain why each change
  was needed for the upgrade.
- **Opportunities:** Link each unapplied idea to the upstream feature and
  the code it could replace. Say what gets simpler and note any support
  trade-offs.
- **Verification:** List checks and smoke tests run, failures, and anything
  you couldn't verify.

## Releases

- [Node.js](https://nodejs.org/en/blog/release) · [Vite+ environments](https://viteplus.dev/guide/env)
- [Vite+](https://github.com/voidzero-dev/vite-plus/releases) · [Project upgrade](https://viteplus.dev/guide/upgrade-project) · [CLI upgrade](https://viteplus.dev/guide/upgrade)
- [Svelte](https://github.com/sveltejs/svelte/releases) · [SvelteKit](https://github.com/sveltejs/kit/releases) · [Svelte tooling](https://github.com/sveltejs/language-tools/releases)
- [TypeScript](https://github.com/microsoft/TypeScript/releases) · [jsdom](https://github.com/jsdom/jsdom/releases)
