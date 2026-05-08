import { useCallback, useRef, useState } from "react";
import { toErrorMessage } from "../../lib/errors";
import { startCanvasRecording } from "./recorderEngine";
import type { RecorderOptions, RecorderState, RecordingResult } from "./types";

export function useRecorder(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const activeRecording = useRef<{ stop: () => Promise<RecordingResult> } | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (options: RecorderOptions) => {
      if (!canvasRef.current) return;
      setError(null);
      setState("requesting");
      try {
        activeRecording.current = await startCanvasRecording(canvasRef.current, options);
        setState("recording");
      } catch (err) {
        setError(toErrorMessage(err));
        setState("idle");
      }
    },
    [canvasRef],
  );

  const stop = useCallback(async () => {
    if (!activeRecording.current) return null;
    setState("stopping");
    try {
      const result = await activeRecording.current.stop();
      activeRecording.current = null;
      setState("idle");
      return result;
    } catch (err) {
      setError(toErrorMessage(err));
      setState("idle");
      return null;
    }
  }, []);

  return { state, error, start, stop, clearError: () => setError(null) };
}
