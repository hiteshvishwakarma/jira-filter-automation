require('dotenv').config();
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 60000,
  retries: 1,
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
    // Main test suite — reuses the saved auth state (no re-login per test)
    {
      name: 'jira-filters',
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
});
