---
description: "Create a detailed plan for a task"
argument-hint: <what to plan>
model: opus
disallowed-tools: Write(src/*), Edit(src/*)
---

Analyze the codebase and create a detailed implementation plan.

## Input
$ARGUMENTS

## Workflow

1. **Read** CLAUDE.md and relevant docs/ to understand the project
2. **Analyze** the codebase to understand current state
3. **Design** the approach: what changes, in what order, what could break
4. **TDD plan**: for each piece of work, specify what tests to write FIRST
5. **Security review**: identify any security implications of the change
6. **Save** the plan to specs/<descriptive-name>.md

## Plan Structure

The plan MUST include:
- Objective (what and why)
- Files to create/modify
- TDD sequence: tests to write → code to implement → validation
- Security considerations
- Scalability impact
- Acceptance criteria (how to verify success)
- Risks and rollback strategy
