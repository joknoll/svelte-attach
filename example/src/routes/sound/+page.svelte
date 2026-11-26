<script lang="ts">
  import { Sound, sound, isSupported } from "@joknoll/svelte-attach/sound";
  import Example from "#lib/Example.svelte";
  import Notice from "#lib/Notice.svelte";
  import PageHeader from "#lib/PageHeader.svelte";
  import Section from "#lib/Section.svelte";
  import click from "#lib/assets/click.opus";
  import cheering from "#lib/assets/kids-cheering.opus";
  import switchOn from "#lib/assets/sounds/switch-on.opus";
  import switchOff from "#lib/assets/sounds/switch-off.opus";
  import { hydrated } from "#lib/hydrated.svelte.ts";

  // Assumed while prerendering, so supporting browsers don't flash the notice.
  const supported = $derived(!hydrated() || isSupported());

  const clicks = [
    { code: "sound(click)", label: "Click" },
    { code: "sound(click, { volume: 0.5 })", label: "Quiet click" },
  ];
  let clickIndex = $state(0);

  const hovers = [
    {
      src: "cheering",
      options: ['on: "mouseenter"', 'stopOn: "mouseleave"', "volume: 0.2"],
      label: "Hover",
    },
    {
      src: "click",
      options: ['on: "mouseenter"', 'stopOn: "mouseleave"', "loop: true"],
      label: "Hover loop",
    },
  ];
  let hoverIndex = $state(0);

  const cheer = new Sound(cheering, { volume: 0.2 });
</script>

<PageHeader
  title="Sound"
  description="Try event-driven sound effects and manual audio playback in Svelte 5 components."
  code={'import { sound, Sound, isSupported } from "@joknoll/svelte-attach/sound";'}
  accent="ring"
  docs="sound.md"
/>

{#if !supported}
  <Notice>This browser doesn't support Web Audio.</Notice>
{/if}

<Section title="Play on click">
  <Example
    code={`<button {@attach ${clicks[clickIndex].code}}>${clicks[clickIndex].label}</button>`}
  >
    <button {@attach sound(click)} onclick={() => (clickIndex = 0)}>
      {clicks[0].label}
    </button>
    <button {@attach sound(click, { volume: 0.5 })} onclick={() => (clickIndex = 1)}>
      {clicks[1].label}
    </button>
  </Example>
</Section>

<Section title="On and off sounds">
  <Example
    code={`<input
  type="checkbox"
  role="switch"
  {@attach sound((input) => (input.checked ? switchOn : switchOff), {
    on: "change",
  })}
/>`}
  >
    <label>
      Notifications
      <input
        type="checkbox"
        role="switch"
        {@attach sound((input: HTMLInputElement) => (input.checked ? switchOn : switchOff), {
          on: "change",
        })}
      />
    </label>
  </Example>
</Section>

<Section title="Hover to play, move away to stop">
  <Example
    code={`<button
  {@attach sound(${hovers[hoverIndex].src}, {
${hovers[hoverIndex].options.map((option) => `    ${option},`).join("\n")}
  })}
>${hovers[hoverIndex].label}</button>`}
  >
    <button
      {@attach sound(cheering, { on: "mouseenter", stopOn: "mouseleave", volume: 0.2 })}
      onmouseenter={() => (hoverIndex = 0)}
    >
      {hovers[0].label}
    </button>
    <button
      {@attach sound(click, { on: "mouseenter", stopOn: "mouseleave", loop: true })}
      onmouseenter={() => (hoverIndex = 1)}
    >
      {hovers[1].label}
    </button>
  </Example>
</Section>

<Section title="Play from code">
  <Example
    code={`const cheer = new Sound(cheering, { volume: 0.2 });

<button onclick={() => cheer.play()}>Play</button>
<button onclick={() => cheer.stop()}>Stop</button>`}
  >
    <button onclick={() => cheer.play()}>Play</button>
    <button onclick={() => cheer.stop()}>Stop</button>
  </Example>
</Section>
