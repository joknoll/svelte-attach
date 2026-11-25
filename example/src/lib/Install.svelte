<script lang="ts">
  import CopyButton from "#lib/CopyButton.svelte";

  const PACKAGE = "@joknoll/svelte-attach";
  const STORAGE_KEY = "package-manager";

  const managers = {
    npm: "install",
    pnpm: "add",
    bun: "add",
    vp: "add",
  } as const;
  type Manager = keyof typeof managers;

  let manager = $state<Manager>("npm");

  const command = $derived(`${manager} ${managers[manager]} ${PACKAGE}`);

  // WHY: storage can be blocked or empty; the default still works.
  $effect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in managers) manager = saved as Manager;
    } catch {}
  });

  function choose(next: Manager) {
    manager = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }
</script>

<div data-slot="install">
  <CopyButton text={command} label="Copy install command" />
  <code data-slot="command"
    ><span aria-hidden="true" data-token="punctuation">$</span><span data-token="function"
      >{manager}</span
    >
    {managers[manager]} <strong>{PACKAGE}</strong></code
  >
  <select aria-label="Package manager" bind:value={() => manager, choose}>
    {#each Object.keys(managers) as name (name)}
      <option value={name}>{name}</option>
    {/each}
  </select>
</div>

<style>
  /* Copy button, command, package manager: in source order. */
  [data-slot="install"] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-xs);
    align-items: center;
    padding: var(--space-2xs);
    border-radius: var(--radius-control);
    box-shadow: inset 0 0 0 1px var(--color-line);
  }

  [data-slot="command"] {
    & [aria-hidden] {
      margin-inline-end: 1ch;
      user-select: none;
    }

    /* WHY: a narrow screen wraps before the package name, not after its hyphen. */
    & strong {
      display: inline-block;
      color: var(--color-text-strong);
    }
  }
</style>
