require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const AUTH_DIR = path.join(__dirname, '..', 'playwright', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

async function authenticate() {
  const jiraUrl = process.env.JIRA_URL;

  if (!jiraUrl) {
    console.error('\nError: JIRA_URL not found in .env file.');
    console.error('Run "cp .env.example .env" and fill in your Jira URL first.\n');
    process.exit(1);
  }

  // Ensure auth directory exists
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log('\n--- Jira Auth ---');
  console.log(`Opening ${jiraUrl} in Chrome...`);
  console.log('Log in using any method (Google, SSO, password, passkey).');
  console.log('Once you see the Jira dashboard, come back here and press Enter.\n');

  // Launch the user's installed Chrome (not Playwright's bundled Chromium)
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(jiraUrl);

  // Wait for the user to log in and press Enter
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question('Press Enter after you are logged in... ', resolve));
  rl.close();

  // Save session cookies + localStorage
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log('\nSession saved to playwright/.auth/user.json');
  console.log('Run "npm run test:ui" to use this session.\n');
}

authenticate().catch(err => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});
