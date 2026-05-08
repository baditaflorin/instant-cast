import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:49537",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "PORT=49537 node scripts/pages-server.mjs",
    url: "http://127.0.0.1:49537/instant-cast/",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
