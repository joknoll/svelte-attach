// @vitest-environment jsdom
// The attachment tests dispatch events on DOM elements.
import { beforeAll, afterAll, describe, expect, it, vi } from "vite-plus/test";
import { Sound, sound } from "../src/sound.ts";

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
    resume.mockClear();
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
    expect(resume).toHaveBeenCalled();
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

describe("sound attachment", () => {
  it("selects a sound from the element state and stops both sounds on cleanup", async () => {
    const fetchSound = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchSound);
    const input = document.createElement("input");
    input.type = "checkbox";
    const initialSources = sources.length;
    const detach = sound<HTMLInputElement>(
      (element) => (element.checked ? "/switch-on.opus" : "/switch-off.opus"),
      { on: "change" },
    )(input);

    input.checked = true;
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(sources).toHaveLength(initialSources + 1));
    expect(fetchSound).toHaveBeenCalledWith("/switch-on.opus");

    input.checked = false;
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(sources).toHaveLength(initialSources + 2));
    expect(fetchSound).toHaveBeenCalledWith("/switch-off.opus");

    detach?.();
    expect(sources[initialSources]?.stop).toHaveBeenCalledOnce();
    expect(sources[initialSources + 1]?.stop).toHaveBeenCalledOnce();

    input.dispatchEvent(new Event("change"));
    expect(fetchSound).toHaveBeenCalledTimes(2);
  });

  it("plays on `on` and stops on `stopOn`", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse()),
    );
    const button = document.createElement("button");
    const initialSources = sources.length;
    const detach = sound("/hover.opus", { on: "mouseenter", stopOn: "mouseleave" })(button);

    button.dispatchEvent(new Event("click"));
    button.dispatchEvent(new Event("mouseenter"));
    await vi.waitFor(() => expect(sources).toHaveLength(initialSources + 1));
    expect(sources[initialSources]?.stop).not.toHaveBeenCalled();
    button.dispatchEvent(new Event("mouseleave"));
    expect(sources[initialSources]?.stop).toHaveBeenCalledOnce();
    detach?.();
  });

  it("passes the event to the selector, skips null, and reports selector errors", () => {
    const fetchSound = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchSound);
    const button = document.createElement("button");
    const failure = new Error("no sound");
    const onError = vi.fn();
    const select = vi.fn((_element: HTMLElement, event: Event) => {
      if (event.type === "click") return null;
      throw failure;
    });
    const detach = sound(select, { onError })(button);

    const click = new Event("click");
    button.dispatchEvent(click);
    expect(select).toHaveBeenCalledWith(button, click);
    expect(fetchSound).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    detach?.();

    const detachFailing = sound(select, { on: "focus", onError })(button);
    button.dispatchEvent(new Event("focus"));
    expect(onError).toHaveBeenCalledWith(failure);
    detachFailing?.();
  });

  it("validates options when the attachment is created", () => {
    expect(() => sound("/a.opus", { volume: 2 })).toThrow(RangeError);
    expect(() => sound(() => "/a.opus", { rate: 0 })).toThrow(RangeError);
  });
});
