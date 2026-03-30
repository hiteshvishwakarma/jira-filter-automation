require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60000,
  retries: 1,
  reporter: [
    ['html', { open: 'always' }],
    ['allure-playwright'],
  ],
  use: {
    baseURL: process.env.JIRA_URL || 'https://your-jira-instance.atlassian.net',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // Auth setup — runs first, logs in and saves session cookies
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    // UI test suite — reuses the saved auth state (no re-login per test)
    {
      name: 'jira-filters',
      testMatch: /filters\.spec\.js/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json',
      },
    },
    // API test suite — no browser login, uses API token directly
    {
      name: 'jira-filters-api',
      testMatch: /filters-api\.spec\.js/,
    },
  ],
});
