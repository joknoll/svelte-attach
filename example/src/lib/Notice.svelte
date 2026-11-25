<script lang="ts">
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

<p>{@render children()}</p>

<style>
  p {
    max-inline-size: none;
    padding: var(--space-xs) var(--space-s);
    font-size: var(--text--1);
    color: var(--color-text-selected);
    background: var(--surface-selected);
    border-radius: var(--radius-control);
  }
</style>
