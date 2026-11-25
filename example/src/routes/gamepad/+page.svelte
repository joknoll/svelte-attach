<script lang="ts">
  import { isSupported, gamepadButton, type ButtonName } from "@joknoll/svelte-attach/gamepad";
  import Example from "#lib/Example.svelte";
  import Notice from "#lib/Notice.svelte";
  import PadButton from "#lib/PadButton.svelte";
  import PageHeader from "#lib/PageHeader.svelte";
  import Section from "#lib/Section.svelte";
  import { connected, held } from "#lib/gamepad.svelte.ts";
  import { hydrated } from "#lib/hydrated.svelte.ts";

  // SYNC(docs/gamepad.md): the groups under "Buttons".
  const groups: { name: string; buttons: ButtonName[] }[] = [
    { name: "Face", buttons: ["A", "B", "X", "Y"] },
    { name: "Shoulders and triggers", buttons: ["LB", "RB", "LT", "RT"] },
    { name: "Stick clicks", buttons: ["L3", "R3"] },
    { name: "D-pad", buttons: ["UP", "DOWN", "LEFT", "RIGHT"] },
    { name: "System", buttons: ["SELECT", "START", "HOME"] },
  ];

  // Assumed while prerendering, so supporting browsers don't flash the notice.
  const supported = $derived(!hydrated() || isSupported());

  const actions = [
    { button: "A", label: "Activate", done: "Activated" },
    { button: "START", label: "Menu", done: "Menu opened" },
  ] as const;
  type Action = (typeof actions)[number];

  let action = $state.raw<Action>(actions[0]);
  let count = $state(0);

  function activate(next: Action) {
    count = next === action ? count + 1 : 1;
    action = next;
  }

  let jumps = $state(0);
</script>

<PageHeader
  title="Gamepad"
  accent="flick"
  code={'import { gamepadButton, isButtonPressed, isSupported } from "@joknoll/svelte-attach/gamepad";'}
  docs="gamepad.md"
/>

{#if !supported}
  <Notice>This browser doesn't support the Gamepad API.</Notice>
{:else if !connected()}
  <Notice>Connect a gamepad and press any button.</Notice>
{/if}

<Section title="Read a button">
  <Example
    code={`requestAnimationFrame(function poll() {
  held = isButtonPressed("A");
  requestAnimationFrame(poll);
});`}
  >
    <dl data-slot="map">
      {#each groups as group (group.name)}
        <dt>{group.name}</dt>
        <dd>
          {#each group.buttons as name (name)}
            <div>
              <PadButton {name} held={held(name)} />
              <!-- PadButton already names the button for screen readers. -->
              <code aria-hidden="true">{name}</code>
            </div>
          {/each}
        </dd>
      {/each}
    </dl>
  </Example>
</Section>

<Section title="Activate the focused element">
  {#snippet lead()}
    Tab to a button, then press its gamepad shortcut. Only the focused button responds.
  {/snippet}
  <Example code={`<button {@attach gamepadButton("${action.button}")}>${action.label}</button>`}>
    {#each actions as item (item.button)}
      <button {@attach gamepadButton(item.button)} onclick={() => activate(item)}>
        {item.label}
        <PadButton name={item.button} />
      </button>
    {/each}
    <output>{count ? `${action.done} ×${count}` : ""}</output>
  </Example>
</Section>

<Section title="Activate without focus">
  {#snippet lead()}
    Press <PadButton name="Y" /> to jump. <PadButton name="LB" /> and <PadButton name="RB" /> switch pages.
  {/snippet}
  <Example code={'<button {@attach gamepadButton("Y", { requireFocus: false })}>Jump</button>'}>
    <button {@attach gamepadButton("Y", { requireFocus: false })} onclick={() => jumps++}>
      Jump <PadButton name="Y" />
    </button>
    <output>{jumps ? `Jumped ×${jumps}` : ""}</output>
  </Example>
</Section>

<style>
  [data-slot="map"] {
    display: grid;
    flex: 1 1 100%;
    grid-template-columns: max-content 1fr;
    gap: var(--space-2xs) var(--space-m);
    align-items: center;
    margin: 0;

    & dt {
      font-size: var(--text--1);
      color: var(--color-text-muted);
    }

    & dd {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
      align-items: end;
      margin: 0;
      font-size: 1.375rem;
    }

    /* Each button above its API name. */
    & dd > div {
      display: grid;
      gap: var(--space-3xs);
      justify-items: center;
      min-inline-size: 3rem;
    }

    & code {
      font-size: var(--text--1);
      color: var(--color-text-muted);
    }

    @media (width < 36rem) {
      grid-template-columns: 1fr;
    }
  }
</style>
