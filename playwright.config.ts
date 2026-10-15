import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: { command: "npx serve out -l 3100", url: "http://localhost:3100", reuseExistingServer: true },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});
