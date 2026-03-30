# Jira Filters Automation - Playwright (Jira Cloud)

## Overview

This repository contains both deliverables for the QA Automation assignment:

- **Part A** — Test Plan & Test Cases for the AI-based Issue Search feature in Jira ([View Document](docs/Part-A-Test-Plan-AI-Based-Issue-Search.md))
- **Part B** — Automation framework for Jira Filters workflow using Playwright (this README)

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

The automation includes **two approaches**:

| Approach | How it works | Auth method |
|---|---|---|
| **API tests** (recommended) | Uses Jira REST API directly — no browser needed | API token (Basic Auth) |
| **UI tests** | Browser-based Playwright automation | Account password via browser login |

---

## Tech Stack

- **Playwright** (JavaScript) — Test runner, browser automation, and assertions
- **Jira REST API v3** — API-based filter creation and JQL search
- **Node.js** (v16+) — Runtime environment
- **dotenv** — Environment variable management for credentials

---

## Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)
- A **Jira Cloud** account (atlassian.net)
- Jira credentials: email address + [API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- For UI tests only: your Atlassian account password (API tokens do not work for browser login)

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

3. **Install Playwright browsers** (required for UI tests only):

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

> Generate an [Atlassian API token](https://id.atlassian.com/manage-profile/security/api-tokens) for `JIRA_PASS`. This token is used for REST API authentication (Basic Auth). For UI tests, the login page object uses the account password — update accordingly if running UI tests.

---

## How to Execute the Tests

### API tests (recommended — no browser needed):

```bash
npm run test:api
```

### UI tests (browser-based, requires Playwright browsers installed):

```bash
npm run test:ui
```

### UI tests in headed mode (to see browser actions):

```bash
npm run test:headed
```

### Run all tests (API + UI):

```bash
npm test
```

### View the HTML report after a run:

```bash
npx playwright show-report
```

### Summary of commands:

| Command | What it runs |
|---|---|
| `npm run test:api` | API tests only — fast, no browser, uses API token |
| `npm run test:ui` | UI tests only — browser login + Playwright automation |
| `npm run test:headed` | All tests in headed mode (visible browser) |
| `npm test` | All tests (API + UI) |

---

## Authentication

### API tests

Uses **Basic Auth** with your Atlassian API token (`JIRA_USER` + `JIRA_PASS` from `.env`). No browser or login flow involved. This is the recommended approach.

### UI tests

Uses Playwright's **storageState** pattern:

1. `tests/auth.setup.js` runs first — logs into Jira Cloud via the Atlassian ID login flow
2. The authenticated session (cookies + localStorage) is saved to `playwright/.auth/user.json`
3. All UI test cases reuse the saved session — no repeated logins

The login flow uses role-based selectors (`getByRole`) for resilience against Atlassian UI changes.

> **Note:** Atlassian's browser login requires your account password, not the API token. If your organization uses SSO/SAML, the login page object will need adjustment.

---

## Test Scenarios

### 1. Open Items Filter

- JQL: `status in ("Open", "To Do", "In Progress")`
- **Assertions:**
  - Filter is created and saved successfully
  - JQL criteria match expected open statuses
  - All returned issues have statuses within the allowed open statuses list

### 2. Closed Items Filter

- JQL: `status in ("Done", "Closed")`
- **Assertions:**
  - Filter is created and saved successfully
  - JQL criteria match expected closed statuses
  - All returned issues have statuses within the allowed closed statuses list

### 3. Empty Results Filter

- JQL: `status = "Open" AND project = "NONEXISTENT_PROJECT_99999"`
- **Assertions:**
  - Zero issues are returned
  - (UI) Jira's "no results" message is displayed

---

## Project Structure

```
jira-filter-automation/
├── tests/
│   ├── auth.setup.js             # Authenticates to Jira Cloud, saves session (UI)
│   ├── filters.spec.js           # UI test cases — browser-based filter workflows
│   └── filters-api.spec.js       # API test cases — REST API-based filter validation
├── pages/
│   ├── login.page.js             # Page Object for Atlassian Cloud login (UI)
│   └── filters.page.js           # Page Object for Jira Filters / Issue Navigator (UI)
├── utils/
│   ├── constants.js              # Status lists, priorities, and issue types
│   └── jira-api.js               # Jira REST API client (search, create/get/delete filters)
├── docs/
│   └── Part-A-Test-Plan-AI-Based-Issue-Search.md  # Part A: Test plan + 22 test cases
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── playwright.config.js          # Playwright config with API and UI test projects
├── package.json                  # Node.js dependencies and scripts
└── Readme.MD                     # This file
```

---

## Selector Strategy (UI tests)

| Approach | Used For | Why |
|---|---|---|
| **URL navigation** | JQL search execution | Most stable — avoids fragile JQL editor DOM |
| **Role-based selectors** (`getByRole`) | Login form, save filter dialog | Playwright-recommended, resilient to CSS/ID changes |
| **Data attributes** (`data-issuekey`, `data-testid`) | Issue table rows and status lozenges | Jira Cloud's semantic DOM attributes |

If selectors break due to a Jira Cloud UI update, use Playwright's codegen tool to discover current selectors:

```bash
npx playwright codegen https://your-instance.atlassian.net
```

---

## Assumptions

- The Jira Cloud instance has issues with relevant statuses (Open, To Do, In Progress, Done, Closed)
- The user has permission to create and save filters
- API token has sufficient permissions for REST API operations (search, filter CRUD)
- For UI tests: Atlassian login uses email + password (not SSO/SAML)

---

## Limitations

- Designed for **Jira Cloud only** — not compatible with Jira Server or Data Center
- UI tests depend on Jira Cloud's DOM structure — Atlassian UI updates may require selector adjustments
- SSO/SAML login flows are not supported out of the box for UI tests
- API tokens cannot be used for browser login (Atlassian restriction)
- Tests run sequentially (no parallel execution configured)

---

## Possible Improvements

- Support SSO/SAML login flows for UI tests
- Enable parallel test execution for faster runs
- Add CI/CD pipeline integration (GitHub Actions / Jenkins)
- Add test data setup/teardown via Jira API to avoid dependency on existing issues
