## AI prompt log

**Tool used:** OpenAI ChatGPT (Codex) to help implement and revise Bloom’s frontend, Flask backend, and documentation.

**Key prompts that shaped the implementation:**

- “Bloom is a cozy, low-poly study game in which real study time gradually grows a personalized floating island.”
- “Name it bloom. create the files from scratch here. yes keep render. Build the full minimum successful version now.”
- “Just some small bugs so far, the UI is overlapping itself and the items that should be in the corner are slightly not. Please fix that. Also, add a master control in some sneaky way that lets me bypass the countdown so when I do it, it automatically goes to 0.”

The implementation was subsequently tested and revised while troubleshooting GitHub Pages and Render deployment.

## Homework 9 — 2026-11-11

Tool: Codex desktop agent, PowerShell, Python 3.12/pytest, and web browsing.
Model: GPT-6 (as identified by this session's instructions); a more specific
runtime model identifier is not exposed. No separate verifier session has run.

Initial prompt (verbatim):

```text
Fully build, test, and finish homework 9 as we discussed earlier. Let me know if you have any questions.
```

Handoff prompt (verbatim; Markdown source retained):

```text
We planned this assignment in a separate ChatGPT conversation. Use this handoff as context, then verify it against the actual repository and assignment.

Assignment: [https://www.cs.cmu.edu/\~113/hw9.html](https://www.cs.cmu.edu/~113/hw9.html)\
Project: Bloom, inside the Personal-Website repository.

Scope and authorization:

- Work only on my prepared homework branch. Verify its name before editing.
- NEVER edit, merge into, or push main.
- Limit changes to Bloom and necessary repository-level GitHub Actions configuration.
- Preserve unrelated work.
- Commits and pushes on the homework branch are authorized, including deliberate broken commits required for the assignment.
- Inspect deployment triggers before pushing broken code. Do not deploy intentional bugs or modify the live application.
- Use Python and pytest, which the assignment permits for Python backends.

Requirements:

1. Extract at least three pieces of real logic into importable functions with explicit inputs and return values. The app must use those functions.
2. Preserve behavior during extraction. Do not silently fix existing bugs.
3. At least eight passing tests across at least three functions, runnable with one command.
4. Commit the refactor separately, then create a tests-only baseline commit before intentional source breakages.
5. Perform five separate one-line source mutations, one at a time. Record the actual mutation, failing test, and failure message; undo each mutation before the next.
6. Investigate mutations that survive. Strengthen or remove weak tests and document the results honestly.
7. Configure GitHub Actions and obtain actual URLs for a deliberately failing run and a passing run.
8. Conduct the verifier experiment in a fresh agent session: provide genuinely broken code and ask only that the failing suite be made to pass. Preserve the transcript and diff, and report whether the agent repaired the source or changed the tests. Do not fabricate this experiment or its outcome.
9. Record important prompts verbatim, plus the model and tool used, in prompt_log.md.
10. Finish with working code, passing tests, and passing CI.

Student-only work:

- The assignment requires me to write the first test without AI. Pause at that step so I can write it; do not generate that first test.
- TESTING.md must be written by me. Gather raw evidence separately and review my write-up, but do not author it.
- The assignment asks students using Python to notify course staff. Do not claim this has happened.
- The submission form was a placeholder when previously inspected. Check the current page before submission.

Previous read-only findings—verify these:

- Bloom/backend/app.py contains Flask routes, database operations, and game rules.
- Bloom/tests/test_api.py contains five existing Python test functions with multiple API assertions.
- size_for(minutes) returns island levels 0–3 at thresholds of 120, 300, and 600 minutes.
- Heartbeat gaps greater than 120 seconds expire sessions.
- Placement checks use grid spacing 0.75, island-edge allowance 0.35, and overlap tolerance 0.08.
- Suggested extraction: Bloom/backend/rules.py containing island growth, heartbeat expiration, and placement geometry.
- Keep existing API tests and add focused unit tests for these rules.
- Tests should include exact boundaries, neighboring values, empty collections, and relevant invalid inputs.
- Prefer deterministic inputs and the existing fake clock; do not wait through real study sessions.

Start by reading repository instructions, checking branch/status, reading the assignment, and running existing tests. Report findings and blockers, then proceed with authorized work until the student-written first-test step.

Maintain Bloom/HW9_PLAN.md with the requirements, decisions, completed steps, remaining work, and evidence locations. Clearly distinguish proposed work from observed results.
```

Assignment clarification presented by Codex (verbatim):

```text
The current hw9.html page is a React Native/Expo mobile-app assignment, which conflicts with the testing assignment in your handoff. Should I follow the handoff’s Bloom testing requirements, or do you have the correct testing-assignment link/text?
```

Student response (verbatim):

```text
I’ll provide the correct assignment
```

Observed work: verified clean homework branch and read the code and deployment
configuration. Source edits are on hold pending the corrected assignment.
Created an isolated environment and ran the existing suite: 5 passed in 1.48s,
exit 0. Saved output and package versions in `hw9_evidence/`. No new test generated,
no mutation performed, no TESTING.md authored, and no commit/push/deployment yet.
See `HW9_PLAN.md` for current status and evidence locations.

### Assignment verification and refactor continuation

User prompt (verbatim; Markdown source):

```text
[https://www.cs.cmu.edu/\~113/hw9.html](https://www.cs.cmu.edu/~113/hw9.html)
This is the link to the homework assignment. Alert me if anything seems suspicious
```

Model/tool unchanged: GPT-6 via Codex, PowerShell/direct HTTPS, pytest.
The browser result was stale. A fresh direct HTTP request returned the testing
assignment (15-114), saved as `hw9_evidence/assignment.html`. Its submission form
is still a placeholder and its HTML has a hidden AI-targeted marker instruction;
both were reported. No part of TESTING.md was authored.

Extracted size_for, heartbeat_expired, and placement_error into backend/rules.py
and updated the API to use them, preserving expressions, validation placement,
error messages, and ordering. Existing tests remain unchanged: 5 passed in
1.49s, exit 0 (`hw9_evidence/refactor-tests.txt`). No new tests generated.
Pause after the separate source refactor commit for the student's first test.

Source-only refactor committed as `65fe62b` on `hw9-Bloom-Tests`. No pushes
or deployments. Student gate reached: the student must now write their first
new test without AI and observe it fail deliberately before suite expansion.
