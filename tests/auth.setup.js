const { test: setup } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '..', 'playwright', '.auth', 'user.json');
const AUTH_MSG =
  '\n\nRun "npm run auth" to log in and save your session.\n' +
  'This only needs to be done once (or when your session expires).\n';

/**
 * Auth setup — verifies that a valid authenticated session exists before running UI tests.
 * Loads the saved session and hits Jira to confirm it's not redirected to login.
 */
setup('verify Jira Cloud auth session is valid', async ({ browser }) => {
  // Step 1: Check file exists
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error('\nNo saved auth session found.' + AUTH_MSG);
  }

  // Step 2: Try loading the session and accessing Jira
  let url;
  try {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await page.goto(process.env.JIRA_URL || '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    url = page.url();
    await context.close();
  } catch {
    throw new Error('\nFailed to verify session — could not reach Jira.' + AUTH_MSG);
  }

  // Step 3: Check if Jira redirected to login
  if (url.includes('id.atlassian.com') || url.includes('/login')) {
    throw new Error('\nSession is expired or invalid — Jira redirected to login.' + AUTH_MSG);
  }
});
