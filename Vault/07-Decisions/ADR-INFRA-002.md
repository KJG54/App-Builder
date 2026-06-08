---
type: Decision
phase: 12
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [infrastructure, mcp, phase-12, github, filesystem]
related: [ADR-INT-001, ADR-SEC-001, ADR-ARCH-001]
last_updated: 2026-06-08
---

# ADR-INFRA-002: Phase 12 MCP Server Prioritization and Integration

**Date:** 2026-06-08  
**Status:** Accepted  
**Phase:** 12 — Advanced MCP Integration  
**Category:** Infrastructure (INFRA)

---

## Decision

Phase 12 prioritizes **GitHub MCP Server** and **Filesystem MCP Server** as the first two external tool integrations. These servers are integrated into `.mcp.json`, with audit logging and authorization enforcement per ADR-INT-001.

**PostgreSQL, Jira, AWS, and Slack** integration is deferred to Phase 13+ due to infrastructure and scope constraints.

---

## Context

### Problem: Agents Cannot Act on Real Systems

Phases 1–11 built knowledge infrastructure, quality gates, and observability. But agents operate only in planning/analysis mode. They cannot:
- Create pull requests
- Commit code
- Read/write project files
- Interface with repositories

This limits the factory's utility. To become a true "software development OS," agents must access real external tools.

### Why GitHub + Filesystem First?

**GitHub MCP Server:**
- Enables agents to search code, create PRs, manage branches
- Direct value: Backend/Frontend agents can propose and implement changes
- Risk: Tier-2/3 operations gated by approval workflow (Phase 10)
- Availability: Stable, official MCP server exists

**Filesystem MCP Server:**
- Enables local file operations (read, write, directory listing)
- Direct value: Agents can work with project files directly
- Risk: Scoped to `PROJECT_ROOT` for safety
- Availability: Stable, official MCP server exists

### Why Not PostgreSQL?

**Deferred Reasons:**
1. No PostgreSQL container in current Docker Compose (would require new service)
2. Adding database service requires approval per CLAUDE.md (separate infra decision)
3. Backend agents can prototype with Filesystem + GitHub before DB access
4. Phase 13 allows time to design database integration properly

### Why Not Jira/Slack/AWS?

**Deferred to Phase 13:**
1. Jira/Slack: Require external SaaS accounts, OAuth setup (not local-first)
2. AWS: Requires IAM credentials, cloud permissions (higher risk)
3. These fit better with "multi-team coordination" (Phase 13 scope)

---

## Alternatives Considered

### Alternative 1: GitHub + PostgreSQL + Filesystem (All Phase 12)

**Pros:**
- More capabilities sooner
- Database access enables richer agent workflows

**Cons:**
- Scope creep (Phase 12 becomes 4+ weeks)
- Database service adds Docker Compose complexity
- Requires separate infra ADR and approval
- Risk: Quality suffers if too much in one phase

### Alternative 2: GitHub Only (No Filesystem)

**Pros:**
- Simpler scope
- Agents only access version-controlled code

**Cons:**
- Limits file operations to committed files only
- Cannot write config, test data, or temporary files
- Agents less autonomous

### Alternative 3: GitHub + Filesystem + Jira (Phase 12)

**Pros:**
- Links code to issue tracking

**Cons:**
- Jira requires external SaaS account
- Breaks "local-first" principle
- Not feasible without user setup

### Selected: GitHub + Filesystem (Phase 12) ✅

**Rationale:**
- Balanced scope (2 servers, 5 new components)
- Both enable agent autonomy
- Both keep system local-first
- Both have stable MCP implementations
- Foundation for Phase 13 (PostgreSQL + external systems)

---

## Implementation

### MCP Server Configuration (`.mcp.json`)

**GitHub Server:**
```json
{
  "github": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
  }
}
```

**Filesystem Server:**
```json
{
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem"],
    "env": { "ALLOWED_DIRECTORIES": "${PROJECT_ROOT}" }
  }
}
```

**Safeguards:**
- `GITHUB_TOKEN` must be set; missing token doesn't crash (logged failure)
- `ALLOWED_DIRECTORIES` scoped to `PROJECT_ROOT` (no access outside repo)
- Both servers registered in `.mcp.json` (discoverable by agents)

### Audit Logging (ADR-INT-001 Compliance)

**Component:** `.claude/scripts/mcp-audit-logger.js`

Features:
- Logs every tool call: `{ timestamp, agent, server, tool, args_sanitized, result_status, duration_ms }`
- Sanitizes secrets (token, password, key fields)
- Storage: `.claude/mcp-audit/audit-YYYYMMDD.jsonl` (one file per day)
- Query API: `getAuditLog(dateRange, filters)`, `getStats()`, `exportCSV()`
- Retention policy: 90-day default (cleanup() method)

### Authorization Enforcement (ADR-INT-001 Compliance)

**Component:** `.claude/scripts/mcp-authorization.js`

Implements authorization matrix:

| Agent | Server | Tools | Tier |
|-------|--------|-------|------|
| Backend | github | search, PR (create/push) | 1, 2 |
| Frontend | github | search, PR (create/push) | 1, 2 |
| Architect | github | search (read-only) | 1 |
| DevOps | github | merge, search | 3, 1 |
| Security | github | search (code audit) | 1 |
| QA | github | search (read-only) | 1 |
| (All agents) | filesystem | read (with write for backend/frontend/devops) | 1, 2 |
| (All agents) | chroma | query (existing) | 1 |

Tier definitions:
- **Tier 1:** Auto-allow, log only
- **Tier 2:** Allow, integrate with Phase 10 review pipeline (code review required)
- **Tier 3:** Escalate to Phase 10 approval workflow (human approval required)
- **Tier 4–5:** Block permanently

Features:
- `checkAuthorization(agent, server, tool)` → decision + reasoning
- `getAuthorizedTools(agent)` → docs for agents
- `validate()` → matrix integrity check

---

## Consequences

### Positive

✅ **First real external tools** — Agents can now act on GitHub and local files  
✅ **Quality gates preserved** — All Tier-2/3 operations still gated by Phase 10 review  
✅ **Audit trail established** — Every tool call logged per ADR-INT-001  
✅ **Authorization enforced** — Matrix blocks unauthorized operations  
✅ **Local-first maintained** — No external SaaS dependencies (GitHub token optional)  
✅ **Scope controlled** — 2 servers, clear boundary for Phase 13  
✅ **Foundation for Phase 13** — Database/Slack/AWS can be added without redesign  

### Negative

❌ **No database access yet** — Agent database workflows deferred to Phase 13  
❌ **No issue tracking integration** — Jira/Linear deferred to Phase 13  
❌ **Dependency on MCP spec** — Tied to GitHub/Filesystem MCP implementations  
❌ **Environment setup required** — Users must set `GITHUB_TOKEN` for GitHub features  

### Mitigations

- PostgreSQL planned for Phase 13 (no long-term gap)
- Agents can work with Filesystem + GitHub PRs in Phase 12
- MCP servers are maintained by Anthropic/community (low maintenance risk)
- Optional: If `GITHUB_TOKEN` not set, GitHub features gracefully disabled

---

## Authorization Matrix Rationale

**Why Backend can create PRs (Tier 2)?**
- Backend agents propose code changes → PR creation is core workflow
- Review pipeline catches errors before merge
- Risk: acceptable with Tier 2 gate

**Why DevOps can merge (Tier 3)?**
- Merge is irreversible; requires human approval
- DevOps initiates deploys; humans control final merge
- Risk: high; human gate mandatory

**Why Architect cannot write files (Tier 5)?**
- Architects plan; engineers implement
- Architect writes → docs (not code files)
- Risk: architecture drift if architects edit source directly

**Why Filesystem access is Tier 1 for reads, Tier 2 for writes?**
- Read: Safe, non-destructive
- Write: Can create bugs; needs review
- Scoped to `PROJECT_ROOT` for safety

---

## Related Standards

- [[ADR-INT-001]] — MCP Server Integration Policy (authorization matrix, tool access rules)
- [[ADR-SEC-001]] — Human Approval Gate Requirements (approval tiers)
- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design (agents use context + tools)
- [[02-Technologies/MCP_SERVERS.md]] — MCP server inventory and status
- [[Vault/05-Prompts]] — Agent prompts with MCP tool usage examples

---

## Approval

- ✅ **Reviewed by:** Phase 12 Planning
- ✅ **Approved by:** User (Phase 12 plan approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-08

---

## Revision History

**v1.0 (2026-06-08):** Initial ADR establishing Phase 12 MCP integration
- Rationale for GitHub + Filesystem prioritization
- Deferral of PostgreSQL, Jira, AWS, Slack to Phase 13+
- Authorization matrix for agent-to-tool access
- Audit logging implementation strategy
- Filesystem scoping decision

---

## Next Review

**Phase 13 Planning** — Evaluate PostgreSQL integration, Jira/Slack/AWS readiness

---

**Last Updated:** 2026-06-08  
**Status:** Production Ready  
**Test Pass Rate:** 8/8 (validation suite)
