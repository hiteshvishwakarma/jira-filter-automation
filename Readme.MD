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
| **UI tests** | Browser-based Playwright automation | Session-based (manual login once) |

---

## Tech Stack

- **Playwright** (JavaScript) — Test runner, browser automation, and assertions
- **Jira REST API v3** — API-based filter creation and JQL search
- **Allure** — Rich test reporting with history, trends, and categorization
- **Node.js** (v16+) — Runtime environment
- **dotenv** — Environment variable management for credentials

---

## Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)
- A **Jira Cloud** account (atlassian.net)
- Jira credentials: email address + [API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- (Optional) [Allure CLI](https://allurereport.org/docs/install/) for rich test reports — install via `brew install allure` (macOS)

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

> Generate an [Atlassian API token](https://id.atlassian.com/manage-profile/security/api-tokens) for `JIRA_PASS`. This token is used for REST API authentication (Basic Auth).

---

## How to Execute the Tests

### API tests (recommended — no browser needed):

```bash
npm run test:api
```

### UI tests (requires one-time auth first):

```bash
npm run auth        # one-time: opens Chrome, you log in manually
npm run test:ui     # runs UI tests using saved session
```

### UI tests in headed mode (to see browser actions):

```bash
npm run test:headed
```

### Run all tests (API + UI):

```bash
npm test
```

### Summary of commands:

| Command | What it does |
|---|---|
| `npm run auth` | One-time: opens Chrome for manual login, saves session |
| `npm run test:api` | API tests only — fast, no browser, uses API token |
| `npm run test:ui` | UI tests only — uses saved session from `npm run auth` |
| `npm run test:headed` | All tests in headed mode (visible browser) |
| `npm test` | All tests (API + UI) |
| `npm run report` | Generate and open Allure report |

---

## Test Reporting

This project uses **two reporters** that run simultaneously:

### Playwright HTML Report

Auto-opens in the browser after every test run. Shows pass/fail, screenshots on failure, and video recordings.

```bash
npx playwright show-report    # re-open the last report
```

### Allure Report

Rich, interactive report with test history, trends, timing charts, categorized failures, and attachments. Ideal for tracking non-deterministic AI test behavior across runs.

```bash
npm run report                # generate and open Allure report
```

> **Note:** Allure CLI must be installed separately: `brew install allure` (macOS) or see [Allure installation docs](https://allurereport.org/docs/install/).

**Why Allure?** Standard pass/fail reporting is insufficient for AI-powered features where outputs are non-deterministic. Allure provides:
- **Historical trends** — track consistency of AI-generated JQL across runs
- **Categorized failures** — distinguish hallucination vs wrong mapping vs timeout
- **Attachments** — capture AI input/output pairs for debugging
- **Retries tracking** — see which tests needed retries and why

---

## Authentication

### API tests

Uses **Basic Auth** with your Atlassian API token (`JIRA_USER` + `JIRA_PASS` from `.env`). No browser or login flow involved. This is the recommended approach.

### UI tests (session-based — like AWS CLI / Claude CLI)

Works the same way as CLI tools like `aws configure` or `claude login`:

1. **Authenticate once:** Run `npm run auth` — Chrome opens, you log in manually using any method (Google, SSO, password, passkey — doesn't matter)
2. **Session saved:** Your cookies and localStorage are saved to `playwright/.auth/user.json`
3. **Tests reuse it:** All subsequent `npm run test:ui` runs use the saved session — no login needed
4. **Session validated:** Before running UI tests, the auth setup verifies the session is still valid by hitting Jira — if expired, it tells you to run `npm run auth` again
5. **Re-authenticate when expired:** When your session expires, run `npm run auth` again

This approach is **team-friendly** — every team member authenticates with their own account using whatever login method their organization requires (SSO, Google, password). No shared passwords, no automated login to break.

---

## Test Scenarios

### 1. Open Items Filter

- JQL: `status in ("Open", "To Do", "In Progress")`
- **Assertions:**
  - JQL criteria in URL match expected open statuses
  - All returned issues have statuses within the allowed open statuses list (case-insensitive)
  - Filter is created and saved successfully

### 2. Closed Items Filter

- JQL: `status in ("Done", "Closed")`
- **Assertions:**
  - JQL criteria in URL match expected closed statuses
  - All returned issues have statuses within the allowed closed statuses list (case-insensitive)
  - Filter is created and saved successfully

### 3. Empty Results Filter

- JQL: `status = "Open" AND project = "NONEXISTENT_PROJECT_99999"`
- **Assertions:**
  - Zero issues are returned
  - (UI) Jira's empty state message is displayed

---

## Project Structure

```
jira-filter-automation/
├── tests/
│   ├── auth.setup.js             # Validates saved auth session before UI tests
│   ├── filters.spec.js           # UI test cases — browser-based filter workflows
│   └── filters-api.spec.js       # API test cases — REST API-based filter validation
├── pages/
│   ├── login.page.js             # Page Object for Atlassian Cloud login (UI)
│   └── filters.page.js           # Page Object for Jira Filters / Issue Navigator (UI)
├── utils/
│   ├── constants.js              # Status lists, priorities, and issue types
│   └── jira-api.js               # Jira REST API client (search, create/get/delete filters)
├── scripts/
│   └── auth.js                   # One-time auth script — opens Chrome for manual login
├── docs/
│   └── Part-A-Test-Plan-AI-Based-Issue-Search.md  # Part A: Test plan + 22 test cases
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── playwright.config.js          # Playwright config with Allure + HTML reporters
├── package.json                  # Node.js dependencies and scripts
└── Readme.MD                     # This file
```

---

## Selector Strategy (UI tests)

| Approach | Used For | Why |
|---|---|---|
| **URL navigation** | JQL search execution | Most stable — avoids fragile JQL editor DOM |
| **Role-based selectors** (`getByRole`) | Save filter dialog, status buttons | Playwright-recommended, resilient to CSS/ID changes |
| **Text patterns** | Status extraction (`"To Do - Change status"` -> `"To Do"`) | Matches Jira Cloud's current DOM structure |

If selectors break due to a Jira Cloud UI update, use Playwright's codegen tool to discover current selectors:

```bash
npx playwright codegen https://your-instance.atlassian.net
```

---

## Assumptions

- The Jira Cloud instance has issues with relevant statuses (Open, To Do, In Progress, Done, Closed)
- The user has permission to create and save filters
- API token has sufficient permissions for REST API operations (search, filter CRUD)
- Status comparison is case-insensitive (Jira Cloud may render statuses in different cases)

---

## Limitations

- Designed for **Jira Cloud only** — not compatible with Jira Server or Data Center
- UI tests depend on Jira Cloud's DOM structure — Atlassian UI updates may require selector adjustments
- API tokens cannot be used for browser login (Atlassian restriction) — UI tests use session-based auth
- Tests run sequentially (no parallel execution configured)
- Allure CLI must be installed separately for rich reporting

---

## Possible Improvements

- Enable parallel test execution for faster runs
- Add CI/CD pipeline integration (GitHub Actions / Jenkins) with Allure report publishing
- Add test data setup/teardown via Jira API to avoid dependency on existing issues
- Add AI-specific test automation for Part A scenarios (intent understanding, hallucination detection, consistency checks)
