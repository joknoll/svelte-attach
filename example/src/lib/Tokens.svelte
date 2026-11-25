<script lang="ts">
  import { highlight } from "#lib/highlight.ts";

  let { code }: { code: string } = $props();

  const tokens = $derived(highlight(code));
</script>

<!-- WHY: one line, so no whitespace slips in between the tokens. -->
{#each tokens as token, index (index)}{#if token.type}<span data-token={token.type}>{token.text}</span
    >{:else}{token.text}{/if}{/each}
