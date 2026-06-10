---
type: architecture
status: active
component: core-engine, state-machine, semantic-search, memory-system, observability, project-build-pipeline
tags: [phase-14, phase-15, phase-16, phase-17, phase-18, fsm, memory, hybrid-search, vault-indexing, learning-loop, build-pipeline]
last_updated: 2026-06-10
author: Claude-Builder-Agent
---

# Phase 14–18 Roadmap: Safety, Memory, Search Quality, Active Learning, and Project Build Pipeline

## Overview

This roadmap combines two planning tracks into a single sequenced plan:

- **Safety/Infrastructure track** (original Phase 14–16): FSM integration, semantic indexing, hybrid search
- **Memory/Observability track** (new): Agent memory, learning loops, cost tracking, skill gap detection

The two tracks are orthogonal concerns. The combined sequence prioritizes finishing in-progress work first, then addresses agent behavior quality (memory), then retrieval quality (search), then active learning (observability).

**Why this order:**
1. Phase 14 integration is already code-complete — finishing it costs 3–5 hours and removes technical debt
2. Memory improvements (Phase 15) address measurable score gaps today (`documentation_score: 70`, `consistency_score: 75`) faster than retrieval improvements would
3. Better chunking (Phase 16) amplifies good memory — retrieval quality improvements compound on top of agent memory improvements
4. Active learning (Phase 17) requires stable memory (Phase 15) and stable retrieval (Phase 16) before the feedback loops produce reliable signals

---

## Phase 14: Finish FSM Integration (Code-Complete, Integration Pending)

**Status:** Modules generated, integration not yet wired  
**Duration:** 3–5 hours  
**Goal:** Connect the three Phase 14 modules into the existing orchestrator pipeline

### Context

All three Phase 14 modules exist as standalone scripts:
- `.claude/scripts/state-machine.js` (375 lines) — FSM engine, IDLE → PLANNING → EXECUTING → VERIFYING → CONSOLIDATING
- `.claude/scripts/vault-validator.js` (390 lines) — YAML frontmatter validation and auto-migration
- `.claude/scripts/mcp-whitelist.js` (310 lines) — Dangerous command detection

31 unit tests exist and cover all functionality. What remains is wiring these modules into the live orchestration pipeline.

### 14.1 FSM Integration

Wire `state-machine.js` into `agent-orchestrator.js`:
- Import and initialize FSM in constructor
- Add `fsm.transition(PLANNING)` in `createTask()`
- Add `fsm.transition(EXECUTING)` in `executeTask()`
- Add `fsm.transition(VERIFYING)` in `verifyTask()`
- Add `fsm.transition(CONSOLIDATING)` / `fsm.transition(IDLE)` in `consolidateTask()`
- Add crash recovery handling

### 14.2 Whitelister Integration

Wire `mcp-whitelist.js` into `mcp-authorization.js`:
- Import and initialize whitelister in constructor
- Add `checkCommand()` call in `getAuthorization()`
- Route dangerous commands to approval prompt

### 14.3 Validator Integration

Wire `vault-validator.js` into `chroma-ingest.js`:
- Add `validateVault()` call before processing begins
- Add `validateFile()` check in `processDocument()`
- Halt ingestion on validation failure with specific field errors

### 14.4 Validation

- Run `node .claude/scripts/validate-phase-14.js` — all 31 tests must pass
- Run Phase 13 regression suite — no breakage
- Manually verify FSM state transitions in orchestrator log
- Manually verify a dangerous command is blocked with a clear error

### Success Criteria

- [ ] FSM logs all state transitions to audit trail
- [ ] Tool calls blocked when they violate current FSM state
- [ ] Phase 13 test suite passes without regression
- [ ] YAML frontmatter validated on ingest; invalid docs rejected with specific error
- [ ] Dangerous commands (rm -rf, chmod 000, dd, fork bombs) blocked with user-visible error

---

## Phase 15: Memory System

**Status:** ✅ Complete (2026-06-09)  
**Duration:** 3–4 days  
**Goal:** Give agents persistent memory of past outcomes, score baselines, and session continuity

### Context

The existing codebase already has the hooks in place:
- `agent-orchestrator.js` `getSharedContext()` is the injection point for agent memory
- `agent-orchestrator.js` `completeSubtask()` is the hook point for the learning loop (Phase 17)
- `context-assembly.js` `assembleContext()` already structures output — two new sources (`agent_memory`, `relationships`) extend it without replacing it
- `outputs.json` records contain `verification_scores`, `cost_usd`, `domain`, `success` — already mined for seeding
- `08-Retrospectives/` contains 20+ session summaries — already mined for continuity

Score gaps visible in outputs.json that memory will address:
- `documentation_score`: consistently 70 — needs skill + memory reinforcement
- `consistency_score`: consistently 75 — needs cross-component consistency check pattern
- `completeness_score`: consistently 80 — addressable via memory of what completeness gaps were flagged

### 15.1 Vault Memory Structure

Create four new Vault directories. Seed manually from existing sources — no automation at this stage.

**Directories:**
```
Vault/
├── 11-Facts/           ← mine from 07-Decisions/ ADRs
├── 12-Entities/        ← component registry (agents, services, APIs)
├── 13-Relationships/   ← mine from 10-Known-Problems/ cause/effect chains
└── 14-Agent-Memory/
    ├── architect/
    ├── backend/
    ├── devops/
    ├── frontend/
    └── qa/
```

**Agent memory file schema:**
```yaml
agent: architect
version: 1.0.0
successful_patterns:
  - pattern: "REST API design"
    domain: "api"
    avg_compliance_score: 90
    confidence: 0.9
    source: "outputs.json#be352f687029fa55"
failed_patterns:
  - pattern: "documentation completeness"
    note: "documentation_score consistently 70 — needs skill"
    source: "outputs.json aggregate"
score_baselines:
  compliance: 97
  completeness: 80
  security: 98
  consistency: 75
  documentation: 70
recommendations:
  - "documentation_score is a consistent weak point — apply documentation skill"
  - "consistency_score 75 — always include cross-component consistency check"
last_updated: "2026-06-09"
```

### 15.2 Chroma Metadata Enhancement

Extend `chroma-ingest.js` metadata schema. Current `where` clause only uses `is_authoritative`. Extend to:

```javascript
metadata: {
  document_type: "adr|retrospective|requirement|known_problem|skill|prompt|fact",
  project: "ai-software-factory",
  phase: "13",
  agent_relevance: ["architect", "backend"],
  domain: "api|auth|infra|security|general",
  tags: ["chroma", "mcp", "authentication"],
  confidence: 0.9,
  source_path: "Vault/07-Decisions/ADR-ARCH-001.md"
}
```

Update `queryChromaCollection()` in `context-assembly.js` to accept and pass metadata filters for domain-targeted retrieval.

### 15.3 Context Assembly Upgrade

Extend `assembleContext()` — add two new context sources without replacing existing ones:

```javascript
context = {
  // existing
  standards: [],
  facts: [],
  sessions: [],
  // new
  agent_memory: {},     // from Vault/14-Agent-Memory/<agent>/
  relationships: []     // from Vault/13-Relationships/
}
```

Pass `agentRole` as a new parameter. The hook already exists in `getSharedContext()` in the orchestrator — just thread `subtask.agent` through.

### 15.4 Memory Seeding Script

One-time migration. Write `.claude/scripts/seed-agent-memory.js`:
- Read all `outputs.json` files across all agents
- Compute per-agent score baselines and weak points
- Read session summaries from `08-Retrospectives/`
- Write initial `Vault/14-Agent-Memory/<agent>/memory.yaml` files

This runs once. Ongoing memory updates are Phase 17 (learning loop).

### 15.5 Session Continuity

Low effort, high value. The `wrap-up.js` script and retrospective format already exist.

Write `.claude/scripts/session-handoff.js`:
- Reads last session summary from `08-Retrospectives/`
- Extracts open items, pending decisions, in-progress tasks
- Writes `Vault/00-Inbox/session-handoff-{date}.md`

Hook into `wrap-up.js` — call `session-handoff.js` at end of wrap-up.

At session start, `assembleContext()` checks for a recent handoff file and includes it in context.

### 15.6 Known Problem Status Tracking

Add status frontmatter to all `10-Known-Problems/` documents:

```yaml
status: open | in_progress | resolved | wont_fix
opened: "2026-06-08"
resolved: null
resolved_by_task: null
resolution_summary: null
```

This is a manual one-time update — no automation yet. The lifecycle tracking enables Phase 17's `problem-resolver.js`.

### Success Criteria

- [x] All four Vault memory directories created and seeded
- [x] `chroma-ingest.js` emits full metadata on every document — implemented and unit-verified; E2E ingestion blocked by pre-existing Chroma API incompatibility, deferred to Phase 16 re-index (see [[../../10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility]])
- [x] `assembleContext()` returns `agent_memory` and `relationships` fields
- [x] `seed-agent-memory.js` runs without errors and produces valid YAML files
- [x] `session-handoff.js` correctly extracts open items from last session summary
- [x] All `10-Known-Problems/` docs have status frontmatter

---

## Phase 16: Search Quality

**Status:** Not started  
**Duration:** 4–5 days  
**Goal:** Improve Chroma retrieval quality via semantic chunking, add exact-match search, and activate the 14 Beta skills

This phase re-indexes the Vault — plan for a Chroma rebuild as part of this work.

### 16.1 Header-Based Markdown Chunking

**Current:** `chroma-ingest.js` splits files naively.  
**Target:** Parse markdown heading hierarchy; chunk by logical sections.

Write `.claude/scripts/markdown-chunker.js`:
- Parse `#`, `##`, `###` heading hierarchy
- Each chunk = heading + all content until next same-level heading
- Chunk metadata includes `header_path` (e.g., `"Authentication > OAuth2 Strategy"`)

Modify `chroma-ingest.js` to use header-based chunking for `.md` files.

### 16.2 AST-Level Code Chunking

**Current:** Code files split by character count.  
**Target:** Split on functional boundaries.

Write `.claude/scripts/code-chunker.js`:
- Identify `function`, `const`, `class`, `async` block boundaries via regex
- Each chunk = complete function/class with scope context prepended
- Chunk metadata includes: file path, component name, scope line range, imports

Modify `chroma-ingest.js` to use block-aware chunking for `.js` and `.py` files.

### 16.3 Skills Activation

The skills system has 14 Beta skills indexed but their file content is empty placeholders — agents are running without knowledge they already have access to.

**Part A — Content + ingestion:**
- Write content for the 14 Beta skill files using the `Templates/Skill.md` format
- Ingest all skills into `global-standards` Chroma collection via `chroma-ingest.js`
- Add `includeSkills` parameter to `assembleContext()` — the SKILLS-INDEX.md already documents this API, the code just doesn't implement it

**Part B — Wire into context pipeline:**
- When `assembleContext()` is called with `{ includeSkills: true, skillDomains: ['api', 'security'] }`, skills matching those domains are retrieved and included in context
- The documentation skill should be activated first given the `documentation_score: 70` baseline

### 16.4 Lexical Search Layer (FlexSearch)

Add exact-match search alongside vector search.

Write `.claude/scripts/lexical-indexer.js`:
- Use `flexsearch` (lightweight, no external deps)
- Index Vault document titles, headings, code function names
- Enable lookup: "find all references to `CHROMA_PORT`"

Modify `chroma-ingest.js` to trigger lexical index updates on document changes.

### 16.5 Hybrid Search (RRF)

Merge vector (semantic) + lexical (exact) results.

Write `.claude/scripts/hybrid-search.js`:
- Run query against ChromaDB: top-N semantic results
- Run query against FlexSearch: exact keyword matches
- Merge using Reciprocal Rank Fusion: `score(doc) = Σ 1 / (60 + rank)`
- Documents appearing in both passes are boosted

Modify `context-assembly.js` to use hybrid search instead of vector-only.

**Example:**
```
Query: "How do I configure the Chroma server host?"

Semantic pass:  1. Chroma setup guide  2. Env vars doc  3. Docker compose
Lexical pass:   1. Docker compose (contains "CHROMA_SERVER_HOST")  2. .env.example

RRF result:     1. Docker compose (boosted — appears in both)  2. Chroma setup guide  3. .env.example
```

### Success Criteria

- [ ] Header-based chunks maintain semantic coherence (no half-paragraphs)
- [ ] Code chunks preserve complete function/class signatures
- [ ] All 14 Beta skills have content and are ingested into Chroma
- [ ] `assembleContext()` accepts `includeSkills` parameter and returns relevant skills
- [ ] FlexSearch indexes Vault content in <1s; exact lookups return in <100ms
- [ ] Hybrid search returns both semantically relevant AND exact-match results
- [ ] Existing Vault re-indexed without document loss

---

## Phase 17: Active Learning and Observability

**Status:** Not started — depends on Phase 15 (stable memory) and Phase 16 (stable retrieval)  
**Duration:** 3–4 days  
**Goal:** Close the feedback loop — agents learn from outcomes, costs are tracked, skill gaps trigger new skill creation

### 17.1 Agent Learning Loop

Attach to `completeSubtask()` in `agent-orchestrator.js` — the hook is already there.

Write `.claude/scripts/memory-updater.js`:
- Reads current agent memory file from `Vault/14-Agent-Memory/<agent>/`
- Appends outcome with verification scores
- Recalculates rolling score baselines
- Flags score drops > 10 points vs. baseline as regressions
- Routes memory write through `approval-workflow.js` (human-in-the-loop gate — reuses existing infrastructure)

In `completeSubtask()`, after `task.status = 'complete'`:
```javascript
await this.memoryUpdater.recordOutcome({
  agent: subtask.agent,
  domain: task.domain,
  verificationScores: subtask.verificationResult,
  pattern: subtask.description,
  success: true
});
```

### 17.2 Cost Aggregation

`cost_usd` already exists in every `outputs.json` record. This is data waiting to be used.

Write `.claude/scripts/cost-analyzer.js`:
- Aggregates cost per agent, per domain, per phase, per day
- Flags tasks that exceeded token/cost thresholds
- Detects cost spikes correlated with prompt version changes
- Outputs to `Vault/Logs/cost-report-{date}.md`

### 17.3 Prompt Health Monitor

`prompt-version-manager.js` and A/B test infrastructure exist but scores aren't tracked per version over time.

Extend prompt tracking:
- After each output, record `(prompt_version, score_type, value)` as a timeseries entry
- Alert when any score drops >10 points vs. that version's baseline
- `documentation_score: 70` would be the first alert this fires

### 17.4 Skill Gap Detection

Connects the learning loop to the skills pipeline.

After the learning loop detects a recurring weak score (e.g., `documentation_score < 75` three times):
1. Check `SKILLS-INDEX.md` for a matching skill in the relevant domain
2. If no matching skill exists: auto-create a Draft stub in `Vault/00-Inbox/` using `Templates/Skill.md`
3. If a Beta skill exists but scores aren't improving: flag it for promotion review
4. Route both actions through `approval-workflow.js`

### 17.5 Known Problem Resolution Loop

Write `.claude/scripts/problem-resolver.js`:
- When a subtask completes, check if its description/output matches keywords from open `10-Known-Problems/` entries
- If a match is found: flag for human confirmation to close the problem
- Route through existing `approval-workflow.js`
- Updates the problem's status frontmatter (added in Phase 15.6) on confirmation

### 17.6 Vault Health Audit

Write `.claude/scripts/vault-auditor.js`:
- Flags documents not updated in >30 days
- Detects ADRs with keyword overlap but contradictory conclusions
- Checks every known problem has a `status` field
- Checks every ADR is referenced by at least one fact in `11-Facts/`
- Outputs to `Vault/Logs/vault-health-{date}.md`

### What Is Deferred

**Knowledge Extraction Service (auto-extraction from ADRs/retrospectives):** High risk. Automated memories can compound if wrong. Deferred until Phase 17 learning loop and vault health checks are stable. At that point, bad auto-extracted memories can be caught and corrected by the audit loop.

**Dependency/Impact Map (15.5 from new plan):** Needs `13-Relationships/` populated first. Re-evaluate after Phase 15.1 seeding is complete.

**Test Coverage Memory (QA agent):** Low priority relative to everything above. Revisit after Phase 17 core is stable.

### Success Criteria

- [ ] `completeSubtask()` triggers memory update after every completed task
- [ ] Memory updates route through approval workflow before being written
- [ ] Score regressions (>10 point drop) logged with task context
- [ ] Cost report generated correctly from existing outputs.json data
- [ ] Prompt health monitor fires an alert on documentation score below threshold
- [ ] Skill gap detection creates a Draft stub for unmapped recurring weak scores
- [ ] `problem-resolver.js` flags completed tasks that match open problem keywords
- [ ] `vault-auditor.js` produces a health report with zero false positives on known-good docs

---

## Timeline Summary

| Phase | Focus | Duration | Prerequisites |
|-------|-------|----------|---------------|
| **Phase 14** | FSM integration (wire existing code) | 3–5 hours | None — code is done |
| **Phase 15** | Memory system | 3–4 days | Phase 14 complete |
| **Phase 16** | Search quality + skills activation | 4–5 days | Phase 15 complete |
| **Phase 17** | Active learning + observability | 3–4 days | Phase 15 + 16 stable |

**Total:** ~12–14 days of focused work

---

## Key Files

| File | Action | Phase |
|------|--------|-------|
| `agent-orchestrator.js` | Wire FSM transitions | 14 |
| `mcp-authorization.js` | Wire whitelister | 14 |
| `chroma-ingest.js` | Wire validator; extend metadata; chunking; lexical trigger | 14, 15.2, 16.1–16.4 |
| `context-assembly.js` | Add memory + relationships sources; `includeSkills`; hybrid search | 15.3, 16.3B, 16.5 |
| `Vault/11-Facts/` | Create + seed from ADRs | 15.1 |
| `Vault/12-Entities/` | Create + schema | 15.1 |
| `Vault/13-Relationships/` | Create + seed from Known Problems | 15.1 |
| `Vault/14-Agent-Memory/<agent>/` | Create + seed | 15.1, 15.4 |
| `.claude/scripts/seed-agent-memory.js` | New — one-time migration | 15.4 |
| `.claude/scripts/session-handoff.js` | New — session continuity | 15.5 |
| `.claude/scripts/markdown-chunker.js` | New — header-based chunking | 16.1 |
| `.claude/scripts/code-chunker.js` | New — AST-level code chunking | 16.2 |
| `.claude/scripts/lexical-indexer.js` | New — FlexSearch index | 16.4 |
| `.claude/scripts/hybrid-search.js` | New — RRF merge | 16.5 |
| `.claude/scripts/memory-updater.js` | New — learning loop | 17.1 |
| `agent-orchestrator.js` | Hook learning loop into `completeSubtask()` | 17.1 |
| `.claude/scripts/cost-analyzer.js` | New — cost aggregation | 17.2 |
| `.claude/scripts/problem-resolver.js` | New — problem lifecycle | 17.5 |
| `.claude/scripts/vault-auditor.js` | New — vault health | 17.6 |

---

## Notes

1. **Phase 16 requires a Chroma re-index.** Plan for a fresh ChromaDB build when starting Phase 16. The new chunking strategy produces different chunk boundaries that invalidate the existing index.
2. **Skills activation (16.3) can start before the Chroma re-index** — write skill content first, verify it, then ingest everything together during the Phase 16 re-index.
3. **Phase 17 learning loop requires human approval gates.** The existing `approval-workflow.js` infrastructure handles this — memory writes are not automatic.
4. **`documentation_score: 70` is the earliest actionable signal.** The documentation skill should be the first Beta skill activated in Phase 16.3, and is the expected first alert from Phase 17.3.

---

## Phase 17 Cleanup Backlog (from 2026-06-10 Audit)

These items were identified during the first full system audit and deferred to Phase 17. They are pre-requisite hygiene work, not new features — complete them before or alongside Phase 17.1–17.6.

### C1 — Remove tracked-but-ignored runtime files (H2 — Approval Required)

**Problem:** `git ls-files -ci --exclude-standard` returns 70+ files that are gitignored but still tracked (`.claude/approvals/`, `.claude/reviews/`, `.claude/metrics/`, `.claude/scripts/.claude/`, `.vscode/`, `Vault/.obsidian/themes/`).

**Action:** Run `git rm --cached` on all affected paths. Requires explicit human approval before execution.

**Verification:** `git ls-files -ci --exclude-standard` returns empty.

### C2 — Isolate test side effects from Vault source files (H1 residual)

**Problem:** `npm test` (Phase 11 validator) writes to `Vault/10-Known-Problems/` as a side effect — incrementing occurrence counts on every run. The capitalization bug is fixed, but the root issue (tests mutating production Vault files) remains.

**Action:** Modify `validate-phase-11.js` and `problem-manager.js` to write test artifacts to `.claude/.test-problems/` (already gitignored) instead of `Vault/10-Known-Problems/`.

**Verification:** Running `npm test` three times produces no changes to `Vault/10-Known-Problems/`.

### C3 — Add validate-phase-15 and validate-phase-16 scripts (M1 extension)

**Problem:** Phases 15 and 16 have no validator scripts. `npm run test:all` covers only phases 8–14.

**Action:** Write `.claude/scripts/validate-phase-15.js` and `.claude/scripts/validate-phase-16.js`; add `test:phase-15` and `test:phase-16` entries to `package.json`; include in `test:all`.

**Verification:** `npm run test:all` exits 0 with all phase validators passing.

### C4 — Move `.claude/scripts/*.md` docs to Vault (L3)

**Problem:** `context-assembly-mcp.md` and `phase-14-integration.md` live in `.claude/scripts/` (a code directory). They are documentation, not scripts.

**Action:** Move to `Vault/03-Projects/AI Software Factory/` with appropriate frontmatter.

**Verification:** `.claude/scripts/` contains only `.js` files.

### C5 — ADR for Phase 16 Chroma strategy change

**Problem:** The switch from direct Chroma HTTP calls to the `chromadb` JS client is an architectural decision with no ADR.

**Action:** Create `Vault/07-Decisions/ADR-INFRA-003.md` documenting the Chroma client strategy, the v1→v2 migration, and the choice of the JS SDK over raw HTTP.

**Verification:** `Vault/07-Decisions/DECISIONS.md` includes ADR-INFRA-003.

---

## Phase 18: Project Build Pipeline

**Goal:** Implement the end-to-end pipeline for scaffolding, building, verifying, and shipping new projects using the framework. This is the first phase that produces *output projects*, not framework improvements.

**Prerequisites:** Phase 16 (Chroma pipeline working), Phase 17 cleanup complete.

**Spec:** `Vault/09-Requirements/Project Build Pipeline/` (BR/FR/NFR — Approved 2026-06-10)

---

### 18.1 — Project Scaffold System

Build the scaffold script that creates a new project from the framework template.

**Deliverables:**
- `.claude/scripts/scaffold-project.js` — copies `.claude/`, `Vault/`, `CLAUDE.md`, and scripts into `Projects/[category]/[project-name]/`; creates category folder on first use; appends project rules placeholder to project `CLAUDE.md`
- `Vault/03-Projects/Registry.md` — project registry (name, category, Chroma collection, status, created date, GitHub repo)
- `Projects/` added to root `.gitignore` (each project manages its own git)
- `package.json` — add `scaffold` script: `node .claude/scripts/scaffold-project.js`

**Verification:** Running `npm run scaffold` prompts for project name, type, and category; creates `Projects/[category]/[name]/` with full framework copy; registers project in Registry.md.

---

### 18.2 — Discovery Skill Update

Extend the `/discover` skill to capture all required pipeline inputs.

**Deliverables:**
- Update `Vault/05-Prompts/Skills/Cross-Cutting/project-discovery-interview-v1.0.md` — add question areas: project-specific rules, soft budget ceiling, hosting/deployment target, paid API tolerance
- Update `Vault/05-Prompts/Project-Discovery.md` — align with updated skill
- Output template updated to include: Project Rules section, Budget Ceiling, Test Plan summary

**Verification:** A `/discover` interview produces a spec with all required fields populated and no open questions.

---

### 18.3 — Chroma Cross-Project Indexing

Register each scaffolded project's Vault into the framework's Chroma instance so future projects can query it.

**Deliverables:**
- Update `chroma-ingest.js` — add support for ingesting a named external Vault path into a named collection
- Update scaffold script (18.1) — after creating project, register and ingest its Vault into framework Chroma
- Reusability detection query added to research phase: queries all registered project collections before recommending new custom components
- Match threshold: 0.85+ semantic similarity flags a component for reuse review

**Verification:** After scaffolding a project and adding content to its Vault, a Chroma query from the framework returns results from the project collection.

---

### 18.4 — Phase Plan Generator

Build the agent capability to produce a phased implementation plan from a completed discovery spec.

**Deliverables:**
- New skill: `Vault/05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md` — takes a project spec and produces: recommended phases with rationale, file structure scaffold, dependencies per phase, test plan summary per phase
- Phase plan output saved to `Projects/[category]/[name]/Vault/03-Projects/[name]/Phase-Plan.md`
- Human approval gate before any build phase begins

**Verification:** Given a completed discovery spec, the skill produces a phase plan that covers all FR-PBP-005 acceptance criteria.

---

### 18.5 — Autonomous Build Loop

Implement the per-phase build loop: implement → test → checkpoint → advance.

**Deliverables:**
- `.claude/scripts/build-runner.js` — orchestrates phased build: reads phase plan, executes each phase, runs tests, creates git checkpoint, advances to next phase
- Blocker escalation ladder wired: fix → web search → escalate → log to Known Problems
- Phase checkpoint: `git commit` at end of each passing phase, labeled `[phase-N] [project-name] checkpoint`
- Regression guard: prior phase tests re-run at start of each new phase

**Verification:** A two-phase build completes autonomously; each phase has a labeled git checkpoint; a regression introduced in phase 2 is detected before phase 3 begins.

---

### 18.6 — Review and Ship

Implement the pre-commit review step and deployable output requirements.

**Deliverables:**
- Pre-commit review script: generates diff summary + decision log (what changed, why each significant decision was made)
- Dockerfile scaffold included in all projects by default
- Basic GitHub Actions CI scaffold (run tests on push)
- `README.md` scaffold with deployment instructions
- Post-build Vault record written to `Projects/[category]/[name]/Vault/03-Projects/[name]/`
- Session summary written to project's `Vault/08-Retrospectives/`
- Project status in Registry.md updated to `shipped`

**Verification:** After build completes, human receives a diff summary + decision log; project contains Dockerfile, CI config, README, and Vault record; Registry.md shows `shipped`.

---

### Phase 18 File Summary

| File | Action |
|------|--------|
| `.claude/scripts/scaffold-project.js` | New |
| `.claude/scripts/build-runner.js` | New |
| `Vault/03-Projects/Registry.md` | New |
| `Vault/05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Cross-Cutting/project-discovery-interview-v1.0.md` | Update |
| `Vault/05-Prompts/Project-Discovery.md` | Update |
| `chroma-ingest.js` | Update |
| `package.json` | Add scaffold script |
| `.gitignore` | Add `Projects/` |
| `SKILLS-INDEX.md` | Add phase-plan-generator skill |

---

### Phase 18 Notes

1. **Phase 16 must complete first.** Chroma cross-project indexing (18.3) requires a working `chroma-ingest.js`.
2. **18.1 scaffold can start immediately** after Phase 17 cleanup — it does not depend on Chroma.
3. **18.4 phase plan generator** is where AI recommendations happen — the agent proposes phases, human reshapes and approves.
4. **`Projects/` is gitignored at the framework level.** Each project runs `git init` independently and gets its own GitHub repo.
5. **Soft budget gate** (NFR-PBP-004) is enforced by the build runner in 18.5 — discovery captures the ceiling, build runner checks against it.
