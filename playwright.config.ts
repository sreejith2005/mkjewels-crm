import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// The local CRM dev server conventionally runs on 3300.  Keep a deployed target
// explicit through E2E_BASE_URL, and make the server readiness probe match it.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3300";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL, channel: process.env.E2E_BROWSER_CHANNEL },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npm.cmd run dev -- --port 3300",
    url: baseURL,
    reuseExistingServer: true,
  },
});
