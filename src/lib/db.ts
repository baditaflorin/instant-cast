import Dexie, { type Table } from "dexie";

export interface RecordingRecord {
  id: string;
  name: string;
  createdAt: string;
  durationSeconds: number;
  clearBytes: number;
  contentType: string;
  transcript: string;
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

export async function saveRecording(recording: RecordingRecord): Promise<void> {
  await db.recordings.put(recording);
}
