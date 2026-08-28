import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://boardroom-six-delta.vercel.app";

if (!baseURL.startsWith("https://") || /localhost|127\.0\.0\.1/.test(baseURL)) {
  throw new Error("Playwright baseURL must be a deployed HTTPS URL");
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
