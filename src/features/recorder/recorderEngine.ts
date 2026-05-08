import { UserFacingError } from "../../lib/errors";
import { chooseSupportedMimeType } from "./mime";
import type { RecorderOptions, RecordingResult } from "./types";

interface ActiveRecording {
  stop: () => Promise<RecordingResult>;
}

function createVideoElement(stream: MediaStream): HTMLVideoElement {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  return video;
}

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Video stream did not start.")),
      10_000,
    );
    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      video
        .play()
        .then(() => resolve())
        .catch(reject);
    };
  });
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function drawWebcam(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  corner: RecorderOptions["webcamCorner"],
): void {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

  const insetWidth = Math.max(180, canvas.width * 0.22);
  const insetHeight = insetWidth * (9 / 16);
  const margin = Math.max(18, canvas.width * 0.018);
  const x = corner.endsWith("right") ? canvas.width - insetWidth - margin : margin;
  const y = corner.startsWith("bottom") ? canvas.height - insetHeight - margin : margin;

  context.save();
  context.fillStyle = "rgba(32, 33, 36, 0.22)";
  context.fillRect(x - 8, y - 8, insetWidth + 16, insetHeight + 16);
  context.drawImage(video, x, y, insetWidth, insetHeight);
  context.restore();
}

export async function startCanvasRecording(
  canvas: HTMLCanvasElement,
  options: RecorderOptions,
): Promise<ActiveRecording> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new UserFacingError("This browser does not support screen capture.");
  }

  if (!("MediaRecorder" in window)) {
    throw new UserFacingError("This browser does not support MediaRecorder.");
  }

  const context = canvas.getContext("2d");
  if (!context) throw new UserFacingError("Canvas recording is not available.");

  let screenStream: MediaStream | null = null;
  let userStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let animationFrame = 0;

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: options.frameRate },
      audio: true,
    });

    if (options.includeCamera || options.includeMicrophone) {
      userStream = await navigator.mediaDevices.getUserMedia({
        video: options.includeCamera ? { width: 1280, height: 720 } : false,
        audio: options.includeMicrophone,
      });
    }

    const screenVideo = createVideoElement(screenStream);
    const cameraVideo =
      userStream && options.includeCamera && userStream.getVideoTracks().length > 0
        ? createVideoElement(userStream)
        : null;

    await waitForVideo(screenVideo);
    if (cameraVideo) await waitForVideo(cameraVideo);

    const screenSettings = screenStream.getVideoTracks()[0]?.getSettings();
    canvas.width = screenSettings.width ?? screenVideo.videoWidth ?? 1280;
    canvas.height = screenSettings.height ?? screenVideo.videoHeight ?? 720;

    const render = () => {
      context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
      if (cameraVideo) drawWebcam(context, cameraVideo, canvas, options.webcamCorner);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    const canvasStream = canvas.captureStream(options.frameRate);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    const audioTracks = [...screenStream.getAudioTracks(), ...(userStream?.getAudioTracks() ?? [])];

    if (audioTracks.length > 0) {
      audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      audioTracks.forEach((track) => {
        const source = audioContext?.createMediaStreamSource(new MediaStream([track]));
        source?.connect(destination);
      });
      tracks.push(...destination.stream.getAudioTracks());
    }

    const mixedStream = new MediaStream(tracks);
    const chunks: BlobPart[] = [];
    const mimeType = chooseSupportedMimeType();
    const recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined);
    const startedAt = performance.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const stopped = new Promise<RecordingResult>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("Recording failed."));
      recorder.onstop = () => {
        const contentType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunks, { type: contentType });
        resolve({
          id: randomId(),
          blob,
          objectUrl: URL.createObjectURL(blob),
          contentType,
          durationSeconds: (performance.now() - startedAt) / 1000,
          createdAt: new Date().toISOString(),
        });
      };
    });

    screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
      if (recorder.state === "recording") recorder.stop();
    });

    recorder.start(1000);

    return {
      stop: async () => {
        if (recorder.state === "recording") recorder.stop();
        const result = await stopped;
        cancelAnimationFrame(animationFrame);
        mixedStream.getTracks().forEach((track) => track.stop());
        stopStream(screenStream);
        stopStream(userStream);
        await audioContext?.close();
        return result;
      },
    };
  } catch (error) {
    cancelAnimationFrame(animationFrame);
    stopStream(screenStream);
    stopStream(userStream);
    await audioContext?.close();
    throw error;
  }
}
