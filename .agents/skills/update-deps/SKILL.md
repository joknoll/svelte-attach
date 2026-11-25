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

1. **Read-only preflight**
   - Work from the repo root. Check `git status --short`, `package.json`,
     `example/package.json`, and `pnpm-workspace.yaml`.
   - Run `vp outdated -r --format json` once. A `wanted` version newer than
     `current` is an in-range update. A `latest` version newer than `wanted`
     is a candidate outside the declared range. Exit `1` can mean updates were
     found; check the output and don't treat scan errors as an empty result.
   - Check the Node pin and typings and the local and global Vite+ versions
     using **Node.js** and **Vite+** below, without changing anything yet.
     If nothing is actionable after accounting for holds and blockers, report
     that and stop without installing or running checks.

2. **Baseline**
   - Before changing versions, run `vp install --frozen-lockfile`, then
     `vp run ready`. If either fails, report it and stop.

3. **Reconcile Node.js and its typings**
   - Follow **Node.js** below before trying the other dependency updates.

4. **Update in range**
   - If the scan found in-range updates, run
     `vp update -r -- --depth 0 --include-workspace-root`, or target named
     packages if a rule limits the batch.
   - Review the manifest and lockfile diff. Keep the original range when the
     resolved version didn't change. If you restore a range, refresh the
     lockfile with `vp install`.
   - Choose checks from **Trial checks** below. If the batch fails, split it
     and keep the updates that pass.

5. **Try newer versions**
   - Check holds. Read release notes for the full version jump, including
     skipped majors. Note migration risks and possible feature leads. Check
     peer requirements and compatibility with the root Node pin.
   - Run `vp update <package>@<version>`, or edit its existing declaration and
     run `vp install`. For the project toolchain, follow **Vite+** below.
   - Apply allowed fixes and choose checks from **Trial checks** below. Verify
     declared minimums when relevant.
   - If a trial fails or can't be verified, undo only that trial, run
     `vp install --frozen-lockfile`, and continue with unrelated upgrades.

6. **Verify the final set**
   - If any upgrades were retained, run `vp install --frozen-lockfile` and
     `vp run --no-cache ready` with all of them in place. If a failure appears
     only here, isolate it using the saved trial states. Keep unrelated
     upgrades that pass and rerun the final checks on the resulting set.
   - If Node, build tooling, or example behavior changed, also build from
     `example/` with `BASE_PATH=/svelte-attach vp build`, as the Pages workflow
     does. Serve the output under `/svelte-attach/` and check navigation, asset
     loads, and page errors in a browser. The normal `ready` build doesn't
     exercise the subpath.

7. **Explore new features**
   - Reuse release notes from the trials. Read only version ranges not yet
     reviewed for upgrades you kept. Look for APIs, defaults, or tooling that
     could remove workarounds, simplify state or cleanup, or improve the
     example's design. Confirm the feature and its minimum version in upstream
     docs.
   - Search for what the feature would replace: old APIs, config, or code that
     solves the same problem. Check files touched during migration for
     workarounds the new release makes obsolete.
   - Read the matching code, callers, and tests. Report the file, what you'd
     replace, why it's better, and how you'd verify it. Note any support
     trade-offs. Skip ideas without a concrete fit and don't apply them unless requested.

## Trial checks

- Match checks to what changed. A jsdom-only trial needs `vp test --run`.
  A typings-only trial needs `vp check` and `vp run example#check`.
- Run `vp run ready` for Node runtime or Vite+ changes, or when a trial
  affects several parts of the project and focused checks won't cover it.
- Save browser smoke tests for the final set unless a specific trial needs
  one to verify or isolate a behavior change.

## Node.js

- During preflight, compare the root `devEngines.runtime` pin with the newest
  stable release from `vp env list-remote node --sort desc`. Ignore prereleases. Before
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
- If Node or its typings changed, check `vp env current` and
  `vp -C example env current` against the root pin. Apply allowed fixes, run
  `vp install --frozen-lockfile`, and follow **Trial checks**. Roll back only
  that trial if it can't be verified.

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
