---
type: Workflow
phase: 13
status: Active
last_updated: 2026-06-08
tags: [multi-agent, orchestration, workflow-example, bug-triage-fix]
related: [ADR-ARCH-002, Phase-13-Multi-Agent-Collaboration, Phase-11-Known-Problems]
---

# Workflow B: Bug Triage → Fix → Verify

**Type:** Bug resolution workflow  
**Agents:** Architect (analysis) → Backend (fix) → QA (verification)  
**Duration:** ~2–4 hours (depending on root cause)

---

## Overview

When a bug is reported, agents collaborate to understand root cause, fix it, and verify:
1. **Architect** analyzes logs and queries known-problems KB
2. **Backend** implements a fix based on analysis
3. **QA** verifies the fix works and doesn't regress

---

## Scenario

**Bug Report:** "User authentication API returning 500 errors under load"

**Impact:** Production users can't log in; ~5 minute outage  
**Frequency:** Intermittent (happens 2-3 times per week)  
**Evidence:** Error logs show timeout in session validation

---

## Task Definition

```javascript
const orchestrator = new AgentOrchestrator();

const task = orchestrator.createTask(
  'Fix: Auth API timeouts under load (P1 - Production)',
  [
    {
      agent: 'architect',
      description: 'Analyze logs, check known problems, propose root cause',
      depends_on: []
    },
    {
      agent: 'backend',
      description: 'Implement fix based on analysis',
      depends_on: [0]  // Depends on Architect diagnosis
    },
    {
      agent: 'qa',
      description: 'Load test fix and verify no regressions',
      depends_on: [1]  // Depends on Backend implementation
    }
  ]
);

console.log(`Bug task created: ${task.id}`);
```

---

## Step 1: Architect Analyzes

**Input:** Bug report + logs from 2026-06-08 15:00-15:05

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);

// Architect queries knowledge base
// Chroma: "authentication timeout session validation performance"
// Returns: Phase-11-Known-Problems.md with similar issues

// Architect reads logs from error tracking
// Finds: SELECT query in session.validate() takes 800ms under concurrent load

const analysisOutput = `# Root Cause Analysis: Auth Timeout

## Symptom
- Endpoint: POST /api/v1/auth/login
- Error: 500 timeout (Tier: 3)
- Frequency: ~2-3 times/week under spikes
- Duration: ~5 minutes each

## Root Cause
Session validation query is N+1 problem:
\`\`\`python
# Current (slow):
for token in active_tokens:
    session = db.query(Session).filter(id=token).first()  # N queries!
    if session.user.permissions:  # loads user + perms
        ...
\`\`\`

Under load (100+ concurrent): Each query stalls, cumulative timeout.

## Similar Known Problems
- Phase-11: Problem-API-N+1-Query-Pattern.md (documented)
- Phase-11: Problem-Database-Connection-Timeout.md (documented)

Both addressed via query batching + caching.

## Proposed Fix
1. Batch session queries: \`db.query(Session).filter(id__in=tokens)\` (1 query)
2. Add caching layer: Sessions cached for 5 minutes (TTL)
3. Result: 800ms → 15ms per request

## Implementation Effort
- Low risk: Session validation is isolated
- Time: ~1 hour
- Backwards compatible: No API changes
`;

orchestrator.completeSubtask(task.id, next.subtask.id, analysisOutput);
```

**Output:**
- Root cause identified (N+1 query)
- Similar issues found in known-problems KB
- Fix strategy proposed
- Risk assessment: low
- Status: ✅ Complete

---

## Step 2: Backend Implements Fix

**Input:** Architect's analysis + proposed fix

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Context includes architect's analysis

// Backend implements the fix:
const fixOutput = `# Fix Implementation: Session Query Optimization

## Changes Made

### 1. Batch Session Queries
File: src/services/session.py

\`\`\`python
# Before (N queries):
def validate_tokens(tokens):
    return [db.query(Session).filter(id=t).first() for t in tokens]

# After (1 query):
def validate_tokens(tokens):
    sessions = db.query(Session).filter(Session.id.in_(tokens)).all()
    return {s.id: s for s in sessions}
\`\`\`

### 2. Add Caching
File: src/services/session.py

\`\`\`python
cache = Cache(ttl=300)  # 5 minute TTL

def get_session(token):
    cached = cache.get(token)
    if cached:
        return cached
    session = db.query(Session).filter(id=token).first()
    cache.set(token, session)
    return session
\`\`\`

## PR Details
- Created: https://github.com/project/repo/pull/789
- Files changed: 2 (session.py, cache.py)
- Lines added: 32
- Test coverage: 100%

## Performance
Before: 800ms per request (100 concurrent)
After: 15ms per request (100 concurrent)
Improvement: 53x faster

## Backwards Compatibility
✅ No API changes
✅ No database schema changes
✅ Existing clients work unchanged

## Verification
- Unit tests: 8/8 passing
- Integration tests: 12/12 passing
- Type checking: 100%
`;

// Create PR via GitHub MCP
orchestrator.completeSubtask(task.id, next.subtask.id, fixOutput);
```

**Output:**
- Fix implemented (32 lines)
- Performance improvement: 53x
- PR created and tested
- No breaking changes
- Status: ✅ Complete

---

## Step 3: QA Load Tests

**Input:** Backend's fix + Architect's analysis

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Context includes architect's analysis + backend's fix

const testOutput = `# Load Testing Results: Session Query Fix

## Test Setup
- Tool: Apache JMeter
- Scenario: 1000 concurrent users, auth spike
- Duration: 5 minutes
- Baseline: Original code (for comparison)

## Results

### Original Code (Baseline)
- Requests/sec: 45 (due to timeouts)
- Avg response: 800ms
- Error rate: 12% (500 timeouts)
- Timeout after: ~2 minutes (connection pool exhausted)

### Fixed Code
- Requests/sec: 2400 (53x improvement!)
- Avg response: 15ms
- Error rate: 0%
- No timeouts observed

## Regression Tests
- ✅ Existing auth tests: 50/50 passing
- ✅ Cache invalidation: Verified (logout clears cache)
- ✅ Session expiration: Verified (TTL works)
- ✅ Concurrent logins: Verified (no race conditions)
- ✅ Token validation: Verified (all tokens still valid)

## Real-World Simulation
- Replayed production login spike from 2026-06-08 15:00
- Original code: Failed after 2 minutes
- Fixed code: Handled full 5-minute spike without errors

## Recommendation
**APPROVED for production merge**
- Fix resolves the P1 issue completely
- Performance improvement verified
- No regressions detected
- Safe to deploy immediately
`;

orchestrator.completeSubtask(task.id, next.subtask.id, testOutput);
```

**Output:**
- Load test results: 53x improvement
- Regression testing: 100% pass rate
- Real-world scenario verified
- Production safe
- Status: ✅ Complete, approved

---

## Step 4: Phase 10 Review + Deployment

**Orchestrator status:** Task complete

**Phase 10 review:**
- Verification agent: Code review (all checks pass)
- Security agent: No security implications
- Human: Approves merge

**Result:** Fix deployed to production  
**Impact:** No more timeouts, P1 resolved  
**Slack notification (optional):**
```
✅ Bug Task Complete: Auth API Timeout Fix
- Root cause: Session N+1 query (found in known-problems KB)
- Fix: Query batching + caching
- Performance: 53x faster (800ms → 15ms)
- Status: Approved, ready for production merge
```

---

## Success Criteria

✅ Root cause identified and verified  
✅ Fix implemented and tested  
✅ Performance improvement measured  
✅ No regressions detected  
✅ Production-safe

---

## Escalation Scenario

If QA finds a regression (e.g., "Cache doesn't invalidate on user role change"):
```javascript
orchestrator.escalateSubtask(
  task.id,
  'subtask-003',  // QA testing
  'Regression detected: User role changes not reflected in cache'
);

// Task status: blocked
// Phase 10: Escalation routed to human
// Options:
// 1. Backend fixes cache invalidation (1-2 hours)
// 2. Disable cache, revert to query batching (no cache)
// 3. Use shorter TTL (15 seconds) to mitigate
```

---

## Related Workflows

- [[design-implement-test.md]] — Feature development (longer cycle)
- [[code-review-handoff.md]] — Code review process
- [[Phase-11-Known-Problems.md]] — How bugs become documented problems
