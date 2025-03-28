// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './',
  timeout: 120000,
  expect: {
    timeout: 10000
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
      }
    }
  ],
  reporter: 'list'
});
