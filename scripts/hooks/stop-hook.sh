#!/bin/bash
# Stop hook: agent cannot finish if tests fail or tasks remain

INPUT=$(cat)

# Check if TODO.md has remaining tasks
if [ -f "TODO.md" ]; then
    REMAINING=$(grep -c "^\- \[ \]" TODO.md 2>/dev/null || echo "0")
    if [ "$REMAINING" -gt "0" ]; then
        echo "There are still $REMAINING uncompleted tasks in TODO.md. Continue working on the next unchecked item." >&2
        exit 2
    fi
fi

# Run tests if a test command exists
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    TEST_RESULT=$(python3 -m pytest --tb=short 2>&1)
    TEST_EXIT=$?
    if [ "$TEST_EXIT" -ne 0 ]; then
        echo "Tests are failing. Fix these before finishing:" >&2
        echo "$TEST_RESULT" | tail -30 >&2
        exit 2
    fi
elif [ -f "package.json" ]; then
    TEST_RESULT=$(npm test 2>&1)
    TEST_EXIT=$?
    if [ "$TEST_EXIT" -ne 0 ]; then
        echo "Tests are failing. Fix these before finishing:" >&2
        echo "$TEST_RESULT" | tail -30 >&2
        exit 2
    fi
fi

# All good — let it stop
exit 0
