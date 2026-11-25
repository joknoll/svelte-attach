<script lang="ts">
  import { onDestroy } from "svelte";

  let { text, label }: { text: string; label: string } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => clearTimeout(timer));

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 1500);
  }
</script>

<button data-copied={copied || undefined} aria-label={label} onclick={copy}>
  <!-- Both icons stay mounted, so a click mid-change retargets the transitions. -->
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <g data-icon="copy">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path
        d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"
      />
    </g>
    <path data-icon="check" pathLength="1" d="M3 8.5l3 3 7-7" />
  </svg>
</button>
<!-- NOTE: absolutely positioned, so it takes no cell in the parent's grid. -->
<span role="status">{copied ? "Copied" : ""}</span>

<style>
  button {
    inline-size: 2.5em;
    padding: 0;
    transition:
      background-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-base) var(--ease-out),
      scale var(--duration-fast) var(--ease-out);

    & svg {
      inline-size: 1.125em;
      overflow: visible;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.25;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Resting: the copy icon is in place; the check is hidden and undrawn. */
    & [data-icon="copy"] {
      transform-box: fill-box;
      transform-origin: center;
      transition:
        opacity var(--duration-base) var(--ease-out) var(--duration-fast),
        scale var(--duration-base) var(--ease-out) var(--duration-fast);
    }

    & [data-icon="check"] {
      stroke: var(--color-focus);
      stroke-width: 1.5;
      stroke-dasharray: 1 2;
      stroke-dashoffset: 1;
      opacity: 0;
      /* NOTE: fades out quietly, then resets the stroke once it is invisible. */
      transition:
        opacity var(--duration-base) var(--ease-out),
        stroke-dashoffset 0s linear var(--duration-base);
    }

    /* Copied: the copy icon shrinks away while the check draws itself in. */
    &[data-copied] {
      box-shadow: inset 0 0 0 1px var(--color-focus);

      & [data-icon="copy"] {
        opacity: 0;
        scale: 0.5;
        transition:
          opacity var(--duration-fast) var(--ease-in),
          scale var(--duration-fast) var(--ease-in);
      }

      & [data-icon="check"] {
        stroke-dashoffset: 0;
        opacity: 1;
        transition:
          opacity 0s linear var(--duration-fast),
          stroke-dashoffset var(--duration-slow) var(--ease-out) var(--duration-fast);
      }

      @media (prefers-reduced-motion: no-preference) {
        animation: copy-pop var(--duration-slow) var(--ease-overshoot);
      }
    }
  }

  @keyframes copy-pop {
    from {
      scale: 0.9;
    }
  }

  /* WHY: read out by screen readers after a copy, not shown; the icon change is the visible cue. */
  [role="status"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
