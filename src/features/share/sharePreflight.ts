import { z } from "zod";

export type SharePreflightStatus = "ok" | "blocked" | "unreachable";

export interface SharePreflightResult {
  status: SharePreflightStatus;
  normalizedUrl: string;
  message: string;
  nextAction: string;
}

const preflightInputSchema = z.object({
  apiBaseUrl: z.string().min(1),
  pageOrigin: z.string().optional(),
});

function isPublicOrigin(origin: string | undefined): boolean {
  return Boolean(origin && origin.startsWith("https://") && !origin.includes("localhost"));
}

export function classifyShareEndpoint(input: unknown): SharePreflightResult {
  const parsed = preflightInputSchema.parse(input);
  let url: URL;
  try {
    url = new URL(parsed.apiBaseUrl);
  } catch {
    return {
      status: "blocked",
      normalizedUrl: parsed.apiBaseUrl.trim(),
      message: "The API endpoint is not a valid URL.",
      nextAction: "Paste a full http:// or https:// backend URL.",
    };
  }

  const normalizedUrl = url.toString().replace(/\/$/, "");
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (isLocalhost && isPublicOrigin(parsed.pageOrigin)) {
    return {
      status: "blocked",
      normalizedUrl,
      message: "The public site cannot upload to localhost.",
      nextAction: "Use local download or set a reachable HTTPS backend URL.",
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      status: "blocked",
      normalizedUrl,
      message: "The API endpoint must use HTTP or HTTPS.",
      nextAction: "Use the backend URL from deploy/README.md.",
    };
  }

  return {
    status: "ok",
    normalizedUrl,
    message: "Backend endpoint looks usable.",
    nextAction: "Preflight /healthz before encryption.",
  };
}

export async function preflightShareEndpoint(
  apiBaseUrl: string,
  signal?: AbortSignal,
): Promise<SharePreflightResult> {
  const classified = classifyShareEndpoint({ apiBaseUrl, pageOrigin: window.location.origin });
  if (classified.status !== "ok") return classified;

  try {
    const response = await fetch(`${classified.normalizedUrl}/healthz`, { signal });
    if (!response.ok) {
      return {
        ...classified,
        status: "unreachable",
        message: `Backend health check returned HTTP ${response.status}.`,
        nextAction: "Keep the recording locally or fix the backend before sharing.",
      };
    }
    return classified;
  } catch {
    return {
      ...classified,
      status: "unreachable",
      message: "The share backend is unreachable.",
      nextAction: "Download locally or configure a reachable backend URL.",
    };
  }
}
