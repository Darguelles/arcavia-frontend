import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config (spec §14.2). Tests live in tests/e2e and run against the Vite dev
 * server. Full gameplay flows require the API (arcavia-api) on :8000 — see the
 * README. iPhone project is included because iOS WebKit is the highest-risk
 * surface for the camera/scan flow (§9).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
