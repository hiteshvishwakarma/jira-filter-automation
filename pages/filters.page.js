class FiltersPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Execute a JQL search by navigating directly to the issue navigator URL.
   * URL-based navigation is the most stable approach for Jira Cloud.
   */
  async searchByJql(jql) {
    const encodedJql = encodeURIComponent(jql);
    await this.page.goto(`/issues/?jql=${encodedJql}`);
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for issue table or "no issues" message to appear
    await this.page.locator('table[aria-label], [role="table"]').or(
      this.page.getByText(/no issues were found/i)
    ).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
  }

  /**
   * Save the current search results as a named Jira filter.
   * Jira Cloud uses "Save filter" button, then a dialog with a name input.
   */
  async saveAsFilter(name) {
    // Jira Cloud's issue navigator has a "Save filter" button
    await this.page.getByRole('button', { name: /save filter/i }).click();

    // Wait for the save dialog to appear
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill the filter name
    await dialog.getByRole('textbox').first().fill(name);

    // Click Save/Submit
    await dialog.getByRole('button', { name: /save|submit/i }).first().click();

    // Wait for save to complete
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);

  }

  /**
   * Get the JQL query string from the current page URL.
   */
  async getJqlFromUrl() {
    const url = new URL(this.page.url());
    return decodeURIComponent(url.searchParams.get('jql') || '');
  }

  /**
   * Extract all issue statuses from the search results table.
   * In Jira Cloud, status is in cells like: button "To Do - Change status"
   * We extract the status name by removing " - Change status" suffix.
   */
  async getIssueStatuses() {
    // Wait for the table to load
    await this.page.locator('table[aria-label], [role="table"]').first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => null);

    // Status buttons in Jira Cloud have the pattern: "StatusName - Change status"
    const statusButtons = this.page.getByRole('button', { name: /- Change status$/i });
    const count = await statusButtons.count();

    const statuses = [];
    for (let i = 0; i < count; i++) {
      const text = await statusButtons.nth(i).innerText();
      // Extract status name: "To Do - Change status" → "To Do"
      const status = text.replace(/\s*-\s*Change status$/i, '').trim();
      if (status) statuses.push(status);
    }

    return statuses;
  }

  /**
   * Get the count of issues returned by the current search.
   */
  async getIssueCount() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    // Count status buttons as a proxy for issue rows
    return await this.page.getByRole('button', { name: /- Change status$/i }).count();
  }

  /**
   * Check if Jira's "no results" message is displayed.
   */
  async isNoResultsMessageVisible() {
    return await this.page.getByText(/nothing matching your search|no issues were found|no results/i)
      .isVisible()
      .catch(() => false);
  }

  /**
   * Check if the saved filter name is visible on the page.
   */
  async isFilterNameVisible(name) {
    await this.page.waitForTimeout(1000);
    return await this.page.getByText(name).first().isVisible().catch(() => false);
  }
}

module.exports = FiltersPage;
