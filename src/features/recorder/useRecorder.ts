import { useCallback, useRef, useState } from "react";
import { toErrorMessage } from "../../lib/errors";
import { startCanvasRecording } from "./recorderEngine";
import type { RecorderOptions, RecorderState, RecordingResult } from "./types";

export function useRecorder(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const activeRecording = useRef<{ stop: () => Promise<RecordingResult> } | null>(null);
  const stopHandled = useRef(false);
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const start = useCallback(
    async (options: RecorderOptions, onAutoStop?: (result: RecordingResult) => void) => {
      if (!canvasRef.current) return;
      setError(null);
      setWarnings([]);
      setState("requesting");
      try {
        const recording = await startCanvasRecording(canvasRef.current, options);
        activeRecording.current = recording;
        setWarnings(recording.warnings);
        stopHandled.current = false;
        recording.result
          .then((result) => {
            if (stopHandled.current) return;
            stopHandled.current = true;
            activeRecording.current = null;
            setState("idle");
            onAutoStop?.(result);
          })
          .catch((err: unknown) => {
            if (stopHandled.current) return;
            setError(toErrorMessage(err));
            setState("idle");
          });
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
      stopHandled.current = true;
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

  return { state, error, warnings, start, stop, clearError: () => setError(null) };
}
