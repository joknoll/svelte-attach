import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";
import { audioContext, loadBuffer } from "./audio.ts";

export type SoundEvents = [play: keyof HTMLElementEventMap, stop?: keyof HTMLElementEventMap];

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
  rate?: number;
}

export interface SoundAttachmentOptions extends SoundOptions {
  src: string;
  events: SoundEvents;
  onError?: (error: unknown) => void;
}

export interface Playback {
  stop(): void;
}

export class Sound {
  private readonly sources = new Set<Playback>();
  private generation = 0;

  constructor(
    private readonly src: string,
    private readonly options: SoundOptions = {},
  ) {
    const { volume = 1, rate = 1 } = options;
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new RangeError("Sound volume must be between 0 and 1.");
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new RangeError("Sound rate must be greater than 0.");
    }
  }

  /** Primes the shared URL cache. Resolves to false without Web Audio and rejects on load failure. */
  async preload(): Promise<boolean> {
    const context = audioContext();
    if (!context) return false;
    await loadBuffer(this.src, context);
    return true;
  }

  /**
   * The handle stops only this playback. Resolves to null if unavailable or stopped before starting.
   * Load and resume failures reject.
   */
  async play(): Promise<Playback | null> {
    const context = audioContext();
    if (!context) return null;

    const generation = this.generation;
    const buffer = await loadBuffer(this.src, context);
    if (generation !== this.generation) return null;

    await context.resume();
    if (generation !== this.generation) return null;

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = this.options.loop ?? false;
    source.playbackRate.value = this.options.rate ?? 1;
    gain.gain.value = this.options.volume ?? 1;
    source.connect(gain).connect(context.destination);

    let active = true;
    const playback: Playback = {
      stop: () => {
        if (!active) return;
        active = false;
        this.sources.delete(playback);
        try {
          source.stop();
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "InvalidStateError")) throw error;
        } finally {
          source.disconnect();
          gain.disconnect();
        }
      },
    };
    source.onended = () => {
      if (!active) return;
      active = false;
      this.sources.delete(playback);
      source.disconnect();
      gain.disconnect();
    };

    try {
      source.start();
    } catch (error) {
      source.disconnect();
      gain.disconnect();
      throw error;
    }
    this.sources.add(playback);
    return playback;
  }

  /** Stops active playbacks and prevents pending ones from starting after load or resume. */
  stop(): void {
    this.generation += 1;
    for (const playback of this.sources) playback.stop();
  }
}

/** The stop event and detachment stop active sounds and prevent pending playbacks from starting. */
export function sound(options: SoundAttachmentOptions): Attachment<HTMLElement> {
  return (element) => {
    const { src, events, onError, ...soundOptions } = options;
    const [playEvent, stopEvent] = events;
    const instance = new Sound(src, soundOptions);

    const offPlay = on(element, playEvent, () => {
      void instance.play().catch((error: unknown) => {
        if (onError) onError(error);
        else console.warn("[svelte-attach-sound] Playback failed:", error);
      });
    });
    const offStop = stopEvent ? on(element, stopEvent, () => instance.stop()) : undefined;

    return () => {
      offPlay();
      offStop?.();
      instance.stop();
    };
  };
}

export function useSound(
  src: string,
  events: SoundEvents,
  options?: SoundOptions,
): (overrides?: SoundOptions) => Attachment<HTMLElement> {
  return (overrides) => sound({ src, events, ...options, ...overrides });
}
