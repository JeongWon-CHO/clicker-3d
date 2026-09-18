import { useCallback, useEffect, useRef } from "react";
import soundUrl from "../assets/key-click.mp3?url";

type Sound = {
  context: AudioContext;
  output: GainNode;
  buffer: Promise<AudioBuffer | null>;
};

export function useKeyClickSound() {
  const sound = useRef<Sound | null>(null);

  useEffect(() => {
    if (!window.AudioContext) return;
    const context = new AudioContext({ latencyHint: "interactive" });
    const output = context.createGain();
    output.gain.value = 0.65;
    const limiter = context.createDynamicsCompressor();
    output.connect(limiter);
    limiter.connect(context.destination);
    const abort = new AbortController();
    const buffer = fetch(soundUrl, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Click sound could not be loaded");
        return response.arrayBuffer();
      })
      .then((bytes) => context.decodeAudioData(bytes))
      .catch(() => null);
    const current = { context, output, buffer };
    sound.current = current;

    // Unlock on the initial gesture, before a valid pointerup triggers playback.
    const unlock = () => {
      if (context.state === "suspended") void context.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      sound.current = null;
      abort.abort();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      output.disconnect();
      limiter.disconnect();
      void context.close().catch(() => {});
    };
  }, []);

  return useCallback(() => {
    const current = sound.current;
    if (!current) return;
    const resumed =
      current.context.state === "running"
        ? Promise.resolve()
        : current.context.resume();
    void Promise.all([current.buffer, resumed])
      .then(([buffer]) => {
        if (
          !buffer ||
          sound.current !== current ||
          document.hidden ||
          current.context.state !== "running"
        )
          return;
        // One source per click: overlapping tails never interrupt the next attack.
        const source = current.context.createBufferSource();
        source.buffer = buffer;
        source.connect(current.output);
        source.onended = () => source.disconnect();
        source.start();
      })
      .catch(() => {});
  }, []);
}
