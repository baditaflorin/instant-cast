import { z } from "zod";
import type { RecorderOptions } from "../features/recorder/types";

const settingsSchema = z.object({
  schemaVersion: z.literal(1),
  apiBaseUrl: z.string(),
  ttlSeconds: z.number().int().min(300).max(2_592_000),
  includeCamera: z.boolean(),
  includeMicrophone: z.boolean(),
  frameRate: z.number().int().min(5).max(60),
  webcamCorner: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]),
  autoTranscribe: z.boolean(),
});

export type AppSettings = z.infer<typeof settingsSchema>;

const storageKey = "instant-cast:settings";

export const defaultSettings: AppSettings = {
  schemaVersion: 1,
  apiBaseUrl: "http://localhost:8080",
  ttlSeconds: 604_800,
  includeCamera: true,
  includeMicrophone: true,
  frameRate: 30,
  webcamCorner: "bottom-right",
  autoTranscribe: true,
};

export function loadSettings(defaultApiBaseUrl: string): AppSettings {
  const fallback = { ...defaultSettings, apiBaseUrl: defaultApiBaseUrl };
  const raw = localStorage.getItem(storageKey);
  if (!raw) return fallback;
  try {
    return settingsSchema.parse({ ...fallback, ...JSON.parse(raw) });
  } catch {
    localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(storageKey, JSON.stringify(settingsSchema.parse(settings)));
}

export function settingsToRecorderOptions(settings: AppSettings): RecorderOptions {
  return {
    includeCamera: settings.includeCamera,
    includeMicrophone: settings.includeMicrophone,
    frameRate: settings.frameRate,
    webcamCorner: settings.webcamCorner,
  };
}
