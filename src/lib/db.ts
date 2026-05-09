import Dexie, { type Table } from "dexie";
import type { RecordingResult } from "../features/recorder/types";

export interface RecordingRecord {
  id: string;
  name: string;
  createdAt: string;
  durationSeconds: number;
  clearBytes: number;
  contentType: string;
  captureMode: RecordingResult["captureMode"];
  transcript: string;
  transcriptConfidence: "high" | "medium" | "low";
  warnings: string[];
  blob: Blob;
}

class InstantCastDatabase extends Dexie {
  recordings!: Table<RecordingRecord, string>;

  constructor() {
    super("instant-cast");
    this.version(1).stores({
      recordings: "id, createdAt, name",
    });
  }
}

export const db = new InstantCastDatabase();

function normalizeRecording(recording: RecordingRecord): RecordingRecord {
  return {
    ...recording,
    captureMode: recording.captureMode ?? "screen-only",
    transcriptConfidence: recording.transcriptConfidence ?? "medium",
    warnings: recording.warnings ?? [],
  };
}

export async function saveRecording(recording: RecordingRecord): Promise<void> {
  await db.recordings.put(normalizeRecording(recording));
}

export async function getLatestRecording(): Promise<RecordingRecord | null> {
  const latest = await db.recordings.orderBy("createdAt").reverse().first();
  return latest ? normalizeRecording(latest) : null;
}

export async function deleteRecording(id: string): Promise<void> {
  await db.recordings.delete(id);
}

export async function clearRecordings(): Promise<void> {
  await db.recordings.clear();
}
