import { UserFacingError } from "../../lib/errors";

let loadedFfmpeg: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFfmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  loadedFfmpeg ??= (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    return ffmpeg;
  })();

  return loadedFfmpeg;
}

export async function remuxRecording(blob: Blob): Promise<Blob> {
  try {
    const [{ fetchFile }, ffmpeg] = await Promise.all([import("@ffmpeg/util"), getFfmpeg()]);
    await ffmpeg.writeFile("input.webm", await fetchFile(blob));
    await ffmpeg.exec(["-i", "input.webm", "-c", "copy", "instant-cast.webm"]);
    const data = await ffmpeg.readFile("instant-cast.webm");
    await ffmpeg.deleteFile("input.webm");
    await ffmpeg.deleteFile("instant-cast.webm");

    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: "video/webm" });
  } catch (error) {
    throw new UserFacingError(
      error instanceof Error ? `FFmpeg export failed: ${error.message}` : "FFmpeg export failed.",
    );
  }
}
