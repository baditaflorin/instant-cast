export type ErrorKind =
  | "permission"
  | "backend"
  | "upload-limit"
  | "share-key"
  | "decrypt"
  | "storage"
  | "unsupported"
  | "cancelled"
  | "unknown";

export interface ActionableError {
  kind: ErrorKind;
  what: string;
  why: string;
  nowWhat: string;
}

export function formatActionableError(error: ActionableError): string {
  return `${error.what} ${error.why} ${error.nowWhat}`;
}

export function classifyError(error: unknown): ActionableError {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();

  if (lower.includes("abort") || lower.includes("cancel")) {
    return {
      kind: "cancelled",
      what: "Operation cancelled.",
      why: "The current work was stopped before it changed your recording.",
      nowWhat: "You can retry from the saved local draft.",
    };
  }

  if (lower.includes("permission") || lower.includes("notallowed") || lower.includes("denied")) {
    return {
      kind: "permission",
      what: "Recording permission was blocked.",
      why: "The browser did not grant one of the requested capture devices.",
      nowWhat:
        "Instant Cast will use any granted devices; retry only if the missing device matters.",
    };
  }

  if (lower.includes("413") || lower.includes("too large") || lower.includes("request entity")) {
    return {
      kind: "upload-limit",
      what: "The share upload is too large.",
      why: "The backend rejected the encrypted recording size.",
      nowWhat: "Download locally, shorten the recording, or raise the backend upload limit.",
    };
  }

  if (
    lower.includes("localhost") ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return {
      kind: "backend",
      what: "The share backend is unreachable.",
      why: "The browser could not reach the configured API endpoint.",
      nowWhat: "Use local download or set a reachable HTTPS backend URL.",
    };
  }

  if (lower.includes("missing") && lower.includes("key")) {
    return {
      kind: "share-key",
      what: "The share link is missing its decryption key.",
      why: "The key lives after the # in the original URL and was not included.",
      nowWhat: "Ask for the full original link or share the recording again.",
    };
  }

  if (lower.includes("decrypt") || lower.includes("invalid version line")) {
    return {
      kind: "decrypt",
      what: "The recording could not be decrypted.",
      why: "The key does not match this encrypted recording, or the file is incomplete.",
      nowWhat: "Check that the copied link includes the full key after #key=.",
    };
  }

  return {
    kind: "unknown",
    what: "Instant Cast could not finish that action.",
    why: message || "The browser did not provide a specific reason.",
    nowWhat: "Your local recording is still available; retry or download it locally.",
  };
}
