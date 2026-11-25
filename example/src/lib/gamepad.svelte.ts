import { isButtonPressed, isSupported, type ButtonName } from "@joknoll/svelte-attach/gamepad";
import { createSubscriber } from "svelte/reactivity";

// WHY: the Gamepad API has no events. Poll once per frame while something reactive reads a pad,
// and stop once nothing does.
const subscribe = createSubscriber((update) => {
  if (!isSupported()) return;
  let frame = requestAnimationFrame(function poll() {
    update();
    frame = requestAnimationFrame(poll);
  });
  return () => cancelAnimationFrame(frame);
});

/** Reactive `isButtonPressed`: always false while prerendering. */
export function held(name: ButtonName): boolean {
  subscribe();
  return isButtonPressed(name);
}

/** Whether any gamepad is connected: always false while prerendering. */
export function connected(): boolean {
  subscribe();
  return isSupported() && navigator.getGamepads().some(Boolean);
}
