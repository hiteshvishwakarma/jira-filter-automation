class LoginPage {
  constructor(page) {
    this.page = page;

    // Atlassian Cloud login selectors (id.atlassian.com)
    // These are stable across all Atlassian Cloud products
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginSubmitButton = page.locator('#login-submit');
  }

  async login() {
    const jiraUrl = process.env.JIRA_URL;
    const email = process.env.JIRA_USER;
    const password = process.env.JIRA_PASS;

    // Navigate to Jira Cloud — redirects to id.atlassian.com for auth
    await this.page.goto(jiraUrl);

    // Step 1: Enter email
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.fill(email);
    await this.loginSubmitButton.click();

    // Step 2: Enter password (Atlassian uses a two-step login flow)
    await this.passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.passwordInput.fill(password);
    await this.loginSubmitButton.click();

    // Wait for redirect back to Jira after successful login
    await this.page.waitForURL('**/*.atlassian.net/**', { timeout: 30000 });
  }
}

module.exports = LoginPage;
