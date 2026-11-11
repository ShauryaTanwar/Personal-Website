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
- `render.yaml` does not specify a deployment branch. Live Render deployment
  settings have NOT been verified. Do not push broken code until this is resolved.
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
- Fresh verifier agent session given genuinely broken code and only asked to
  make the suite pass; preserve verbatim transcript and diff, report whether
  source or tests changed. Not yet conducted; do not invent an outcome.
- Verbatim important prompts and model/tool in `prompt_log.md`.
- Final working source, passing local suite and CI.

## Student-only gates

1. Pause BEFORE generating the first new test. Student must write it without AI.
   Existing API tests are pre-existing work, not evidence of this requirement.
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
- [x] Paused for student-authored first test, before any AI-written tests.
  Student should create `tests/test_rules.py` independently. Run from Bloom:
  `.venv/Scripts/python.exe -m pytest -q`. Step 3 also requires the student to
  observe a deliberate failure and restore it before AI expands the suite.
  No first-test code, inputs, or assertions have been supplied by AI.
- [ ] Add remaining focused tests, covering boundaries, neighbors, empty
  collections and relevant invalid inputs; tests-only baseline commit.
- [ ] Verify live deployment branch/settings before intentionally broken pushes.
- [ ] Add test-only CI workflow limited to homework branch; record run URLs.
- [ ] Conduct mutations one at a time and record raw evidence separately.
- [ ] Conduct fresh-session verifier experiment and preserve transcript/diff.
- [ ] Student writes TESTING.md; review against collected evidence.
- [ ] Restore good code, passing local and CI results, final branch push.

Proposed evidence directory: `hw9_evidence/` for baseline/refactor test output,
mutation diffs/output, verifier transcript/diff, and CI URLs. Future planned
artifacts are not observed results.
