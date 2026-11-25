<script lang="ts">
  import { hotkey, pressed } from "@joknoll/svelte-attach/key";
  import type { Attachment } from "svelte/attachments";
  import { on } from "svelte/events";
  import Example from "#lib/Example.svelte";
  import PageHeader from "#lib/PageHeader.svelte";
  import Section from "#lib/Section.svelte";
  import { hint } from "#lib/hydrated.svelte.ts";

  const bindings = [
    { keys: "f", label: "❤️ Like", done: "Liked" },
    { keys: "ctrl+s", label: "Save", done: "Saved" },
    { keys: "mod+z", label: "Undo", done: "Undone" },
  ] as const;
  type Binding = (typeof bindings)[number];

  let binding = $state.raw<Binding>(bindings[0]);
  let fired = $state(0);

  function fire(next: Binding) {
    fired = next === binding ? fired + 1 : 1;
    binding = next;
  }

  // Hold to repeat: a marker on a 5 × 5 board.
  const SIZE = 5;
  let x = $state(2);
  let y = $state(2);

  function move(dx: number, dy: number) {
    x = Math.min(SIZE - 1, Math.max(0, x + dx));
    y = Math.min(SIZE - 1, Math.max(0, y + dy));
  }

  let enabled = $state(true);
  let step = $state(1);

  // A few hearts fly out of the emoji on every like, spread evenly around a random start angle.
  const hearts: Attachment<HTMLElement> = (button) =>
    on(button, "click", () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = button.getBoundingClientRect();
      // NOTE: the emoji sits one half-height in from the start edge.
      const originX = rect.left + rect.height / 2;
      const originY = rect.top + rect.height / 2;
      const count = 6;
      const phase = Math.random() * Math.PI * 2;
      for (let index = 0; index < count; index++) {
        const angle = phase + ((index + (Math.random() - 0.5) * 0.6) / count) * Math.PI * 2;
        const distance = 24 + Math.random() * 16;
        const heart = document.createElement("span");
        heart.textContent = "♥";
        heart.setAttribute("aria-hidden", "true");
        heart.dataset.heart = "";
        heart.style.left = `${originX}px`;
        heart.style.top = `${originY}px`;
        heart.style.setProperty("--heart-x", `${Math.cos(angle) * distance}px`);
        heart.style.setProperty("--heart-y", `${Math.sin(angle) * distance}px`);
        document.body.append(heart);
        setTimeout(() => heart.remove(), 800);
      }
    });
</script>

<PageHeader
  title="Keyboard"
  code={'import { hotkey, pressed, formatHint } from "@joknoll/svelte-attach/key";'}
  accent="press"
  docs="keyboard.md"
/>

<Section title="Bind a shortcut">
  {#snippet lead()}
    Shortcuts work without focus. By default, they're ignored in text fields.
  {/snippet}
  <Example code={`<button {@attach hotkey("${binding.keys}")}>${binding.label}</button>`}>
    {#each bindings as item (item.keys)}
      <button
        {@attach hotkey(item.keys)}
        {@attach item.keys === "f" && hearts}
        onclick={() => fire(item)}
      >
        {item.label} <kbd>{hint(item.keys)}</kbd>
      </button>
    {/each}
    <input type="text" placeholder="Type F here" aria-label="Shortcut test field" />
    <output>{fired ? `${binding.done} ×${fired}` : ""}</output>
  </Example>
</Section>

<Section title="Hold to repeat">
  {#snippet lead()}
    Hold an arrow key or <kbd>H</kbd>, <kbd>J</kbd>, <kbd>K</kbd>, or <kbd>L</kbd>.
  {/snippet}
  <Example
    code={`<button
  {@attach hotkey(["arrowup", "k"], {
    ignoreRepeat: false,
    pressedClass: "is-pressed",
  })}
  onclick={() => move(0, -1)}
>↑</button>`}
  >
    <div data-slot="board" aria-hidden="true">
      <span style:translate="{x * 100}% {y * 100}%"></span>
    </div>
    <output data-slot="position">Row {y + 1}, column {x + 1}</output>
    <div data-slot="arrows" role="group" aria-label="Move">
      <button
        data-slot="up"
        aria-label="Up"
        title={hint(["arrowup", "k"])}
        {@attach hotkey(["arrowup", "k"], { ignoreRepeat: false, pressedClass: "is-pressed" })}
        onclick={() => move(0, -1)}>↑</button
      >
      <button
        data-slot="left"
        aria-label="Left"
        title={hint(["arrowleft", "h"])}
        {@attach hotkey(["arrowleft", "h"], { ignoreRepeat: false, pressedClass: "is-pressed" })}
        onclick={() => move(-1, 0)}>←</button
      >
      <button
        data-slot="down"
        aria-label="Down"
        title={hint(["arrowdown", "j"])}
        {@attach hotkey(["arrowdown", "j"], { ignoreRepeat: false, pressedClass: "is-pressed" })}
        onclick={() => move(0, 1)}>↓</button
      >
      <button
        data-slot="right"
        aria-label="Right"
        title={hint(["arrowright", "l"])}
        {@attach hotkey(["arrowright", "l"], { ignoreRepeat: false, pressedClass: "is-pressed" })}
        onclick={() => move(1, 0)}>→</button
      >
    </div>
  </Example>
</Section>

<Section title="Shortcut hints">
  <Example code={'<kbd {@attach pressed("mod+enter")}>{formatHint("mod+enter")}</kbd>'}>
    <dl data-slot="hints">
      <div>
        <dt><code>"shift"</code></dt>
        <dd><kbd {@attach pressed("shift")}>{hint("shift")}</kbd></dd>
      </div>
      <div>
        <dt><code>"mod+enter"</code></dt>
        <dd><kbd {@attach pressed("mod+enter")}>{hint("mod+enter")}</kbd></dd>
      </div>
      <div>
        <dt><code>"alt+arrowup"</code></dt>
        <dd><kbd {@attach pressed("alt+arrowup")}>{hint("alt+arrowup")}</kbd></dd>
      </div>
      <div>
        <dt><code>["j", "arrowdown"]</code></dt>
        <dd>
          <kbd {@attach pressed(["j", "arrowdown"])}>{hint(["j", "arrowdown"])}</kbd>
        </dd>
      </div>
    </dl>
  </Example>
</Section>

<Section title="Disable a shortcut">
  {#snippet lead()}
    Press <kbd>T</kbd> to toggle the shortcut. Next stays clickable.
  {/snippet}
  <Example code={'<button {@attach enabled && hotkey("n")}>Next</button>'}>
    <label>
      Hotkey <input type="checkbox" role="switch" bind:checked={enabled} {@attach hotkey("t")} />
    </label>
    <button {@attach enabled && hotkey("n")} onclick={() => step++}>
      Next <kbd>{hint("n")}</kbd>
    </button>
    <output>Step {step}</output>
  </Example>
</Section>

<style>
  /* A 5 × 5 field with a dot on each cell; the marker moves one cell per press. */
  [data-slot="board"] {
    position: relative;
    inline-size: 5.25em;
    aspect-ratio: 1;
    background-image: radial-gradient(circle, var(--color-line-strong) 1px, transparent 1.5px);
    background-size: 20% 20%;
    border-radius: var(--radius-control);
    box-shadow: inset 0 0 0 1px var(--color-line);

    & span {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: 20%;
      aspect-ratio: 1;
      background: radial-gradient(circle, var(--color-focus) 45%, transparent 50%);

      @media (prefers-reduced-motion: no-preference) {
        transition: translate var(--duration-base) var(--ease-overshoot);
      }
    }
  }

  /* The marker's position, for screen readers; the board shows it to everyone else. */
  [data-slot="position"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* The inverted T of a keyboard's arrow keys. */
  [data-slot="arrows"] {
    display: grid;
    grid-template-areas:
      ". up ."
      "left down right";
    gap: var(--space-3xs);
    margin-inline-start: var(--space-s);

    & button {
      inline-size: 2.5em;
      padding: 0;
    }
  }

  [data-slot="up"] {
    grid-area: up;
  }

  [data-slot="left"] {
    grid-area: left;
  }

  [data-slot="down"] {
    grid-area: down;
  }

  [data-slot="right"] {
    grid-area: right;
  }

  [data-slot="hints"] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s) var(--space-m);
    margin: 0;

    & div {
      display: grid;
      gap: var(--space-3xs);
      justify-items: start;
    }

    & dt {
      font-size: var(--text--1);
      color: var(--color-text-muted);
    }

    & dd {
      margin: 0;
    }
  }

  :global([data-heart]) {
    position: fixed;
    z-index: 1;
    font-size: 0.875rem;
    color: var(--color-accent-500);
    pointer-events: none;
    translate: -50% -50%;
    animation:
      heart-fly 600ms var(--ease-out) both,
      heart-fade 300ms 300ms linear both;
  }

  @keyframes -global-heart-fly {
    to {
      scale: 0.6;
      translate: calc(-50% + var(--heart-x)) calc(-50% + var(--heart-y));
    }
  }

  @keyframes -global-heart-fade {
    to {
      opacity: 0;
    }
  }
</style>
