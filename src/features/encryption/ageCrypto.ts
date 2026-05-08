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

export async function encryptBlobWithAge(blob: Blob): Promise<EncryptedPayload> {
  try {
    const age = await import("age-encryption");
    const passphrase = randomPassphrase();
    const encrypter = new age.Encrypter();
    encrypter.setScryptWorkFactor(12);
    encrypter.setPassphrase(passphrase);

    const input = await readBlobBytes(blob);
    const ciphertext = await encrypter.encrypt(input);
    const encryptedBlob = new Blob([toArrayBuffer(ciphertext)], {
      type: "application/octet-stream",
    });

    return {
      encryptedBlob,
      passphrase,
      encryptedBytes: encryptedBlob.size,
    };
  } catch (error) {
    throw new UserFacingError(
      error instanceof Error ? `Encryption failed: ${error.message}` : "Encryption failed.",
    );
  }
}

export async function decryptBlobWithAge(
  encryptedBlob: Blob,
  passphrase: string,
  clearContentType: string,
): Promise<Blob> {
  try {
    const age = await import("age-encryption");
    const decrypter = new age.Decrypter();
    decrypter.addPassphrase(passphrase);

    const input = await readBlobBytes(encryptedBlob);
    const clearBytes = await decrypter.decrypt(input, "uint8array");
    return new Blob([toArrayBuffer(clearBytes)], { type: clearContentType });
  } catch (error) {
    throw new UserFacingError(
      error instanceof Error ? `Decryption failed: ${error.message}` : "Decryption failed.",
    );
  }
}
