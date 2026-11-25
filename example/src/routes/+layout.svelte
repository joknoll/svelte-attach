<script lang="ts">
  import favicon from "#lib/assets/favicon.svg";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  const links = [
    { href: "/", label: "Home" },
    { href: "/haptic", label: "Haptic" },
    { href: "/sound", label: "Sound" },
    { href: "/key", label: "Key" },
    { href: "/gamepad", label: "Gamepad" },
  ] as const;

  function isActive(href: (typeof links)[number]["href"]): boolean {
    const path = page.url.pathname.replace(/\/$/, "");
    const target = resolve(href).replace(/\/$/, "");
    return href === "/" ? path === target : path.startsWith(target);
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header>
  <a class="brand" href={resolve("/")}>svelte-attach</a>
  <nav>
    {#each links.slice(1) as link (link.href)}
      <a href={resolve(link.href)} class:active={isActive(link.href)}>{link.label}</a>
    {/each}
  </nav>
</header>

<main>
  {@render children()}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1a1a1a;
    background: #fafafa;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e5e5;
    background: #fff;
    position: sticky;
    top: 0;
  }

  .brand {
    font-weight: 700;
    text-decoration: none;
    color: inherit;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  nav a {
    text-decoration: none;
    color: #555;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  nav a.active {
    color: #1a1a1a;
    background: #f0f0f0;
    font-weight: 600;
  }

  main {
    max-width: 50rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
</style>
