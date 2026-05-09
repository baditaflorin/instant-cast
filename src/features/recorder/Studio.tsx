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
  RotateCcw,
  ScanFace,
  Share2,
  Square,
  Trash2,
  Upload,
  Video,
  Wand2,
} from "lucide-react";
import { appConfig } from "../../app/config";
import { loadSettings, saveSettings, settingsToRecorderOptions } from "../../app/settings";
import { setApiBaseUrl, uploadEncryptedRecording } from "../../api/client";
import { IconButton } from "../../components/IconButton";
import { StatusPill } from "../../components/StatusPill";
import { Toast } from "../../components/Toast";
import {
  cancelOperation,
  idleOperation,
  startOperation,
  updateOperation,
} from "../operations/operationState";
import { classifyError, formatActionableError } from "../../lib/actionableErrors";
import {
  clearRecordings,
  getLatestRecording,
  saveRecording,
  type RecordingRecord,
} from "../../lib/db";
import { downloadBlob } from "../../lib/download";
import { formatBytes, formatDuration } from "../../lib/time";
import { encryptBlobWithAge } from "../encryption/ageCrypto";
import { remuxRecording } from "../media-processing/ffmpeg";
import { detectFaceFrame } from "../media-processing/mediapipe";
import { buildSharePageUrl, copyToClipboard } from "../share/shareLinks";
import { preflightShareEndpoint } from "../share/sharePreflight";
import { exportStudioState, importStudioState, serializeStudioState } from "../state/studioState";
import { transcribeRecording } from "../transcription/transcribe";
import { useRecorder } from "./useRecorder";
import type { RecordingResult } from "./types";

const ttlOptions = [
  { label: "1 day", value: 86_400 },
  { label: "7 days", value: 604_800 },
  { label: "30 days", value: 2_592_000 },
];

function toRecordingRecord(
  recording: RecordingResult,
  transcript: string,
  transcriptConfidence: RecordingRecord["transcriptConfidence"],
  warnings: string[],
): RecordingRecord {
  return {
    id: recording.id,
    name: `instant-cast-${recording.id.slice(0, 8)}.webm`,
    createdAt: recording.createdAt,
    durationSeconds: recording.durationSeconds,
    clearBytes: recording.blob.size,
    contentType: recording.contentType,
    transcript,
    transcriptConfidence,
    warnings,
    blob: recording.blob,
    captureMode: recording.captureMode,
  };
}

function fromRecordingRecord(record: RecordingRecord): RecordingResult {
  return {
    id: record.id,
    blob: record.blob,
    objectUrl: URL.createObjectURL(record.blob),
    contentType: record.contentType,
    durationSeconds: record.durationSeconds,
    createdAt: record.createdAt,
    captureMode: record.captureMode,
    warnings: record.warnings,
  };
}

export function Studio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [settings, setSettings] = useState(() => loadSettings(appConfig.defaultApiBaseUrl));
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptConfidence, setTranscriptConfidence] =
    useState<RecordingRecord["transcriptConfidence"]>("medium");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [operation, setOperation] = useState(idleOperation);
  const [debugEnabled] = useState(
    () => new URLSearchParams(window.location.search).get("debug") === "1",
  );
  const recorder = useRecorder(canvasRef);

  const options = useMemo(() => settingsToRecorderOptions(settings), [settings]);
  const isBusy = operation.status === "running";

  useEffect(() => {
    saveSettings(settings);
    setApiBaseUrl(settings.apiBaseUrl);
  }, [settings]);

  useEffect(() => {
    if (recorder.error) setToast(formatActionableError(classifyError(recorder.error)));
  }, [recorder.error]);

  useEffect(() => {
    getLatestRecording()
      .then((latest) => {
        if (!latest || recording) return;
        setRecording(fromRecordingRecord(latest));
        setTranscript(latest.transcript);
        setTranscriptConfidence(latest.transcriptConfidence);
        setWarnings(latest.warnings);
        setToast("Restored your last local draft.");
      })
      .catch(() => setToast("Local draft restore failed. You can still start a new recording."));
  }, [recording]);

  const status = useMemo(() => {
    if (recorder.state === "recording") return "Recording";
    if (recorder.state === "requesting") return "Waiting for permission";
    if (recorder.state === "stopping") return "Finalizing";
    if (isBusy) return operation.label;
    return recording ? "Ready to share" : "Ready";
  }, [isBusy, operation.label, recorder.state, recording]);

  function updateSetting<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function persistCurrent(
    nextRecording = recording,
    nextTranscript = transcript,
    nextConfidence = transcriptConfidence,
    nextWarnings = warnings,
  ) {
    if (!nextRecording) return;
    await saveRecording(
      toRecordingRecord(nextRecording, nextTranscript, nextConfidence, nextWarnings),
    );
  }

  async function acceptRecording(result: RecordingResult, autoStopped = false) {
    const nextWarnings = [...result.warnings];
    if (autoStopped)
      nextWarnings.push("Browser sharing stopped; recording was finalized automatically.");
    setRecording(result);
    setTranscript("");
    setTranscriptConfidence("medium");
    setWarnings(nextWarnings);
    setShareUrl("");
    await saveRecording(toRecordingRecord(result, "", "medium", nextWarnings));
    if (settings.autoTranscribe) void runTranscription(result.blob, result, nextWarnings);
  }

  async function handleStop() {
    const result = await recorder.stop();
    if (result) await acceptRecording(result);
  }

  async function runTranscription(
    blob: Blob,
    sourceRecording = recording,
    sourceWarnings = warnings,
  ) {
    const controller = new AbortController();
    abortRef.current = controller;
    setOperation(startOperation("transcribe", "Loading Whisper", true));
    try {
      const result = await transcribeRecording(blob, controller.signal, (label, progress) => {
        setOperation((current) => updateOperation(current, label, progress));
      });
      const nextWarnings = [...new Set([...sourceWarnings, ...result.warnings])];
      setTranscript(result.text);
      setTranscriptConfidence(result.confidence);
      setWarnings(nextWarnings);
      await persistCurrent(sourceRecording, result.text, result.confidence, nextWarnings);
      setToast(`Transcript ready (${result.confidence} confidence).`);
    } catch (error) {
      setToast(formatActionableError(classifyError(error)));
    } finally {
      abortRef.current = null;
      setOperation(idleOperation);
    }
  }

  async function optimizeRecording() {
    if (!recording) return;
    setOperation(startOperation("optimize", "Optimizing export", true));
    try {
      const optimized = await remuxRecording(recording.blob);
      if (operation.status === "cancelled") return;
      URL.revokeObjectURL(recording.objectUrl);
      const nextRecording = {
        ...recording,
        blob: optimized,
        objectUrl: URL.createObjectURL(optimized),
        contentType: optimized.type || "video/webm",
      };
      setRecording(nextRecording);
      await persistCurrent(nextRecording);
      setToast("Export optimized.");
    } catch (error) {
      setToast(formatActionableError(classifyError(error)));
    } finally {
      setOperation(idleOperation);
    }
  }

  async function shareRecording() {
    if (!recording) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setOperation(startOperation("share", "Checking backend", true));
    try {
      const preflight = await preflightShareEndpoint(settings.apiBaseUrl, controller.signal);
      if (preflight.status !== "ok")
        throw new Error(`${preflight.message} ${preflight.nextAction}`);
      const encrypted = await encryptBlobWithAge(
        recording.blob,
        controller.signal,
        (label, progress) => {
          setOperation((current) => updateOperation(current, label, progress));
        },
      );
      setOperation((current) => updateOperation(current, "Uploading encrypted recording", 0.8));
      const upload = await uploadEncryptedRecording(
        encrypted.encryptedBlob,
        {
          filename: `instant-cast-${recording.id.slice(0, 8)}.webm`,
          clearContentType: recording.contentType,
          encryptedBytes: encrypted.encryptedBytes,
          clearBytes: recording.blob.size,
          durationSeconds: recording.durationSeconds,
          transcript,
          transcriptConfidence,
          warnings,
          captureMode: recording.captureMode,
          appVersion: appConfig.version,
          schemaVersion: 1,
          ttlSeconds: settings.ttlSeconds,
        },
        settings.apiBaseUrl,
        controller.signal,
      );
      const url = buildSharePageUrl(upload.token, encrypted.passphrase, settings.apiBaseUrl);
      setShareUrl(url);
      await copyToClipboard(url);
      setToast("Encrypted share link copied.");
    } catch (error) {
      setToast(formatActionableError(classifyError(error)));
    } finally {
      abortRef.current = null;
      setOperation(idleOperation);
    }
  }

  async function calibrateCamera() {
    setOperation(startOperation("calibrate", "Calibrating camera", true));
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
      setWarnings((current) => [
        ...new Set([
          ...current,
          frame
            ? "MediaPipe detected a face for webcam framing."
            : "No face detected in camera calibration.",
        ]),
      ]);
      setToast(
        frame
          ? "Face framing confidence available."
          : "No face detected; webcam overlay still works.",
      );
    } catch (error) {
      setToast(formatActionableError(classifyError(error)));
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setOperation(idleOperation);
    }
  }

  async function exportStateFile() {
    if (!recording) return;
    const state = await exportStudioState(
      toRecordingRecord(recording, transcript, transcriptConfidence, warnings),
    );
    downloadBlob(
      new Blob([serializeStudioState(state)], { type: "application/json" }),
      "instant-cast-state.json",
    );
  }

  async function importStateFile(file: File) {
    try {
      const record = importStudioState(await file.text());
      await saveRecording(record);
      setRecording(fromRecordingRecord(record));
      setTranscript(record.transcript);
      setTranscriptConfidence(record.transcriptConfidence);
      setWarnings(record.warnings);
      setShareUrl("");
      setToast("State file imported.");
    } catch (error) {
      setToast(formatActionableError(classifyError(error)));
    }
  }

  async function restoreLatestDraft() {
    const latest = await getLatestRecording();
    if (!latest) {
      setToast("No local draft to restore.");
      return;
    }
    setRecording(fromRecordingRecord(latest));
    setTranscript(latest.transcript);
    setTranscriptConfidence(latest.transcriptConfidence);
    setWarnings(latest.warnings);
    setToast("Restored local draft.");
  }

  async function startFresh() {
    await clearRecordings();
    if (recording) URL.revokeObjectURL(recording.objectUrl);
    setRecording(null);
    setTranscript("");
    setTranscriptConfidence("medium");
    setWarnings([]);
    setShareUrl("");
    setToast("Local drafts cleared.");
  }

  function cancelCurrentOperation() {
    abortRef.current?.abort();
    setOperation((current) => cancelOperation(current));
    setToast("Cancelled. Your local recording is still available.");
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
            <StatusPill tone={recorder.state === "recording" ? "warn" : isBusy ? "busy" : "ready"}>
              {status}
            </StatusPill>
            <span className="text-xs font-semibold text-white/60">
              {recording
                ? `${formatDuration(recording.durationSeconds)} · ${formatBytes(recording.blob.size)} · ${recording.captureMode}`
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

          {isBusy ? (
            <div className="mt-3 rounded-md bg-white/10 p-3 text-sm font-semibold text-white">
              <div className="flex items-center justify-between gap-3">
                <span>{operation.label}</span>
                {operation.cancellable ? (
                  <button
                    type="button"
                    onClick={cancelCurrentOperation}
                    className="rounded-md bg-white px-3 py-1 text-xs font-black text-ink"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              {operation.progress == null ? null : (
                <div className="mt-2 h-2 overflow-hidden rounded bg-white/20">
                  <div
                    className="h-full bg-sea"
                    style={{ width: `${operation.progress * 100}%` }}
                  />
                </div>
              )}
            </div>
          ) : null}

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
                disabled={isBusy}
                onClick={() => recorder.start(options, (result) => acceptRecording(result, true))}
              />
            )}

            <IconButton
              label={settings.includeCamera ? "Camera on" : "Camera off"}
              icon={<Video size={18} aria-hidden="true" />}
              onClick={() => updateSetting("includeCamera", !settings.includeCamera)}
            />
            <IconButton
              label={settings.includeMicrophone ? "Mic on" : "Mic off"}
              icon={<Mic size={18} aria-hidden="true" />}
              onClick={() => updateSetting("includeMicrophone", !settings.includeMicrophone)}
            />
            <IconButton
              label="Calibrate"
              icon={<ScanFace size={18} aria-hidden="true" />}
              disabled={isBusy || recorder.state === "recording"}
              onClick={calibrateCamera}
            />
            <select
              aria-label="Webcam corner"
              value={settings.webcamCorner}
              onChange={(event) =>
                updateSetting("webcamCorner", event.target.value as typeof settings.webcamCorner)
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black">Transcript</h2>
              <StatusPill
                tone={
                  transcriptConfidence === "high"
                    ? "ready"
                    : transcriptConfidence === "medium"
                      ? "busy"
                      : "warn"
                }
              >
                {`${transcriptConfidence} confidence`}
              </StatusPill>
            </div>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              onBlur={() => persistCurrent()}
              className="mt-3 min-h-36 w-full resize-y rounded-md border-0 bg-paper p-3 text-sm leading-6 ring-1 ring-black/10"
              aria-label="Transcript"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <IconButton
                label="Transcribe"
                icon={<Captions size={18} aria-hidden="true" />}
                disabled={!recording || isBusy}
                onClick={() => recording && runTranscription(recording.blob)}
              />
              <IconButton
                label="Optimize"
                icon={<Wand2 size={18} aria-hidden="true" />}
                disabled={!recording || isBusy}
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
              <IconButton
                label="Copy"
                icon={<Copy size={18} aria-hidden="true" />}
                disabled={!transcript}
                onClick={() =>
                  copyToClipboard(transcript).then(() => setToast("Transcript copied."))
                }
              />
            </div>
            {warnings.length > 0 ? (
              <ul className="mt-3 grid gap-1 text-xs font-semibold text-ink/65">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-md bg-white p-5 shadow-panel">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Link size={18} aria-hidden="true" />
              Share
            </h2>
            <label className="mt-3 block text-xs font-black uppercase tracking-normal text-ink/60">
              API endpoint
              <input
                value={settings.apiBaseUrl}
                onChange={(event) => updateSetting("apiBaseUrl", event.target.value)}
                className="mt-2 h-11 w-full rounded-md border-0 bg-paper px-3 text-sm normal-case ring-1 ring-black/10"
              />
            </label>
            <label className="mt-3 block text-xs font-black uppercase tracking-normal text-ink/60">
              Expiry
              <select
                value={settings.ttlSeconds}
                onChange={(event) => updateSetting("ttlSeconds", Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-md border-0 bg-paper px-3 text-sm normal-case ring-1 ring-black/10"
              >
                {ttlOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-ink/70">
              <input
                type="checkbox"
                checked={settings.autoTranscribe}
                onChange={(event) => updateSetting("autoTranscribe", event.target.checked)}
              />
              Auto-transcribe after recording
            </label>
            <IconButton
              label="Share"
              icon={<Share2 size={18} aria-hidden="true" />}
              tone="primary"
              disabled={!recording || isBusy}
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
                    onClick={() => copyToClipboard(shareUrl).then(() => setToast("Link copied."))}
                  />
                </div>
                <p className="mt-2 break-all text-xs font-semibold leading-5 text-ink/70">
                  {shareUrl}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-md bg-white p-5 shadow-panel">
            <h2 className="text-lg font-black">Local State</h2>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importStateFile(file);
                event.currentTarget.value = "";
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <IconButton
                label="Export state"
                icon={<Download size={18} aria-hidden="true" />}
                disabled={!recording}
                onClick={exportStateFile}
              />
              <IconButton
                label="Import state"
                icon={<Upload size={18} aria-hidden="true" />}
                onClick={() => importInputRef.current?.click()}
              />
              <IconButton
                label="Restore"
                icon={<RotateCcw size={18} aria-hidden="true" />}
                onClick={restoreLatestDraft}
              />
              <IconButton
                label="Clear"
                icon={<Trash2 size={18} aria-hidden="true" />}
                tone="danger"
                onClick={startFresh}
              />
            </div>
          </section>

          {debugEnabled ? (
            <section className="rounded-md bg-white p-5 shadow-panel">
              <h2 className="text-lg font-black">Debug</h2>
              <pre className="mt-3 overflow-auto rounded-md bg-paper p-3 text-xs">
                {JSON.stringify(
                  {
                    status,
                    operation,
                    settings,
                    transcriptConfidence,
                    warnings,
                    recording: recording && {
                      id: recording.id,
                      captureMode: recording.captureMode,
                      bytes: recording.blob.size,
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </section>
          ) : null}
        </aside>
      </section>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
