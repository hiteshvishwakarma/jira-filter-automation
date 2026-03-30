# Jira Filters Automation - Playwright (Jira Cloud)

## Overview

This repository contains both deliverables for the QA Automation assignment:

- **Part A** — Test Plan & Test Cases for the AI-based Issue Search feature in Jira ([View Document](docs/Part-A-Test-Plan-AI-Based-Issue-Search.md))
- **Part B** — UI automation framework for Jira Filters workflow using Playwright (this README)

> **Note:** This project is designed and tested for **Jira Cloud** only. It is not compatible with Jira Server or Jira Data Center, which have a different UI and DOM structure.

### Part A: AI-Based Issue Search — Test Plan & Test Cases

The complete test plan and 22 test cases (8 AI-specific, 6 functional, 3 non-functional, 5 negative/edge cases) are documented in:

**[docs/Part-A-Test-Plan-AI-Based-Issue-Search.md](docs/Part-A-Test-Plan-AI-Based-Issue-Search.md)**

Covers intent understanding, hallucination detection, consistency checks, ambiguity handling, synonym understanding, and more.

### Part B: Jira Filters Automation — What it validates

- Filter is created and saved successfully
- JQL criteria match expected open/closed statuses
- The returned issue list contains items with correct statuses only
- Behavior when filter results are empty (no matching issues)

---

## Tech Stack

- **Playwright** (JavaScript) — Browser automation and assertions
- **Node.js** (v16+) — Runtime environment
- **dotenv** — Environment variable management for credentials

---

## Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)
- A **Jira Cloud** account (atlassian.net)
- Jira credentials: email address + [API token](https://id.atlassian.com/manage-profile/security/api-tokens)

---

## Setup Steps

1. **Clone the repository:**

```bash
git clone <your-repo-url>
cd jira-filter-automation
```

2. **Install dependencies:**

```bash
npm install
```

3. **Install Playwright browsers:**

```bash
npx playwright install
```

4. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your Jira Cloud credentials:

```
JIRA_URL=https://your-instance.atlassian.net
JIRA_USER=your-email@example.com
JIRA_PASS=your-api-token
```

> Use an [Atlassian API token](https://id.atlassian.com/manage-profile/security/api-tokens) as the password — not your account password.

---

## How to Execute the Tests

Run all tests (headless):

```bash
npm test
```

Run in headed mode (to see browser actions):

```bash
npm run test:headed
```

Run a specific test file:

```bash
npx playwright test tests/filters.spec.js
```

View the HTML report after a run:

```bash
npx playwright show-report
```

---

## Authentication Approach

This project uses Playwright's recommended **storageState** pattern:

1. `tests/auth.setup.js` runs first — logs into Jira Cloud via the Atlassian ID login flow (`id.atlassian.com`)
2. The authenticated session (cookies + localStorage) is saved to `playwright/.auth/user.json`
3. All test cases reuse the saved session — no repeated logins, faster execution

The login flow uses stable Atlassian Cloud selectors (`#username`, `#password`, `#login-submit`) that are consistent across all Atlassian Cloud products.

---

## Test Scenarios

### 1. Open Items Filter

- Executes JQL:
  ```
  status in ("Open", "To Do", "In Progress")
  ```
- **Assertions:**
  - Filter is created and visible by name
  - JQL in the URL contains the expected open status values
  - All returned issues have statuses within the allowed open statuses list

### 2. Closed Items Filter

- Executes JQL:
  ```
  status in ("Done", "Closed")
  ```
- **Assertions:**
  - Filter is created and visible by name
  - JQL in the URL contains the expected closed status values
  - All returned issues have statuses within the allowed closed statuses list

### 3. Empty Results Filter

- Executes JQL targeting a non-existent project:
  ```
  status = "Open" AND project = "NONEXISTENT_PROJECT_99999"
  ```
- **Assertions:**
  - Zero issues are returned
  - Jira's "no results" message is displayed

---

## Project Structure

```
jira-filter-automation/
├── tests/
│   ├── auth.setup.js             # Authenticates to Jira Cloud, saves session
│   └── filters.spec.js           # Test cases for Jira filter workflows
├── pages/
│   ├── login.page.js             # Page Object for Atlassian Cloud login
│   └── filters.page.js           # Page Object for Jira Filters / Issue Navigator
├── utils/
│   └── constants.js              # Status lists, priorities, and issue types
├── docs/
│   └── Part-A-Test-Plan-AI-Based-Issue-Search.md  # Part A: Test plan + 22 test cases
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── playwright.config.js          # Playwright config with auth setup project
├── package.json                  # Node.js dependencies and scripts
└── Readme.MD                     # This file
```

---

## Selector Strategy

This project uses the following selector strategies for Jira Cloud, ordered by stability:

| Approach | Used For | Why |
|---|---|---|
| **URL navigation** | JQL search execution | Most stable — avoids fragile JQL editor DOM |
| **Stable IDs** (`#username`, `#password`) | Atlassian login | Consistent across all Atlassian Cloud products |
| **Role-based selectors** (`getByRole`) | Save filter dialog | Playwright-recommended, resilient to CSS changes |
| **Data attributes** (`data-issuekey`, `data-testid`) | Issue table rows and status lozenges | Jira Cloud's semantic DOM attributes |

If selectors break due to a Jira Cloud UI update, use Playwright's codegen tool to discover current selectors:

```bash
npx playwright codegen https://your-instance.atlassian.net
```

---

## Assumptions

- The Jira Cloud instance has issues with relevant statuses (Open, To Do, In Progress, Done, Closed)
- The user has permission to create and save filters
- Atlassian login uses email + password/API token (not SSO/SAML — if your org uses SSO, the login page object will need adjustment)

---

## Limitations

- Designed for **Jira Cloud only** — not compatible with Jira Server or Data Center
- Validation is UI-based only (no API-level verification)
- Dependent on Jira Cloud's DOM structure — Atlassian UI updates may require selector adjustments
- SSO/SAML login flows are not supported out of the box
- Tests run sequentially (no parallel execution configured)

---

## Possible Improvements

- Add Jira REST API validation alongside UI assertions for stronger coverage
- Support SSO/SAML login flows
- Enable parallel test execution for faster runs
- Add CI/CD pipeline integration (GitHub Actions / Jenkins)
- Add test data setup/teardown via Jira API to avoid dependency on existing issues
