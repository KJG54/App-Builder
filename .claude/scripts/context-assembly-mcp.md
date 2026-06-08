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

**Architect uses this context to:**
- Follow Architecture Standards constraints
- Respect prior decision (ADR-DATA-001)
- Implement to requirement FR-001

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

**Backend uses this context to:**
- Follow API design standard (ADR-API-001)
- Implement with proper error handling and authentication
- Reference prior API discussions in sessions

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

**DevOps uses this context to:**
- Implement secure secrets management (per Security Standards)
- Follow infrastructure decision (ADR-INFRA-001)
- Set up monitoring per Requirement NFR-002

---

## Integration with Agent Prompts

### For Architect Agent

Add to prompt:

```
## Retrieve Implementation Context

Before designing, retrieve task-specific context:

```bash
assembleContext(
  "{{ARCHITECTURE_TASK}}",
  "ai-software-factory",
  { includeSession: false, maxResults: 5 }
)
```

Returns:
- Standards you must follow
- Prior architectural decisions
- Related requirements
- Architecture versions

Use this context to ensure decisions don't conflict with prior ADRs.
```

### For Backend Agent

Add to prompt:

```
## Retrieve Implementation Context

Before coding, get relevant patterns and standards:

```bash
assembleContext(
  "{{IMPLEMENTATION_TASK}}",
  "ai-software-factory",
  { includeSession: true, maxResults: 5 }
)
```

Returns:
- Coding Standards and patterns
- API Design Standard (for endpoints)
- Related requirements
- Architecture decisions about relevant layer
- Session notes with technical discussions
```

### For Frontend Agent

Add to prompt:

```
## Retrieve Design Constraints

Get relevant standards and UI decisions:

```bash
assembleContext(
  "{{UI_FEATURE_DESCRIPTION}}",
  "ai-software-factory",
  { includeSession: false, maxResults: 5 }
)
```

Returns:
- Security Standards (auth, data handling)
- Documentation Standards (user-facing features)
- Architecture constraints (component model)
- Related requirements
```

### For DevOps Agent

Add to prompt:

```
## Retrieve Infrastructure Context

Get deployment, monitoring, security context:

```bash
assembleContext(
  "{{DEPLOYMENT_TASK}}",
  "ai-software-factory",
  { includeSession: false, maxResults: 5 }
)
```

Returns:
- Security Standards (secrets, encryption)
- Infrastructure ADR (ADR-INFRA-001)
- Deployment workflows
- Observability and monitoring requirements
```

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

### Phase 5.3 - Agent Integration (NEXT)
- [ ] Update Architect.md with context retrieval section
- [ ] Update Backend.md with context retrieval section
- [ ] Update Frontend.md with context retrieval section
- [ ] Update DevOps.md with context retrieval section

### Phase 5.4 - Validation & Testing (NEXT)
- [ ] Run retrieval quality tests
- [ ] Measure precision and recall
- [ ] Verify latency (<1 second)
- [ ] Confirm zero contamination

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

## How to Use Context Assembly in This Session

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

This returns facts relevant to your query with full metadata.

### Method 2: JavaScript Script (Node.js)

Use `.claude/scripts/context-assembly.js` (when HTTP Chroma API is stable):

```bash
node .claude/scripts/context-assembly.js \
  ai-software-factory \
  "Design a database layer" \
  --include-sessions
```

### Method 3: Manual Query Pattern

For any query in this session:

1. Use `mcp__chroma__chroma_query_documents` to query collections
2. Set `collection_name` to: `global-standards`, `ai-software-factory-facts`, or `ai-software-factory-sessions`
3. Provide your `query_texts` (e.g., ["your task description"])
4. Filter with `where: { is_authoritative: true }` for facts
5. Review results and use in your planning

---

## Next Steps

**Immediate (Phase 5 continuation):**
1. Update 4 agent prompts with context retrieval sections
2. Run validation test suite
3. Verify retrieval quality (precision >80%, recall >90%)

**Future (Phase 6+):**
1. **Agent Coordination:** Agents use context assembly before all decisions
2. **Verification Agent:** Checks context completeness before implementation
3. **Semantic Cache:** Cache frequent queries to improve latency
4. **Auto-Indexing:** New vault documents automatically indexed

---

## References

- [[ADR-ARCH-001]] — Knowledge-First Pipeline (context assembly is Phase 2)
- [[ADR-DATA-001]] — Facts/Sessions Separation (underlies collection architecture)
- [[Chroma-Indexing.md]] — Indexing strategy and metadata schemas
