# Study Rooms — Unit Testing Plan

**Author:** Christian Molina
**Date:** 2026-04-24
**Sprint:** 3
**Framework:** Vitest + React Testing Library (frontend)

---

## Overview

This plan covers **3 unit tests** targeting the Study Room feature's React
components. Each test file exercises component methods, prop-driven rendering
using object fields, and return values — meeting the requirement for testing
"classes, methods, or API calls and similarly complex code structures."

All tests mock external dependencies (Firebase, services) so they run in
isolation with zero network calls.

---

## Test 1 — `ChatArea.test.jsx`

**Component under test:** `src/components/rooms/ChatArea.jsx`

### What is being tested

| # | Test Case | Method / Logic | Fields & Return Values |
|---|-----------|---------------|----------------------|
| 1a | Renders each message's sender name, text, and formatted timestamp | `formatTime(date)` returns locale time string; `getInitials(name)` returns uppercase initials | Asserts `message.sender`, `message.text`, `message.timestamp` fields appear in DOM |
| 1b | `getInitials()` extracts correct avatar initials from multi-word names | `getInitials("John Doe")` → `"JD"` | Return value verified via rendered avatar element |
| 1c | Submitting the form calls `onSend` with the trimmed message and clears the input | `handleSend(e)` invokes the `onSend` callback prop and resets state | `onSend` receives the message string; input value returns to `""` |

### Why this component

`ChatArea` contains two **pure helper methods** (`formatTime`, `getInitials`)
with clear return values, a **state-driven form** (`handleSend` manages input
state), and renders a list of **message objects** whose fields (`sender`,
`text`, `timestamp`) drive the UI. It also has conditional rendering for the
empty-messages state.

### Mocking strategy

- Props: pass mock `messages` array and `onSend` as `vi.fn()`
- No Firebase or service imports to mock

---

## Test 2 — `SharedDocumentPanel.test.jsx`

**Component under test:** `src/components/rooms/SharedDocumentPanel.jsx`

### What is being tested

| # | Test Case | Method / Logic | Fields & Return Values |
|---|-----------|---------------|----------------------|
| 2a | Renders document list using `fileName`, `fileType`, and `uploaderName` fields | Component iterates `documents` prop array | Asserts each document's `fileName` and `uploaderName` appear in the DOM |
| 2b | `getFileIcon()` and `getFileColor()` return correct values per file type | `getFileIcon("pdf")` returns `FileText` component; `getFileColor("pdf")` returns red CSS classes | Verified indirectly — correct icon rendered and correct color class applied to DOM element |
| 2c | Upload button is disabled when `user.uid` is falsy | Button `disabled` attribute is derived from `!user?.uid` prop | `expect(button).toBeDisabled()` when user is `null` or missing `uid` |

### Why this component

`SharedDocumentPanel` has two **pure mapping methods** (`getFileIcon`,
`getFileColor`) that return component references and CSS class strings based on
a `fileType` field. It renders a **document object array** whose fields
(`fileName`, `fileType`, `uploaderName`, `uploadedAt`, `status`) are displayed
in the UI. The upload button's disabled state depends on the `user` prop
object's `uid` field.

### Mocking strategy

- Mock `uploadRoomDocument` from `../../services/roomService` via `vi.mock()`
- Props: pass mock `documents` array, `roomId` string, and `user` object
- No actual Firebase Storage or Firestore calls

---

## Test 3 — `RoomLobby.test.jsx`

**Component under test:** `src/components/rooms/RoomLobby.jsx`

### What is being tested

| # | Test Case | Method / Logic | Fields & Return Values |
|---|-----------|---------------|----------------------|
| 3a | Renders room `name`, `description`, and `inviteCode` from the `room` prop object | Component reads fields from `room` prop | Asserts `room.name`, `room.description`, `room.inviteCode` text appears in DOM |
| 3b | `getInitials()` returns correct uppercase initials for member avatars | `getInitials("Alice Bob")` → `"AB"` | Return value verified through rendered avatar text content |
| 3c | Owner sees the remove button for non-host members; non-owner does not | Permission derived from `members` array: `currentUserIsOwner = members.some(m => m.id === currentUserId && m.isHost)` and `canRemove = currentUserIsOwner && !member.isHost` | Asserts remove button present/absent based on `member.isHost` and `currentUserId` fields |

### Why this component

`RoomLobby` renders **room metadata fields** (`name`, `description`,
`inviteCode`) and iterates a **members array** whose objects contain `id`,
`name`, `isHost`, and `isOnline` fields. It computes **permission flags**
(`currentUserIsOwner`, `canRemove`) from those fields — this is role-based
access logic that should be tested. The `getInitials` method is reused across
components but is defined locally.

### Mocking strategy

- Mock `navigator.clipboard.writeText` via `vi.fn()` (for copy button tests)
- Props: pass mock `room` object, `members` array, `currentUserId`, and
  `onRemoveMember` as `vi.fn()`
- No Firebase imports to mock

---

## Test Infrastructure

| Setting | Value |
|---------|-------|
| Test runner | Vitest 4.1.3 |
| DOM environment | jsdom |
| Setup file | `src/test/setup.js` (imports `@testing-library/jest-dom`) |
| Global mode | `true` (no explicit `import { describe, it }`) |
| Run command | `npx vitest run src/components/rooms/tests/` |

### Existing patterns followed

These tests follow the conventions established by:
- `src/components/quiz/tests/QuizGenerator.test.jsx` — multi-step component testing
- `src/components/file-upload/tests/DocumentCard.test.jsx` — prop-driven rendering + state machines
- `src/hooks/tests/useDocuments.test.js` — mock services, async assertions

---

## File Structure

```
src/components/rooms/tests/
  TESTING_PLAN.md               ← this file (Jira Task 1)
  TEST_RESULTS.md               ← execution evidence (Jira Task 2)
  ChatArea.test.jsx             ← Test 1
  SharedDocumentPanel.test.jsx  ← Test 2
  RoomLobby.test.jsx            ← Test 3
```
