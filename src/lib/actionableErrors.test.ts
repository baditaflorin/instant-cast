import { describe, expect, it } from "vitest";
import { classifyError, formatActionableError } from "./actionableErrors";

describe("actionable errors", () => {
  it("turns network failures into backend guidance", () => {
    const error = classifyError(new Error("Failed to fetch"));
    expect(error.kind).toBe("backend");
    expect(formatActionableError(error)).toContain("backend");
  });

  it("turns decryption failures into share-key guidance", () => {
    const error = classifyError(new Error("invalid version line"));
    expect(error.kind).toBe("decrypt");
    expect(error.nowWhat).toContain("#key=");
  });
});
