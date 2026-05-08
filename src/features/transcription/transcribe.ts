import { UserFacingError } from "../../lib/errors";

export interface TranscriptResult {
  text: string;
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

export async function transcribeRecording(blob: Blob): Promise<TranscriptResult> {
  const url = URL.createObjectURL(blob);
  try {
    const transcriber = await getTranscriber();
    const result = await transcriber(url, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    const text = Array.isArray(result)
      ? result.map((item) => item.text ?? "").join(" ")
      : (result.text ?? "");

    return { text: text.trim() || "No speech detected." };
  } catch (error) {
    throw new UserFacingError(
      error instanceof Error ? `Transcription failed: ${error.message}` : "Transcription failed.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
