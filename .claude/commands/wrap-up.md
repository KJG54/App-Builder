# /wrap-up

Summarize today's work, commit changes to git, and push to origin.

## What This Does

When you run `/wrap-up`, it:

1. **Creates a session summary** — Generates a markdown session summary for today based on the current conversation context
2. **Saves to Vault** — Writes the summary to `Vault/08-Retrospectives/Session-Summary-<YYYY-MM-DD>.md` using the canonical template
3. **Stages files** — Runs `git status` and automatically stages:
   - Modified tracked files (`.env`, `.mcp.json`, Vault docs, source code, etc.)
   - New Vault documents (session summaries, retrospectives, decision records)
   - Excludes: `.env.local` (secrets), temp files (start with `_`), large binaries, `.claude/` runtime state
4. **Creates commit** — Commits staged changes with a message: `docs: end of day wrap-up <YYYY-MM-DD>`
5. **Pushes to main** — Runs `git push origin main`
6. **Reports results** — Shows what was committed and any follow-up items

---

## How to Use

Simply type in Claude Code:

```
/wrap-up
```

The command runs automatically and reports status when complete.

---

## What Gets Committed

✅ **Included:**
- Source code changes (`.py`, `.js`, `.ts`, `.go`, etc.)
- Configuration files (`.env`, `.mcp.json`, docker-compose.yml, etc.) — but never secrets
- Documentation and Vault files (`Vault/**/*.md`, session summaries, etc.)
- New scripts in `.claude/scripts/`
- Test files and test results

❌ **Excluded:**
- `.env.local` or files with `secret`, `token`, `key` in the name (security)
- Temporary files starting with `_` or ending in `.tmp`
- Large binaries (node_modules, venv, etc.)
- `.claude/` runtime state (`.fsm-state.json`, cache, daemon logs)
- Uncommitted work-in-progress that you want to hold

---

## Customization

To override file staging decisions, run git commands manually before `/wrap-up`:

```bash
# Stage only specific files:
git add path/to/file.md

# Exclude files from staging:
git restore --staged path/to/file.js

# Then run /wrap-up to commit and push
```

---

## Session Summary Template

The generated session summary includes:

```markdown
# Session Summary: <YYYY-MM-DD> — <Topic>

**Date:** YYYY-MM-DD
**Participants:** Claude Code (Haiku 4.5), Krystian Garcia

## Overview
[Auto-generated from conversation context]

## Work Completed
- [Major items from this session]

## Decisions Made
- [Key decisions]

## Problems Found
[Issues encountered and their status]

## Lessons Learned
- [Insights from this session]

## Next Steps
1. [Priority items for next session]

## Files Modified
- [List of changed files]
```

See [[../04-Workflows/end-of-day.md|End-of-Day Workflow]] for detailed documentation.

---

## Examples

**Simple case — after a bug fix:**
```
/wrap-up
→ Creates Session-Summary-2026-06-09.md
→ Stages: src/bugfix.js, tests/bugfix.test.js, Vault/Session-Summary-2026-06-09.md
→ Commits: docs: end of day wrap-up 2026-06-09
→ Pushes to origin/main
✅ Done
```

**Complex case — after feature + architecture change:**
```
/wrap-up
→ Creates Session-Summary-2026-06-10-Feature-X.md
→ Stages: src/feature/*, tests/*, Vault/07-Decisions/ADR-FEAT-001.md, Vault/Session-Summary-2026-06-10-Feature-X.md
→ Commits: docs: end of day wrap-up 2026-06-10
→ Asks: Should Phase 14 state machine work be included? (y/n)
→ Pushes to origin/main
✅ Done
```

---

## Troubleshooting

**Q: `/wrap-up` failed to push — "merge conflict"**
A: Another branch updated main. Manually resolve with `git pull origin main`, then `git push origin main`.

**Q: I don't want to commit some files**
A: Run `git restore --staged <file>` before calling `/wrap-up` to exclude them.

**Q: The session summary is incomplete**
A: The command auto-generates from conversation context. You can manually edit `Vault/08-Retrospectives/Session-Summary-*.md` after the fact.

**Q: I want to use a different commit message**
A: Modify `git commit -m` call in the generated session. The default is `docs: end of day wrap-up <YYYY-MM-DD>`.

---

## Related

- [[../04-Workflows/end-of-day.md|End-of-Day Workflow]] — Full documentation of the wrap-up process
- [[../08-Retrospectives/README.md|Session Summaries]] — Retrospective format and standards
- [[../CLAUDE.md|CLAUDE.md]] — Completion Checklist (what `/wrap-up` implements)

---

**See also:** `git status`, `git add`, `git commit`, `git push`
