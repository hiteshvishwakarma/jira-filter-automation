const { test, expect } = require('@playwright/test');
const { searchByJql, getStatusNames, createFilter, getFilter, deleteFilter } = require('../utils/jira-api');
const { OPEN_STATUSES, CLOSED_STATUSES } = require('../utils/constants');

// These tests use the Jira REST API directly — no browser login required.
// Auth uses Basic Auth with the API token from .env (JIRA_USER + JIRA_PASS).
test.use({ storageState: undefined }); // no browser auth needed

test.describe('Jira Filters — API', () => {
  const createdFilterIds = [];

  test.afterAll(async () => {
    // Clean up any filters created during tests
    for (const id of createdFilterIds) {
      await deleteFilter(id).catch(() => {});
    }
  });

  test('Create and validate Open Items Filter via API', async () => {
    const jql = 'status in ("Open", "To Do", "In Progress")';

    // Step 1: Search issues with JQL
    const results = await searchByJql(jql);

    // Step 2: Create a saved filter
    const filter = await createFilter('Open Items Filter (API)', jql);
    createdFilterIds.push(filter.id);

    expect(filter.name).toBe('Open Items Filter (API)');
    expect(filter.jql).toBe(jql);

    // Step 3: Verify filter is retrievable
    const fetched = await getFilter(filter.id);
    expect(fetched.name).toBe('Open Items Filter (API)');
    expect(fetched.jql).toBe(jql);

    // Step 4: All returned issues should have open statuses
    const statuses = getStatusNames(results.issues);
    for (const status of statuses) {
      expect(OPEN_STATUSES).toContain(status);
    }
  });

  test('Create and validate Closed Items Filter via API', async () => {
    const jql = 'status in ("Done", "Closed")';

    const results = await searchByJql(jql);

    const filter = await createFilter('Closed Items Filter (API)', jql);
    createdFilterIds.push(filter.id);

    expect(filter.name).toBe('Closed Items Filter (API)');
    expect(filter.jql).toBe(jql);

    const fetched = await getFilter(filter.id);
    expect(fetched.name).toBe('Closed Items Filter (API)');

    const statuses = getStatusNames(results.issues);
    for (const status of statuses) {
      expect(CLOSED_STATUSES).toContain(status);
    }
  });

  test('Validate empty results for non-existent project via API', async () => {
    const jql = 'status = "Open" AND project = "NONEXISTENT_PROJECT_99999"';

    const results = await searchByJql(jql);
    expect(results.issues).toHaveLength(0);
  });
});
