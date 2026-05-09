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
