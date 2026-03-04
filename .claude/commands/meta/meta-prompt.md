---
description: "Generate a new slash command"
argument-hint: <name> <purpose>
model: opus
---

Create a new Claude Code slash command.

## Input
$ARGUMENTS

## Instructions

1. Read existing commands in .claude/commands/ for style reference
2. Read CLAUDE.md for project conventions
3. Create a new command file at .claude/commands/<name>.md
4. The command MUST include:
   - Frontmatter with description and argument-hint
   - Clear purpose statement
   - Step-by-step workflow
   - TDD considerations (if it involves code changes)
   - Security considerations (if it touches data or external systems)
   - Output format specification
5. Follow the patterns established by existing commands
