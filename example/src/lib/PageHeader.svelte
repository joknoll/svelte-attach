<script lang="ts">
  import CopyButton from "#lib/CopyButton.svelte";
  import Tokens from "#lib/Tokens.svelte";

  /** A one-shot flourish on the title that hints at the page's topic. */
  type Accent = "press" | "ring" | "buzz" | "flick";

  let {
    title,
    code,
    docs,
    accent,
  }: { title: string; code: string; docs: string; accent?: Accent } = $props();
</script>

<svelte:head>
  <title>{title} · @joknoll/svelte-attach</title>
</svelte:head>

<header>
  <h1 data-accent={accent}>{title}</h1>
  <a href="https://github.com/joknoll/svelte-attach/blob/main/docs/{docs}">
    API docs
  </a>
  <!-- Laid out like the install command: copy, then the code. -->
  <div data-slot="import">
    <CopyButton text={code} label="Copy import" />
    <div data-slot="code">
      <!-- SYNC(docs/): the import line that opens each doc. -->
      <code style:--chars={code.length}><Tokens {code} /></code>
    </div>
  </div>
</header>

<style>
  header {
    display: grid;
    grid-template-areas:
      "title docs"
      "import import";
    grid-template-columns: 1fr auto;
    gap: var(--space-s);
    align-items: baseline;
  }

  h1 {
    position: relative;
    grid-area: title;

    /* NOTE: shrink-wrapped, so a press or buzz pivots on the word, not the whole row. */
    justify-self: start;
  }

  /* The accent plays once the page has mostly settled in, on arrival and on a direct load. */
  @media (prefers-reduced-motion: no-preference) {
    /* Keyboard: dips toward its base like a key, then springs back. */
    h1[data-accent="press"] {
      transform-origin: 50% 100%;
      animation: title-press calc(320ms * var(--motion)) calc(180ms * var(--motion)) both;
    }

    /* Sound: two waves leave the end of the word, like a speaker icon. */
    h1[data-accent="ring"] {
      &::before,
      &::after {
        position: absolute;
        inset-block-start: 50%;
        inset-inline-start: calc(100% + 0.1em);
        inline-size: 0.5em;
        block-size: 0.8em;
        pointer-events: none;
        content: "";
        border-inline-end: 0.08em solid var(--color-focus);
        border-radius: 50%;
        opacity: 0;
        translate: 0 -50%;
        animation: title-ring calc(520ms * var(--motion)) var(--ease-out) calc(180ms * var(--motion)) both;
      }

      &::after {
        animation-delay: calc(300ms * var(--motion));
      }
    }

    /* Gamepad: leans like a flicked stick, then springs back past center and settles. */
    h1[data-accent="flick"] {
      transform-origin: 50% 100%;
      animation: title-flick calc(380ms * var(--motion)) calc(180ms * var(--motion)) both;
    }

    /* Vibration: a short, tight buzz that fades out. */
    h1[data-accent="buzz"] {
      animation: title-buzz calc(220ms * var(--motion)) linear calc(180ms * var(--motion)) both;
    }
  }

  @keyframes title-flick {
    0% {
      animation-timing-function: var(--ease-out);
    }

    30% {
      rotate: -5deg;
      translate: -0.125rem 0;
      animation-timing-function: var(--ease-overshoot);
    }
  }

  @keyframes title-press {
    0% {
      animation-timing-function: var(--ease-in);
    }

    35% {
      scale: 0.94;
      translate: 0 0.125rem;
      animation-timing-function: var(--ease-overshoot);
    }
  }

  @keyframes title-ring {
    from {
      opacity: 0.9;
      scale: 0.6;
      translate: 0 -50%;
    }

    to {
      opacity: 0;
      scale: 1.3;
      translate: 0.6em -50%;
    }
  }

  @keyframes title-buzz {
    14% {
      translate: 2px 0;
    }

    28% {
      translate: -2px 0;
    }

    43% {
      translate: 2px 0;
    }

    57% {
      translate: -2px 0;
    }

    71% {
      translate: 1px 0;
    }

    86% {
      translate: -1px 0;
    }
  }

  a {
    grid-area: docs;
    font-size: var(--text--1);
  }

  [data-slot="import"] {
    display: grid;
    grid-area: import;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-xs);
    align-items: center;
    padding: var(--space-2xs);
    border-radius: var(--radius-control);
    box-shadow: inset 0 0 0 1px var(--color-line);
  }

  [data-slot="code"] {
    container-type: inline-size;

    /* Below the size floor, the line scrolls rather than wrapping. */
    overflow-x: auto;

    /* WHY: a phone would scroll most of the line out of view, so there it wraps instead. */
    @media (width < 36rem) {
      container-type: normal;
    }
  }

  /* NOTE: one line at the small code size, shrinking only as far as it must to fit, down to a
     floor. A monospace glyph is about 0.6em wide; 0.62 leaves a little slack. */
  code {
    display: block;
    font-size: clamp(0.6875rem, 100cqi / (var(--chars) * 0.62), calc(var(--text--1) * 0.875));
    white-space: nowrap;

    @media (width < 36rem) {
      font-size: calc(var(--text--1) * 0.875);
      white-space: normal;

      /* The package name wraps as a whole, never at its hyphens. */
      & :global([data-token="string"]) {
        white-space: nowrap;
      }
    }
  }
</style>
