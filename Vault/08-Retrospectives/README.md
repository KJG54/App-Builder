# Session Retrospectives Index

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder contains **session summaries** — records of work completed, decisions made, problems found, and lessons learned during development sessions.

Each session captures:
- What was completed
- What decisions were made
- What problems were found
- What was learned
- What to do next

---

## Current Sessions

**[[Session-Summary-2026-06-07.md|Session: 2026-06-07 — Phase 2.2 Completion]]**  
Phase 2 completion: Stream A (standards expansion), Stream B (4 ADRs), Stream C (4 prompts), Stream D (Chroma indexing).  
Status: Complete ✅

---

## Session Organization

Sessions are named by date:
```
Session-Summary-YYYY-MM-DD-[optional-topic].md
```

For example:
- `Session-Summary-2026-06-07.md` (single session day)
- `Session-Summary-2026-06-07-Integration.md` (multiple sessions same day)
- `Session-Summary-2026-06-15-Architecture-Review.md` (topic-specific session)

---

## Session Template

Each session includes:

```markdown
# Session Summary: [Date] — [Topic]

**Date:** YYYY-MM-DD  
**Duration:** X hours  
**Participants:** [Claude, User, others]

---

## Overview

[1-2 paragraph summary of what was accomplished]

---

## Work Completed

### [Major Work Item 1]
- [Sub-item 1]
- [Sub-item 2]

### [Major Work Item 2]
- ...

---

## Decisions Made

- **Decision 1:** [Summary] (see [[../07-Decisions/ADR-XXX-###.md|ADR-XXX-###]])
- **Decision 2:** ...

---

## Problems Found

| Problem | Severity | Status | Action |
|---------|----------|--------|--------|
| [Problem 1] | High | Open | [What to do] |
| [Problem 2] | Medium | Resolved | [How fixed] |

---

## Lessons Learned

- **Lesson 1:** [What we learned and why it matters]
- **Lesson 2:** ...

---

## Blockers & Open Questions

- **Question 1:** [Open question]
- **Blocker 1:** [What's blocking progress]

---

## Next Steps

1. [Priority 1 for next session]
2. [Priority 2]
3. [Priority 3]

---

## Files Modified

- [[../file-path.md]] (summary of changes)
- [More files...]

---

## Related

- [[../03-Projects/AI Software Factory/Roadmap.md|Roadmap]] (phase updated)
- [[../07-Decisions/DECISIONS.md|Decisions]] (new ADRs created)
- [[../STATUS.md|Status]] (update at session end)

---

**Last Updated:** YYYY-MM-DD
```

---

## How to Create a Session Summary

At the **end of each session:**

1. **Create file** named `Session-Summary-YYYY-MM-DD.md` (or with topic suffix)
2. **Fill sections:**
   - Overview (1-2 paragraphs)
   - Work Completed (bullet list)
   - Decisions Made (with ADR links)
   - Problems Found (table)
   - Lessons Learned (insights)
   - Blockers (open questions)
   - Next Steps (priority list)
   - Files Modified (what changed)
3. **Link to** [[../STATUS.md|STATUS.md]] (human will update dashboard)
4. **Link from** [[../03-Projects/AI Software Factory/Roadmap.md|Roadmap]] (under completed phase)

---

## Linking Sessions to Phases

Each session should link to the phase it completed:

**In Roadmap.md**, under completed phases:
```markdown
## Phase 2 Complete ✅

[Phase description...]

### Session Summaries
- [[08-Retrospectives/Session-Summary-2026-06-07.md|2026-06-07]] — Standards expansion, ADRs, prompts, Chroma indexing
```

This way, humans can:
1. Open Roadmap → see which phases are done
2. Click on phase → see which sessions completed it
3. Click on session → see what was accomplished

---

## Retrospective Cadence

**Recommended:** One session summary per major work block
- After completing a phase
- After significant decision-making
- After incident resolution
- After architectural change

**Not recommended:** Daily summaries (too granular; creates clutter)

---

## What Makes a Good Session Summary

✅ **Good:**
- Specific: "Completed ADR-DATA-001 (Chroma schema) with facts/sessions separation" ✅
- Linked: References [[../07-Decisions/ADR-DATA-001.md|related ADRs]]
- Actionable: "Next: Phase 3 requirements definition"
- Lesson-rich: "Learned: Metadata at authoring time prevents ingestion friction in Phase 5"

❌ **Not good:**
- Vague: "Did some work"
- Unlinked: No references to decisions or files
- No next steps: "Work done, waiting for feedback"
- Not documented: Key lessons lost

---

## Using Sessions for Onboarding

New team members can read sessions to understand:
- What has been accomplished (which phases done)
- How decisions were made (see ADRs)
- What problems were encountered (and how fixed)
- What the current priorities are (see recent sessions + Roadmap)

---

## Archive Old Sessions

Once a session is older than ~3 months:
1. **Move to Archive folder** (if repo supports)
2. **Or keep with status: Archived** (in YAML frontmatter)
3. Chroma can still index archived sessions; they just won't show in recency queries

---

## Cross-References

Each session links to:
- **Phase in Roadmap** (what phase was completed)
- **ADRs created** (decisions made)
- **Standards** (what was learned about them)
- **Workflows** (improvements to processes)
- **Files modified** (what changed)

All these connections make sessions discoverable:
- "What was completed in Phase 2?" → See Roadmap → Click Phase 2 → See sessions
- "When was this problem discovered?" → Query Chroma for problem mention → See session date

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../03-Projects/AI Software Factory/Roadmap.md|Roadmap]]
