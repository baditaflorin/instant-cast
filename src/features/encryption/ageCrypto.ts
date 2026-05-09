import { UserFacingError } from "../../lib/errors";

export interface EncryptedPayload {
  encryptedBlob: Blob;
  passphrase: string;
  encryptedBytes: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Uint8Array(await new Response(blob).arrayBuffer());
}

function randomPassphrase(length = 43): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Operation cancelled.", "AbortError");
}

export async function encryptBlobWithAge(
  blob: Blob,
  signal?: AbortSignal,
  onProgress?: (label: string, progress: number | null) => void,
): Promise<EncryptedPayload> {
  try {
    throwIfAborted(signal);
    onProgress?.("Loading age encryption", 0.05);
    const age = await import("age-encryption");
    const passphrase = randomPassphrase();
    const encrypter = new age.Encrypter();
    encrypter.setScryptWorkFactor(12);
    encrypter.setPassphrase(passphrase);

    throwIfAborted(signal);
    onProgress?.("Reading recording bytes", 0.2);
    const input = await readBlobBytes(blob);
    throwIfAborted(signal);
    onProgress?.("Encrypting recording", 0.45);
    const ciphertext = await encrypter.encrypt(input);
    throwIfAborted(signal);
    const encryptedBlob = new Blob([toArrayBuffer(ciphertext)], {
      type: "application/octet-stream",
    });
    onProgress?.("Encrypted", 1);

    return {
      encryptedBlob,
      passphrase,
      encryptedBytes: encryptedBlob.size,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserFacingError("Encryption cancelled. Your recording is still saved locally.");
    }
    throw new UserFacingError(
      error instanceof Error ? `Encryption failed: ${error.message}` : "Encryption failed.",
    );
  }
}

export async function decryptBlobWithAge(
  encryptedBlob: Blob,
  passphrase: string,
  clearContentType: string,
  signal?: AbortSignal,
  onProgress?: (label: string, progress: number | null) => void,
): Promise<Blob> {
  try {
    throwIfAborted(signal);
    onProgress?.("Loading age decryption", 0.05);
    const age = await import("age-encryption");
    const decrypter = new age.Decrypter();
    decrypter.addPassphrase(passphrase);

    throwIfAborted(signal);
    onProgress?.("Reading encrypted bytes", 0.25);
    const input = await readBlobBytes(encryptedBlob);
    throwIfAborted(signal);
    onProgress?.("Decrypting recording", 0.5);
    const clearBytes = await decrypter.decrypt(input, "uint8array");
    throwIfAborted(signal);
    onProgress?.("Decrypted", 1);
    return new Blob([toArrayBuffer(clearBytes)], { type: clearContentType });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserFacingError("Decryption cancelled.");
    }
    throw new UserFacingError(
      error instanceof Error ? `Decryption failed: ${error.message}` : "Decryption failed.",
    );
  }
}
