// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decryptBlobWithAge, encryptBlobWithAge } from "./ageCrypto";

describe("age encryption", () => {
  it("round-trips a blob with a URL-safe passphrase", async () => {
    const source = new Blob(["hello instant cast"], { type: "text/plain" });
    const encrypted = await encryptBlobWithAge(source);
    const decrypted = await decryptBlobWithAge(
      encrypted.encryptedBlob,
      encrypted.passphrase,
      "text/plain",
    );

    expect(encrypted.passphrase).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decrypted.text()).toBe("hello instant cast");
  });
});
