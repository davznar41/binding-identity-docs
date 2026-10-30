import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';
import { mkdirSync } from 'node:fs';

mkdirSync('verification', { recursive: true });
const baseCheck = process.env.DOCS_BASE_CHECK === '1';
const port = baseCheck ? '4322' : '4321';
const origin = `http://127.0.0.1:${port}`;
const channel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : 'chrome');

export default defineConfig({
  testDir: './tests',
  outputDir: baseCheck ? '.base-check/test-results' : 'test-results',
  ...(baseCheck ? { testMatch: '**/base.spec.ts' } : { testIgnore: '**/base.spec.ts' }),
  timeout: 60000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: baseCheck ? 'verification/base-results.json' : 'verification/results.json' }]],
  use: { baseURL: origin, trace: 'retain-on-failure' },
  projects: [{ name: channel ?? 'chromium', use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) } }],
  webServer: baseCheck ? undefined : {
    command: 'npm run preview -- --port 4321',
    url: origin,
    reuseExistingServer: !process.env.CI,
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
  },
});
