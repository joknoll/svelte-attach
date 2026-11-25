<script lang="ts">
  import { isButtonPressed, isSupported as gamepadSupported } from "@joknoll/svelte-attach/gamepad";
  import { haptic, patterns } from "@joknoll/svelte-attach/haptic";
  import { formatHint, hotkey, pressed } from "@joknoll/svelte-attach/key";
  import { sound } from "@joknoll/svelte-attach/sound";
  import Example from "#lib/Example.svelte";
  import Install from "#lib/Install.svelte";
  import PadButton from "#lib/PadButton.svelte";
  import Pulses from "#lib/Pulses.svelte";
  import click from "#lib/assets/click.opus";
  import logo from "#lib/assets/favicon.svg";
  import { resolve } from "$app/paths";

  const demos = [
    // SYNC(docs/README.md): the descriptions.
    {
      href: "/key",
      title: "Keyboard",
      blurb: "Shortcuts, held states, and shortcut hints.",
    },
    {
      href: "/sound",
      title: "Sound",
      blurb: "Event-driven and manual playback.",
    },
    {
      href: "/haptic",
      title: "Vibration",
      blurb: "Vibration presets and custom patterns.",
    },
    {
      href: "/gamepad",
      title: "Gamepad",
      blurb: "Button activation and state.",
    },
  ] as const;

  // Split the closing tag so Svelte doesn't close this script early.
  const usage = `<script>
  import { hotkey } from "@joknoll/svelte-attach/key";
  import { sound } from "@joknoll/svelte-attach/sound";
  import click from "./click.opus";
${"</"}script>

<button {@attach hotkey("mod+s")} {@attach sound(click)}>Save</button>`;

  let saveHint = $state(formatHint("mod+s"));
  let saved = $state(0);

  let buzzRun = $state(0);
  let gamepadHeld = $state(false);

  $effect(() => {
    // Refresh the prerendered Ctrl label after hydration.
    saveHint = formatHint("mod+s");
    if (!gamepadSupported()) return;
    let frame = requestAnimationFrame(function poll() {
      gamepadHeld = isButtonPressed("A");
      frame = requestAnimationFrame(poll);
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<svelte:head>
  <title>@joknoll/svelte-attach</title>
</svelte:head>

<header>
  <img data-slot="logo" src={logo} alt="" width="107" height="128" />
  <h1 data-slot="heading"><span>@joknoll/</span><span>svelte-attach</span></h1>
  <!-- SYNC(README.md): the description, with a link added. -->
  <p data-slot="lead">
    Svelte <a href="https://svelte.dev/docs/svelte/@attach">attachments</a> to add keyboard shortcuts,
    sound effects, vibration, and gamepad controls to Svelte 5 components.
  </p>
</header>

<Install />

<Example code={usage}>
  <button {@attach hotkey("mod+s")} {@attach sound(click)} onclick={() => saved++}>
    Save <kbd>{saveHint}</kbd>
  </button>
  <output>{saved ? `Saved ×${saved}` : ""}</output>
</Example>

<ul>
  {#each demos as demo (demo.href)}
    <li>
      <h2><a href={resolve(demo.href)}>{demo.title}</a></h2>
      <p>{demo.blurb}</p>
      <div data-slot="try">
        {#if demo.href === "/key"}
          Hold <kbd {@attach pressed("shift")}>Shift</kbd>
        {:else if demo.href === "/sound"}
          <button {@attach sound(click)}>Click</button>
        {:else if demo.href === "/haptic"}
          <button {@attach haptic("success")} onclick={() => buzzRun++}>Success</button>
          <Pulses pattern={patterns.success} run={buzzRun} />
        {:else}
          Press <PadButton name="A" held={gamepadHeld} />
        {/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  header {
    display: grid;
    grid-template-areas:
      "logo heading"
      "lead lead";
    grid-template-columns: auto 1fr;
    gap: var(--space-2xs) var(--space-xs);
    align-items: center;
  }

  [data-slot="logo"] {
    grid-area: logo;
    inline-size: auto;
    block-size: 1lh;
    font-size: var(--text-3);
    line-height: var(--leading-tight);
  }

  [data-slot="heading"] {
    grid-area: heading;

    /* WHY: a narrow screen breaks after the scope, not after the hyphen. */
    & span {
      display: inline-block;
    }

    & span:first-child {
      font-weight: 400;
      color: var(--color-text-muted);
    }
  }

  [data-slot="lead"] {
    grid-area: lead;
    color: var(--color-text-muted);
  }

  ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--space-s);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--space-3xs);
    padding: var(--space-s);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-control);
    transition: border-color var(--duration-fast) var(--ease-out);

    &:hover {
      border-color: var(--color-line-strong);
    }

    & p {
      color: var(--color-text-muted);
    }
  }

  /* Stretch the link across the card; keep the controls above it. */
  h2 a {
    color: inherit;
    text-decoration: none;

    &::after {
      position: absolute;
      inset: 0;
      content: "";
      border-radius: inherit;
    }

    li:hover & {
      text-decoration: underline;
    }
  }

  [data-slot="try"] {
    position: relative;
    z-index: 1;
    display: flex;
    gap: var(--space-2xs);
    align-items: center;
    justify-self: start;
    margin-block-start: var(--space-xs);
    font-size: var(--text--1);
    color: var(--color-text-muted);

    & :global([data-slot="pulses"]) {
      inline-size: 6rem;
    }
  }
</style>
