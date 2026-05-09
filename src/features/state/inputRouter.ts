import type { RecordingRecord } from "../../lib/db";
import { parseInstantCastShareUrl, type ParsedShareUrl } from "../share/shareLinks";
import { importStudioState } from "./studioState";

export type RoutedTextInput =
  | {
      kind: "state";
      confidence: "high";
      record: RecordingRecord;
      message: string;
    }
  | {
      kind: "share-url";
      confidence: "high" | "medium";
      share: ParsedShareUrl;
      message: string;
    }
  | {
      kind: "unsupported";
      confidence: "high";
      message: string;
    };

export interface FileImportResult {
  accepted: RecordingRecord[];
  rejected: string[];
}

export function routeTextInput(input: string): RoutedTextInput {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      kind: "unsupported",
      confidence: "high",
      message: "Paste an Instant Cast state JSON file or share URL.",
    };
  }

  const share = parseInstantCastShareUrl(trimmed);
  if (share) {
    return {
      kind: "share-url",
      confidence: share.passphrase ? "high" : "medium",
      share,
      message: share.passphrase
        ? "Instant Cast share link detected."
        : "Share link detected, but it is missing the decryption key.",
    };
  }

  if (trimmed.startsWith("{")) {
    try {
      return {
        kind: "state",
        confidence: "high",
        record: importStudioState(trimmed),
        message: "Instant Cast state JSON detected.",
      };
    } catch {
      return {
        kind: "unsupported",
        confidence: "high",
        message:
          "That looks like JSON, but not a valid Instant Cast state file. Export state from Instant Cast and try again.",
      };
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      kind: "unsupported",
      confidence: "high",
      message:
        "Only Instant Cast share URLs can be opened here. External pages cannot be fetched from GitHub Pages.",
    };
  }

  return {
    kind: "unsupported",
    confidence: "high",
    message: "Unsupported input. Use an exported state JSON file or an Instant Cast share URL.",
  };
}

export async function readStateFiles(files: Iterable<File>): Promise<FileImportResult> {
  const accepted: RecordingRecord[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    try {
      accepted.push(importStudioState(await file.text()));
    } catch {
      rejected.push(`${file.name || "unnamed file"} is not a valid Instant Cast state file.`);
    }
  }

  return { accepted, rejected };
}
