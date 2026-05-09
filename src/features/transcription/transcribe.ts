import { UserFacingError } from "../../lib/errors";

export interface TranscriptResult {
  text: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

type Transcriber = (
  input: string,
  options: Record<string, unknown>,
) => Promise<{ text?: string } | Array<{ text?: string }>>;

let cachedTranscriber: Promise<Transcriber> | null = null;

async function getTranscriber(): Promise<Transcriber> {
  cachedTranscriber ??= import("@huggingface/transformers").then(async (module) => {
    module.env.allowLocalModels = false;
    module.env.useBrowserCache = true;
    const pipeline = await module.pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-tiny.en",
      {
        dtype: "q8",
        device: "wasm",
      },
    );
    return pipeline as unknown as Transcriber;
  });

  return cachedTranscriber;
}

function assessTranscript(text: string): Pick<TranscriptResult, "confidence" | "warnings"> {
  const normalized = text.trim();
  if (normalized === "" || normalized === "No speech detected.") {
    return {
      confidence: "low",
      warnings: ["Review transcript; no speech was confidently detected."],
    };
  }
  if (normalized.length < 40) {
    return {
      confidence: "medium",
      warnings: ["Short transcript; verify that the microphone captured the important parts."],
    };
  }
  return { confidence: "high", warnings: [] };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Transcription cancelled.", "AbortError");
}

export async function transcribeRecording(
  blob: Blob,
  signal?: AbortSignal,
  onProgress?: (label: string, progress: number | null) => void,
): Promise<TranscriptResult> {
  const url = URL.createObjectURL(blob);
  try {
    throwIfAborted(signal);
    onProgress?.("Loading Whisper", 0.05);
    const transcriber = await getTranscriber();
    throwIfAborted(signal);
    onProgress?.("Transcribing audio", 0.35);
    const result = await transcriber(url, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });
    throwIfAborted(signal);

    const text = Array.isArray(result)
      ? result.map((item) => item.text ?? "").join(" ")
      : (result.text ?? "");
    const normalizedText = text.trim() || "No speech detected.";
    const assessment = assessTranscript(normalizedText);

    onProgress?.("Transcript ready", 1);
    return { text: normalizedText, ...assessment };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserFacingError("Transcription cancelled. Your recording is still saved locally.");
    }
    throw new UserFacingError(
      error instanceof Error ? `Transcription failed: ${error.message}` : "Transcription failed.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
