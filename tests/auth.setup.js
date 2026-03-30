const { test: setup } = require('@playwright/test');
const LoginPage = require('../pages/login.page');

/**
 * Playwright auth setup — runs once before all tests.
 * Logs into Jira Cloud and saves the session (cookies + localStorage)
 * so that test cases can reuse the authenticated state without re-logging in.
 */
setup('authenticate to Jira Cloud', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login();

  // Save authenticated session state for reuse in test projects
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
