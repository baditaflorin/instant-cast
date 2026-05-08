import { useEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Check,
  Copy,
  Download,
  Github,
  Heart,
  Link,
  Mic,
  MonitorUp,
  ScanFace,
  Share2,
  Square,
  Video,
  Wand2,
} from "lucide-react";
import { appConfig } from "../../app/config";
import { getApiBaseUrl, setApiBaseUrl, uploadEncryptedRecording } from "../../api/client";
import { IconButton } from "../../components/IconButton";
import { StatusPill } from "../../components/StatusPill";
import { Toast } from "../../components/Toast";
import { downloadBlob } from "../../lib/download";
import { saveRecording } from "../../lib/db";
import { formatBytes, formatDuration } from "../../lib/time";
import { toErrorMessage } from "../../lib/errors";
import { encryptBlobWithAge } from "../encryption/ageCrypto";
import { remuxRecording } from "../media-processing/ffmpeg";
import { detectFaceFrame } from "../media-processing/mediapipe";
import { buildSharePageUrl, copyToClipboard } from "../share/shareLinks";
import { transcribeRecording } from "../transcription/transcribe";
import { useRecorder } from "./useRecorder";
import type { RecorderOptions, RecordingResult } from "./types";

const ttlOptions = [
  { label: "1 day", value: 86_400 },
  { label: "7 days", value: 604_800 },
  { label: "30 days", value: 2_592_000 },
];

export function Studio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [options, setOptions] = useState<RecorderOptions>({
    includeCamera: true,
    includeMicrophone: true,
    frameRate: 30,
    webcamCorner: "bottom-right",
  });
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getApiBaseUrl());
  const [ttlSeconds, setTtlSeconds] = useState(604_800);
  const [toast, setToast] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const recorder = useRecorder(canvasRef);

  useEffect(() => {
    if (recorder.error) setToast(recorder.error);
  }, [recorder.error]);

  const status = useMemo(() => {
    if (recorder.state === "recording") return "Recording";
    if (recorder.state === "requesting") return "Waiting for permission";
    if (recorder.state === "stopping") return "Finalizing";
    if (busyLabel) return busyLabel;
    return recording ? "Ready to share" : "Ready";
  }, [busyLabel, recorder.state, recording]);

  async function handleStop() {
    const result = await recorder.stop();
    if (!result) return;
    setRecording(result);
    setTranscript("");
    setShareUrl("");
    await saveRecording({
      id: result.id,
      name: `instant-cast-${result.id.slice(0, 8)}.webm`,
      createdAt: result.createdAt,
      durationSeconds: result.durationSeconds,
      clearBytes: result.blob.size,
      contentType: result.contentType,
      transcript: "",
      blob: result.blob,
    });
    void runTranscription(result.blob);
  }

  async function runTranscription(blob: Blob) {
    setBusyLabel("Transcribing");
    try {
      const result = await transcribeRecording(blob);
      setTranscript(result.text);
      setToast("Transcript ready");
    } catch (error) {
      setToast(toErrorMessage(error));
    } finally {
      setBusyLabel(null);
    }
  }

  async function optimizeRecording() {
    if (!recording) return;
    setBusyLabel("Optimizing");
    try {
      const optimized = await remuxRecording(recording.blob);
      URL.revokeObjectURL(recording.objectUrl);
      setRecording({
        ...recording,
        blob: optimized,
        objectUrl: URL.createObjectURL(optimized),
        contentType: optimized.type || "video/webm",
      });
      setToast("Export optimized");
    } catch (error) {
      setToast(toErrorMessage(error));
    } finally {
      setBusyLabel(null);
    }
  }

  async function shareRecording() {
    if (!recording) return;
    setBusyLabel("Encrypting");
    try {
      setApiBaseUrl(apiBaseUrl);
      const encrypted = await encryptBlobWithAge(recording.blob);
      setBusyLabel("Uploading");
      const upload = await uploadEncryptedRecording(
        encrypted.encryptedBlob,
        {
          filename: `instant-cast-${recording.id.slice(0, 8)}.webm`,
          clearContentType: recording.contentType,
          encryptedBytes: encrypted.encryptedBytes,
          clearBytes: recording.blob.size,
          durationSeconds: recording.durationSeconds,
          transcript,
          ttlSeconds,
        },
        apiBaseUrl,
      );
      const url = buildSharePageUrl(upload.token, encrypted.passphrase, apiBaseUrl);
      setShareUrl(url);
      await copyToClipboard(url);
      setToast("Encrypted share link copied");
    } catch (error) {
      setToast(toErrorMessage(error));
    } finally {
      setBusyLabel(null);
    }
  }

  async function calibrateCamera() {
    setBusyLabel("Calibrating");
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error("Camera preview timed out.")),
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
      const frame = await detectFaceFrame(video);
      setToast(frame ? "MediaPipe face frame ready" : "No face detected");
    } catch (error) {
      setToast(toErrorMessage(error));
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setBusyLabel(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex w-[min(1260px,calc(100vw-32px))] flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Instant Cast</h1>
          <p className="text-xs font-semibold text-ink/60">
            Version {appConfig.version} · Commit {appConfig.commit.slice(0, 12)}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Project links">
          <a
            href={appConfig.repoUrl}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-ink ring-1 ring-black/10 transition hover:bg-black/[0.04]"
          >
            <Github size={17} aria-hidden="true" />
            Star on GitHub
          </a>
          <a
            href={appConfig.paypalUrl}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-coral px-3 text-sm font-bold text-white transition hover:bg-[#bd4e36]"
          >
            <Heart size={17} aria-hidden="true" />
            PayPal
          </a>
        </nav>
      </header>

      <section className="mx-auto stage-grid w-[min(1260px,calc(100vw-32px))] gap-5 pb-10">
        <section className="rounded-md bg-[#111314] p-3 shadow-panel">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <StatusPill
              tone={recorder.state === "recording" ? "warn" : busyLabel ? "busy" : "ready"}
            >
              {status}
            </StatusPill>
            <span className="text-xs font-semibold text-white/60">
              {recording
                ? `${formatDuration(recording.durationSeconds)} · ${formatBytes(recording.blob.size)}`
                : "WebRTC preview"}
            </span>
          </div>
          <div className="aspect-video overflow-hidden rounded bg-black">
            {recording && recorder.state !== "recording" ? (
              <video src={recording.objectUrl} className="h-full w-full" controls playsInline />
            ) : (
              <canvas
                ref={canvasRef}
                className="h-full w-full object-contain"
                aria-label="Recording preview"
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {recorder.state === "recording" || recorder.state === "requesting" ? (
              <IconButton
                label="Stop"
                icon={<Square size={18} aria-hidden="true" />}
                tone="danger"
                disabled={recorder.state === "requesting"}
                onClick={handleStop}
              />
            ) : (
              <IconButton
                label="Record"
                icon={<MonitorUp size={18} aria-hidden="true" />}
                tone="primary"
                disabled={Boolean(busyLabel)}
                onClick={() => recorder.start(options)}
              />
            )}

            <IconButton
              label={options.includeCamera ? "Camera on" : "Camera off"}
              icon={
                options.includeCamera ? (
                  <Video size={18} aria-hidden="true" />
                ) : (
                  <Video size={18} aria-hidden="true" />
                )
              }
              onClick={() =>
                setOptions((current) => ({ ...current, includeCamera: !current.includeCamera }))
              }
            />
            <IconButton
              label={options.includeMicrophone ? "Mic on" : "Mic off"}
              icon={<Mic size={18} aria-hidden="true" />}
              onClick={() =>
                setOptions((current) => ({
                  ...current,
                  includeMicrophone: !current.includeMicrophone,
                }))
              }
            />
            <IconButton
              label="Calibrate"
              icon={<ScanFace size={18} aria-hidden="true" />}
              disabled={Boolean(busyLabel) || recorder.state === "recording"}
              onClick={calibrateCamera}
            />
            <select
              aria-label="Webcam corner"
              value={options.webcamCorner}
              onChange={(event) =>
                setOptions((current) => ({
                  ...current,
                  webcamCorner: event.target.value as RecorderOptions["webcamCorner"],
                }))
              }
              className="h-11 rounded-md border-0 bg-white px-3 text-sm font-bold text-ink ring-1 ring-black/10"
            >
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="top-right">Top right</option>
              <option value="top-left">Top left</option>
            </select>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <section className="rounded-md bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black">Transcript</h2>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              className="mt-3 min-h-36 w-full resize-y rounded-md border-0 bg-paper p-3 text-sm leading-6 ring-1 ring-black/10"
              aria-label="Transcript"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <IconButton
                label="Transcribe"
                icon={<Captions size={18} aria-hidden="true" />}
                disabled={!recording || Boolean(busyLabel)}
                onClick={() => recording && runTranscription(recording.blob)}
              />
              <IconButton
                label="Optimize"
                icon={<Wand2 size={18} aria-hidden="true" />}
                disabled={!recording || Boolean(busyLabel)}
                onClick={optimizeRecording}
              />
              <IconButton
                label="Download"
                icon={<Download size={18} aria-hidden="true" />}
                disabled={!recording}
                onClick={() =>
                  recording &&
                  downloadBlob(recording.blob, `instant-cast-${recording.id.slice(0, 8)}.webm`)
                }
              />
            </div>
          </section>

          <section className="rounded-md bg-white p-5 shadow-panel">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Link size={18} aria-hidden="true" />
              Share
            </h2>
            <label className="mt-3 block text-xs font-black uppercase tracking-normal text-ink/60">
              API endpoint
              <input
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrlState(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border-0 bg-paper px-3 text-sm normal-case ring-1 ring-black/10"
              />
            </label>
            <label className="mt-3 block text-xs font-black uppercase tracking-normal text-ink/60">
              Expiry
              <select
                value={ttlSeconds}
                onChange={(event) => setTtlSeconds(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-md border-0 bg-paper px-3 text-sm normal-case ring-1 ring-black/10"
              >
                {ttlOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <IconButton
              label="Share"
              icon={<Share2 size={18} aria-hidden="true" />}
              tone="primary"
              disabled={!recording || Boolean(busyLabel)}
              onClick={shareRecording}
              className="mt-4 w-full"
            />
            {shareUrl ? (
              <div className="mt-4 rounded-md bg-paper p-3">
                <div className="flex items-center justify-between gap-2">
                  <Check size={18} className="text-fern" aria-hidden="true" />
                  <IconButton
                    label="Copy"
                    icon={<Copy size={18} aria-hidden="true" />}
                    onClick={() => copyToClipboard(shareUrl).then(() => setToast("Link copied"))}
                  />
                </div>
                <p className="mt-2 break-all text-xs font-semibold leading-5 text-ink/70">
                  {shareUrl}
                </p>
              </div>
            ) : null}
          </section>
        </aside>
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
