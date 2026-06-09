---
type: architecture
status: active
component: core-engine, state-machine, semantic-search, mcp-security
tags: [phase-14, phase-15, phase-16, fsm, hybrid-search, vault-indexing]
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Phase 14–16 Roadmap: State Machine, Semantic Indexing, & Hybrid Search

## Overview

Phases 14–16 implement the three tiers of architectural improvements from the App Builder Vision Blueprint. These phases focus on framework quality, reliability, and search accuracy — not product features.

---

## Phase 14: Explicit State Machine & Safety Guardrails (Tier 1)

**Duration:** 2–3 days  
**Goal:** Lock tools per execution state; enforce Vault metadata; block dangerous commands.

### 14.1 Deterministic Finite State Machine (FSM)

**Current:** Implicit states in agent-orchestrator.  
**Target:** Explicit IDLE → PLANNING → EXECUTING → VERIFYING → CONSOLIDATING with hard engine locks.

**Implementation Details:**

| State | Tool Permissions | Description |
|-------|------------------|---|
| **IDLE** | Read-only Vault, file system | Waiting for user input or file trigger |
| **PLANNING** | Read Vault specs; Write `.claude/plan.md` | Formalize execution strategy |
| **EXECUTING** | Read + Write code/configs; Execute terminal | Implement planned changes (Read + Write per user choice) |
| **VERIFYING** | Read logs only; Execute test/linter commands | Automated validation; forbid further code edits |
| **CONSOLIDATING** | Write Vault logs; Cleanup workspace | Parse results, update docs, reset to IDLE |

**Files:**
- `.claude/scripts/state-machine.js` (new, ~150 lines) — FSM engine with state tracking and transition hooks
- `.claude/scripts/agent-orchestrator.js` (modify) — integrate FSM, check state before tool invocation
- `.claude/scripts/mcp-authorization.js` (extend) — state-aware tool gating
- `.claude/settings.json` (modify) — log FSM transitions to audit trail

**Validation:**
- Unit tests: state transitions follow strict rules
- Integration: Phase 13 test suite runs without regression
- Audit trail: every state change logged with timestamp

### 14.2 YAML Frontmatter Enforcement

**Current:** Inconsistent Vault doc metadata.  
**Target:** All docs (new or modified) require structured frontmatter.

**Template:**
```yaml
---
type: spec | log | architecture | guide | decision
status: draft | active | deprecated | review
component: core-engine | embedding-pipeline | interface | mcp
tags: [comma, separated, tags]
last_updated: YYYY-MM-DD
author: Claude-Builder-Agent
---
```

**Files:**
- `.claude/scripts/vault-validator.js` (new, ~200 lines) — Parse and validate frontmatter
- `.claude/scripts/chroma-ingest.js` (modify) — Add validation gate before indexing
- `Vault/Templates/Document-Template.md` (new) — Copy-paste template with instructions
- Batch script to auto-update existing docs (optional cleanup pass)

**Validation:**
- Rejected docs logged with specific missing fields
- chroma-ingest.js halts on validation failure
- All Phase 14 Vault docs use frontmatter

### 14.3 MCP Command Whitelisting (Permissive Approach)

**Current:** All terminal commands allowed.  
**Target:** Block only proven dangerous commands; log all blocked attempts.

**Dangerous Patterns (Blacklist):**
- `rm -rf /` (system destruction)
- `chmod -R 000 /` (permission lockout)
- `mkfs`, `dd` (data destruction)
- `fork() bomb` patterns, `: () { : | : & }` (resource exhaustion)
- Raw `eval()` or `exec()` of untrusted input

**Safe Patterns (Allowed):**
- File operations: `cat`, `cp`, `mv`, `mkdir`, `ls`, `find` (within project)
- Git: `git add`, `git commit`, `git push`, etc.
- Package managers: `npm install`, `npm test`, `yarn`, etc.
- Linters/formatters: `eslint`, `prettier`, `node`, `python`
- Test runners: `jest`, `mocha`, `pytest`, etc.

**Files:**
- `.claude/scripts/mcp-whitelist.js` (new, ~150 lines) — Command registry with patterns
- `.claude/scripts/mcp-authorization.js` (extend) — Enforcement layer
- `.claude/settings.json` (modify) — Whitelist config; permissive by default

**Validation:**
- Blocked command logs include context (agent, task, reason)
- User receives clear error message
- Whitelist can be extended per project

---

## Phase 15: Semantic Indexing & Lexical Search (Tier 2)

**Duration:** 3–4 days  
**Goal:** Improve Chroma retrieval quality via header-based chunking and add exact-match search.

### 15.1 Header-Based Markdown Chunking

**Current:** chroma-ingest.js splits files naively (by line count or character).  
**Target:** Parse markdown heading hierarchy; chunk by logical sections.

**Strategy:**
- Parse `# Heading 1`, `## Heading 2`, `### Heading 3` hierarchy
- Each chunk = heading + all content until next heading of equal/higher rank
- Metadata includes: heading path, doc type, tags, outbound links

**Example:**
```markdown
# Authentication Specifications

## OAuth2 Strategy
[Detailed content about OAuth2...]

## Session Lifecycles
[Detailed content about sessions...]
```

**Chunks Generated:**
- Chunk 1: "## OAuth2 Strategy\n[content]" with metadata `header_path: "Authentication Specifications > OAuth2 Strategy"`
- Chunk 2: "## Session Lifecycles\n[content]" with metadata `header_path: "Authentication Specifications > Session Lifecycles"`

**Files:**
- `.claude/scripts/markdown-chunker.js` (new, ~250 lines) — Parse headings, extract logical sections
- `.claude/scripts/chroma-ingest.js` (modify) — Use header-based chunking instead of naive splits
- Test fixtures: sample markdown files with various heading structures

**Validation:**
- Chunked sections maintain semantic coherence (no half-paragraphs)
- Metadata includes full heading paths
- Existing Vault docs re-indexed without loss

### 15.2 AST/Block-Level Code Chunking

**Current:** Code files split by character count or line count.  
**Target:** Split on functional boundaries (functions, classes, blocks); preserve scope context.

**Strategy:**
- Use regex or lightweight parser to identify `function`, `const`, `class`, `async` blocks
- Each chunk = complete function/class/declaration with scope context prepended
- Metadata includes: file path, component name, scope lines, imports

**Example:**
```javascript
// Source: src/core/engine.js
// Component: class ExecutionEngine → method runTaskSequence
// Lines: 45–82

async runTaskSequence(taskArray) {
    this.status = 'EXECUTING';
    for(const task of taskArray) {
        await this.mcpClient.execute(task);
    }
}
```

**Files:**
- `.claude/scripts/code-chunker.js` (new, ~200 lines) — Parse code blocks, extract functions/classes
- `.claude/scripts/chroma-ingest.js` (modify) — Use block-aware chunking for JS/Python files
- Test fixtures: sample code with various function/class patterns

**Validation:**
- No broken function signatures
- Closing braces preserved with scope
- All Phase 14+ code follows chunk-safe patterns

### 15.3 Lexical Search Layer (FlexSearch)

**Current:** ChromaDB provides vector search only.  
**Target:** Add keyword/regex search for exact string matching.

**Approach:**
- Use `flexsearch` (lightweight, no external dependencies)
- Index Vault document titles, headings, code function names
- Enable fast lookup: "find all references to `CHROMA_PORT`"

**Files:**
- `.claude/scripts/lexical-indexer.js` (new, ~150 lines) — Build and maintain inverted index
- `.claude/scripts/hybrid-search.js` (new, ~150 lines) — Merge vector + lexical results (Phase 16)
- `.claude/scripts/chroma-ingest.js` (modify) — Trigger lexical index updates on document changes

**Validation:**
- Lexical search finds exact variable names, file paths, error codes
- Performs in <100ms for project-scale corpus
- Index stays in sync with Vault

---

## Phase 16: Hybrid Search Integration (Tier 3)

**Duration:** 2–3 days  
**Goal:** Merge vector (semantic) + lexical (exact) search using reciprocal rank fusion.

### 16.1 Reciprocal Rank Fusion (RRF) Ranking

**Concept:**
- Run query against ChromaDB (semantic pass): get top 5 conceptually relevant chunks
- Run query against FlexSearch (lexical pass): get exact matches for keywords
- Merge results using RRF formula: boost results appearing in both passes

**RRF Formula:**
```
score(doc) = sum over queries: 1 / (k + rank(doc in result list))
```

Where `k` is typically 60 (prevents very high scores for rank 1).

**Example:**
```
Query: "How do I configure the Chroma server host?"

Semantic Pass (ChromaDB):
  1. Chroma server setup guide (rank 1, score: 1/61)
  2. Environment variables doc (rank 2, score: 1/62)
  3. Docker compose reference (rank 3, score: 1/63)

Lexical Pass (FlexSearch):
  1. Docker compose (mentions "CHROMA_SERVER_HOST", rank 1)
  2. .env.example (mentions "CHROMA_SERVER_HOST", rank 2)

RRF Merge:
  1. Docker compose (appears in both → boosted)
  2. Chroma server setup guide (semantic only)
  3. .env.example (lexical only)
  4. Environment variables doc (semantic only)
```

**Files:**
- `.claude/scripts/hybrid-search.js` (new, ~200 lines) — RRF merging and ranking
- `.claude/scripts/context-assembly.js` (modify) — Use hybrid search instead of vector-only
- Test fixtures: queries with mixed semantic + lexical needs

**Validation:**
- Hybrid search returns both conceptually relevant AND exact-match results
- RRF ranking favors documents appearing in both passes
- Context assembly receives improved results

### 16.2 Observability & Tuning

**Monitor:**
- Search latency (vector + lexical + RRF merge time)
- Relevance: do top 3 results answer the query?
- False positives: irrelevant high-scoring results

**Tuning Knobs:**
- `k` parameter in RRF formula (adjust for aggressive deduping)
- Top-N cutoff (take top 10 or top 20 results?)
- Semantic weight vs. lexical weight (could add `weight_semantic=0.6, weight_lexical=0.4`)

**Files:**
- `.claude/scripts/metrics-collector.js` (modify) — Track search quality
- `.claude/metrics/search/` (new directory) — Store search performance logs

---

## Phase Progression & Success Criteria

### Phase 14 Success Criteria
- [ ] FSM engine logs all state transitions
- [ ] Tool calls blocked when they violate state
- [ ] All Phase 13 tests still pass (no regression)
- [ ] YAML frontmatter present in all new Vault docs
- [ ] Dangerous commands (rm -rf, chmod) blocked with clear error
- [ ] Audit trail shows blocked command attempts

### Phase 15 Success Criteria
- [ ] Header-based chunks maintain semantic coherence
- [ ] Code chunks preserve complete function/class signatures
- [ ] FlexSearch indexes Vault content in <1s
- [ ] Exact variable/function names retrievable in <100ms
- [ ] Existing Vault re-indexed without loss

### Phase 16 Success Criteria
- [ ] RRF merging combines vector + lexical results correctly
- [ ] Queries return both semantic + exact-match results
- [ ] Latency acceptable (<500ms for full hybrid search)
- [ ] Context assembly uses hybrid search by default
- [ ] Search quality metrics tracked

---

## Timeline Summary

| Phase | Tier | Duration | Cumulative |
|-------|------|----------|-----------|
| **Phase 14** | 1 (Safety) | 2–3 days | 2–3 days |
| **Phase 15** | 2 (Indexing) | 3–4 days | 5–7 days |
| **Phase 16** | 3 (Hybrid) | 2–3 days | 7–10 days |

**Total:** ~10 days of focused work (1–2 weeks with testing/debugging)

---

## Dependencies & Integration Points

- **Phase 14** → No external dependencies; integrates with existing `agent-orchestrator.js`
- **Phase 15** → Depends on Phase 14 (assumes YAML validation in place)
- **Phase 16** → Depends on Phase 15 (needs header-based chunks + FlexSearch index)

**Backward Compatibility:**
- Phase 14: Fully backward compatible (old Vault docs work, new ones enforced)
- Phase 15: Re-indexing required; recommends fresh ChromaDB build
- Phase 16: Transparent to existing code (hybrid search is a drop-in replacement)

---

## Notes for Implementation

1. **Testing Approach:** Each phase includes unit tests + integration tests against Phase 13 suite
2. **Documentation:** Update CLAUDE.md to reflect FSM rules and frontmatter requirements
3. **Rollout:** Can be done incrementally (Phase 14 → 15 → 16) or in parallel with careful branch management
4. **User Visibility:** FSM state transitions logged to audit trail; frontmatter requirements clear in templates
5. **Performance:** FSM state checks and whitelist lookups cached in memory (~<1ms overhead per tool call)
