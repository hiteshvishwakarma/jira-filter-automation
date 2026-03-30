class LoginPage {
  constructor(page) {
    this.page = page;

    // Atlassian Cloud login — use role-based selectors for resilience
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.locator('#password').or(page.getByRole('textbox', { name: /password/i }));
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.loginButton = page.locator('#login-submit').or(page.getByRole('button', { name: /log in/i }));
  }

  async login() {
    const jiraUrl = process.env.JIRA_URL;
    const email = process.env.JIRA_USER;
    const password = process.env.JIRA_PASS;

    // Navigate to Jira Cloud — redirects to id.atlassian.com for auth
    await this.page.goto(jiraUrl);

    // Step 1: Enter email and continue
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.fill(email);
    await this.continueButton.click();

    // Step 2: Enter password (Atlassian uses a two-step login flow)
    await this.passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for redirect back to Jira after successful login
    // After Atlassian login, Jira may redirect to /jira/, /projects/, or the home page
    await this.page.waitForURL(url => {
      const href = url.href;
      return href.includes('.atlassian.net') && !href.includes('id.atlassian.com');
    }, { timeout: 30000 });
  }
}

module.exports = LoginPage;
