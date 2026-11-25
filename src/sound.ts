import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";

type EventName = keyof HTMLElementEventMap;

export interface SoundOptions {
  /** Between 0 and 1. Defaults to 1. */
  volume?: number;
  loop?: boolean;
  /** Playback speed, greater than 0. Defaults to 1. */
  rate?: number;
}

/** A URL, or a function that picks one when the event fires. Returning null skips playback. */
export type SoundSource<E extends HTMLElement = HTMLElement> =
  | string
  | ((element: E, event: Event) => string | null | undefined);

export interface SoundAttachmentOptions extends SoundOptions {
  /** Event that starts playback. Defaults to `"click"`. */
  on?: EventName;
  /** Event that stops every playback this attachment started. */
  stopOn?: EventName;
  /** Receives selection, load and playback errors. Without it they are logged. */
  onError?: (error: unknown) => void;
}

export interface Playback {
  stop(): void;
}

// Loads and decoded buffers are shared across attachments and Sound instances.
const buffers = new Map<string, Promise<AudioBuffer>>();
let sharedContext: AudioContext | undefined;

export function isSupported(): boolean {
  return typeof AudioContext !== "undefined";
}

function audioContext(): AudioContext | undefined {
  if (!isSupported()) return undefined;
  return (sharedContext ??= new AudioContext());
}

function loadBuffer(src: string, context: AudioContext): Promise<AudioBuffer> {
  const cached = buffers.get(src);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to load sound ${src}: HTTP ${response.status}`);
    return context.decodeAudioData(await response.arrayBuffer());
  })();

  buffers.set(src, pending);
  // Failed loads leave the cache so a later play can retry.
  void pending.catch(() => {
    if (buffers.get(src) === pending) buffers.delete(src);
  });
  return pending;
}

function validate({ volume = 1, rate = 1 }: SoundOptions): void {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new RangeError("Sound volume must be between 0 and 1.");
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new RangeError("Sound rate must be greater than 0.");
  }
}

export class Sound {
  private readonly playbacks = new Set<Playback>();
  private generation = 0;

  constructor(
    private readonly src: string,
    private readonly options: SoundOptions = {},
  ) {
    validate(options);
  }

  /** Primes the shared URL cache. Resolves to false without Web Audio and rejects on load failure. */
  async preload(): Promise<boolean> {
    const context = audioContext();
    if (!context) return false;
    await loadBuffer(this.src, context);
    return true;
  }

  /**
   * The handle stops only this playback. Resolves to null without Web Audio, or when `stop()`
   * ran before playback started. Load and resume failures reject.
   */
  async play(): Promise<Playback | null> {
    const context = audioContext();
    if (!context) return null;

    const generation = this.generation;
    // Resume during the user gesture, even when the sound still needs to load.
    const [buffer] = await Promise.all([loadBuffer(this.src, context), context.resume()]);
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
        this.playbacks.delete(playback);
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
      this.playbacks.delete(playback);
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
    this.playbacks.add(playback);
    return playback;
  }

  /** Stops active playbacks and prevents pending ones from starting after load or resume. */
  stop(): void {
    this.generation += 1;
    for (const playback of this.playbacks) playback.stop();
  }
}

/**
 * Plays a sound when the element receives `on` (default `"click"`). `stopOn` and detaching stop
 * active sounds and prevent pending ones from starting.
 *
 * @example
 * ```svelte
 * <button {@attach sound(click, { volume: 0.5 })}>Click</button>
 * ```
 */
export function sound<E extends HTMLElement = HTMLElement>(
  src: SoundSource<E>,
  options: SoundAttachmentOptions = {},
): Attachment<E> {
  const { on: playEvent = "click", stopOn, onError, ...soundOptions } = options;
  validate(soundOptions);

  return (element) => {
    const instances = new Map<string, Sound>();
    const getSound = (url: string): Sound => {
      let instance = instances.get(url);
      if (!instance) {
        instance = new Sound(url, soundOptions);
        instances.set(url, instance);
      }
      return instance;
    };
    const reportError = (error: unknown): void => {
      if (onError) onError(error);
      else console.warn("[svelte-attach/sound] Playback failed:", error);
    };
    const stop = (): void => {
      for (const instance of instances.values()) instance.stop();
    };

    const offPlay = on(element, playEvent, (event) => {
      try {
        const url = typeof src === "string" ? src : src(element, event);
        if (url != null) void getSound(url).play().catch(reportError);
      } catch (error) {
        reportError(error);
      }
    });
    const offStop = stopOn ? on(element, stopOn, stop) : undefined;

    return () => {
      offPlay();
      offStop?.();
      stop();
    };
  };
}
