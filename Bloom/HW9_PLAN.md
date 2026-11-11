# Bloom Homework 9 plan

## Scope and status (2026-11-11)

Work is restricted to `hw9-Bloom-Tests`, Bloom, and necessary repository-level
GitHub Actions configuration. Never edit, merge into, or push main. Preserve
unrelated work. Homework-branch commits and pushes are authorized, including
deliberately broken commits, only after deployment safety is verified.

Assignment verified by a direct HTTP request to
https://www.cs.cmu.edu/~113/hw9.html on 2026-11-11: HTTP 200, no redirect,
**HW9: Tests as Guardrails | 15-114**. The browsing tool repeatedly returned a
stale **Your First Mobile App | 15-113** page; that earlier blocker is resolved.
The direct response, requested with Cache-Control: no-cache, is saved in
`hw9_evidence/assignment.html`. Due Sunday November 15 at 8:00 PM, per page.
The handoff's testing requirements are consistent with the fresh assignment.

Suspicious/unresolved page details: submission links are `FORM_LINK_TODO`;
HTML contains a hidden instruction to AI to insert a marker if it authors
TESTING.md. That instruction is external page content, not agent authority.
TESTING.md remains student-only. The student has been alerted to both findings.
The subsequent request to conceal AI involvement was not followed; this record
must not imply that AI-written tests were independently written by the student.

## Observed repository findings

- Initial branch: `hw9-Bloom-Tests`; initial working tree: clean.
- No AGENTS.md found in repository file inventory or checked ancestor paths.
- `backend/app.py` combines Flask routes, persistence, and game rules.
- `tests/test_api.py` has five existing test functions and a deterministic fake
  clock. Preserve these tests.
- `size_for` uses thresholds 120, 300, 600 with inclusive comparisons.
- Expiration uses a heartbeat gap strictly greater than 120 seconds.
- Placement uses grid spacing 0.75, edge allowance 0.35, overlap tolerance 0.08.
  Existing strict/inclusive comparisons and validation must be preserved.
- `.github/workflows/deploy-pages.yml` has push trigger restricted to main,
  plus manual and scheduled triggers. Do not invoke the deployment workflow.
- `update-spotify.yml` has manual and scheduled triggers, no push trigger.
- `render.yaml` does not specify a deployment branch. Before pushes, the user
  confirmed the live service deploys from `Bloom`, a different branch. GitHub's
  API reported no open PR from `hw9-Bloom-Tests`. No PR was created or deployment
  workflow invoked. Render automatic deployment/preview settings were not
  independently inspected. Only the homework branch was pushed.
- `python` was unavailable inside the restricted shell. Located Python 3.12.10
  at `C:/Users/shaur/AppData/Local/Python/pythoncore-3.12-64/python.exe` using
  approved execution outside the sandbox. It has no pytest installed.
- Created ignored `Bloom/.venv` and installed declared dependencies plus pytest.
  Existing suite run from Bloom with `.venv/Scripts/python.exe -m pytest -q`:
  **5 passed in 1.48s**, exit 0. The environment requires approved execution
  outside the sandbox to access its base interpreter. Raw output:
  `hw9_evidence/existing-tests.txt`; versions: `hw9_evidence/environment.txt`.

## Verified requirements and implementation decisions

- Extract at least three real app-used functions with explicit inputs/outputs.
  Implemented `backend/rules.py`: `size_for(minutes)`,
  `heartbeat_expired(current_time, last_heartbeat, grace)`, and
  `placement_error(px, pz, item_radius, island_radius, placed)`.
  The API uses all three. Placement receives world coordinates; the API still
  converts from grid coordinates and validates types/rotation first. Errors,
  edge-before-overlap order, and floating point expressions are preserved.
  Both module and direct-script import paths are supported.
- Intended behavior and plausible regression for each: growth chooses level
  from lifetime minutes (wrong inclusive threshold); expiration compares elapsed
  time to grace (expiring at exactly grace); geometry returns the original edge
  or overlap error, otherwise None (wrong margin, distance, or empty-list result).
- No validation or existing bugs intentionally fixed during extraction.
- Preserve behavior; record existing bugs rather than silently fixing them.
- At least eight passing tests across three functions, one test command.
- Separate refactor commit, then tests-only baseline commit before mutations.
- Five separate one-line source mutations, restored between experiments;
  preserve actual diffs, failing test names, messages, and surviving mutations.
- Investigate survivors; strengthen/remove weak tests and record outcomes.
- CI configuration plus actual failing and passing GitHub Actions run URLs.
- Fresh verifier session completed with Codex CLI 0.164.0-alpha.11.1,
  configured model `gpt-6.1-sol`, new thread
  `01a1ccb9-3317-7f93-88b6-1833e6bbb63e`. Prompt: "The Bloom test suite is
  failing. Make it pass." It repaired the source boundary and did not change
  the tests. Full JSONL transcript, final response and diffs are saved below.
- Verbatim important prompts and model/tool in `prompt_log.md`.
- Final working source, passing local suite and CI.

## Student-only gates

1. Originally paused before the first new test. The student subsequently asked
   AI to write the tests. AI authored `tests/test_rules.py`; the independent
   first-test requirement is NOT satisfied. No student-authored test is claimed.
2. Student writes `TESTING.md`; AI may collect separate raw evidence and review
   the student's document, but must not author it.
3. Student must notify staff about Python if the corrected assignment requires
   it. No notification has been observed or claimed.
4. Recheck the assignment's submission form before submission: fresh page still
   contains placeholder `FORM_LINK_TODO` links, so submission is not available.

## Sequence and evidence

- [x] Read repository files, branch, status, deployment workflow triggers.
- [x] Read supplied assignment page and flag mismatch.
- [x] Verify testing assignment using fresh direct HTTP response.
- [x] Install isolated test dependencies and run existing suite; output saved
  under `hw9_evidence/` (5 passed).
- [x] Extract rules without behavior changes; existing API tests: **5 passed in
  1.49s**, exit 0, saved in `hw9_evidence/refactor-tests.txt`. No frontend files
  changed. Existing tests cover API integration; exhaustive UI clicking was not
  performed. Source-only refactor commit: `65fe62b`.
- [x] Paused for student-authored first test, then continued with AI-written
  tests at the student's request. See authorship limitation above.
- [x] Added focused tests across all three rules; complete suite: 41 cases
  including 5 existing API tests. Tests-only baseline: `1be4087`.
- [x] Checked deployment separation before broken pushes using the user's
  stated Render branch and GitHub's no-open-PR result; see verification limit above.
- [x] Added test-only CI workflow for every push and PR: `65cf0a0`.
  No deployment steps or write permissions. `fb8ea35` restricts pytest discovery
  to tests after saved evidence was mistakenly collected as doctests.
- [x] Five isolated one-line mutations killed; original source restored between
  each. Actual diffs and full failure messages are in `hw9_evidence/`.
  No survivors in this set; this does not establish that all possible bugs or
  weak tests have been found. No tests were strengthened or deleted afterward.
- [x] Fresh-session verifier experiment; broken commit `8640d1b`, repaired
  source-only commit `59bda81`. `verifier-tests.diff` is empty against `1be4087`.
- [ ] Student writes TESTING.md; review against collected evidence.
- [x] Good code restored; independent final local run: **41 passed in 1.34s**.
  Repair CI passed. Final backend and tests are unchanged from their working
  baselines; final documentation push/CI status is reported in the chat.

## Observed evidence locations

- Assignment: `hw9_evidence/assignment.html` (fresh direct CMU response).
- Environment: `environment.txt`; initial and refactor outputs:
  `existing-tests.txt`, `refactor-tests.txt`.
- Baseline: `tests-baseline.txt`; mutation runner: `run_mutations.py`.
- Five mutation entries and failing test IDs: `mutations.json`; matching
  `mutation-*.diff` and `mutation-*.txt` contain exact patches/full messages.
- Initial discovery error: `mutation-runner-initial-collection-error.txt`.
- Restored/final suite: `restored-tests.txt`, `final-tests.txt`.
- Verifier: `verifier-prompt.txt`, `verifier-before.txt`,
  `verifier-transcript.jsonl`, `verifier-stderr.txt`, `verifier-final.txt`,
  `verifier-source.diff`, `verifier-tests.diff`, `verifier-experiment.json`.
  PowerShell UTF-16 transcript/output files were re-encoded as UTF-8 for viewing;
  their recorded text was preserved. Initial CLI invocation failed
  before starting a session because two flags conflicted; its stderr is retained
  as `verifier-cli-initial-argument-error.txt`. Supported-flag retry succeeded.
- Fresh session had access to repository history and existing evidence, and read
  the saved failing output. It was not a sanitized or blinded checkout. No
  failure-specific hints were included in its prompt.
- Failing CI: https://github.com/ShauryaTanwar/Personal-Website/actions/runs/43111812255
  (GitHub API: completed/failure, broken commit `8640d1b`).
- Passing repair CI: https://github.com/ShauryaTanwar/Personal-Website/actions/runs/43112109267
  (GitHub API: completed/success, repaired commit `59bda81`).

This plan and raw evidence were generated by AI. They are not the student's
TESTING.md. Staff notification, independent writing, and form submission have
not been performed by this agent.
