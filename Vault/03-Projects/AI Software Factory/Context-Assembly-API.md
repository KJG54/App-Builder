---
type: guide
phase: 5
status: active
authority: facts
chroma_collection: ai-software-factory-facts
tags: [context-assembly, chroma, api, knowledge-pipeline, phase-5]
related: [ADR-ARCH-001, ADR-DATA-001, Phase-5-Chroma-Integration.md]
last_updated: 2026-06-10
author: Claude-Builder-Agent
---

# Context Assembly API — Phase 5 Implementation Guide

## Overview

**Purpose:** Implement Phase 2 of the Knowledge-First Pipeline (ADR-ARCH-001) — Context Assembly.

**Function:** Given a task query, retrieve authoritative context from Chroma collections.

**Status:** Tested and operational via MCP tools

---

## API Specification

### Function: `assembleContext(query, project, options)`

**Parameters:**
- `query` (string): Task description or question (e.g., "Design a database layer")
- `project` (string): Project name (e.g., "ai-software-factory")
- `options` (object):
  - `includeSession` (boolean): Include exploratory session content (default: false)
  - `maxResults` (integer): Max results per collection (default: 5)

**Returns:**
```json
{
  "timestamp": "2026-06-08T00:30:00Z",
  "query": "Design a database layer",
  "projectName": "ai-software-factory",
  "standards": [
    {
      "type": "Standard",
      "content": "Database management section from Architecture Standards...",
      "metadata": { "category": "Architecture", "authority": "facts" },
      "relevance": 0.85,
      "position": 1
    }
  ],
  "facts": [
    {
      "type": "Decision",
      "content": "ADR-DATA-001: Chroma Collection Schema...",
      "metadata": { "source": "ADR-DATA-001", "status": "Accepted" },
      "relevance": 0.92,
      "position": 1
    }
  ],
  "sessions": [],
  "summary": "Context assembled: Standards: 1 constraint(s), Facts: 2 authoritative document(s)"
}
```

---

## Implementation Details

### Collection Queries

The context assembly queries **3 collections in order:**

1. **global-standards** (mandatory)
   - Cross-project governance standards
   - Always included in context
   - Provides constraints for all decisions

2. **{project}-facts** (primary)
   - Approved ADRs, requirements, architecture
   - Authoritative knowledge only
   - Primary source for context

3. **{project}-sessions** (optional)
   - Session notes, research, experiments
   - Exploratory content only
   - Included only if `includeSession: true`

### Query Logic

```
For each collection:
  1. Query with semantic search (query text → embeddings)
  2. Filter: is_authoritative = true (facts) or false (sessions)
  3. Return top N results sorted by relevance distance
  4. Format results for agent consumption
```

### Retrieval Quality Targets

- **Precision:** >80% of results relevant to query
- **Recall:** >90% of relevant documents retrieved
- **Latency:** <1 second for full context assembly
- **Contamination:** Zero cross-collection leakage (facts never contain session content)

---

## Usage Examples

### Example 1: Architect Designing Database

**Query:**
```
assembleContext(
  "Design a database layer for user management",
  "ai-software-factory",
  { includeSession: false, maxResults: 5 }
)
```

**Returns Context:**
- **Standards:** Architecture Standards (data layer section), Security Standards (data protection)
- **Facts:** ADR-DATA-001 (Chroma Collection Schema), Architecture v1.0 (data layer component), Requirement FR-001 (Context Assembly)
- **Sessions:** None (excluded)

---

### Example 2: Backend Implementing API

**Query:**
```
assembleContext(
  "Implement RESTful API for user creation endpoint",
  "ai-software-factory",
  { includeSession: true, maxResults: 10 }
)
```

**Returns Context:**
- **Standards:** Architecture Standards (API section), Coding Standards (testing), Security Standards (auth)
- **Facts:** ADR-API-001 (RESTful conventions), Workflow (Build API), Requirement FR-001, Requirement FR-002
- **Sessions:** Session notes discussing API design patterns

---

### Example 3: DevOps Deploying Service

**Query:**
```
assembleContext(
  "Deploy application to production with monitoring and alerting",
  "ai-software-factory",
  { includeSession: false, maxResults: 5 }
)
```

**Returns Context:**
- **Standards:** Security Standards (secrets, encryption), Architecture Standards (deployment)
- **Facts:** ADR-INFRA-001 (Infrastructure setup), Workflow (Deploy Service), Requirement NFR-001 (Local First), Requirement NFR-002 (Observability)
- **Sessions:** None (excluded)

---

## Integration with Agent Prompts

Each agent prompt should include a context retrieval section. See individual agent prompts in `Vault/05-Prompts/` for their configured `assembleContext` queries.

---

## Implementation Status

### Phase 5.1 - Vault Ingestion ✅ COMPLETE
- ✅ 26 documents indexed across 3 collections
- ✅ Facts collection: 14 documents (ADRs, requirements, workflows, architecture)
- ✅ Global Standards: 8 documents (4 standards + others)
- ✅ Sessions collection: 4 documents (session summaries)

### Phase 5.2 - Context Assembly API ✅ OPERATIONAL
- ✅ Context assembly logic designed and tested
- ✅ Query functions work via MCP tools (proven in Phase 4)
- ✅ Formatting and summary generation complete
- ✅ API contract documented (this file)

### Phase 5.3 - Agent Integration ✅ COMPLETE (Phase 6)
- ✅ Architect.md updated with context retrieval section
- ✅ Backend.md updated with context retrieval section
- ✅ Frontend.md updated with context retrieval section
- ✅ DevOps.md updated with context retrieval section

### Phase 16 - Chroma Pipeline Rebuild (IN PROGRESS)
- ⏳ chromadb JS client swap (replaces removed v1 HTTP endpoint)
- ⏳ context-assembly.js v2 route fix
- See Known-Problem: Problem-infra-chroma-ingestion-api-incompatibility.md

---

## Verification Test Cases

### Test 1: Precision (Are results relevant?)
```
Query: "How should I manage database migrations?"
Expected: ADR-DATA-001, Architecture (data layer), Workflow (Build API)
Measure: Did all top 3 results relate to database migrations?
Target: >80% precision
```

### Test 2: Recall (Are important docs found?)
```
Query: "security requirements for authentication"
Expected: Security Standards, ADR-SEC-001, Requirement NFR-001
Check: Did result set include all 3 major documents?
Target: >90% recall
```

### Test 3: Rank (Are best results first?)
```
Query: "API endpoint design"
Check: Does ADR-API-001 appear in top 2 results?
Target: Mean Reciprocal Rank > 0.7
```

### Test 4: Contamination (No cross-collection mixing?)
```
Query facts for: "session experiment notes"
Check: Do session documents appear? (should not)
Target: 0% session documents in facts results
```

### Test 5: Latency (Is response fast?)
```
Execute: assembleContext("...", "ai-software-factory")
Time: How long did query take?
Target: <1 second total (all 3 collections)
```

---

## How to Query Context Assembly

### Method 1: Direct MCP Query (Most Reliable)

Use the MCP chroma_query_documents tool directly:

```
mcp__chroma__chroma_query_documents({
  collection_name: "ai-software-factory-facts",
  query_texts: ["database design"],
  n_results: 5,
  include: ["documents", "metadatas"]
})
```

### Method 2: JavaScript Script (Node.js)

Use `.claude/scripts/context-assembly.js` (requires Phase 16 Chroma rebuild):

```bash
node .claude/scripts/context-assembly.js \
  ai-software-factory \
  "Design a database layer" \
  --include-sessions
```

---

## References

- [[ADR-ARCH-001]] — Knowledge-First Pipeline (context assembly is Phase 2)
- [[ADR-DATA-001]] — Facts/Sessions Separation (underlies collection architecture)
- [[Phase-5-Chroma-Integration.md]] — Indexing strategy and metadata schemas
- [[Phase-14-Integration-Guide.md]] — Phase 14 module integration (VaultValidator in Chroma ingest)
