---
name: tdd-feature-delivery
description: Deliver a product feature with strict TDD and clean Git history. Use when implementing or modifying code in this repository where you must proceed Red→Green→Refactor, verify with tests/build, update related docs, and split commits into meaningful units without touching unrelated unstaged files.
---

# TDD Feature Delivery

Implement features with a predictable workflow that keeps quality and history clean.

## 1. Define scope and seams

- Confirm feature scope, supported outputs, and non-goals.
- Identify seams first: domain/service logic, integration boundary (IPC/API), UI wiring.
- Map each seam to one test level.

## 2. Red first

- Add the smallest failing test for the core behavior.
- Prefer deterministic unit tests before integration tests.
- Run only the new test file first.

```bash
npm test -- <new-test-file>
```

## 3. Green with minimal implementation

- Implement the minimum code to pass the failing test.
- Avoid premature abstractions.
- Re-run the focused test until green.

## 4. Expand by seam

- Wire integration boundaries next (e.g., preload/IPC/API).
- Wire UI last.
- For each seam change, add/adjust tests when practical; if no practical test exists, add explicit runtime verification in step 5.

## 5. Verify end-to-end quality gate

Run quality gates in order:

```bash
npm test -- --run
npm run build
```

Do not proceed to commit if either fails.

## 6. Sync docs with implementation

- Update impacted docs in the same delivery (feature lists, workflows, "next steps" checkboxes, file/path notes).
- Remove stale TODOs for completed work.
- Keep docs factual and aligned to the current code paths.

## 7. Commit in meaningful units

Use this commit slicing policy:

- Commit 1: TDD core unit (tests + core implementation).
- Commit 2: integration/UI wiring.
- Commit 3: documentation sync.

Rules:

- Never include unrelated files.
- If the user asks to commit only staged changes, respect that strictly.
- Do not modify or include unrelated unstaged files.

## 8. Final report format

Report:

- What was implemented.
- Which tests/build were executed and results.
- Exact commit hashes and file groups per commit.
- Remaining risks or deferred follow-ups.
