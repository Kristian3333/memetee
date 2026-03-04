---
description: "Design tests first from a specification (Step 1 of TDD)"
argument-hint: <feature description or spec file>
model: opus
disallowed-tools: Write(src/*), Edit(src/*)
---

You are designing tests for a feature. You may ONLY create or modify files
in the tests/ directory. You are explicitly forbidden from touching src/.

## Strict TDD — Step 1: Design Tests

### Input
$ARGUMENTS

### Workflow

1. **Understand** the feature specification completely
2. **Read** existing code in src/ to understand interfaces, types, and patterns
3. **Design** comprehensive tests that cover:
   - Happy path (expected inputs → expected outputs)
   - Edge cases (empty inputs, boundary values, max limits)
   - Error cases (invalid inputs, missing data, network failures)
   - Security cases (malicious input, injection attempts, unauthorized access)
   - Integration points (how this feature interacts with existing modules)
4. **Write** all tests to the appropriate files in tests/
5. **Verify** tests are syntactically valid by running them (they should FAIL — the code doesn't exist yet)
6. **Report** what you wrote and the expected failure count

### Test Quality Checklist
- [ ] Every test has a descriptive name: test_[function]_[scenario]_[expected]
- [ ] Tests are independent — no shared mutable state between tests
- [ ] Tests are deterministic — no randomness, no timing dependencies
- [ ] Setup and teardown are explicit
- [ ] Assertions are specific (not just "assert result is not None")
- [ ] Both positive and negative cases are covered

### Output
- List of test files created/modified
- Number of tests written
- Summary of what each test group covers
- Confirmation that all tests FAIL (proving they're testing real behavior)

DO NOT write any implementation code. Tests only.
