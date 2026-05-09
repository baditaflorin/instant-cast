import { z } from "zod";
import { appConfig } from "../../app/config";
import type { RecordingRecord } from "../../lib/db";

const stateSchema = z.object({
  schemaVersion: z.literal(1),
  appVersion: z.string(),
  exportedAt: z.string(),
  recording: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.string(),
    durationSeconds: z.number(),
    clearBytes: z.number(),
    contentType: z.string(),
    captureMode: z
      .enum(["screen-camera-mic", "screen-camera", "screen-mic", "screen-only"])
      .default("screen-only"),
    transcript: z.string(),
    transcriptConfidence: z.enum(["high", "medium", "low"]).optional(),
    warnings: z.array(z.string()).default([]),
    dataBase64: z.string(),
  }),
});

export type StudioStateFile = z.infer<typeof stateSchema>;

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: contentType });
}

export async function exportStudioState(recording: RecordingRecord): Promise<StudioStateFile> {
  return {
    schemaVersion: 1,
    appVersion: appConfig.version,
    exportedAt: new Date().toISOString(),
    recording: {
      id: recording.id,
      name: recording.name,
      createdAt: recording.createdAt,
      durationSeconds: recording.durationSeconds,
      clearBytes: recording.clearBytes,
      contentType: recording.contentType,
      captureMode: recording.captureMode,
      transcript: recording.transcript,
      transcriptConfidence: recording.transcriptConfidence,
      warnings: recording.warnings,
      dataBase64: await blobToBase64(recording.blob),
    },
  };
}

export function serializeStudioState(state: StudioStateFile): string {
  return JSON.stringify(stateSchema.parse(state), null, 2);
}

export function importStudioState(json: string): RecordingRecord {
  const state = stateSchema.parse(JSON.parse(json));
  return {
    id: state.recording.id,
    name: state.recording.name,
    createdAt: state.recording.createdAt,
    durationSeconds: state.recording.durationSeconds,
    clearBytes: state.recording.clearBytes,
    contentType: state.recording.contentType,
    captureMode: state.recording.captureMode,
    transcript: state.recording.transcript,
    transcriptConfidence: state.recording.transcriptConfidence ?? "medium",
    warnings: state.recording.warnings,
    blob: base64ToBlob(state.recording.dataBase64, state.recording.contentType),
  };
}
