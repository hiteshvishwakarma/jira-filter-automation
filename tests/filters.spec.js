const { test, expect } = require('@playwright/test');
const FiltersPage = require('../pages/filters.page');
const { OPEN_STATUSES, CLOSED_STATUSES } = require('../utils/constants');

test.describe('Jira Filters Automation', () => {

  test('Create and validate Open Items Filter', async ({ page }) => {
    const filtersPage = new FiltersPage(page);
    const jql = 'status in ("Open", "To Do", "In Progress")';

    // Step 1: Execute JQL search via URL navigation
    await filtersPage.searchByJql(jql);

    // Assertion 1: JQL criteria match expected open statuses (check BEFORE saving — save changes the URL)
    const appliedJql = await filtersPage.getJqlFromUrl();
    expect(appliedJql).toContain('status in');
    expect(appliedJql).toContain('Open');
    expect(appliedJql).toContain('To Do');
    expect(appliedJql).toContain('In Progress');

    // Assertion 2: All returned issues have open statuses only
    const statuses = await filtersPage.getIssueStatuses();
    for (const status of statuses) {
      expect(OPEN_STATUSES.map(s => s.toUpperCase())).toContain(status.toUpperCase());
    }

    // Step 2: Save the search as a named filter
    await filtersPage.saveAsFilter('Open Items Filter');

    // Assertion 3: Filter is created and visible on the page
    const isVisible = await filtersPage.isFilterNameVisible('Open Items Filter');
    expect(isVisible).toBeTruthy();
  });

  test('Create and validate Closed Items Filter', async ({ page }) => {
    const filtersPage = new FiltersPage(page);
    const jql = 'status in ("Done", "Closed")';

    await filtersPage.searchByJql(jql);

    // Assertion 1: JQL criteria match expected closed statuses (before save)
    const appliedJql = await filtersPage.getJqlFromUrl();
    expect(appliedJql).toContain('status in');
    expect(appliedJql).toContain('Done');
    expect(appliedJql).toContain('Closed');

    // Assertion 2: All returned issues have closed statuses only
    const statuses = await filtersPage.getIssueStatuses();
    for (const status of statuses) {
      expect(CLOSED_STATUSES.map(s => s.toUpperCase())).toContain(status.toUpperCase());
    }

    // Step 2: Save
    await filtersPage.saveAsFilter('Closed Items Filter');

    // Assertion 3: Filter is created and visible
    const isVisible = await filtersPage.isFilterNameVisible('Closed Items Filter');
    expect(isVisible).toBeTruthy();
  });

  test('Validate behavior when filter returns empty results', async ({ page }) => {
    const filtersPage = new FiltersPage(page);
    const jql = 'status = "Open" AND project = "NONEXISTENT_PROJECT_99999"';

    await filtersPage.searchByJql(jql);

    // Assertion 1: No issues are returned
    const issueCount = await filtersPage.getIssueCount();
    expect(issueCount).toBe(0);

    // Assertion 2: Jira displays empty state message
    const noResults = await filtersPage.isNoResultsMessageVisible();
    expect(noResults).toBeTruthy();
  });

});
