const preferredTypes = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export function chooseSupportedMimeType(): string {
  if (!("MediaRecorder" in window)) return "";
  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}
