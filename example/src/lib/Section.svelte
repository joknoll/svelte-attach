<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, lead, children }: { title: string; lead?: Snippet; children: Snippet } = $props();

  const id = $derived(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
</script>

<section aria-labelledby={id}>
  <h2 {id}>{title}</h2>
  {#if lead}
    <p>{@render lead()}</p>
  {/if}
  {@render children()}
</section>

<style>
  section {
    display: grid;
    gap: var(--space-xs);
    scroll-margin-block-start: var(--space-s);
  }

  p {
    color: var(--color-text-muted);
  }
</style>
