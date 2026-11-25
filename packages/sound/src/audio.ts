// Loads and decoded buffers are shared across attachments and Sound instances.
const buffers = new Map<string, Promise<AudioBuffer>>();
let context: AudioContext | undefined;

export function audioContext(): AudioContext | undefined {
  if (typeof AudioContext === "undefined") return undefined;
  return (context ??= new AudioContext());
}

export function loadBuffer(src: string, context: AudioContext): Promise<AudioBuffer> {
  const cached = buffers.get(src);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to load sound ${src}: HTTP ${response.status}`);
    return context.decodeAudioData(await response.arrayBuffer());
  })();

  buffers.set(src, pending);
  void pending.catch(() => {
    if (buffers.get(src) === pending) buffers.delete(src);
  });
  return pending;
}
