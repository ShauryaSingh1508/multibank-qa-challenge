import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

/**
 * Projects
 *  - chromium / firefox / webkit : desktop functional suite (cross-browser evidence)
 *  - mobile-chrome / mobile-safari : @mobile specs on real device descriptors (touch, DPR, UA)
 *  - api : @api specs, no browser launched
 *  - visual : @visual specs, Chromium only so baselines stay stable
 *
 * Tags are the routing mechanism: a spec only has to tag itself to land in the right project(s).
 */
const DESKTOP_ONLY = /@mobile|@api|@visual/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 1 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', caret: 'hide' },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{projectName}/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: env.baseUrl,
    locale: env.locale,
    timezoneId: 'Asia/Dubai',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grepInvert: DESKTOP_ONLY,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
      grepInvert: DESKTOP_ONLY,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
      grepInvert: DESKTOP_ONLY,
    },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] }, grep: /@mobile/ },
    { name: 'api', grep: /@api/ },
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grep: /@visual/,
    },
  ],
});
