<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { on } from "svelte/events";
  import Tokens from "#lib/Tokens.svelte";

  let { code, children }: { code: string; children: Snippet } = $props();

  // WHY: hotkeys and gamepad buttons click without a pointer, so :active never shows it.
  const flashOnClick: Attachment<HTMLElement> = (stage) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = on(stage, "click", (event) => {
      const button = (event.target as Element).closest("button");
      if (!button) return;
      button.dataset.flash = "";
      clearTimeout(timer);
      timer = setTimeout(() => delete button.dataset.flash, 400);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  };
</script>

<figure>
  <div data-slot="stage" {@attach flashOnClick}>
    {@render children()}
  </div>
  <!-- Keep this on one line to avoid extra whitespace in the snippet. -->
  <pre data-slot="code"><code><Tokens {code} /></code></pre>
</figure>

<style>
  /* WHY: a demo's widest content, such as a text field's default width, would otherwise widen the
     figure and push the page sideways; this way the demo wraps and the code scrolls. */
  figure {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    margin: 0;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-control);
  }

  [data-slot="stage"] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: center;
    box-sizing: border-box;
    min-block-size: 5.5rem;
    padding: var(--space-s);

    & > :global(output) {
      margin-inline-start: auto;
    }

    /* NOTE: a switch takes the button's box, so a row of mixed controls reads as one. */
    & > :global(label:has(> input[type="checkbox"])) {
      min-block-size: 2.5em;
      padding-inline: 0.75em;
      font-size: var(--text--1);
      font-weight: 500;
      cursor: pointer;
      border-radius: var(--radius-control);
      box-shadow: inset 0 0 0 1px var(--color-line-strong);
    }

    & :global([data-flash]) {
      color: var(--color-text-selected);
      background: var(--surface-selected);

      /* A shortcut clicks without a pointer, so the flash also plays the press. */
      @media (prefers-reduced-motion: no-preference) {
        animation: example-press var(--duration-base) var(--ease-out);
      }
    }
  }

  [data-slot="code"] {
    padding: var(--space-xs) var(--space-s);
    margin: 0;
    overflow-x: auto;
    line-height: 1.5;
    tab-size: 2;
    background: color-mix(in oklab, var(--color-text) 4%, transparent);
    border-block-start: 1px solid var(--color-line);
    border-end-start-radius: calc(var(--radius-control) - 1px);
    border-end-end-radius: calc(var(--radius-control) - 1px);
  }

  @keyframes -global-example-press {
    from {
      scale: 0.95;
    }
  }
</style>
