// @vitest-environment node
import { describe, expect, it } from "vitest";
import { exportStudioState, importStudioState, serializeStudioState } from "./studioState";
import type { RecordingRecord } from "../../lib/db";

describe("studio state export/import", () => {
  it("round-trips a recording draft", async () => {
    const record: RecordingRecord = {
      id: "draft-1",
      name: "draft.webm",
      createdAt: "2026-05-09T12:00:00.000Z",
      durationSeconds: 12,
      clearBytes: 5,
      contentType: "video/webm",
      captureMode: "screen-camera-mic",
      transcript: "hello",
      transcriptConfidence: "high",
      warnings: ["none"],
      blob: new Blob(["hello"], { type: "video/webm" }),
    };

    const state = await exportStudioState(record);
    const imported = importStudioState(serializeStudioState(state));

    expect(imported.id).toBe(record.id);
    expect(imported.captureMode).toBe("screen-camera-mic");
    expect(imported.transcriptConfidence).toBe("high");
    expect(await imported.blob.text()).toBe("hello");
  });
});
