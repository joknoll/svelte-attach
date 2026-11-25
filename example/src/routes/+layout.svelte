<script lang="ts">
  import { gamepadButton } from "@joknoll/svelte-attach/gamepad";
  import { haptic } from "@joknoll/svelte-attach/haptic";
  import { hotkey, pressed } from "@joknoll/svelte-attach/key";
  import { sound } from "@joknoll/svelte-attach/sound";
  import "#lib/app.css";
  import tick from "#lib/assets/sounds/pop.opus";
  import favicon from "#lib/assets/favicon.svg";
  import disableSound from "#lib/assets/sounds/disable-sound.opus";
  import enableSound from "#lib/assets/sounds/enable-sound.opus";
  import { markHydrated } from "#lib/hydrated.svelte.ts";
  import { onNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  // Lets pages swap prerendered fallbacks for browser-only values.
  $effect(markHydrated);

  const links = [
    { href: "/key", label: "Keyboard" },
    { href: "/sound", label: "Sound" },
    { href: "/haptic", label: "Vibration" },
    { href: "/gamepad", label: "Gamepad" },
  ] as const;

  const path = $derived(page.url.pathname.replace(/\/$/, ""));

  function isCurrent(href: "/" | (typeof links)[number]["href"]): boolean {
    const target = resolve(href).replace(/\/$/, "");
    return href === "/" ? path === target : path.startsWith(target);
  }

  // Navigation sounds are on by default; the visitor's choice is remembered.
  const SOUND_KEY = "nav-sounds";
  let soundOn = $state(true);

  // WHY: storage can be blocked or empty; the default still works.
  $effect(() => {
    try {
      soundOn = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {}
  });

  function setSound(on: boolean) {
    soundOn = on;
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {}
  }

  // A tick when the tab changes; the current tab stays silent.
  const navSound = (href: "/" | (typeof links)[number]["href"]) =>
    sound(() => (soundOn && !isCurrent(href) ? tick : null), {
      volume: 0.5,
    });

  // LB and RB click the previous or next tab, wrapping around, so its sound and vibration play.
  // START clicks the home link the same way.
  function step(nav: HTMLElement, direction: 1 | -1) {
    const tabs = [...nav.querySelectorAll("a")];
    const current = tabs.findIndex((tab) => tab.getAttribute("aria-current") === "page");
    const next = current === -1 ? (direction === 1 ? 0 : -1) : current + direction;
    tabs.at(next % tabs.length)?.click();
  }

  let main: HTMLElement;
  let runs = 0;

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;

    // Arms the settle-in of the new page's blocks; disarmed once they land, so later DOM changes
    // don't replay it. A newer navigation owns the flag from then on.
    const root = document.documentElement;
    const run = String(++runs);
    root.dataset.settle = run;
    void navigation.complete
      .then(() => {
        const settling = main
          .getAnimations({ subtree: true })
          .filter(
            (animation) =>
              animation instanceof CSSAnimation && animation.animationName === "page-settle",
          );
        return Promise.allSettled(settling.map((animation) => animation.finished));
      })
      .finally(() => {
        if (root.dataset.settle === run) delete root.dataset.settle;
      });

    return new Promise((ready) => {
      document.startViewTransition(async () => {
        ready();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header data-slot="header">
  <!-- The home page's title takes the brand's place, so the brand only links back from sub pages. -->
  {#if !isCurrent("/")}
    <a
      data-slot="brand"
      href={resolve("/")}
      {@attach hotkey("0")}
      {@attach gamepadButton("START", { requireFocus: false })}
      {@attach navSound("/")}
      {@attach haptic("selection")}
    >
      <span>svelte-attach</span> <kbd aria-hidden="true" {@attach pressed("0")}>0</kbd>
    </a>
  {/if}
  <nav
    data-slot="nav"
    {@attach gamepadButton("LB", {
      requireFocus: false,
      onTrigger: (nav) => step(nav, -1),
    })}
    {@attach gamepadButton("RB", {
      requireFocus: false,
      onTrigger: (nav) => step(nav, 1),
    })}
  >
    {#each links as link, index (link.href)}
      {@const key = String(index + 1)}
      <a
        href={resolve(link.href)}
        aria-current={isCurrent(link.href) ? "page" : undefined}
        {@attach hotkey(key)}
        {@attach navSound(link.href)}
        {@attach haptic("selection")}
      >
        {link.label}
        <kbd aria-hidden="true" {@attach pressed(key)}>{key}</kbd>
        {#if isCurrent(link.href)}
          <span data-slot="indicator" aria-hidden="true"></span>
        {/if}
      </a>
    {/each}
  </nav>
  <label data-slot="sound" title="Navigation sounds (M)">
    <input
      type="checkbox"
      role="switch"
      aria-label="Navigation sounds"
      bind:checked={() => soundOn, setSound}
      {@attach hotkey("m")}
      {@attach sound((input: HTMLInputElement) => (input.checked ? enableSound : disableSound), {
        on: "change",
      })}
    />
    <!-- A speaker with waves when on, crossed out when off. -->
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 6h2l3-2.5v9l-3-2.5h-2z" />
      <path data-icon="on" d="M10 5.5a3.5 3.5 0 0 1 0 5M12 3.5a6 6 0 0 1 0 9" />
      <path data-icon="off" d="M10.5 6l3.5 4M14 6l-3.5 4" />
    </svg>
    <kbd aria-hidden="true" {@attach pressed("m")}>M</kbd>
  </label>
</header>

<main data-slot="main" bind:this={main}>
  {@render children()}
</main>

<footer data-slot="footer">
  <p data-slot="license">
    <a href="https://github.com/joknoll/svelte-attach/blob/main/LICENSE">MIT License</a> © 2026 Johannes
    Knoll
  </p>
  <p data-slot="dependencies">
    <a href={`${resolve("/")}licenses.md`} data-sveltekit-reload> Dependency licenses </a>
  </p>
  <!-- SYNC(lib/assets/CREDITS.md): the sound sources. -->
  <p data-slot="credits">
    <a href="https://github.com/joknoll/svelte-attach/blob/main/example/src/lib/assets/CREDITS.md"
      >Sound credits and licenses</a
    >
  </p>
  <p data-slot="built">Built with <a href="https://svelte.dev/">Svelte</a></p>
</footer>

<style>
  /* NOTE: the layout owns the page shell; SvelteKit's wrapper div is display: contents. */
  :global(body) {
    display: grid;
    grid-template-areas:
      ". header ."
      ". main ."
      ". footer .";
    grid-template-rows: auto 1fr auto;
    box-sizing: border-box;
    min-block-size: 100dvb;
    grid-template-columns: 1fr min(46rem, 100% - 2 * var(--gutter)) 1fr;
    row-gap: var(--space-xl);
    padding-block: var(--space-s) var(--space-xl);
  }

  [data-slot="header"] {
    display: grid;
    grid-area: header;
    grid-template-areas: "brand nav sound";
    grid-template-columns: auto 1fr auto;
    gap: var(--space-2xs) var(--space-s);
    align-items: center;

    @media (width < 32rem) {
      grid-template-areas:
        "brand sound"
        "nav nav";
      grid-template-columns: 1fr auto;

      /* The home page has no brand, so the nav moves up beside the sound switch. */
      &:not(:has([data-slot="brand"])) {
        grid-template-areas: "nav sound";
      }
    }

    /* NOTE: hints float above their link and take no space, so the nav keeps its width.
       They show while the header is hovered or holds focus, and a held key shows its own. */
    & kbd {
      position: absolute;
      inset-block-end: calc(100% - 0.125rem);
      inset-inline-start: 50%;
      min-inline-size: 1.5em;
      font-size: 0.625rem;
      color: var(--color-text-muted);
      pointer-events: none;
      opacity: 0;
      translate: -50% 0;
      transition:
        opacity var(--duration-fast) var(--ease-out),
        translate var(--duration-fast) var(--ease-out);

      &:global(.is-pressed) {
        opacity: 1;
      }
    }

    @media (hover: hover) {
      &:is(:hover, :focus-within) kbd {
        opacity: 1;
      }
    }
  }

  [data-slot="brand"] {
    position: relative;
    grid-area: brand;
    font-weight: 700;
    color: var(--color-text-strong);
    text-decoration: none;

    /* NOTE: shares its snapshot with the home page's title, so the name grows into the title
       and shrinks back. */
    & span {
      display: inline-block;
      view-transition-name: brand;
    }
  }

  [data-slot="nav"] {
    display: flex;
    flex-wrap: wrap;
    grid-area: nav;
    gap: var(--space-3xs);
    justify-content: end;

    @media (width < 32rem) {
      justify-content: start;
    }

    & a {
      position: relative;
      padding: var(--space-3xs) var(--space-2xs);
      color: var(--color-text-muted);
      text-decoration: none;
      border-radius: var(--radius-control);
      transition: color var(--duration-fast) var(--ease-out);

      &:hover,
      &[aria-current="page"] {
        color: var(--color-text-strong);
      }
    }
  }

  /* NOTE: the switch is visually hidden but keeps focus; the label shows the state as an icon. */
  [data-slot="sound"] {
    position: relative;
    display: inline flex;
    grid-area: sound;
    gap: 0.25em;
    align-items: center;
    padding: var(--space-3xs);
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-control);
    transition: color var(--duration-fast) var(--ease-out);

    &:hover {
      color: var(--color-text-strong);
    }

    &:has(:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    & input {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    & svg {
      inline-size: 1.25em;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.25;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &:has(:checked) [data-icon="off"],
    &:not(:has(:checked)) [data-icon="on"] {
      display: none;
    }
  }

  /* NOTE: its own snapshot, so it slides between tabs while the labels stay put. */
  [data-slot="indicator"] {
    position: absolute;
    inset-block-end: -0.125rem;
    inset-inline: var(--space-2xs);
    block-size: 2px;
    background: var(--color-focus);
    border-radius: 1px;
    view-transition-name: nav-indicator;
  }

  /* WHY: pages stack their blocks here, so a page needs no wrapper of its own. */
  [data-slot="main"] {
    display: grid;
    grid-area: main;
    gap: var(--space-l);
    align-content: start;
    view-transition-name: main;
  }

  /* A quiet colophon: small, muted, and pinned below short pages. */
  [data-slot="footer"] {
    display: grid;
    grid-area: footer;
    grid-template-areas:
      "license dependencies"
      "credits built";
    grid-template-columns: 1fr auto;
    gap: var(--space-3xs) var(--space-s);
    padding-block-start: var(--space-s);
    font-size: var(--text--1);
    color: var(--color-text-muted);
    border-block-start: 1px solid var(--color-line);

    /* NOTE: its own snapshot, so it glides to the new page's end instead of crossfading. */
    view-transition-name: footer;

    & [data-slot="license"] {
      grid-area: license;
    }

    & [data-slot="dependencies"] {
      grid-area: dependencies;
    }

    & [data-slot="credits"] {
      grid-area: credits;
    }

    & [data-slot="built"] {
      grid-area: built;
      justify-self: end;
    }

    @media (width < 32rem) {
      grid-template-areas: "license" "dependencies" "credits" "built";
      grid-template-columns: 1fr;
    }

    & p {
      margin: 0;
    }

    & a {
      color: inherit;
      white-space: nowrap;
      text-decoration-color: var(--color-line-strong);
      text-underline-offset: 0.2em;
      transition:
        color var(--duration-fast) var(--ease-out),
        text-decoration-color var(--duration-fast) var(--ease-out);

      &:hover {
        color: var(--color-text-strong);
        text-decoration-color: currentColor;
      }
    }
  }

  /* The old page fades out while the new page's blocks settle in from the top down. The new
     snapshot is live, so it shows the blocks' own animations. Reduced motion skips all of it. */
  @media (prefers-reduced-motion: no-preference) {
    :global(::view-transition-group(nav-indicator)) {
      animation-duration: var(--duration-slow);
      animation-timing-function: var(--ease-overshoot);
    }

    :global(::view-transition-group(brand)) {
      animation-duration: var(--duration-slow);
      animation-timing-function: var(--ease-out);
    }

    :global(::view-transition-old(main)) {
      animation: page-out var(--duration-fast) var(--ease-in) both;
    }

    :global(::view-transition-new(main)) {
      animation: none;
    }

    /* WHY: the last block starts by 140ms, so a long page never waits on its stagger. */
    :global(:root[data-settle]) [data-slot="main"] > :global(*) {
      animation: page-settle var(--duration-slow) var(--ease-out) both;

      &:nth-child(2) {
        animation-delay: calc(35ms * var(--motion));
      }

      &:nth-child(3) {
        animation-delay: calc(70ms * var(--motion));
      }

      &:nth-child(4) {
        animation-delay: calc(105ms * var(--motion));
      }

      &:nth-child(n + 5) {
        animation-delay: calc(140ms * var(--motion));
      }
    }
  }

  @keyframes -global-page-out {
    to {
      opacity: 0;
    }
  }

  @keyframes -global-page-settle {
    from {
      opacity: 0;
      translate: 0 0.375rem;
    }
  }
</style>
