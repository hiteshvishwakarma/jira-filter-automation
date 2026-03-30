class FiltersPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Execute a JQL search by navigating directly to the issue navigator URL.
   * This is the most stable approach for Jira Cloud — avoids fragile JQL editor selectors.
   */
  async searchByJql(jql) {
    const encodedJql = encodeURIComponent(jql);
    await this.page.goto(`/issues/?jql=${encodedJql}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Save the current search results as a named Jira filter.
   * Uses Playwright role-based and text-based selectors for Jira Cloud stability.
   */
  async saveAsFilter(name) {
    // "Save as" link/button appears near the top of the issue navigator
    await this.page.getByRole('link', { name: /save as/i })
      .or(this.page.getByRole('button', { name: /save as/i }))
      .first()
      .click();

    // Wait for the save dialog/popover to appear
    const dialog = this.page.getByRole('dialog')
      .or(this.page.locator('[role="dialog"], [data-testid="save-filter-dialog"]'));
    await dialog.first().waitFor({ state: 'visible', timeout: 5000 });

    // Fill the filter name in the dialog input
    await dialog.first().getByRole('textbox').first().fill(name);

    // Submit the save dialog
    await dialog.first().getByRole('button', { name: /submit|save/i }).first().click();

    // Wait for save confirmation
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the JQL query string from the current page URL.
   * More reliable than reading the JQL editor DOM.
   */
  async getJqlFromUrl() {
    const url = new URL(this.page.url());
    return decodeURIComponent(url.searchParams.get('jql') || '');
  }

  /**
   * Extract all issue statuses from the search results table.
   * Uses Jira Cloud's data-issuekey attribute on table rows and status lozenge elements.
   */
  async getIssueStatuses() {
    // Wait for issue rows to appear
    await this.page.locator('tr[data-issuekey]').first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => null);

    // Jira Cloud renders statuses as lozenges inside table rows
    const statuses = await this.page.locator('tr[data-issuekey]').evaluateAll(rows => {
      return rows.map(row => {
        // Look for status lozenge — Jira Cloud uses [data-testid*="badge"] or .jira-issue-status-lozenge
        const lozenge = row.querySelector(
          '[data-testid*="badge"], [data-testid*="status"] span, .jira-issue-status-lozenge'
        );
        return lozenge ? lozenge.innerText.trim() : '';
      }).filter(text => text.length > 0);
    });

    return statuses;
  }

  /**
   * Get the count of issues returned by the current search.
   */
  async getIssueCount() {
    await this.page.waitForLoadState('networkidle');
    return await this.page.locator('tr[data-issuekey]').count();
  }

  /**
   * Check if Jira's "no results" message is displayed.
   */
  async isNoResultsMessageVisible() {
    return await this.page.getByText(/no issues were found|no results/i)
      .isVisible()
      .catch(() => false);
  }

  /**
   * Check if the saved filter name is visible on the page.
   */
  async isFilterNameVisible(name) {
    return await this.page.getByText(name).first().isVisible().catch(() => false);
  }
}

module.exports = FiltersPage;
