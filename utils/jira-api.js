require('dotenv').config();

const JIRA_URL = process.env.JIRA_URL;
const JIRA_USER = process.env.JIRA_USER;
const JIRA_PASS = process.env.JIRA_PASS;

const headers = {
  'Authorization': `Basic ${Buffer.from(`${JIRA_USER}:${JIRA_PASS}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Search issues using JQL via Jira REST API.
 * @param {string} jql - JQL query string
 * @param {string[]} [fields=['status','summary']] - Fields to return
 * @returns {Promise<{total: number, issues: Array}>}
 */
async function searchByJql(jql, fields = ['status', 'summary']) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/search/jql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jql, fields, maxResults: 50 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`JQL search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    issues: data.issues || [],
    isLast: data.isLast,
  };
}

/**
 * Extract status names from search results.
 * @param {Array} issues - Issues array from searchByJql
 * @returns {string[]}
 */
function getStatusNames(issues) {
  return issues.map(issue => issue.fields.status.name);
}

/**
 * Create a saved Jira filter.
 * @param {string} name - Filter name
 * @param {string} jql - JQL query
 * @returns {Promise<{id: string, name: string, jql: string}>}
 */
async function createFilter(name, jql) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/filter`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, jql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create filter failed (${res.status}): ${body}`);
  }

  return await res.json();
}

/**
 * Get a filter by ID.
 * @param {string} filterId
 * @returns {Promise<{id: string, name: string, jql: string}>}
 */
async function getFilter(filterId) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/filter/${filterId}`, { headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Get filter failed (${res.status}): ${body}`);
  }

  return await res.json();
}

/**
 * Delete a filter by ID (for test cleanup).
 * @param {string} filterId
 */
async function deleteFilter(filterId) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/filter/${filterId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Delete filter failed (${res.status}): ${body}`);
  }
}

/**
 * Remove a filter from the user's starred/favourites list.
 * Jira Cloud REST API: DELETE /rest/api/3/filter/{id}/favourite
 * @param {string} filterId
 */
async function unstarFilter(filterId) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/filter/${filterId}/favourite`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Unstar filter failed (${res.status}): ${body}`);
  }
}

/**
 * Get all filters owned by the current user (for cleanup).
 * @param {string} namePrefix - Filter name prefix to match
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function getMyFilters(namePrefix) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/filter/my`, { headers });

  if (!res.ok) {
    return [];
  }

  const filters = await res.json();
  if (namePrefix) {
    return filters.filter(f => f.name.startsWith(namePrefix));
  }
  return filters;
}

module.exports = { searchByJql, getStatusNames, createFilter, getFilter, deleteFilter, unstarFilter, getMyFilters };
