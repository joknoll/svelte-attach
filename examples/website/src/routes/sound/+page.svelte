<script lang="ts">
  import { Sound, sound, useSound } from "@joknoll/svelte-attach-sound";
  import click from "#lib/assets/click.opus";
  import cheering from "#lib/assets/kids-cheering.opus";

  let count = $state(0);

  // Programmatic Sound instance — used without DOM events
  const clickSound = new Sound(click);

  function handleDoubleClick() {
    clickSound.play();
    setTimeout(() => {
      clickSound.play();
      count += 1;
    }, 125);
  }

  // Pre-configured attachment factory — reused across elements
  const clickFx = useSound(click, ["click"]);
</script>

<h1>Sound</h1>

<section>
  <button onclick={() => count++} {@attach sound({ src: click, events: ["click"] })}>
    Attachment {count} (single click sound)
  </button>

  <button onclick={() => count++} {@attach sound({ src: click, events: ["click"], volume: 0.5 })}>
    Attachment {count} (single click sound, 0.5 volume)
  </button>

  <button onclick={() => count++} {@attach clickFx()}>
    useSound factory {count} (via useSound)
  </button>

  <button ondblclick={handleDoubleClick}>
    Manual Sound {count} (double click, programmatic)
  </button>

  <button
    onclick={() => count++}
    {@attach sound({ src: cheering, events: ["mouseenter", "mouseleave"], volume: 0.2 })}
  >
    Attachment {count} (mouse enter/leave sound)
  </button>

  <button {@attach sound({ src: click, events: ["mouseenter", "mouseleave"], loop: true })}>
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
</style>
