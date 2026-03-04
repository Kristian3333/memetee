---
description: "Write code to pass the frozen tests (Step 2 of TDD)"
argument-hint: <description of what to implement>
model: opus
disallowed-tools: Write(tests/*), Edit(tests/*)
---

You are implementing code to pass existing tests. You may ONLY create or
modify files in src/. You are explicitly forbidden from touching tests/.

## Strict TDD — Step 2: Make Tests Pass

The tests have already been written and frozen. They are the specification.
Your job is to write the minimum code needed to make ALL tests pass.

### Input
$ARGUMENTS

### Workflow

1. **Read** all relevant test files to understand what is expected
2. **Read** existing src/ code for patterns, interfaces, and conventions
3. **Implement** the code that makes the tests pass
4. **Run** the test suite after each meaningful change
5. **Iterate** until ALL tests pass — if a test fails, your code is wrong, not the test
6. **Run** linter and type checker — fix all issues
7. **Report** final results

### Rules

- NEVER ask to modify a test. The tests are frozen.
- If a test seems wrong, flag it in your report but still write code that passes it.
- Write the simplest code that passes. No speculative features.
- Follow existing patterns in the codebase.
- Add type hints to every function signature.
- Add docstrings to every public function.
- Handle errors explicitly — no silent failures.

### Output
- List of files created/modified
- Full test suite results (must be ALL PASSING)
- Linter/type checker results (must be clean)
- Any concerns or flags about test expectations
