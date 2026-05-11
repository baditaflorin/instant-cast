import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { planCapture } from "./captureIntelligence";
import { classifyShareEndpoint } from "../share/sharePreflight";

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");

interface ExpectedFixture {
  canRecord?: boolean;
  captureMode?: string;
  confidence?: string;
  sharePreflight?: string;
  eventOutcome?: string;
  restoreAction?: string;
  transcriptConfidence?: string;
  sizeRisk?: string;
  shareRecovery?: string;
  warningIncludes?: string;
}

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

describe("real-data capture plans", () => {
  for (const file of readdirSync(fixtureDir).filter((entry) => !entry.endsWith(".expected.json"))) {
    it(`matches ${file}`, () => {
      const expected = readFixture(file.replace(".json", ".expected.json")) as ExpectedFixture;
      const scenario = readFixture(file);
      const plan = planCapture(scenario);

      if (expected.canRecord !== undefined) expect(plan.canRecord).toBe(expected.canRecord);
      if (expected.captureMode) expect(plan.captureMode).toBe(expected.captureMode);
      if (expected.confidence) expect(plan.confidence).toBe(expected.confidence);
      if (expected.eventOutcome) expect(plan.eventOutcome).toBe(expected.eventOutcome);
      if (expected.restoreAction) expect(plan.restoreAction).toBe(expected.restoreAction);
      if (expected.transcriptConfidence) {
        expect(plan.transcriptConfidence).toBe(expected.transcriptConfidence);
      }
      if (expected.sizeRisk) expect(plan.sizeRisk).toBe(expected.sizeRisk);
      if (expected.shareRecovery) expect(plan.shareRecovery).toBe(expected.shareRecovery);
      if (expected.warningIncludes) {
        expect(plan.warnings.join(" ")).toContain(expected.warningIncludes);
      }
      if (expected.sharePreflight) {
        const share = classifyShareEndpoint({
          apiBaseUrl: (scenario as { apiBaseUrl: string }).apiBaseUrl,
          pageOrigin: (scenario as { pageOrigin?: string }).pageOrigin,
        });
        expect(share.status).toBe(expected.sharePreflight);
      }
    });
  }
});

describe("planCapture shareProblem handling", () => {
  const baseScenario = {
    id: "share-problem-base",
    screen: "available" as const,
    camera: "available" as const,
    microphone: "available" as const,
    durationSeconds: 30,
    width: 1280,
    height: 720,
    speech: "clear" as const,
  };

  it('routes "missing-key" to ask-for-original-link with a key-specific warning', () => {
    const plan = planCapture({ ...baseScenario, shareProblem: "missing-key" });
    expect(plan.shareRecovery).toBe("ask-for-original-link");
    expect(plan.warnings.join(" ")).toMatch(/missing the decryption key/i);
  });

  it('routes "expired" to retry-backend with an expiry-specific warning', () => {
    const plan = planCapture({ ...baseScenario, shareProblem: "expired" });
    expect(plan.shareRecovery).toBe("retry-backend");
    expect(plan.warnings.join(" ")).toMatch(/expired/i);
    // Must not show the missing-key copy — the cause is different.
    expect(plan.warnings.join(" ")).not.toMatch(/missing the decryption key/i);
  });

  it('routes "mismatch" to ask-for-original-link with a mismatch-specific warning', () => {
    const plan = planCapture({ ...baseScenario, shareProblem: "mismatch" });
    expect(plan.shareRecovery).toBe("ask-for-original-link");
    expect(plan.warnings.join(" ")).toMatch(/doesn't match/i);
  });

  it('falls through to "none" when no shareProblem is reported and size is safe', () => {
    const plan = planCapture({ ...baseScenario });
    expect(plan.shareRecovery).toBe("none");
  });
});
