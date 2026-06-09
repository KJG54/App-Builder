---
type: fact
status: Current
authority: facts
domain: infra
confidence: 0.9
agent_relevance: [architect, devops, backend]
tags: [mcp, integration, audit]
source: ADR-INT-001
last_updated: 2026-06-09
---

# Fact: All MCP Tool Calls Are Authorized and Audit-Logged

**Statement:** Every MCP tool operation passes through the authorization matrix and is recorded by the audit logger. GitHub and Filesystem MCP servers are the prioritized integrations; dangerous commands are blocked by the Phase 14 whitelister.

**Implications:**

- `mcp-authorization.js` enforces per-agent tool permissions
- `mcp-whitelist.js` blocks destructive commands (rm -rf, dd, fork bombs) with user-visible errors
- PostgreSQL, Jira, AWS, and Slack MCP integrations are deferred decisions

**Source:** [[../07-Decisions/ADR-INT-001]], [[../07-Decisions/ADR-INFRA-002]], Decision 9 in [[../07-Decisions/DECISIONS.md]]
