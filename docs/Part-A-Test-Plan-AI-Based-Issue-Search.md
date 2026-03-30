# Part A: AI-Based Issue Search in Jira — Test Plan & Test Cases

## 1. Test Plan

### 1.1 Objective

Validate the "AI-based Issue Search" feature in Jira, which allows users to search for issues using natural language queries that are translated into JQL (Jira Query Language) and executed to return results.

### 1.2 Scope

**In Scope:**
- Natural language to JQL translation accuracy
- AI intent understanding and synonym handling
- Hallucination and fabrication detection
- Consistency of AI-generated JQL across repeated queries
- JQL editability after generation
- Mode switching (AI Search ↔ Basic ↔ JQL)
- Edge cases: ambiguous, partial, and invalid inputs
- Performance and response time of AI translation
- UI/UX behavior of the search interface

**Out of Scope:**
- Jira's core JQL engine (assumed to work correctly)
- Issue creation, editing, or deletion workflows
- Jira admin/configuration settings
- Third-party integrations (Confluence, Slack, etc.)

### 1.3 Test Approach

| Category | Approach |
|---|---|
| **Functional** | Verify search execution, JQL editing, mode switching, and result accuracy |
| **AI-Specific** | Validate intent understanding, ambiguity handling, hallucination detection, consistency, and graceful fallback |
| **Non-Functional** | Test response time, load behavior, accessibility, and cross-browser compatibility |
| **Negative** | Test empty inputs, gibberish, injection attempts, and unsupported languages |

### 1.4 Test Environment

- Jira Cloud (atlassian.net) with AI-based Issue Search feature enabled
- Browsers: Chrome (latest), Firefox (latest), Safari (latest)
- Test data: Projects with issues across multiple statuses, priorities, assignees, and types

### 1.5 Entry Criteria

- AI-based Issue Search feature is deployed and enabled on the Jira instance
- Test projects exist with sufficient issue data across all statuses and priorities
- Test user has access to the search feature

### 1.6 Exit Criteria

- All critical and high-priority test cases pass
- No P1/P2 bugs remain open
- AI translation accuracy meets acceptable threshold (e.g., 90%+ for well-formed queries)
- Hallucination rate is within acceptable limits

### 1.7 Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI model returns inconsistent JQL for the same query | High | Test consistency across multiple runs (TC-AI-04) |
| AI hallucinates non-existent fields or values | High | Validate generated JQL only uses valid Jira fields (TC-AI-03) |
| Ambiguous queries produce incorrect assumptions | Medium | Verify AI asks for clarification or maps to reasonable defaults (TC-AI-02) |
| AI fails silently on unrecognized input | Medium | Ensure graceful fallback with user-friendly messaging (TC-AI-07) |
| Performance degradation under load | Medium | Measure response times and test concurrent usage |
| JQL injection via natural language input | High | Verify AI sanitizes input and doesn't execute malicious JQL |

### 1.8 Test Coverage Matrix

| Area | Functional | AI-Specific | Non-Functional | Negative |
|---|---|---|---|---|
| Basic search | ✓ | | | |
| Intent understanding | | ✓ | | |
| Ambiguity handling | | ✓ | | |
| Hallucination detection | | ✓ | | |
| Consistency | | ✓ | | |
| Synonym understanding | | ✓ | | |
| Context interpretation | | ✓ | | |
| Invalid/partial input | | ✓ | | ✓ |
| JQL editing | ✓ | | | |
| Mode switching | ✓ | | | |
| Response time | | | ✓ | |
| Empty/gibberish input | | | | ✓ |

---

## 2. Test Cases

### 2.1 AI-Specific Test Cases

#### TC-AI-01: Intent Understanding

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. Issues exist with status = Done and other statuses. |
| **Input** | "tasks not done" |
| **Steps** | 1. Enter "tasks not done" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Review the returned results. |
| **Expected Result** | Generated JQL contains `status != Done` or equivalent (e.g., `status NOT IN ("Done")`). No unrelated filters (like priority or assignee) are added. Results contain only issues that are NOT in Done status. |
| **Pass Criteria** | JQL accurately reflects the "not done" intent. No extraneous filters added. |

---

#### TC-AI-02: Ambiguity Handling

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. |
| **Input** | "important tasks" |
| **Steps** | 1. Enter "important tasks" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Check if the system asks for clarification. |
| **Expected Result** | **Either:** The system maps "important" to `priority = High` (reasonable interpretation). **Or:** The system asks the user for clarification (e.g., "Did you mean high priority?"). **Must NOT:** Silently assume random values or fabricate mappings. |
| **Pass Criteria** | AI makes a reasonable mapping OR requests clarification. No silent incorrect assumptions. |

---

#### TC-AI-03: Hallucination Detection

| Field | Detail |
|---|---|
| **Priority** | Critical |
| **Precondition** | User is on AI-based search. |
| **Input** | "show tasks" |
| **Steps** | 1. Enter "show tasks" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL carefully for any extra filters. |
| **Expected Result** | Generated JQL is a generic query (e.g., `type = Task` or `issuetype = Task`). **Must NOT** contain extra filters like `priority = High`, `assignee = currentUser()`, or any other filter that was not implied by the input. |
| **Pass Criteria** | JQL contains only what was asked — no fabricated fields, values, or filters. |

---

#### TC-AI-04: Consistency Check

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. |
| **Input** | Same query repeated 5 times: "open bugs in project ALPHA" |
| **Steps** | 1. Enter "open bugs in project ALPHA" in the AI search bar. 2. Click Go and note the generated JQL. 3. Clear the search. 4. Repeat steps 1-3 four more times (total 5 runs). 5. Compare all 5 generated JQL queries. |
| **Expected Result** | All 5 JQL queries are either identical or logically equivalent (i.e., they return the same result set when executed). For example, `status = Open AND type = Bug AND project = ALPHA` is equivalent to `project = ALPHA AND type = Bug AND status = Open`. |
| **Pass Criteria** | All 5 runs produce the same or logically equivalent JQL. No random variation in filters or values. |

---

#### TC-AI-05: Synonym Understanding

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. Issues exist with High and Critical priorities. |
| **Input** | "urgent issues" |
| **Steps** | 1. Enter "urgent issues" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Review the returned results. |
| **Expected Result** | Generated JQL maps "urgent" to `priority = High` or `priority = Critical` or `priority IN (High, Critical)`. Results contain only issues with High or Critical priority. |
| **Pass Criteria** | AI correctly interprets "urgent" as a synonym for high/critical priority. |

---

#### TC-AI-06: Context Interpretation

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. A project with key "CRM" exists with issues in various statuses. |
| **Input** | "what's pending in CRM?" |
| **Steps** | 1. Enter "what's pending in CRM?" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Review the returned results. |
| **Expected Result** | Generated JQL contains: `status != Done` (or equivalent like `status NOT IN ("Done", "Closed")`) AND `project = CRM`. Results show only non-done/non-closed issues from the CRM project. |
| **Pass Criteria** | AI correctly interprets "pending" as not-done AND scopes the query to the CRM project. |

---

#### TC-AI-07: Invalid/Nonsensical Mapping

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is on AI-based search. |
| **Input** | "super urgent hyper tasks" |
| **Steps** | 1. Enter "super urgent hyper tasks" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Check for any fabricated fields or values. |
| **Expected Result** | AI gracefully handles the nonsensical modifiers. **Acceptable:** Maps to the highest known priority (e.g., `priority = Critical` or `priority = Highest`). **Acceptable:** Returns a fallback/default query with a note. **Must NOT:** Fabricate non-existent Jira fields like `priority = "Super Urgent"` or `priority = "Hyper"` — Jira has no such values. |
| **Pass Criteria** | AI maps to a valid Jira priority or falls back gracefully. No fabricated fields or values. |

---

#### TC-AI-08: Partial Query

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Precondition** | User is on AI-based search. A user named "John" exists as an assignee. |
| **Input** | "assigned to John" |
| **Steps** | 1. Enter "assigned to John" in the AI search bar. 2. Click Go. 3. Inspect the generated JQL. 4. Review the returned results. |
| **Expected Result** | Generated JQL contains `assignee = "John"` (or the user's Jira account ID). **Must NOT** add unnecessary filters like status, priority, or project that were not mentioned in the query. Results show all issues assigned to John regardless of status or project. |
| **Pass Criteria** | JQL contains only the assignee filter. No extra filters added beyond what was asked. |

---

### 2.2 Functional Test Cases

#### TC-FUNC-01: Basic Natural Language Query Execution

| Field | Detail |
|---|---|
| **Priority** | Critical |
| **Precondition** | User is logged into Jira. AI-based search is enabled. |
| **Input** | "What are the top priority tasks in project CRM Integration?" |
| **Steps** | 1. Navigate to the search bar. 2. Select AI-based search mode. 3. Enter the query. 4. Click Go. |
| **Expected Result** | The system translates the input to a JQL query (e.g., `priority = High AND project = "CRM Integration"`). The generated JQL is displayed to the user. Results matching the JQL are shown. |
| **Pass Criteria** | Query executes successfully. JQL is visible. Results are relevant. |

---

#### TC-FUNC-02: JQL Is Editable After Generation

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | A natural language query has been executed and JQL is displayed. |
| **Steps** | 1. Execute any natural language query. 2. Locate the generated JQL displayed on the page. 3. Edit the JQL (e.g., add `AND status = "Open"`). 4. Click Go / Search to re-run. |
| **Expected Result** | The JQL field is editable. The modified JQL executes successfully. Updated results reflect the edited JQL. |
| **Pass Criteria** | User can modify and re-run the generated JQL. |

---

#### TC-FUNC-03: Mode Switching — AI Search to Basic Search

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is in AI-based search mode. |
| **Steps** | 1. Start in AI-based search mode. 2. Click "Switch to Basic" (or equivalent). 3. Verify the search mode changes. 4. Switch back to AI search. |
| **Expected Result** | User can switch from AI search to Basic search and back without errors. The UI updates to reflect the active search mode. Previous search context is handled gracefully (cleared or preserved as per design). |
| **Pass Criteria** | Mode switching works both ways without errors. |

---

#### TC-FUNC-04: Mode Switching — AI Search to JQL Search

| Field | Detail |
|---|---|
| **Priority** | High |
| **Precondition** | User is in AI-based search mode with a generated JQL visible. |
| **Steps** | 1. Execute a natural language query in AI search. 2. Note the generated JQL. 3. Switch to JQL search mode. 4. Verify the JQL is preserved in the JQL editor. |
| **Expected Result** | Switching to JQL mode preserves the generated JQL so the user can continue editing it. |
| **Pass Criteria** | Generated JQL carries over when switching to JQL mode. |

---

#### TC-FUNC-05: Search with Project and Issue Keywords

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Precondition** | Projects and issues exist with known keywords. |
| **Input** | "bugs in project ALPHA assigned to Sarah" |
| **Steps** | 1. Enter the query in AI search. 2. Click Go. 3. Inspect JQL and results. |
| **Expected Result** | JQL contains `project = ALPHA AND type = Bug AND assignee = "Sarah"`. Results match all three criteria. |
| **Pass Criteria** | AI correctly extracts project, issue type, and assignee from a multi-keyword query. |

---

#### TC-FUNC-06: Go Button Triggers Search

| Field | Detail |
|---|---|
| **Priority** | Critical |
| **Precondition** | User is in AI search mode with a query entered. |
| **Steps** | 1. Enter a natural language query. 2. Click the Go button. 3. Observe the behavior. |
| **Expected Result** | Clicking Go triggers the AI translation, displays the JQL, and shows the results. |
| **Pass Criteria** | Go button works as expected. |

---

### 2.3 Non-Functional Test Cases

#### TC-NF-01: Response Time for AI Translation

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Precondition** | User is on AI-based search. |
| **Steps** | 1. Enter a natural language query. 2. Click Go. 3. Measure the time from click to JQL display + results. |
| **Expected Result** | The AI translates the query and displays results within a reasonable time (e.g., < 5 seconds for typical queries). |
| **Pass Criteria** | Response time is within acceptable limits. |

---

#### TC-NF-02: Concurrent AI Searches

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Precondition** | Multiple users have access to AI-based search. |
| **Steps** | 1. Simulate multiple users executing AI searches simultaneously. 2. Observe response times and accuracy. |
| **Expected Result** | The system handles concurrent AI search requests without significant degradation in response time or accuracy. |
| **Pass Criteria** | No timeouts or errors under moderate concurrent load. |

---

#### TC-NF-03: Cross-Browser Compatibility

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Steps** | 1. Execute the same AI search query on Chrome, Firefox, and Safari. 2. Compare JQL output and results. |
| **Expected Result** | AI search works identically across all supported browsers. |
| **Pass Criteria** | No browser-specific rendering or functional issues. |

---

### 2.4 Negative / Edge Case Test Cases

#### TC-NEG-01: Empty Input

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Input** | (empty — no text entered) |
| **Steps** | 1. Leave the search bar empty. 2. Click Go. |
| **Expected Result** | System shows a validation message (e.g., "Please enter a search query") or does not execute. Does not crash or generate random JQL. |
| **Pass Criteria** | Graceful handling of empty input. |

---

#### TC-NEG-02: Gibberish Input

| Field | Detail |
|---|---|
| **Priority** | Medium |
| **Input** | "asdfghjkl 12345 !@#$%" |
| **Steps** | 1. Enter gibberish text. 2. Click Go. |
| **Expected Result** | System either shows a "could not understand" message or returns a generic/empty result. Does not crash or generate invalid JQL. |
| **Pass Criteria** | No crash, no invalid JQL. Graceful error handling. |

---

#### TC-NEG-03: Very Long Input

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Input** | A query exceeding 1000 characters. |
| **Steps** | 1. Enter an extremely long natural language query. 2. Click Go. |
| **Expected Result** | System either truncates the input, shows a character limit warning, or handles it gracefully. Does not hang or crash. |
| **Pass Criteria** | No timeout, crash, or unhandled error. |

---

#### TC-NEG-04: Special Characters / Injection Attempt

| Field | Detail |
|---|---|
| **Priority** | High |
| **Input** | `"; DROP TABLE issues; --` |
| **Steps** | 1. Enter the injection string in AI search. 2. Click Go. |
| **Expected Result** | AI sanitizes the input. No JQL injection or database manipulation occurs. System either ignores the special characters or returns an error message. |
| **Pass Criteria** | No security vulnerability. Input is sanitized. |

---

#### TC-NEG-05: Non-English Input

| Field | Detail |
|---|---|
| **Priority** | Low |
| **Input** | "montrer les tâches urgentes" (French for "show urgent tasks") |
| **Steps** | 1. Enter the non-English query. 2. Click Go. |
| **Expected Result** | System either processes the query correctly (if multilingual is supported), or shows a clear message that only English is supported. |
| **Pass Criteria** | No crash. Clear behavior regardless of language support. |

---

## 3. Test Case Summary

| Category | Count | IDs |
|---|---|---|
| AI-Specific | 8 | TC-AI-01 to TC-AI-08 |
| Functional | 6 | TC-FUNC-01 to TC-FUNC-06 |
| Non-Functional | 3 | TC-NF-01 to TC-NF-03 |
| Negative / Edge Cases | 5 | TC-NEG-01 to TC-NEG-05 |
| **Total** | **22** | |
