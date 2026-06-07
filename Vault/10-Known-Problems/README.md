# Known Problems Index

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder documents **known issues, bugs, workarounds, and limitations** that haven't been fully resolved.

When you encounter a problem that:
- Recurs frequently
- Has a workaround (but no permanent fix)
- Affects multiple people
- Should be remembered for future debugging

...capture it here.

---

## Problem Lifecycle

### 1. Discovery
You find a problem during development, testing, or operations.

### 2. Triage
Decide:
- Is this a bug (wrong behavior)?
- Is this a limitation (design constraint)?
- Is this a workaround (temporary solution)?

### 3. Document
Create file: `Problem-[Category]-[Brief Name].md`

Example:
- `Problem-API-Cors-Configuration.md`
- `Problem-Chroma-Connection-Timeout.md`
- `Problem-Docker-Memory-Leak.md`

### 4. Escalate
If the problem needs a permanent solution:
- Create ADR proposing the fix
- Link ADR from problem file
- Update problem status when ADR approved

### 5. Resolve
Once fixed:
- Update problem status: `Status: Resolved`
- Document fix date and what changed
- Keep in history (don't delete)

---

## Problem Template

```markdown
# [Category] — [Problem Name]

**Status:** Open | Resolved | Workaround | Design Constraint  
**Severity:** Low | Medium | High | Critical  
**Discovered:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD

---

## Problem Description

[What is the issue? When does it occur?]

---

## Symptoms

[How do you know this is happening?]

- Symptom 1
- Symptom 2

---

## Root Cause

[Why does this happen? If unknown, say so.]

---

## Impact

[Who is affected? What can't they do?]

---

## Workaround

[If there's a temporary fix, document it here.]

**Steps:**
1. [Step 1]
2. [Step 2]

**Limitations:** [What the workaround doesn't solve]

---

## Permanent Fix

[What would solve this permanently?]

**Option 1:** [Fix approach]  
**Option 2:** [Alternative approach]

**Related ADR:** [[../07-Decisions/ADR-XXX-###.md|ADR proposing fix]] (if exists)

---

## Links

- Related problem: [[Problem-XXX.md|Similar problem]]
- Related decision: [[../07-Decisions/ADR-XXX-###.md|ADR]]
- Session discovered: [[../08-Retrospectives/Session-Summary-YYYY-MM-DD.md|Session]]

---

**Last Updated:** YYYY-MM-DD
```

---

## Problem Categories

- **API** — API design, request/response issues
- **Chroma** — Vector database indexing, retrieval
- **Docker** — Containerization, image building, composition
- **Database** — Migrations, schemas, queries
- **Frontend** — UI rendering, accessibility, performance
- **DevOps** — Deployment, monitoring, infrastructure
- **Git** — Version control, merging, conflicts
- **Security** — Authentication, secrets, access control
- **Documentation** — Vault, standards, ADRs
- **Process** — Workflows, approval gates

---

## Status Meanings

| Status | Meaning | Example |
|--------|---------|---------|
| **Open** | Known issue; no workaround yet | "Chroma queries timeout on large datasets" |
| **Workaround** | Known issue; temporary fix exists | "Restart Docker daemon if connection fails" |
| **Design Constraint** | Not a bug; by design; accepted limitation | "API rate limiting is per-IP, not per-user" |
| **Resolved** | Fixed; problem no longer occurs | "Fixed via PR #45; deployed 2026-07-01" |

---

## Using Known Problems

**For developers:**
- Check here when debugging issues
- Use workarounds if available
- Help resolve by creating fixes (ADRs)

**For operations:**
- Runbooks should reference known problems
- Alert on recurring issues

**For future developers:**
- Understand what's been struggled with
- Avoid re-discovering problems
- Propose permanent solutions (ADRs)

---

## When to Create a Known Problem vs. ADR

**Create Known Problem if:**
- Issue is recurring but not critical
- Has a workaround but no permanent fix
- Needs documenting but doesn't require architecture change

**Create ADR if:**
- Problem requires system-wide change
- Solution affects design
- Multiple teams affected

Often, you'll do both:
1. Document problem here (immediate workaround)
2. Create ADR proposing permanent fix (future work)

---

## Linking Problems to Sessions

When a problem is discovered during a session:

**In session summary:**
```markdown
## Problems Found

- [[../10-Known-Problems/Problem-API-Cors-Configuration.md|CORS Configuration Issue]] (discovered, workaround documented)
```

**In problem file:**
```markdown
## Links

- Session discovered: [[../08-Retrospectives/Session-Summary-2026-06-07.md|2026-06-07]]
```

This makes problems discoverable by exploring session retrospectives.

---

## Chroma Indexing

Each problem will be indexed to `{project}-known-problems` collection:

```yaml
---
type: KnownProblem
status: Open | Resolved | Workaround | Design Constraint
severity: Low | Medium | High | Critical
authority: sessions
chroma_collection: {project}-known-problems
tags: [category, impact-area]
related: [related-ADRs, related-problems]
---
```

This allows agents to query: "What are known issues in the API?" or "Are there workarounds for timeout problems?"

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../07-Decisions/README.md|ADR Guide]]
