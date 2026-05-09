export type RecorderState = "idle" | "requesting" | "recording" | "stopping";

export interface RecorderOptions {
  includeCamera: boolean;
  includeMicrophone: boolean;
  frameRate: number;
  webcamCorner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface RecordingResult {
  id: string;
  blob: Blob;
  objectUrl: string;
  contentType: string;
  durationSeconds: number;
  createdAt: string;
  captureMode: "screen-camera-mic" | "screen-camera" | "screen-mic" | "screen-only";
  warnings: string[];
}
