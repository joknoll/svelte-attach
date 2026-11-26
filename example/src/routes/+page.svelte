<script lang="ts">
  import { haptic, patterns } from "@joknoll/svelte-attach/haptic";
  import { hotkey, pressed } from "@joknoll/svelte-attach/key";
  import { sound } from "@joknoll/svelte-attach/sound";
  import "npmx-embed";
  import Example from "#lib/Example.svelte";
  import Install from "#lib/Install.svelte";
  import PadButton from "#lib/PadButton.svelte";
  import Pulses from "#lib/Pulses.svelte";
  import click from "#lib/assets/click.opus";
  import logo from "#lib/assets/favicon.svg";
  import { held } from "#lib/gamepad.svelte.ts";
  import { hint } from "#lib/hydrated.svelte.ts";
  import { resolve } from "$app/paths";

  const demos = [
    // SYNC(docs/README.md): the descriptions.
    {
      href: "/key",
      title: "Keyboard",
      blurb: "Shortcuts, held states, and shortcut hints.",
      preview: keyPreview,
    },
    {
      href: "/sound",
      title: "Sound",
      blurb: "Event-driven and manual playback.",
      preview: soundPreview,
    },
    {
      href: "/haptic",
      title: "Vibration",
      blurb: "Vibration presets and custom patterns.",
      preview: hapticPreview,
    },
    {
      href: "/gamepad",
      title: "Gamepad",
      blurb: "Button activation and state.",
      preview: gamepadPreview,
    },
  ] as const;

  // Split the closing tag so Svelte doesn't close this script early.
  const usage = `<script>
  import { hotkey } from "@joknoll/svelte-attach/key";
  import { sound } from "@joknoll/svelte-attach/sound";
  import click from "./click.opus";
${"</"}script>

<button {@attach hotkey("mod+s")} {@attach sound(click)}>Save</button>`;

  let saved = $state(0);

  let buzzRun = $state(0);
</script>

<svelte:head>
  <title>@joknoll/svelte-attach</title>
</svelte:head>

<header>
  <img data-slot="logo" src={logo} alt="" width="107" height="128" />
  <h1 data-slot="heading">
    <a href="https://npmx.dev/package/@joknoll/svelte-attach"
      ><span>@joknoll/</span><span>svelte-attach</span></a
    >
  </h1>
  <!-- SYNC(README.md): the description, with a link added. -->
  <p data-slot="lead">
    Svelte <a href="https://svelte.dev/docs/svelte/@attach">attachments</a> to add keyboard shortcuts,
    sound effects, vibration, and gamepad controls to Svelte 5 components.
  </p>
</header>

{#snippet keyPreview()}
  Hold <kbd {@attach pressed("shift")}>Shift</kbd>
{/snippet}

{#snippet soundPreview()}
  <button {@attach sound(click)}>Click</button>
{/snippet}

{#snippet hapticPreview()}
  <button {@attach haptic("success")} onclick={() => buzzRun++}>Success</button>
  <Pulses pattern={patterns.success} run={buzzRun} />
{/snippet}

{#snippet gamepadPreview()}
  Press <PadButton name="A" held={held("A")} />
{/snippet}

<Install />

<Example code={usage}>
  <button {@attach hotkey("mod+s")} {@attach sound(click)} onclick={() => saved++}>
    Save <kbd>{hint("mod+s")}</kbd>
  </button>
  <output>{saved ? `Saved ×${saved}` : ""}</output>
</Example>

<ul>
  {#each demos as demo (demo.href)}
    <li>
      <h2><a href={resolve(demo.href)}>{demo.title}</a></h2>
      <p>{demo.blurb}</p>
      <div data-slot="try">{@render demo.preview()}</div>
    </li>
  {/each}
</ul>

<npmx-card package="@joknoll/svelte-attach" details="size,type,license"></npmx-card>

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

    /* NOTE: the header's brand on sub pages; it shares this snapshot and grows into place. */
    & span:last-child {
      view-transition-name: brand;
    }

    /* The title links to the package page but keeps the heading's colours. */
    & a {
      color: inherit;
      text-decoration: none;
    }

    /* NOTE: a link's underline skips inline-block children, so each span draws its own. */
    & a:hover span {
      text-decoration: underline;
    }
  }

  [data-slot="lead"] {
    grid-area: lead;
    color: var(--color-text-muted);
  }

  ul {
    display: grid;
    /* WHY: min() lets a card shrink below 16rem when large text makes that wider than the page. */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
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

  npmx-card {
    --npmx-bg: var(--surface-canvas);
    --npmx-border: var(--color-line);
    --npmx-border-hover: var(--color-line-strong);
    --npmx-text: var(--color-text-strong);
    --npmx-muted: var(--color-text-muted);
    --npmx-accent: var(--color-link);
    --npmx-radius: var(--radius-control);
    --npmx-font: var(--font-sans);
    --npmx-font-mono: var(--font-mono);

    min-inline-size: 0;
    max-inline-size: none;
  }

  npmx-card::part(title) {
    white-space: normal;
    overflow-wrap: anywhere;
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
