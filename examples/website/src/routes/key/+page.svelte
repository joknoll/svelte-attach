<script lang="ts">
  import { formatHint, hotkey, pressed } from "@joknoll/svelte-attach/key";

  let saveCount = $state(0);
  let undoCount = $state(0);
  let likeCount = $state(0);
  let enabled = $state(true);
  let lastKey = $state<string | null>(null);

  function flash(key: string) {
    lastKey = key;
    setTimeout(() => (lastKey = null), 1000);
  }
</script>

<h1>Key</h1>
<p class="subtitle">Keyboard shortcut attachments for Svelte 5 elements</p>

<div class="grid">
  <div class="card">
    <h2>Simple key</h2>
    <p>Press <kbd>L</kbd> anywhere to like</p>
    <button
      title={formatHint("l")}
      {@attach hotkey("l")}
      onclick={() => {
        likeCount++;
        flash("L");
      }}
      class:flash={lastKey === "L"}
    >
      ♥ Like ({likeCount})
    </button>
    <code>hotkey("l")</code>
  </div>

  <div class="card">
    <h2>Modifier keys</h2>
    <p>Press <kbd>Ctrl</kbd>+<kbd>S</kbd> to save</p>
    <button
      title={formatHint("ctrl+s")}
      {@attach hotkey("ctrl+s")}
      onclick={() => {
        saveCount++;
        flash("Ctrl+S");
      }}
      class:flash={lastKey === "Ctrl+S"}
    >
      Save ({saveCount})
    </button>
    <code>hotkey("ctrl+s")</code>
  </div>

  <div class="card">
    <h2>Cross-platform mod</h2>
    <p>Press <kbd>Mod</kbd>+<kbd>Z</kbd> (Ctrl on Windows/Linux, ⌘ on Mac)</p>
    <button
      title={formatHint("mod+z")}
      {@attach hotkey("mod+z")}
      onclick={() => {
        undoCount++;
        flash("Mod+Z");
      }}
      class:flash={lastKey === "Mod+Z"}
    >
      Undo ({undoCount})
    </button>
    <code>hotkey("mod+z")</code>
  </div>

  <div class="card">
    <h2>Held state</h2>
    <p>Hold <kbd {@attach pressed("shift")}>Shift</kbd> and press <kbd>Space</kbd></p>
    <button
      title={formatHint("shift+space")}
      {@attach hotkey("shift+space", { pressedClass: "is-pressed" })}
      onclick={() => flash("Shift+Space")}
      class:flash={lastKey === "Shift+Space"}
    >
      Shift+Space
    </button>
    <code>hotkey("shift+space", &#123; pressedClass: "is-pressed" &#125;)</code>
  </div>

  <div class="card">
    <h2>Conditional</h2>
    <p>Press <kbd>K</kbd> — toggle to enable/disable</p>
    <label class="toggle">
      <input type="checkbox" bind:checked={enabled} {@attach hotkey("h")} />
      Hotkey {enabled ? "enabled" : "disabled"} <kbd>H</kbd>
    </label>
    <button
      {@attach enabled && hotkey("k")}
      onclick={() => flash("K")}
      class:flash={lastKey === "K"}
      class:dim={!enabled}
    >
      Press K
    </button>
    <code>&#123;@attach enabled && hotkey("k")&#125;</code>
  </div>

  <div class="card">
    <h2>Alternatives</h2>
    <p>Either <kbd>J</kbd> or <kbd>↓</kbd> will trigger the button</p>
    <button
      title={formatHint(["j", "arrowdown"])}
      {@attach hotkey(["j", "arrowdown"])}
      onclick={() => flash("J or ArrowDown")}
      class:flash={lastKey === "J or ArrowDown"}
    >
      Move down
    </button>
    <code>hotkey(["j", "arrowdown"])</code>
  </div>
</div>

{#if lastKey}
  <div class="toast">Triggered: {lastKey}</div>
{/if}

<style>
  .subtitle {
    color: #666;
    margin-top: 0.25rem;
    margin-bottom: 2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #fff;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: #444;
  }

  kbd {
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.8em;
    font-family: monospace;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #fff;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.15s;
    align-self: flex-start;
  }

  button:hover {
    background: #f5f5f5;
  }

  button.flash {
    background: #d4edda;
    border-color: #28a745;
  }

  /* The attachments add these classes at runtime, so the compiler cannot see them in markup. */
  kbd:global(.is-pressed),
  button:global(.is-pressed) {
    background: #e2e8f0;
    border-color: #64748b;
  }

  button.dim {
    opacity: 0.4;
  }

  code {
    font-size: 0.75rem;
    background: #f5f5f5;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    color: #333;
    margin-top: auto;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    font-size: 0.875rem;
    pointer-events: none;
  }
</style>
