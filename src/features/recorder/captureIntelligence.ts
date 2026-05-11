import { z } from "zod";

export type Confidence = "high" | "medium" | "low";
export type DeviceAvailability = "available" | "denied" | "missing" | "ended" | "unknown";
export type SizeRisk = "low" | "medium" | "high" | "critical";
export type CaptureMode = "screen-camera-mic" | "screen-camera" | "screen-mic" | "screen-only";

export const captureScenarioSchema = z.object({
  id: z.string(),
  screen: z.enum(["available", "denied", "missing", "ended", "unknown"]),
  camera: z.enum(["available", "denied", "missing", "ended", "unknown"]),
  microphone: z.enum(["available", "denied", "missing", "ended", "unknown"]),
  durationSeconds: z.number().min(0),
  width: z.number().min(0),
  height: z.number().min(0),
  speech: z.enum(["clear", "silent", "noisy", "unknown"]),
  apiBaseUrl: z.string().optional(),
  pageOrigin: z.string().optional(),
  hasDraft: z.boolean().optional(),
  maxUploadBytes: z.number().optional(),
  shareProblem: z.enum(["missing-key", "expired", "mismatch"]).optional(),
});

export type CaptureScenario = z.infer<typeof captureScenarioSchema>;

export interface CapturePlan {
  canRecord: boolean;
  captureMode: CaptureMode;
  confidence: Confidence;
  sizeRisk: SizeRisk;
  eventOutcome: "normal" | "auto-finalize";
  restoreAction: "none" | "offer-restore";
  transcriptConfidence: Confidence;
  shareRecovery: "none" | "ask-for-original-link" | "retry-backend" | "download-locally";
  warnings: string[];
  nextAction: string;
}

export function estimateSizeRisk(
  scenario: Pick<CaptureScenario, "durationSeconds" | "width" | "height">,
): SizeRisk {
  const pixels = scenario.width * scenario.height;
  const pixelSeconds = pixels * scenario.durationSeconds;
  if (pixelSeconds > 12_000_000_000) return "critical";
  if (pixelSeconds > 4_000_000_000) return "high";
  if (pixelSeconds > 900_000_000) return "medium";
  return "low";
}

export function inferTranscriptConfidence(
  speech: CaptureScenario["speech"],
  transcriptText = "",
): Confidence {
  if (speech === "noisy" || transcriptText === "No speech detected.") return "low";
  if (speech === "silent" || transcriptText.trim().length < 20) return "low";
  if (speech === "unknown") return "medium";
  return "high";
}

export function planCapture(input: unknown): CapturePlan {
  const scenario = captureScenarioSchema.parse(input);
  const warnings: string[] = [];
  const screenUsable = scenario.screen === "available" || scenario.screen === "ended";
  const cameraUsable = scenario.camera === "available";
  const microphoneUsable = scenario.microphone === "available";

  if (!screenUsable) {
    return {
      canRecord: false,
      captureMode: "screen-only",
      confidence: "low",
      sizeRisk: "low",
      eventOutcome: "normal",
      restoreAction: scenario.hasDraft ? "offer-restore" : "none",
      transcriptConfidence: "low",
      shareRecovery: "download-locally",
      warnings: ["Screen capture is required before Instant Cast can record."],
      nextAction: "Grant screen sharing or restore a previous draft.",
    };
  }

  if (!cameraUsable && scenario.camera !== "unknown") {
    warnings.push("Camera was skipped; screen recording can continue.");
  }
  if (!microphoneUsable && scenario.microphone !== "unknown") {
    warnings.push("Microphone was skipped; recording can continue without voice.");
  }

  const captureMode: CaptureMode =
    cameraUsable && microphoneUsable
      ? "screen-camera-mic"
      : cameraUsable
        ? "screen-camera"
        : microphoneUsable
          ? "screen-mic"
          : "screen-only";

  const sizeRisk = estimateSizeRisk(scenario);
  if (sizeRisk === "high") {
    warnings.push("Large recording: show progress and keep local download as a fallback.");
  }
  if (sizeRisk === "critical") {
    warnings.push("Critical recording size: download locally or shorten it before hosted sharing.");
  }

  const transcriptConfidence = inferTranscriptConfidence(scenario.speech);
  if (transcriptConfidence === "low") {
    warnings.push("Review transcript; audio evidence is weak or noisy.");
  }

  if (scenario.hasDraft) {
    warnings.push("A local draft is available after refresh.");
  }

  if (
    scenario.apiBaseUrl?.includes("localhost") &&
    scenario.pageOrigin?.startsWith("https://") &&
    !scenario.pageOrigin.includes("localhost")
  ) {
    warnings.push(
      "The public site cannot share to localhost; use local download or a hosted backend.",
    );
  }

  let shareRecovery: CapturePlan["shareRecovery"] = "none";
  // The schema declares three shareProblem values — all of them used to be
  // routed by sharePreflight or the watch page, but only "missing-key" was
  // actually handled here. "expired" and "mismatch" silently dropped to
  // shareRecovery: "none", which is the same answer Instant Cast gives a
  // perfectly healthy link, leaving the user with no remediation path.
  if (scenario.shareProblem === "missing-key") {
    shareRecovery = "ask-for-original-link";
    warnings.push("The share link is missing the decryption key.");
  } else if (scenario.shareProblem === "expired") {
    // The token is gone server-side. Re-uploading is the only path; we
    // route to retry-backend so the UI nudges the user to re-encrypt and
    // re-upload, then warn so the watch page knows to display "expired"
    // rather than the generic "missing key" copy.
    shareRecovery = "retry-backend";
    warnings.push(
      "The share link has expired; re-upload the encrypted recording to mint a new token.",
    );
  } else if (scenario.shareProblem === "mismatch") {
    // The passphrase fragment doesn't decrypt the bytes the backend has —
    // either the link was edited or the encryption regenerated. Asking
    // for the original link is the safest action; downloading what's on
    // the backend would just produce undecryptable bytes.
    shareRecovery = "ask-for-original-link";
    warnings.push(
      "The decryption key in the URL doesn't match the uploaded recording; ask for the original link.",
    );
  } else if (sizeRisk === "critical") {
    shareRecovery = "download-locally";
  }

  return {
    canRecord: true,
    captureMode,
    confidence: captureMode === "screen-camera-mic" ? "high" : "medium",
    sizeRisk,
    eventOutcome: scenario.screen === "ended" ? "auto-finalize" : "normal",
    restoreAction: scenario.hasDraft ? "offer-restore" : "none",
    transcriptConfidence,
    shareRecovery,
    warnings,
    nextAction:
      warnings.length > 0
        ? "Continue with the best available capture mode and review warnings."
        : "Start recording.",
  };
}
