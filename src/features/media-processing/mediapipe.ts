import { UserFacingError } from "../../lib/errors";

export interface FaceFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

let detectorPromise: Promise<import("@mediapipe/tasks-vision").FaceDetector> | null = null;

async function getFaceDetector(): Promise<import("@mediapipe/tasks-vision").FaceDetector> {
  detectorPromise ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
    );
    return FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });
  })();

  return detectorPromise;
}

export async function detectFaceFrame(video: HTMLVideoElement): Promise<FaceFrame | null> {
  try {
    const detector = await getFaceDetector();
    const result = detector.detectForVideo(video, performance.now());
    const first = result.detections[0]?.boundingBox;
    if (!first) return null;
    return {
      x: first.originX ?? 0,
      y: first.originY ?? 0,
      width: first.width ?? 0,
      height: first.height ?? 0,
    };
  } catch (error) {
    throw new UserFacingError(
      error instanceof Error ? `MediaPipe failed: ${error.message}` : "MediaPipe failed.",
    );
  }
}
