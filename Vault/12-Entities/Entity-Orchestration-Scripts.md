---
type: entity
status: Current
authority: facts
entity_kind: script
domain: general
agent_relevance: [architect, backend, devops]
tags: [orchestration, scripts, pipeline]
last_updated: 2026-06-09
---

# Entity: Orchestration Script Pipeline

The `.claude/scripts/` modules that implement the factory's runtime.

| Script | Responsibility | Phase |
|--------|----------------|-------|
| `agent-orchestrator.js` | Task/subtask lifecycle, dependencies, context sharing, FSM enforcement | 13–14 |
| `mcp-authorization.js` | Per-agent tool authorization matrix + dangerous-command check | 12, 14 |
| `mcp-audit-logger.js` | Audit trail for all MCP operations | 12 |
| `approval-workflow.js` | Human-in-the-loop escalation and approval gates | 10 |
| `context-assembly.js` | Chroma context retrieval, agent memory, relationships, session handoff | 5, 15 |
| `chroma-ingest.js` | Vault → Chroma ingestion with classification + validation | 5, 14, 15 |
| `state-machine.js` | FSM engine (IDLE → PLANNING → EXECUTING → VERIFYING → CONSOLIDATING) | 14 |
| `vault-validator.js` | YAML frontmatter validation and auto-migration | 14 |
| `mcp-whitelist.js` | Dangerous command detection | 14 |
| `slack-notifier.js` | Observer-only Slack notifications | 13 |
| `seed-agent-memory.js` | One-time agent memory seeding from outputs.json | 15 |
| `session-handoff.js` | Session continuity — extracts open items from last retrospective | 15 |
| `wrap-up.js` | End-of-day summary, handoff, commit, push | — |

**Related:** [[../11-Facts/Fact-Multi-Agent-Orchestration]] | [[../11-Facts/Fact-MCP-Integration-Policy]]
