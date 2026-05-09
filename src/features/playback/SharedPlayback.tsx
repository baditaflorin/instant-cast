import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Github, Heart, LockKeyhole, RotateCw } from "lucide-react";
import { appConfig } from "../../app/config";
import { fetchEncryptedBlob, fetchShare, getApiBaseUrl } from "../../api/client";
import { IconButton } from "../../components/IconButton";
import { StatusPill } from "../../components/StatusPill";
import { decryptBlobWithAge } from "../encryption/ageCrypto";
import { downloadBlob } from "../../lib/download";
import { formatBytes } from "../../lib/time";
import { classifyError, formatActionableError } from "../../lib/actionableErrors";

interface SharedPlaybackProps {
  token: string;
  passphrase: string | null;
  apiBaseUrl: string | null;
}

export function SharedPlayback({ token, passphrase, apiBaseUrl }: SharedPlaybackProps) {
  const resolvedApiBaseUrl = getApiBaseUrl(apiBaseUrl);
  const [clearBlob, setClearBlob] = useState<Blob | null>(null);
  const [clearUrl, setClearUrl] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState("Loading");

  const shareQuery = useQuery({
    queryKey: ["share", token, resolvedApiBaseUrl],
    enabled: Boolean(passphrase),
    queryFn: () => fetchShare(token, resolvedApiBaseUrl),
  });

  useEffect(() => {
    if (!shareQuery.data || !passphrase) return;
    let cancelled = false;
    setDecryptError(null);
    setClearBlob(null);
    setClearUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    fetchEncryptedBlob(shareQuery.data.blobDownloadUrl)
      .then((encrypted) =>
        decryptBlobWithAge(
          encrypted,
          passphrase,
          shareQuery.data.metadata.clearContentType,
          undefined,
          (label) => setProgressLabel(label),
        ),
      )
      .then((blob) => {
        if (cancelled) return;
        setClearBlob(blob);
        setClearUrl(URL.createObjectURL(blob));
      })
      .catch((error: unknown) => {
        if (!cancelled) setDecryptError(formatActionableError(classifyError(error)));
      });

    return () => {
      cancelled = true;
    };
  }, [passphrase, shareQuery.data]);

  useEffect(() => {
    return () => {
      if (clearUrl) URL.revokeObjectURL(clearUrl);
    };
  }, [clearUrl]);

  const metadata = shareQuery.data?.metadata;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex w-[min(1180px,calc(100vw-32px))] flex-wrap items-center justify-between gap-3 py-5">
        <a href={appConfig.pagesUrl} className="text-xl font-black tracking-normal text-ink">
          Instant Cast
        </a>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Project links">
          <a
            href={appConfig.repoUrl}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-ink ring-1 ring-black/10"
          >
            <Github size={17} aria-hidden="true" />
            Star
          </a>
          <a
            href={appConfig.paypalUrl}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-coral px-3 text-sm font-bold text-white"
          >
            <Heart size={17} aria-hidden="true" />
            Support
          </a>
        </nav>
      </header>

      <section className="mx-auto grid w-[min(1180px,calc(100vw-32px))] gap-5 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={clearUrl ? "ready" : "busy"}>
            {clearUrl ? "Decrypted locally" : "Opening encrypted share"}
          </StatusPill>
          <span className="text-xs font-semibold text-ink/60">
            Version {appConfig.version} · Commit {appConfig.commit.slice(0, 12)}
          </span>
        </div>

        {!passphrase ? (
          <section className="rounded-md bg-white p-6 shadow-panel">
            <LockKeyhole className="text-coral" aria-hidden="true" />
            <h1 className="mt-4 text-3xl font-black">Missing decryption key</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
              The key lives in the URL fragment and is never sent to the server.
            </p>
          </section>
        ) : (
          <div className="stage-grid gap-5">
            <section className="rounded-md bg-[#111314] p-3 shadow-panel">
              <div className="aspect-video overflow-hidden rounded bg-black">
                {clearUrl ? (
                  <video src={clearUrl} className="h-full w-full" controls playsInline />
                ) : (
                  <div className="grid h-full place-items-center text-sm font-bold text-white/70">
                    {shareQuery.isLoading ? "Loading" : progressLabel}
                  </div>
                )}
              </div>
            </section>

            <aside className="rounded-md bg-white p-5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black">
                    {metadata?.filename ?? "Shared recording"}
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-ink/60">
                    {metadata
                      ? `${formatBytes(metadata.clearBytes)} cleartext before encryption`
                      : ""}
                  </p>
                </div>
                <IconButton
                  label="Retry"
                  icon={<RotateCw size={18} aria-hidden="true" />}
                  onClick={() => shareQuery.refetch()}
                />
              </div>

              {decryptError || shareQuery.error ? (
                <p className="mt-5 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">
                  {decryptError || formatActionableError(classifyError(shareQuery.error))}
                </p>
              ) : null}

              {metadata?.transcript ? (
                <div className="mt-5">
                  <h2 className="text-sm font-black uppercase tracking-normal text-ink/60">
                    Transcript{" "}
                    {metadata.transcriptConfidence ? `(${metadata.transcriptConfidence})` : ""}
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap rounded-md bg-paper p-3 text-sm leading-6">
                    {metadata.transcript}
                  </p>
                </div>
              ) : null}

              <IconButton
                label="Download"
                icon={<Download size={18} aria-hidden="true" />}
                disabled={!clearBlob || !metadata}
                onClick={() => {
                  if (clearBlob && metadata) downloadBlob(clearBlob, metadata.filename);
                }}
                className="mt-5 w-full"
                tone="primary"
              />
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
