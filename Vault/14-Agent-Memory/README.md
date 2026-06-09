---
type: guide
status: active
tags: [agent-memory, memory, phase-15]
last_updated: 2026-06-09
---

# 14-Agent-Memory — Per-Agent Persistent Memory

Persistent memory for each orchestrated agent role. Part of the Phase 15 memory system.

**Purpose:** Give each agent durable knowledge of its own past outcomes — successful patterns, failure patterns, score baselines, and recommendations — injected into its context by `context-assembly.js` on every assignment.

**Structure:**

```
14-Agent-Memory/
├── architect/memory.yaml
├── backend/memory.yaml
├── devops/memory.yaml
├── frontend/memory.yaml
└── qa/memory.yaml
```

**Memory file schema (`memory.yaml`):**

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
last_updated: "2026-06-09"
```

**Lifecycle:**

- **Seeding (Phase 15):** `.claude/scripts/seed-agent-memory.js` — one-time migration from `.claude/metrics/*/outputs.json`
- **Reading (Phase 15):** `context-assembly.js` includes `agent_memory` in assembled context when `agentRole` is passed
- **Updating (Phase 17):** `memory-updater.js` will append outcomes after each completed subtask, gated by `approval-workflow.js` — memory writes are never automatic

**Note:** The `.claude/metrics/test/` directory maps to the `qa` agent role.

**Related:** [[../11-Facts/Fact-Agent-Role-Specialization]] | [[../13-Relationships/README|13-Relationships]] | [[../12-Entities/Entity-Agent-Roles]]
