import { expect, test } from "@playwright/test";

test("loads the studio shell and project links", async ({ page }) => {
  await page.goto("/instant-cast/");
  await expect(page.getByRole("heading", { name: "Instant Cast" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Star on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/instant-cast",
  );
  await expect(page.getByRole("link", { name: "PayPal" })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );
  await expect(page.getByText(/Version .* Commit/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Record" })).toBeVisible();
});

test("imports user-owned state and exposes real settings controls", async ({ page }) => {
  await page.goto("/instant-cast/");

  const state = {
    schemaVersion: 1,
    appVersion: "0.3.0",
    exportedAt: "2026-05-09T12:00:00.000Z",
    recording: {
      id: "e2e-state",
      name: "e2e.webm",
      createdAt: "2026-05-09T12:00:00.000Z",
      durationSeconds: 3,
      clearBytes: 5,
      contentType: "video/webm",
      captureMode: "screen-only",
      transcript: "Imported by Playwright",
      transcriptConfidence: "high",
      warnings: ["fixture import"],
      dataBase64: Buffer.from("hello").toString("base64"),
    },
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: "instant-cast-state.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });

  await expect(page.getByLabel("Transcript")).toHaveValue("Imported by Playwright");
  await expect(page.getByText("high confidence")).toBeVisible();
  await expect(page.getByText("fixture import")).toBeVisible();
  await expect(page.getByLabel("State JSON or share URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy state" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Print" })).toBeEnabled();
  await expect(page.getByLabel("Frame rate")).toHaveValue("30");
});
