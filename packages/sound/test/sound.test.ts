// @vitest-environment jsdom
import { beforeAll, afterAll, describe, expect, it, vi } from "vite-plus/test";
import { Sound } from "../src/index.ts";

const sources: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = [];
const decode = vi.fn(async () => ({}) as AudioBuffer);
const resume = vi.fn(async () => {});
const context = {
  decodeAudioData: decode,
  resume,
  destination: {},
  createGain: () => ({
    gain: { value: 1 },
    connect() {
      return this;
    },
    disconnect: vi.fn(),
  }),
  createBufferSource: () => {
    const source = {
      buffer: null,
      loop: false,
      playbackRate: { value: 1 },
      onended: null,
      start: vi.fn(),
      stop: vi.fn(),
      connect<T>(node: T): T {
        return node;
      },
      disconnect: vi.fn(),
    };
    sources.push(source);
    return source;
  },
} as unknown as AudioContext;

beforeAll(() => {
  vi.stubGlobal("AudioContext", function AudioContextMock() {
    return context;
  });
});
afterAll(() => vi.unstubAllGlobals());

function okResponse(): Response {
  return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response;
}

describe("Sound", () => {
  it("decodes a URL once and controls overlapping playbacks independently", async () => {
    const fetchSound = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchSound);
    const first = new Sound("/shared.opus");
    const second = new Sound("/shared.opus");
    const [a, b] = await Promise.all([first.play(), second.play()]);
    expect(fetchSound).toHaveBeenCalledOnce();
    expect(decode).toHaveBeenCalledOnce();
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(sources).toHaveLength(2);
    a?.stop();
    expect(sources[0]?.stop).toHaveBeenCalledOnce();
    expect(sources[1]?.stop).not.toHaveBeenCalled();
    second.stop();
    expect(sources[1]?.stop).toHaveBeenCalledOnce();
  });

  it("cancels playback while a sound is loading", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    const sound = new Sound("/pending.opus");
    const playing = sound.play();
    sound.stop();
    resolveFetch(okResponse());
    expect(await playing).toBeNull();
    expect(sources).toHaveLength(2);
  });

  it("evicts failed loads so a later play can retry", async () => {
    const fetchSound = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal("fetch", fetchSound);
    const sound = new Sound("/retry.opus");
    await expect(sound.play()).rejects.toThrow("HTTP 503");
    expect(await sound.play()).not.toBeNull();
    expect(fetchSound).toHaveBeenCalledTimes(2);
    sound.stop();
  });
});
