<script lang="ts">
  let {
    pattern,
    run = 0,
    scale,
  }: {
    /** Alternating vibration and pause durations in ms. */
    pattern: readonly number[];
    /** Increment to replay. Set to 0 to reset. */
    run?: number;
    /** Duration in ms shown across the full width. Defaults to the pattern length. */
    scale?: number;
  } = $props();

  const segments = $derived.by(() => {
    let start = 0;
    return pattern.map((duration, index) => {
      const segment = { start, duration, vibrates: index % 2 === 0 };
      start += duration;
      return segment;
    });
  });
  const span = $derived(
    scale ??
      Math.max(
        1,
        pattern.reduce((sum, duration) => sum + duration, 0),
      ),
  );
</script>

<span data-slot="pulses" aria-hidden="true">
  {#key run}
    {#each segments as segment}
      {#if segment.vibrates}
        <span
          data-running={run > 0 || undefined}
          style:inset-inline-start="{(segment.start / span) * 100}%"
          style:inline-size="{(segment.duration / span) * 100}%"
          style:--start="{segment.start}ms"
          style:--length="{segment.duration}ms"
        ></span>
      {/if}
    {/each}
  {/key}
</span>

<style>
  [data-slot="pulses"] {
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: 0.5rem;
    background: linear-gradient(var(--color-line), var(--color-line)) center / 100% 1px no-repeat;

    & span {
      position: absolute;
      inset-block: 0;
      min-inline-size: 2px;
      overflow: hidden;
      background: var(--color-line-strong);
      border-radius: 1px;

      &::after {
        position: absolute;
        inset: 0;
        content: "";
        background: var(--color-focus);
        transform-origin: left;
        scale: 0 1;
      }

      /* Keep each bar filled until the next run. */
      &[data-running]::after {
        animation: pulse-fill calc(var(--length) * var(--motion)) linear
          calc(var(--start) * var(--motion)) both;
      }
    }
  }

  @keyframes pulse-fill {
    to {
      scale: 1 1;
    }
  }
</style>
