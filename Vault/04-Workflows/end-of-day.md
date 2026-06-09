---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# End-of-Day Wrap-Up Workflow

**Status:** Active  
**Last Updated:** 2026-06-09  
**Owner:** Development Process  

---

## Overview

The End-of-Day Wrap-Up is an **automated workflow** that captures session work, creates a durable Vault record, and pushes changes to git without requiring manual paragraph-writing every time.

**When to use:** At the end of a work session (after completing a task, fixing a bug, or finishing a phase block).

**How to trigger:** Type `/wrap-up` in Claude Code.

---

## What Happens

### Step 1: Session Summary Generation
The `/wrap-up` command generates a **session summary** for today based on the current conversation context:
- Auto-extracts major work items completed
- Lists decisions made during the session
- Records problems found and their status
- Identifies lessons learned
- Suggests next steps

The summary uses the canonical template from [[../08-Retrospectives/README.md|Retrospectives README]].

### Step 2: Vault Storage
The session summary is written to:
```
Vault/08-Retrospectives/Session-Summary-<YYYY-MM-DD>.md
```

This ensures the work is:
- **Discoverable** via Chroma semantic search
- **Persistent** across sessions and projects
- **Linked** to related ADRs, phase docs, and decisions
- **Accessible** for future onboarding and context

### Step 3: Git Staging
The command runs `git status` and automatically stages:
- **Modified tracked files:** source code, configs, docs, Vault files
- **New Vault documents:** session summaries, decisions, retrospectives
- **Excludes sensibly:** secrets (`.env.local`), temp files (`_*`), binaries

Files are staged intelligently — if Phase 14 work is uncommitted and unrelated to today's session, you're asked whether to include it.

### Step 4: Commit & Push
The command commits with a concise message:
```
docs: end of day wrap-up <YYYY-MM-DD>
```

Then pushes to `origin/main`:
```bash
git push origin main
```

The working tree becomes clean, and all session work is recorded in the repo history.

---

## When to Use End-of-Day

### Use it when:
- ✅ Completing a significant task (bug fix, feature, investigation)
- ✅ Finishing a phase or work block
- ✅ Resolving a major issue or incident
- ✅ Making architectural decisions
- ✅ End of a work session (even if small task)

### Don't use it when:
- ❌ Mid-task (pausing for a break) — wait until task is done
- ❌ Uncommitted state is intentional (e.g., working on two things in parallel) — stage selectively instead
- ❌ You're not ready to push to main — use `git add` manually instead

---

## Workflow Diagram

```
┌─────────────────────────────────────────┐
│ Work completed (bug fix, feature, etc.) │
└──────────────┬──────────────────────────┘
               │
               v
┌─────────────────────────────────────────┐
│ Run: /wrap-up                            │
└──────────────┬──────────────────────────┘
               │
               ├─ Auto-generate session summary
               │  ↓
               │  Vault/08-Retrospectives/Session-Summary-<date>.md
               │
               ├─ Run: git status
               │  ↓
               │  Stage relevant files (skip secrets, temp, binaries)
               │
               ├─ Run: git commit
               │  ↓
               │  Message: "docs: end of day wrap-up <date>"
               │
               └─ Run: git push origin main
                  ↓
                  Changes live in repo; session recorded in Vault
```

---

## Command Reference

### Basic Usage
```bash
/wrap-up
```

Runs the full workflow: generate summary, stage, commit, push.

### Manual Alternatives

If you want more control, use git commands directly:

```bash
# Stage only specific files:
git add path/to/file.md

# Create manual session summary:
# (Copy template from Vault/08-Retrospectives/README.md)
nano Vault/08-Retrospectives/Session-Summary-2026-06-09.md

# Commit:
git commit -m "docs: end of day wrap-up 2026-06-09"

# Push:
git push origin main
```

See [[../../.claude/commands/wrap-up.md|/wrap-up Command]] for full documentation.

---

## Session Summary Structure

Each session summary includes:

| Section | Purpose | Example |
|---------|---------|---------|
| **Overview** | 1-2 sentence recap | "Fixed Chroma MCP connection by correcting `.env` host format and adding `--ssl false` flag." |
| **Work Completed** | Bulleted list of major items | "MCP server Chroma — connection failure debug & fix", "Filesystem MCP — env var fix" |
| **Decisions Made** | Decisions with reasoning | "Decision 1: Fix `.env` before SSL flag (primary vs secondary issue)" |
| **Problems Found** | Table of issues, severity, status, action | Issue, High/Med/Low, Resolved/Open, How addressed |
| **Lessons Learned** | Key insights | "Configuration validation is strict in ChromaDB 1.4.4+" |
| **Next Steps** | Priority items for next session | Numbered list (1, 2, 3...) |
| **Files Modified** | What changed | List of file paths and summaries |

See [[../08-Retrospectives/README.md|Retrospectives Template]] for the full template.

---

## Integration with CLAUDE.md

The end-of-day workflow implements the **Completion Checklist** from [[../CLAUDE.md|CLAUDE.md]]:

- ✅ Requested task completed
- ✅ Scope remained controlled
- ✅ No unnecessary complexity introduced
- ✅ Existing functionality preserved
- ✅ Validation completed
- ✅ **Required documentation updated** ← Handled by `/wrap-up`
- ✅ Decisions recorded ← Session summary captures them
- ✅ Risks communicated ← Documented in Problems Found
- ✅ Follow-up work identified ← Listed in Next Steps

And the **Knowledge Transfer Checklist**:

- ✅ Session learnings recorded in Vault ← Vault/08-Retrospectives/
- ✅ Decisions documented ← Session summary + ADR links
- ✅ Session summary created ← Auto-generated by `/wrap-up`

---

## Examples

### Example 1: Simple Bug Fix
```
Session: Fixed authentication timeout in API handler

/wrap-up produces:
  - Session-Summary-2026-06-09.md
  - Commits: src/api/auth.js, tests/auth.test.js, Vault summary
  - Push to main ✅
```

### Example 2: Architecture Decision
```
Session: Decided on event-driven architecture for async tasks

/wrap-up produces:
  - Session-Summary-2026-06-10-Architecture.md
  - Creates ADR-ARCH-003 (Event-Driven Pattern)
  - Commits: ADR, session summary, architecture docs
  - Updates Vault/07-Decisions/DECISIONS.md index
  - Push to main ✅
```

### Example 3: Phase Completion
```
Session: Completed Phase 3 (MCP integration)

/wrap-up produces:
  - Session-Summary-2026-06-11-Phase-3.md
  - Commits: All Phase 3 code, tests, docs
  - Updates Vault/03-Projects/.../Phase-3.md with completion status
  - Asks: Include Phase 4 work? (if any outstanding changes)
  - Push to main ✅
```

---

## Customization

### Override Default Commit Message
Edit the commit message before pushing:
```bash
git commit --amend -m "fix: resolve chroma mcp connection + add wrap-up automation"
git push origin main
```

### Exclude Specific Files
Before running `/wrap-up`, unstage files you don't want:
```bash
git restore --staged path/to/temp-analysis.json
/wrap-up
```

### Change Vault Location
The default location is `Vault/08-Retrospectives/Session-Summary-<YYYY-MM-DD>.md`. To change it, edit [[../../.claude/commands/wrap-up.md|/wrap-up.md]] command file.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `git push` fails — remote has changes | Run `git pull origin main`, resolve conflicts, then push |
| Session summary is incomplete | Manually edit the `.md` file after `/wrap-up` completes |
| Some files weren't staged | Use `git add <file>` before `/wrap-up`, or `git add .` and re-run |
| Commit message needs to change | Use `git commit --amend -m "..."` before next action |

---

## Future Extensions

The end-of-day workflow can be extended to:

1. **Auto-generate ADRs** — Detect architectural decisions and create ADR drafts
2. **Update Roadmap** — If phase was completed, auto-mark phase as Done in Roadmap
3. **Chroma indexing** — Auto-ingest session summary into Chroma for semantic search
4. **Metrics/analytics** — Track work velocity, time per phase, etc.
5. **Slack notification** — Post a summary to project Slack channel
6. **Email digest** — Weekly summary of all sessions + decisions

---

## Related

- [[../../.claude/commands/wrap-up.md|/wrap-up Command]] — Full command documentation and customization
- [[../08-Retrospectives/README.md|Session Retrospectives]] — Template and standards
- [[../CLAUDE.md|CLAUDE.md]] — Completion & Knowledge Transfer checklists
- [[../03-Projects/AI Software Factory/Roadmap.md|Roadmap]] — Phase tracking (linked from sessions)
- [[../07-Decisions/DECISIONS.md|Decisions Index]] — ADRs (linked from sessions)

---

**See also:** `git status`, `git add`, `git commit`, `git push`, `git pull`
