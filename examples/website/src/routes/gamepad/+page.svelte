<script lang="ts">
  import {
    isSupported,
    isButtonPressed,
    gamepadButton,
    GamepadButtonMap,
  } from "@joknoll/svelte-attach/gamepad";

  const buttons = Object.keys(GamepadButtonMap) as (keyof typeof GamepadButtonMap)[];

  let connected = $state(false);
  let activations = $state(0);
  let pressed = $state<Record<string, boolean>>({});
  let frame = 0;

  function poll() {
    const pad = typeof navigator !== "undefined" ? navigator.getGamepads?.().find(Boolean) : null;
    connected = Boolean(pad);
    const next: Record<string, boolean> = {};
    for (const name of buttons) next[name] = isButtonPressed(name);
    pressed = next;
    frame = requestAnimationFrame(poll);
  }

  $effect(() => {
    if (!isSupported()) return;
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  });
</script>

<h1>Gamepad</h1>

<p>
  Focus the button below, then press A on a standard-mapped gamepad. The button activates once per
  press. The list also shows the current button states.
</p>

<label class="support-indicator">
  <input type="checkbox" checked={isSupported()} disabled />
  Gamepad API available
</label>

<p class="status">{connected ? "Gamepad connected" : "No gamepad connected"}</p>

<button {@attach gamepadButton("A")} onclick={() => (activations += 1)}>
  Focus me, then press A ({activations})
</button>

<ul class="buttons">
  {#each buttons as name (name)}
    <li class:on={pressed[name]}>{name}</li>
  {/each}
</ul>

<style>
  .support-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: default;
  }

  .status {
    font-weight: 600;
  }

  .buttons {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .buttons li {
    padding: 0.4rem 0.7rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    font-family: monospace;
  }

  .buttons li.on {
    background: #1a1a1a;
    color: #fff;
    border-color: #1a1a1a;
  }
</style>
