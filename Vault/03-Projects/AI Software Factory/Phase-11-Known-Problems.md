---
type: Phase
phase: 11
status: Complete
authority: facts
chroma_collection: ai-software-factory-facts
tags: [phase-11, known-problems-kb, problem-tracking, observability-integration]
related: [ADR-ARCH-001, Phase-10, Phase-8]
last_updated: 2026-06-08
---

# Phase 11: Known Problems Knowledge Base

**Status:** ✅ Complete (2026-06-08)  
**Test Results:** 7/7 tests passing (100% success rate)  
**Implementation Files:** 4 core modules + test suite

---

## Overview

Phase 11 builds a **Known Problems Knowledge Base** that connects Phase 10 observability data to a searchable repository of recurring issues with solutions and workarounds.

**Key Components:**
1. **Problem Extractor** — Identifies recurring issues from observability data
2. **Problem Manager** — Creates and maintains problem records in Vault
3. **Problem Indexer** — Indexes problems to Chroma for semantic search
4. **Integration** — Agents can query the KB before starting work

---

## Architecture

```
Phase 10 Observability Data
    ├─ Review metrics
    ├─ Issue frequency
    └─ Anomalies
    ↓
Problem Extractor
    ├─ Analyze issue patterns
    ├─ Cluster related issues
    └─ Calculate severity
    ↓
Problem Manager
    ├─ Create Vault records
    ├─ Track status (Open/Workaround/Resolved)
    └─ Link to ADRs
    ↓
Problem Indexer
    └─ Index to {project}-known-problems
    ↓
Agent Integration
    └─ Agents query KB before starting work
```

---

## Component Details

### 1. Problem Extractor (`problem-extractor.js`)

**Purpose:** Identify recurring issues from observability data

**Key Methods:**
```javascript
extractProblems(timeRange, minOccurrences)  // Identify recurring issues
analyzePatterns(issues)                     // Find patterns
clusterRelatedIssues(issues)                // Group related problems
categorizeIssue(issue)                      // Determine category
calculateSeverity(problem)                  // Impact-based severity
```

**Features:**
- Analyzes Phase 10 review data
- Groups issues by category and frequency
- Calculates impact on compliance scores
- Identifies affected agents
- Determines severity (critical/high/medium/low)

### 2. Problem Manager (`problem-manager.js`)

**Purpose:** Create and manage problem records

**Key Methods:**
```javascript
createProblem(extractedIssue)     // Create Vault record
updateProblem(fileName, updates)  // Update status
linkToADR(fileName, adrPath)      // Link to permanent fix
resolveProblem(fileName, fix)     // Mark resolved
getProblems(category, status)     // Query problems
```

**File Structure:**
- Location: `Vault/10-Known-Problems/`
- Format: Markdown with YAML frontmatter
- Naming: `Problem-[Category]-[Brief-Name].md`
- Metadata: Status, severity, discovered date, affected agents

**Example:**
```markdown
---
type: KnownProblem
status: Open
severity: High
category: API
authority: sessions
tags: [API, issue, recurring]
---

# API — Missing Error Handling

**Occurrences:** 5  
**Affected Agents:** backend, api  

[Problem description, symptoms, root cause, impact, workarounds...]
```

### 3. Problem Indexer (`problem-indexer.js`)

**Purpose:** Index problems to Chroma for search

**Key Methods:**
```javascript
indexProblem(fileName)       // Index a problem file
queryProblems(query)         // Semantic search
reindexAll()                 // Re-index all problems
getStatistics()              // KB statistics
```

**Chroma Collection:**
- Name: `{project}-known-problems`
- Documents: Problem markdown files
- Metadata: status, severity, category
- Searchable: Issue name, description, symptoms

---

## Usage Example

**Workflow:**
```javascript
// 1. Extract problems from observability
const extractor = new ProblemExtractor();
const extracted = extractor.extractProblems('7d', 3);
// Returns: 4 recurring issues found

// 2. Create problem records
const manager = new ProblemManager();
extracted.problems.forEach(issue => {
  manager.createProblem(issue);
  // Creates: Problem-API-Timeout-Error.md
});

// 3. Index to Chroma
const indexer = new ProblemIndexer();
indexer.reindexAll();

// 4. Agent queries before starting work
const results = indexer.queryProblems('API timeout');
// Returns: [Problem-API-Timeout-Error.md with workaround]
```

---

## Test Results

**Phase 11 Validation Suite:** 7/7 tests passing ✅

**Test Coverage:**
1. ✅ **Test 1:** Problem extraction from observability
2. ✅ **Test 2:** Problem creation with YAML frontmatter
3. ✅ **Test 3:** Clustering related issues
4. ✅ **Test 4:** Severity calculation
5. ✅ **Test 5:** Chroma indexing
6. ✅ **Test 6:** Semantic search
7. ✅ **Test 7:** Full integration pipeline

**Running Tests:**
```bash
npm run test:phase-11
```

---

## Directory Structure

**Vault Organization:**
```
Vault/10-Known-Problems/
├── README.md                           (problem guidelines)
├── Problem-API-*.md                    (API issues)
├── Problem-Chroma-*.md                 (Database issues)
├── Problem-Security-*.md               (Security issues)
└── Problem-[Category]-[Name].md        (other issues)
```

**Implementation Files:**
- `.claude/scripts/problem-extractor.js` (350 lines)
- `.claude/scripts/problem-manager.js` (300 lines)
- `.claude/scripts/problem-indexer.js` (250 lines)
- `.claude/scripts/validate-phase-11.js` (300 lines)

---

## Integration with Other Phases

**Requires:**
- Phase 10 (Observability) — Source of recurring issue data
- Phase 8 (Verification) — Issue types and categories
- Vault structure — 10-Known-Problems/ folder

**Enables:**
- Phase 12 (Advanced MCP) — Expose KB via API
- Phase 13 (Multi-Agent) — Agents use KB for coordination

---

## Problem Lifecycle

**Status Meanings:**

| Status | Meaning | Next Step |
|--------|---------|-----------|
| **Open** | Known issue; no workaround yet | Implement fix or create workaround |
| **Workaround** | Issue identified; temporary fix exists | Propose permanent solution (ADR) |
| **Design Constraint** | Not a bug; accepted limitation | Document why it's not being fixed |
| **Resolved** | Issue fixed; problem no longer occurs | Move to history, keep for reference |

---

## Known Limitations

**Current:**
- Problem extraction uses pattern matching (not ML)
- Clustering is rule-based (not algorithmic)
- Severity calculation is heuristic
- Agent integration is prompt-based (not enforced)

**Future (Phase 12+):**
- ML-based anomaly detection
- Learned clustering algorithms
- Predictive severity scoring
- MCP API endpoint for remote access
- Automated workaround generation

---

## Success Metrics

✅ **All criteria met:**

1. **Problem Extraction:** Recurring issues identified from observability data
2. **Problem Management:** Records created with proper YAML metadata
3. **Indexing:** Chroma collection created and populated
4. **Search:** Semantic search working on problem database
5. **Integration:** Full pipeline tested end-to-end
6. **Testing:** 7/7 tests passing

---

## Related Documentation

- [[../07-Decisions/ADR-ARCH-001.md|ADR-ARCH-001]] — Knowledge-First Pipeline
- [[../10-Known-Problems/README.md|Known Problems README]] — Template and guidelines
- [[../02-Technologies/Chroma-Indexing.md|Chroma Integration]]
- Phase 10: Review Pipeline
- Phase 8: Verification Layer

---

**Status:** ✅ Production Ready  
**Test Pass Rate:** 100% (7/7)  
**Next Phase:** Phase 12 (Advanced MCP Integration)