<script lang="ts">
  import { Sound, sound } from "@joknoll/svelte-attach/sound";
  import click from "#lib/assets/click.opus";
  import cheering from "#lib/assets/kids-cheering.opus";
  import switchOn from "#lib/assets/sounds/switch-on.opus";
  import switchOff from "#lib/assets/sounds/switch-off.opus";

  let count = $state(0);
  let enabled = $state(false);

  const clickSound = new Sound(click);

  function handleDoubleClick() {
    clickSound.play();
    setTimeout(() => {
      clickSound.play();
      count += 1;
    }, 125);
  }

  const clickFx = sound(click);
</script>

<h1>Sound</h1>

<section>
  <label class="toggle">
    <input
      type="checkbox"
      role="switch"
      bind:checked={enabled}
      {@attach sound((input: HTMLInputElement) => (input.checked ? switchOn : switchOff), {
        on: "change",
      })}
    />
    Switch {enabled ? "on" : "off"}
  </label>

  <button onclick={() => count++} {@attach sound(click)}>
    Attachment {count} (single click sound)
  </button>

  <button onclick={() => count++} {@attach sound(click, { volume: 0.5 })}>
    Attachment {count} (single click sound, 0.5 volume)
  </button>

  <button onclick={() => count++} {@attach clickFx}>
    Shared attachment {count} (one sound() reused)
  </button>

  <button ondblclick={handleDoubleClick}>
    Manual Sound {count} (double click, programmatic)
  </button>

  <button
    onclick={() => count++}
    {@attach sound(cheering, { on: "mouseenter", stopOn: "mouseleave", volume: 0.2 })}
  >
    Attachment {count} (mouse enter/leave sound)
  </button>

  <button {@attach sound(click, { on: "mouseenter", stopOn: "mouseleave", loop: true })}>
    Attachment {count} (mouse enter/leave with loop)
  </button>
</section>

<style>
  section {
    display: grid;
    gap: 1rem;
    max-width: 26rem;
  }

  button {
    padding: 1rem;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    cursor: pointer;
  }
</style>
