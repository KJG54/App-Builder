# Inbox — Quick Capture Area

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

The **Inbox** is for temporary capture during active development. Loose notes, quick findings, and work-in-progress ideas go here before triaging to proper locations.

**Purpose:** Don't break focus during development. Capture quick thoughts, then organize later.

---

## Inbox Workflow

```
1. During session:
   → Capture loose notes here
   
2. At session end:
   → Triage to proper location (or delete)
   
3. Weekly cleanup:
   → Remove stale notes
   → Complete work that was started
```

---

## Where Inbox Notes Go

After capturing in Inbox, move to appropriate folder:

| Note Type | Destination | When |
|-----------|------------|------|
| Work completed this session | [[../08-Retrospectives/README.md|Session Summary]] | At session end |
| Interesting research | [[../06-Research/README.md|Research folder]] | When mature enough to share |
| Bug discovered | [[../10-Known-Problems/README.md|Known Problems]] | Once workaround found |
| New idea for ADR | [[../07-Decisions/README.md|Decisions folder]] | Once researched |
| Quick learnings | [[../08-Retrospectives/README.md|Session notes]] | At session end |
| Random thoughts | Delete | If not relevant after review |

---

## Triage Process

**At the end of each work session:**

1. **Review** all Inbox items
2. **Categorize** each:
   - ✅ **Complete** (move to session summary)
   - 🔄 **In Progress** (move to relevant folder)
   - 🔍 **Research** (move to Research folder)
   - ❌ **Irrelevant** (delete)
3. **Clean up** (delete triaged items)

---

## Cleanup Schedule

**Weekly:** Remove notes older than 1 week (unless they're waiting for action)  
**Monthly:** Archive anything that's been sitting untriaged for >2 weeks

---

## Inbox File Naming

Quick notes during session:
```
[topic]-[brief-title].md
```

Examples:
- `api-rate-limiting-approach.md`
- `chroma-performance-notes.md`
- `docker-startup-issue.md`

These are temporary; no need for formal structure.

---

## Inbox Do's & Don'ts

✅ **DO:**
- Capture quick thoughts without overthinking
- Include timestamps for context
- Link to related files when you remember
- Mark as "complete", "in progress", or "research"

❌ **DON'T:**
- Leave notes here permanently (they get lost)
- Use for long-term documentation (use proper folders)
- Create nested folder structure (keep flat)
- Forget to triage (check weekly)

---

## Example Inbox Note

```markdown
# API Rate Limiting Approach

**Status:** In Progress  
**Created:** 2026-06-07 14:30  
**Type:** Design Decision

## Quick Notes
- Current design: per-IP limit, 100 req/min
- Problem: Legitimate users behind proxy hit limit
- Idea: Switch to per-API-key limit instead?

## Questions
- Do we have API keys in current design? Check [[../07-Decisions/ADR-API-001.md]]
- Would per-user limit be better than per-key?

## Next Step
- Research API key design in ADR-API-001
- Propose new rate-limiting ADR if needed
```

**Then at session end:** Move to [[../07-Decisions/README.md|Decisions folder]] if it needs an ADR, or delete if it's answered.

---

## When NOT to Use Inbox

**Don't use Inbox for:**
- Permanent documentation (use [[../01-Standards/README.md|Standards]])
- Decisions (use [[../07-Decisions/README.md|ADRs]])
- Complete work (use [[../08-Retrospectives/README.md|Session notes]])
- Resolved problems (use [[../10-Known-Problems/README.md|Known Problems]])

Use Inbox only for **temporary, in-progress notes** that will be triaged elsewhere.

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../08-Retrospectives/README.md|Session Summaries]]
