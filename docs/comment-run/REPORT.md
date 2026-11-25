# Code quality, API ergonomics, and comments

The workspace’s four packages have small public entry points and a clear attachment model. Default clicks let callers keep the usual button behavior. Key and gamepad share listeners or polling across attachments, while sound shares decoded audio across its imperative and attachment APIs. Those choices are worth preserving.

## Code review findings

1. **P2 — Global hotkeys can override controls that already handled the event.** A local handler that calls `preventDefault()` still triggers the window hotkey. An input in a shadow root can also trigger it because the dispatcher sees the host as the target. Both reproduced with jsdom. Respect locally handled events and check the composed path for editable targets. [Dispatcher](../../packages/key/src/dispatcher.ts#L138)
2. **P2 — Policy-blocked gamepad access throws every animation frame.** `isSupported` is true when the API exists, even if Permissions Policy denies access. `isButtonPressed()` propagates the resulting `SecurityError` and the poller schedules itself again from `finally`. A thrown-error stub reproduced both paths. Treat policy denial as an unavailable state and stop polling when it occurs. [Polling](../../packages/gamepad/src/polling.ts#L24) · [Gamepad specification](https://www.w3.org/TR/gamepad/#dom-navigator-getgamepads)
3. **P2 — Shifted punctuation can disagree with the announced hotkey.** `shift+5` advertises `Shift+5` but the matching code expects `event.key === "5"`. A U.S. layout sends `"%"`. Using `shift+%` matches that event while advertising a different shortcut from the WAI-ARIA convention. A synthetic key event reproduced the mismatch. Define how layout-sensitive keys are matched before adding shortcuts of this kind to examples. [Matcher](../../packages/key/src/dispatcher.ts#L104) · [WAI-ARIA shortcut syntax](https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts) · [UI Events key values](https://www.w3.org/TR/uievents-key/)
4. **P2 — A gamepad callback can leave two polling loops running.** Synchronously detaching the last registration and adding one in `onPress` schedules a frame in registration and another in the current frame’s `finally`. A frame harness confirmed that later cleanup cancels only one outstanding ID. Track when a poll is in progress, and schedule the next frame in one place. [Frame scheduling](../../packages/gamepad/src/polling.ts#L57)
5. **P2 — Overlapping keyboard attachments leave stale accessibility state.** Attach `hotkey("a")` and `hotkey("b")` to the same element, then detach A before B. A’s cleanup hides B’s live ARIA value and B’s cleanup leaves A’s stale value. Reproduced with jsdom. Track live registrations and the original attribute together. [Hotkey setup and cleanup](../../packages/key/src/attachments.ts#L39)
6. **P2 — Sound can report an error after the attachment detaches.** In-flight errors still reach `onError`, and `Sound.stop()` can leave an awaited `play()` pending until the context resumes. A deferred fetch and suspended-context stub reproduced both. Separate cancellation of the caller’s playback from the shared fetch/decode promise. Browser autoplay policy can keep `resume()` pending until activation. [Playback](../../packages/sound/src/index.ts#L58) · [Attachment](../../packages/sound/src/index.ts#L134) · [Web Audio specification](https://www.w3.org/TR/webaudio/#dom-audiocontext-resume)
7. **P3 — The vibration validator accepts durations that become cancellation.** A positive fraction below 1 ms truncates to zero, and `2 ** 32` wraps to zero at the Web IDL boundary. For single-entry patterns, zero requests cancellation. Define the accepted integer range or document that browser conversion applies. An unrecognized preset from JavaScript can also hit an inherited object key such as `constructor` and fail with an unrelated type error. Use an own-key lookup and an explicit unknown-preset error. [Pattern validation](../../packages/haptic/src/index.ts#L32) · [Vibration specification](https://www.w3.org/TR/vibration/#vibration-interface) · [Web IDL unsigned long](https://webidl.spec.whatwg.org/#es-unsigned-long)

Two additional attachment assumptions deserve coverage. The `pressed` attachment can remove a class it never added, and two hotkeys sharing a chord can both look pressed even though only one activates. A focused button inside a shadow root also fails the gamepad focus guard because `document.activeElement` is the host. [Pressed cleanup](../../packages/key/src/attachments.ts#L75) · [Gamepad focus guard](../../packages/gamepad/src/polling.ts#L43) · [HTML focus API](https://html.spec.whatwg.org/multipage/interaction.html#dom-documentorshadowroot-activeelement)

## API ergonomics

| Package | What works                                                                                                                                                 | Where callers have to do extra work                                                                                                                                                                                                                                                                                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Key     | `hotkey("mod+k")` is a short call, defaults to a click, and composes with `pressed()` and `formatHint()`.                                                  | Keep the concise call and add an options-object overload for callback, scope, or priority. Today options-only calls need an explicit `undefined`, callback elements are typed as `HTMLElement`, and reuse of a readonly shortcuts tuple is rejected. Document exact modifier matching and consider a platform argument to `formatHint()` when rendering on the server.         |
| Sound   | The dynamic source resolver fits stateful controls. Independent playback handles, a shared decode cache, and explicit `preload()` cover more advanced use. | `useSound()` only accepts static URLs and cannot configure `onError`, so the reusable and inline forms diverge. Invalid volume throws during mount for a static URL but reaches `onError` on the first event for a resolver. An attachment-options factory could share validation and defaults. Named play and stop events would make two-event configurations easier to scan. |
| Haptic  | `haptic()` has a useful default and the imperative API accepts the same presets and sequences. Cleanup leaves shared vibration alone.                      | An import-time `isSupported` value answers API presence only. Prefer a live capability helper if callers need to evaluate support later, and keep it distinct from whether a request succeeded. If presets are meant to be immutable, freeze them at runtime or expose copies.                                                                                                 |
| Gamepad | A focused button needs only `gamepadButton("A")`. The attachment keeps browser polling out of the caller’s component.                                      | A state display needs a snapshot API. The example reads `getGamepads()` 18 times per frame for connection status and 17 button states in addition to the attachment poller. A standard-pad snapshot and a generic `onPress` element type would help consumers build richer controls.                                                                                           |

The live example and the dynamic resolver also make sound cache ownership more visible. The module retains decoded buffers for every successful URL, and an attachment retains one `Sound` per selected URL until detach. This fits a fixed set of sound effects. For applications selecting from a growing set of URLs, document a cache lifetime or offer bounded caching. [Shared cache](../../packages/sound/src/audio.ts#L1) · [Dynamic source instances](../../packages/sound/src/index.ts#L124)

## Comment counts

Counts use the starting working tree, including the in-progress sound changes. The inventory lists every scoped file. Positive changes are mainly call-site documentation, browser contracts, and directive reasons. [Inventory](INVENTORY.md)

| Domain                  | Before |  After |
| ----------------------- | -----: | -----: |
| Key                     |     26 |     15 |
| Sound                   |      8 |     11 |
| Haptic                  |      6 |      8 |
| Gamepad                 |      2 |     10 |
| Example site            |     20 |      4 |
| Workspace configuration |      4 |      0 |
| **Total**               | **66** | **48** |

## Tag map

### CONTRACT

- [examples/website/src/app.d.ts:3](../../examples/website/src/app.d.ts#L3) — SvelteKit’s application-wide types.
- [packages/gamepad/src/buttons.ts:1](../../packages/gamepad/src/buttons.ts#L1) — Standard Gamepad API button positions.
- [packages/haptic/src/index.ts:4](../../packages/haptic/src/index.ts#L4) — Vibration and pause durations in milliseconds.
- [packages/key/src/dispatcher.ts:29](../../packages/key/src/dispatcher.ts#L29) — ARIA spellings for Space and Plus.
- [packages/key/src/dispatcher.ts:149](../../packages/key/src/dispatcher.ts#L149) — Focus behavior at the boundary of a marked shortcut-ignore zone.

### FIXME

- [packages/gamepad/src/polling.ts:34](../../packages/gamepad/src/polling.ts#L34) — Gamepad access denied by policy throws on every frame.
- [packages/gamepad/src/polling.ts:43](../../packages/gamepad/src/polling.ts#L43) — The focus check skips elements inside a shadow root.
- [packages/gamepad/src/polling.ts:58](../../packages/gamepad/src/polling.ts#L58) — Replacing the last registration in a callback can start a second loop.
- [packages/key/src/attachments.ts:41](../../packages/key/src/attachments.ts#L41) — Out-of-order detachment leaves stale ARIA.

There are no `TODO:`, `HACK:`, `WARNING:`, or `SECURITY:` tags in the scoped files.

## Comment and code mismatches

- **Key ARIA restore.** The old unconditional cleanup promise is valid for a single attachment. Overlapping attachments expose a code bug, documented beside the saved attribute.
- **Sound cancellation.** “Cancels plays still waiting” is ambiguous. The code prevents playback from starting, while load and resume still settle independently. The hover docs now say what is canceled. The README also only describes the unsupported case for a `null` playback, even though a stop can produce it.
- **Gamepad default pad.** A test title implies that the default scans for a standard pad. The implementation inspects the first occupied slot and rejects its mapping if nonstandard. The README describes the first-slot policy. Clarify the test or decide whether to change the selection policy.
- **Keyboard examples.** The page advertises H for the checkbox, but the default editable-target guard blocks H while the checkbox has focus. It also describes Shift+Space as an attachment option, although the example supplies it as the same positional argument as the other shortcuts. The toggle needs an explicit behavior choice. The Shift+Space explanation is stale. [Key examples](../../examples/website/src/routes/key/+page.svelte#L72)
- **Svelte upgrade cue.** The old Vite comment promised that the runes override could be removed in Svelte 6. The documented default does change, but dependency compatibility still needs checking. The comment now preserves the upgrade cue with that condition. [Svelte compiler options](https://svelte.dev/docs/svelte/svelte-compiler#CompileOptions)

## Directives and decisions

All four `@vitest-environment jsdom` directives are byte-identical. Each has a reason beside it. There are no unexplained directives and no renames. The structure suggestions above focus on dispatch ownership, sharing a gamepad snapshot, and using one sound configuration path.

- **How much hover documentation belongs in a comment pass?** Keep exact shortcut display examples, ARIA ownership, playback rejection, and gamepad focus and press semantics because callers need them. Drop markup headings and scaffolding that the code or the remaining SvelteKit link already covers.
- **Which uncertain comments should stay?** Keep the Svelte upgrade cue and the sound gesture-order comment because each records a dependency or browser constraint. The independent reviewer also identified lost ARIA behavior and formatting examples, which were restored in compact hover documentation. The reviewer flagged an overbroad claim about sound cancellation, which now includes the load and resume error behavior.
- **Which version of sound should the review describe?** Use the working tree, which already had a dynamic source resolver and switch example. Stage the review’s comment edits separately from that work. Leave the unrelated nested `button-sounds/` checkout outside the review.
- **Should findings change executable code now?** Keep the pass comment-only. Report the functional changes and test gaps with concrete examples for a later pass.

## Verification

- Compared all tracked starting files against the reviewed tree and separately compared the committed branch against its starting commit. All 19 changed source and configuration files matched line for line after removing standalone comments. Four test directives matched verbatim.
- Compared comment-stripped JavaScript emitted for 14 TypeScript files. Compared Svelte client and server JavaScript after removing emitted comments, with byte-identical CSS for both changed components. The declaration-only file matched after stripping comments.
- `vp run ready` passed in an isolated checkout of the review branch with 11 tests, and passed again with the in-progress sound edits and 12 tests. Each run covered formatting, lint, type checks, package builds, and the prerendered site. The shared checkout later picked up formatting errors from the unrelated nested `button-sounds/` repository, so the final checks ran in isolation. Browser-dependent findings used synthetic events, controlled API stubs, or the cited standards.
- A fresh reviewer read the complete source and configuration diff independently. The final check was run directly with `vp run ready`, so the commits could omit the staged auto-fix hook while keeping the pre-existing edits out of the index.
