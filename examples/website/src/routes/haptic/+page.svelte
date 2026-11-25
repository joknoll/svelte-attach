<script lang="ts">
  import { haptic, triggerHaptic, isSupported } from "@joknoll/svelte-attach/haptic";
</script>

<h1>Haptic</h1>

<label class="support-indicator">
  <input type="checkbox" checked={isSupported()} disabled />
  Vibrate API available
</label>

<section>
  <button {@attach haptic()}>Default (medium on click)</button>
  <button {@attach haptic("success")}>Success</button>
  <button {@attach haptic("error")}>Error</button>
  <button {@attach haptic("heavy", { on: "pointerdown" })}>
    Heavy (on pointerdown)
  </button>
  <button {@attach haptic([30, 50, 30])}>Custom pattern</button>
  <button onclick={() => triggerHaptic("selection")}>Imperative selection</button>
</section>

<style>
  section {
    display: grid;
    gap: 1rem;
    max-width: 22rem;
  }

  button {
    padding: 1rem;
  }

  .support-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    cursor: default;
  }
</style>
