import { formatHint } from "@joknoll/svelte-attach/key";

// NOTE: shared module state is safe here: only the browser ever sets it, so the server always sees false.
let value = $state(false);

/** False while prerendering and during the first client render; true once the app has hydrated. */
export function hydrated(): boolean {
  return value;
}

/** Called once by the root layout. */
export function markHydrated(): void {
  value = true;
}

/** `formatHint`, recomputed after hydration: prerendering can't detect a Mac, so it prints Ctrl. */
export function hint(keys: string | readonly string[]): string {
  hydrated(); // Read only to depend on it.
  return formatHint(keys);
}
