<script lang="ts">
  import {
    cancelHaptic,
    haptic,
    isSupported,
    patterns,
    triggerHaptic,
    type HapticPreset,
  } from "@joknoll/svelte-attach/haptic";
  import Example from "#lib/Example.svelte";
  import Notice from "#lib/Notice.svelte";
  import PageHeader from "#lib/PageHeader.svelte";
  import Pulses from "#lib/Pulses.svelte";
  import Section from "#lib/Section.svelte";

  let supported = $state(true);
  $effect(() => {
    supported = isSupported();
  });

  const total = (pattern: readonly number[]) => pattern.reduce((sum, ms) => sum + ms, 0);

  const presets = Object.keys(patterns) as HapticPreset[];
  // Use one scale so preset durations are comparable.
  const SCALE = Math.max(...Object.values(patterns).map(total));
  let preset = $state<HapticPreset>("medium");
  let runs = $state<Partial<Record<HapticPreset, number>>>({});

  function play(name: HapticPreset) {
    preset = name;
    runs[name] = (runs[name] ?? 0) + 1;
  }

  let input = $state("25, 60, 40");
  const custom = $derived(input.split(/[\s,]+/).filter(Boolean).map(Number));
  const valid = $derived(custom.length > 0 && custom.every((ms) => Number.isFinite(ms) && ms >= 0));
  let customRun = $state(0);

  let pressRun = $state(0);

  // Leave time to press Stop.
  const LONG = 2000;
  let longRun = $state(0);
</script>

<PageHeader
  title="Vibration"
  code={'import { haptic, triggerHaptic, cancelHaptic } from "@joknoll/svelte-attach/haptic";'}
  accent="buzz"
  docs="vibration.md"
/>

{#if !supported}
  <Notice>Vibration is unavailable. You can still preview the patterns.</Notice>
{/if}

<Section title="Presets">
  <Example code={`<button {@attach haptic("${preset}")}>${preset}</button>`}>
    <div data-slot="presets">
      {#each presets as name (name)}
        <button {@attach haptic(name)} onclick={() => play(name)}>
          {name}
          <Pulses pattern={patterns[name]} run={runs[name]} scale={SCALE} />
        </button>
      {/each}
    </div>
  </Example>
</Section>

<Section title="Custom pattern">
  {#snippet lead()}
    Enter milliseconds: vibrate, pause, vibrate…
  {/snippet}
  <Example
    code={`<button {@attach haptic([${valid ? custom.join(", ") : "…"}])}>Try</button>`}
  >
    <input
      id="durations"
      type="text"
      inputmode="numeric"
      aria-label="Durations in milliseconds"
      aria-invalid={!valid || undefined}
      bind:value={input}
    />
    <button disabled={!valid} {@attach valid && haptic(custom)} onclick={() => customRun++}>
      Try
    </button>
    <div data-slot="timeline">
      {#if valid}
        <Pulses pattern={custom} run={customRun} scale={Math.max(SCALE, total(custom))} />
      {:else}
        <output for="durations">Enter non-negative numbers separated by commas or spaces.</output>
      {/if}
    </div>
  </Example>
</Section>

<Section title="Vibrate on press">
  <Example code={'<button {@attach haptic("heavy", { on: "pointerdown" })}>Press</button>'}>
    <button {@attach haptic("heavy", { on: "pointerdown" })} onpointerdown={() => pressRun++}>
      Press
    </button>
    <div data-slot="timeline">
      <Pulses pattern={patterns.heavy} run={pressRun} scale={SCALE} />
    </div>
  </Example>
</Section>

<Section title="Trigger from code">
  <Example
    code={`<button onclick={() => triggerHaptic(${LONG})}>Start</button>
<button onclick={() => cancelHaptic()}>Stop</button>`}
  >
    <button
      onclick={() => {
        triggerHaptic(LONG);
        longRun++;
      }}>Start</button
    >
    <button
      onclick={() => {
        cancelHaptic();
        longRun = 0;
      }}>Stop</button
    >
    <div data-slot="timeline">
      <Pulses pattern={[LONG]} run={longRun} />
    </div>
  </Example>
</Section>

<style>
  [data-slot="presets"] {
    display: grid;
    flex: 1 1 100%;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--space-2xs);

    & button {
      display: grid;
      gap: 0.375em;
      place-content: stretch;
      justify-items: start;
      text-align: start;

      & > :global([data-slot="pulses"]) {
        justify-self: stretch;
      }
      padding-block: 0.5em 0.625em;
    }
  }

  [data-slot="timeline"] {
    flex: 1 1 8rem;
  }

  input {
    inline-size: 10rem;

    &[aria-invalid] {
      box-shadow: inset 0 0 0 1px var(--color-focus);
    }
  }
</style>
