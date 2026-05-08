import createClient from "openapi-fetch";
import { appConfig } from "../app/config";
import type { components, paths } from "./schema";

export type UploadMetadata = components["schemas"]["UploadMetadata"];
export type UploadResponse = components["schemas"]["UploadResponse"];
export type ShareResponse = components["schemas"]["ShareResponse"];

type ApiError = components["schemas"]["ErrorResponse"];

function normalizeBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, "");
}

export function getApiBaseUrl(candidate?: string | null): string {
  return normalizeBaseUrl(
    candidate || localStorage.getItem("instant-cast:api-base-url") || appConfig.defaultApiBaseUrl,
  );
}

export function setApiBaseUrl(apiBaseUrl: string): void {
  localStorage.setItem("instant-cast:api-base-url", normalizeBaseUrl(apiBaseUrl));
}

function api(apiBaseUrl?: string | null) {
  return createClient<paths>({ baseUrl: getApiBaseUrl(apiBaseUrl) });
}

function throwApiError(error: ApiError | undefined, fallback: string): never {
  throw new Error(error?.message || fallback);
}

export async function uploadEncryptedRecording(
  encryptedBlob: Blob,
  metadata: UploadMetadata,
  apiBaseUrl?: string | null,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", encryptedBlob, `${metadata.filename}.age`);
  form.append("metadata", JSON.stringify(metadata));

  const { data, error } = await api(apiBaseUrl).POST("/api/uploads", {
    body: form as never,
  });

  if (!data) throwApiError(error, "Upload failed.");
  return data;
}

export async function fetchShare(
  token: string,
  apiBaseUrl?: string | null,
): Promise<ShareResponse> {
  const { data, error } = await api(apiBaseUrl).GET("/api/shares/{token}", {
    params: { path: { token } },
  });

  if (!data) throwApiError(error, "Share not found.");
  return data;
}

export async function fetchEncryptedBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}.`);
  return response.blob();
}
