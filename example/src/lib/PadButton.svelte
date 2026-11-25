<script lang="ts">
  import type { ButtonName } from "@joknoll/svelte-attach/gamepad";

  let { name, held = false }: { name: ButtonName; held?: boolean } = $props();

  const kinds: Record<ButtonName, "face" | "bumper" | "trigger" | "stick" | "dpad" | "system"> = {
    A: "face",
    B: "face",
    X: "face",
    Y: "face",
    LB: "bumper",
    RB: "bumper",
    LT: "trigger",
    RT: "trigger",
    L3: "stick",
    R3: "stick",
    UP: "dpad",
    DOWN: "dpad",
    LEFT: "dpad",
    RIGHT: "dpad",
    SELECT: "system",
    START: "system",
    HOME: "system",
  };

  // An arrow on the d-pad's pressed arm, in a 24 × 24 box.
  const arrows: Partial<Record<ButtonName, string>> = {
    UP: "M12 4.5 14 7.5h-4z",
    DOWN: "M12 19.5 10 16.5h4z",
    LEFT: "M4.5 12 7.5 10v4z",
    RIGHT: "M19.5 12 16.5 14v-4z",
  };

  const kind = $derived(kinds[name]);
</script>

<kbd data-kind={kind} data-button={name} data-held={held || undefined}>
  <span data-slot="name">{name}</span>
  <span data-slot="glyph" aria-hidden="true">
    {#if kind === "dpad"}
      <svg viewBox="0 0 24 24">
        <path data-slot="cross" d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
        <path data-slot="arrow" d={arrows[name]} />
      </svg>
    {:else if name === "SELECT"}
      <svg viewBox="0 0 24 24">
        <rect x="4" y="5" width="11" height="9" rx="2" />
        <rect x="9" y="10" width="11" height="9" rx="2" />
      </svg>
    {:else if name === "START"}
      <svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    {:else if name === "HOME"}
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /></svg>
    {:else if kind === "stick"}
      {name[0]}
    {:else}
      {name}
    {/if}
  </span>
</kbd>

<style>
  /* Flat caps in the site's control style: raised surface, one strong outline. */
  kbd {
    --_ring: var(--color-line-strong);

    position: relative;
    display: inline grid;
    place-items: center;
    padding: 0;
    font-family: var(--font-sans);
    font-size: 1em;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text-muted);
    vertical-align: middle;
    background: var(--surface-raised);
    border: 0;
    box-shadow: inset 0 0 0 1px var(--_ring);
    transition:
      scale var(--duration-fast) var(--ease-out),
      background-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);

    /* Held, a button takes the site's selected colours and sinks slightly. */
    &[data-held] {
      --_ring: var(--color-focus);

      color: var(--color-text-selected);
      background: var(--surface-selected);
      scale: 0.92;
    }
  }

  /* NOTE: the usual face-button colours, darker in light mode so the letters keep contrast. */
  [data-button="A"] {
    --_face: light-dark(oklch(52% 0.16 145), oklch(76% 0.18 145));
  }

  [data-button="B"] {
    --_face: light-dark(oklch(52% 0.19 27), oklch(70% 0.18 27));
  }

  [data-button="X"] {
    --_face: light-dark(oklch(50% 0.15 250), oklch(72% 0.13 250));
  }

  [data-button="Y"] {
    --_face: light-dark(oklch(58% 0.13 85), oklch(85% 0.15 92));
  }

  [data-kind="face"] {
    inline-size: 1.6em;
    aspect-ratio: 1;
    color: var(--_face);
    border-radius: 50%;

    /* A held face button fills with its own colour. */
    &[data-held] {
      --_ring: var(--_face);

      color: var(--surface-canvas);
      background: var(--_face);
    }
  }

  /* A thumbstick seen from above: a ring inside the cap. */
  [data-kind="stick"] {
    inline-size: 1.6em;
    aspect-ratio: 1;
    border-radius: 50%;

    &::before {
      position: absolute;
      inset: 0.25em;
      content: "";
      border-radius: inherit;
      box-shadow: inset 0 0 0 1px var(--color-line);
    }

    &[data-held]::before {
      box-shadow: inset 0 0 0 1px var(--_ring);
    }

    & [data-slot="glyph"] {
      font-size: 0.6em;
    }
  }

  [data-kind="bumper"],
  [data-kind="trigger"] {
    & [data-slot="glyph"] {
      font-size: 0.55em;
      letter-spacing: 0.04em;
    }
  }

  /* Bumpers are wide and flat; triggers are taller and rounder on top. */
  [data-kind="bumper"] {
    inline-size: 2.4em;
    block-size: 1.15em;
    border-radius: 0.6em 0.6em 0.25em 0.25em;
  }

  [data-kind="trigger"] {
    inline-size: 1.7em;
    block-size: 1.6em;
    border-radius: 0.85em 0.85em 0.3em 0.3em;
  }

  [data-kind="system"] {
    inline-size: 1.3em;
    aspect-ratio: 1;
    border-radius: 50%;

    & svg {
      inline-size: 0.75em;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.25;
      stroke-linecap: round;
    }
  }

  [data-button="HOME"] {
    inline-size: 1.6em;

    & circle:last-child {
      fill: currentColor;
    }
  }

  /* The d-pad is the cross itself, so it drops the round cap. */
  [data-kind="dpad"] {
    inline-size: 1.6em;
    aspect-ratio: 1;
    background: none;
    box-shadow: none;

    & svg {
      inline-size: 100%;
      overflow: visible;
    }

    & [data-slot="cross"] {
      fill: var(--surface-raised);
      stroke: var(--_ring);
      stroke-width: 1.25;
      stroke-linejoin: round;
      transition: fill var(--duration-fast) var(--ease-out);
    }

    & [data-slot="arrow"] {
      fill: currentColor;
    }

    &[data-held] {
      color: var(--color-focus);
      background: none;

      & [data-slot="cross"] {
        fill: var(--surface-selected);
      }
    }
  }

  [data-slot="glyph"] {
    display: contents;
  }

  /* The API name, for screen readers; the glyph shows it to everyone else. */
  [data-slot="name"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
