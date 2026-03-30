const { test, expect } = require('@playwright/test');
const FiltersPage = require('../pages/filters.page');
const { deleteFilter, unstarFilter, getMyFilters } = require('../utils/jira-api');
const { OPEN_STATUSES, CLOSED_STATUSES } = require('../utils/constants');

// Prefix for all test-created filters — used for cleanup
const FILTER_PREFIX = 'AutoTest_';

test.describe('Jira Filters Automation', () => {

  test.afterAll(async () => {
    // Find and delete all filters created by these tests via API
    const testFilters = await getMyFilters(FILTER_PREFIX).catch(() => []);
    for (const filter of testFilters) {
      await unstarFilter(filter.id).catch(() => {});
      await deleteFilter(filter.id).catch(() => {});
    }
  });

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

    // Assertion 2: Results must exist — empty results would silently skip validation
    const statuses = await filtersPage.getIssueStatuses();
    expect(statuses.length).toBeGreaterThan(0);

    // Assertion 3: All returned issues have open statuses only
    for (const status of statuses) {
      expect(OPEN_STATUSES.map(s => s.toUpperCase())).toContain(status.toUpperCase());
    }

    // Step 2: Save the search as a named filter
    const filterName = `${FILTER_PREFIX}Open Items Filter ${Date.now()}`;
    await filtersPage.saveAsFilter(filterName);

    // Assertion 4: Filter is created and visible on the page
    const isVisible = await filtersPage.isFilterNameVisible(filterName);
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

    // Assertion 2: Results must exist
    const statuses = await filtersPage.getIssueStatuses();
    expect(statuses.length).toBeGreaterThan(0);

    // Assertion 3: All returned issues have closed statuses only
    for (const status of statuses) {
      expect(CLOSED_STATUSES.map(s => s.toUpperCase())).toContain(status.toUpperCase());
    }

    // Step 2: Save with unique name
    const filterName = `${FILTER_PREFIX}Closed Items Filter ${Date.now()}`;
    await filtersPage.saveAsFilter(filterName);

    // Assertion 4: Filter is created and visible
    const isVisible = await filtersPage.isFilterNameVisible(filterName);
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
