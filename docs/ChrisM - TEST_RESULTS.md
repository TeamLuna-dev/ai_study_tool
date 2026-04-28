# Study Rooms — Test Execution & Results

**Author:** Christian Molina
**Date:** 2026-04-24
**Sprint:** 3
**Framework:** Vitest 4.1.3 + React Testing Library

---

## How to Reproduce

```bash
# From the project root:
npx vitest run src/components/rooms/tests/
```

For an HTML report (optional):

```bash
npx vitest run src/components/rooms/tests/ --reporter=verbose
```

---

## Test Results

> This section will be populated after test execution.

### Summary

| Metric | Value |
|--------|-------|
| Total test suites | — |
| Passed suites | — |
| Failed suites | — |
| Total tests | — |
| Passed tests | — |
| Failed tests | — |
| Run time | — |

---

### Test 1 — `ChatArea.test.jsx`

**Status:** PENDING

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1a | Renders message sender, text, and timestamp | — | — |
| 1b | getInitials returns correct avatar initials | — | — |
| 1c | Form submit calls onSend and clears input | — | — |

---

### Test 2 — `SharedDocumentPanel.test.jsx`

**Status:** PENDING

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 2a | Renders document fileName and uploaderName fields | — | — |
| 2b | File icon and color map correctly per file type | — | — |
| 2c | Upload button disabled when user.uid is falsy | — | — |

---

### Test 3 — `RoomLobby.test.jsx`

**Status:** PENDING

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 3a | Renders room name, description, and inviteCode | — | — |
| 3b | getInitials returns correct initials for members | — | — |
| 3c | Owner sees remove button; non-owner does not | — | — |

---

### Console Output

```
(paste full vitest output here after execution)
```

---

### Screenshot / Report

> Attach a screenshot of the terminal output or HTML report here after running
> the tests. If using Vitest's HTML reporter, the report is generated at
> `html/index.html` in the project root.
