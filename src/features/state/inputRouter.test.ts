import { describe, expect, it } from "vitest";
import { routeTextInput } from "./inputRouter";

describe("input router", () => {
  it("detects exported state JSON", () => {
    const routed = routeTextInput(
      JSON.stringify({
        schemaVersion: 1,
        appVersion: "0.3.0",
        exportedAt: "2026-05-09T12:00:00.000Z",
        recording: {
          id: "draft-2",
          name: "draft.webm",
          createdAt: "2026-05-09T12:00:00.000Z",
          durationSeconds: 4,
          clearBytes: 5,
          contentType: "video/webm",
          captureMode: "screen-only",
          transcript: "state text",
          transcriptConfidence: "medium",
          warnings: [],
          dataBase64: btoa("hello"),
        },
      }),
    );
    expect(routed.kind).toBe("state");
    if (routed.kind === "state") expect(routed.record.transcript).toBe("state text");
  });

  it("detects Instant Cast share URLs", () => {
    const routed = routeTextInput(
      "https://baditaflorin.github.io/instant-cast/watch/token-1#key=abc&api=https%3A%2F%2Fapi.example.com",
    );
    expect(routed.kind).toBe("share-url");
    if (routed.kind === "share-url") {
      expect(routed.share.token).toBe("token-1");
      expect(routed.share.passphrase).toBe("abc");
    }
  });

  it("rejects unsupported external URLs honestly", () => {
    const routed = routeTextInput("https://example.com/video");
    expect(routed.kind).toBe("unsupported");
    expect(routed.message).toContain("External pages");
  });
});
