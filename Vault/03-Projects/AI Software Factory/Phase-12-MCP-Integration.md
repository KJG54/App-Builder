---
type: Phase
phase: 12
status: Complete
authority: facts
chroma_collection: ai-software-factory-facts
tags: [phase-12, mcp-integration, github, filesystem, authorization, audit]
related: [ADR-INT-001, ADR-INFRA-002, ADR-SEC-001, Phase-11, Phase-13]
last_updated: 2026-06-08
---

# Phase 12: Advanced MCP Integration

**Status:** ✅ Complete (2026-06-08)  
**Test Results:** 8/8 tests passing (100% success rate)  
**Implementation Files:** 3 core modules + test suite

---

## Overview

Phase 12 integrates GitHub and Filesystem MCP servers into the agent framework, giving agents their first real-world tool access. All operations are logged, authorized, and gated by the approval workflow from Phase 10.

**Key Components:**
1. **MCP Server Configuration** — GitHub and Filesystem servers in `.mcp.json`
2. **Audit Logger** — Logs every tool call with metadata and sanitized args
3. **Authorization Enforcer** — Implements agent-to-tool access matrix
4. **Integration Documentation** — Agent workflows and usage examples
5. **ADR Infrastructure Decision** — Rationale for server prioritization

---

## Architecture

```
Agent Initiates Tool Call
    ├─ Tool: github:create_pull_request
    └─ Args: { repo, title, branch }
    ↓
Authorization Check (MCP Authorization Enforcer)
    ├─ Agent: backend
    ├─ Tool Tier: 2 (code review required)
    └─ Decision: Allow (with Phase 10 review gate)
    ↓
Tool Call Executes
    └─ GitHub MCP Server handles request
    ↓
Audit Log Entry (MCP Audit Logger)
    ├─ timestamp: 2026-06-08T15:30:00Z
    ├─ agent_role: backend
    ├─ server: github
    ├─ tool: create_pull_request
    ├─ args_sanitized: { repo, title, branch }
    ├─ result_status: success
    └─ duration_ms: 1234
    ↓
Integration with Phase 10
    ├─ Tier 2 → Review Request
    ├─ Tier 3 → Escalation
    └─ Tier 1 → Auto-approve (logged only)
```

---

## Component Details

### 1. MCP Server Configuration (`.mcp.json`)

**New Servers Added:**

**GitHub MCP Server**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
}
```

Tools available (per authorization):
- `search_repositories` (Tier 1)
- `search_code` (Tier 1)
- `get_repository` (Tier 1)
- `get_file_contents` (Tier 1)
- `create_pull_request` (Tier 2)
- `push_branch` (Tier 2)
- `merge_pull_request` (Tier 3)

**Filesystem MCP Server**
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem"],
  "env": { "ALLOWED_DIRECTORIES": "${PROJECT_ROOT}" }
}
```

Tools available (per authorization):
- `read_file` (Tier 1)
- `list_directory` (Tier 1)
- `write_file` (Tier 2)

**Safeguards:**
- GitHub server: `GITHUB_TOKEN` env var controls access; missing token → graceful failure
- Filesystem server: `ALLOWED_DIRECTORIES` scoped to project root only
- Both servers: gracefully disabled if env vars missing (no crash)

### 2. MCP Audit Logger (`.claude/scripts/mcp-audit-logger.js`)

**Purpose:** Implement audit trail required by ADR-INT-001

**Key Methods:**
```javascript
log(agentRole, server, tool, args, resultStatus, metadata)
  → { timestamp, agent_role, server, tool, args_sanitized, result_status, ... }

query(startDate, endDate, filters)
  → Returns all log entries matching criteria

getStats(startDate, endDate)
  → { total_calls, by_agent, by_server, by_result, error_rate }

exportCSV(startDate, endDate, outputPath)
  → Export for compliance audits

cleanup(keepDays)
  → Delete logs older than N days
```

**Log Format (JSONL):**
```jsonl
{"timestamp":"2026-06-08T15:30:00Z","agent_role":"backend","server":"github","tool":"create_pull_request","args_sanitized":{"repo":"test/repo","title":"Feature X"},"result_status":"success","duration_ms":1234}
{"timestamp":"2026-06-08T15:31:00Z","agent_role":"devops","server":"github","tool":"merge_pull_request","args_sanitized":{"pr_number":123},"result_status":"blocked","reason":"Tier 3: requires human approval","error":"Escalation required"}
```

**Secret Sanitization:**
- Strips values for: `password`, `token`, `secret`, `key`, `credential`, `auth`
- Replaces with: `***REDACTED***`
- Preserves: normal fields, repo names, file paths

**Storage:**
- Directory: `.claude/mcp-audit/`
- Naming: `audit-YYYYMMDD.jsonl` (one per day)
- Format: Newline-delimited JSON (easy grep)
- Retention: 90 days default

### 3. MCP Authorization Enforcer (`.claude/scripts/mcp-authorization.js`)

**Purpose:** Enforce agent-to-tool access matrix from ADR-INT-001

**Authorization Matrix:**

| Agent | github | filesystem | chroma |
|-------|--------|-----------|--------|
| **Architect** | search (1) | read (1) | query (1) |
| **Backend** | search (1), PR (2), push (2) | read (1), write (2) | query (1) |
| **Frontend** | search (1), PR (2), push (2) | read (1), write (2) | query (1) |
| **Security** | search (1) | read (1) | query (1) |
| **DevOps** | search (1), merge (3) | read (1), write (2) | — |
| **QA** | search (1) | read (1) | query (1) |
| **Documentation** | search (1) | read (1) | query (1) |

**Tier Definitions:**
- **Tier 1:** Read-only, low-risk → Allow, log only
- **Tier 2:** Code-modifying → Allow, integrate with Phase 10 review pipeline
- **Tier 3:** Infrastructure-modifying → Escalate to Phase 10 approval workflow
- **Tier 4–5:** Blocked permanently (e.g., delete repo, delete database)

**Key Methods:**
```javascript
checkAuthorization(agentRole, server, tool)
  → { allowed, tier, action, reason, deadline_hours, ... }

getAuthorizedTools(agentRole, server?)
  → Returns all tools agent can use (useful for docs)

getMatrix()
  → Export full authorization matrix

getAgentsForTool(server, tool)
  → Reverse lookup: which agents can use this tool?

validate()
  → Check matrix for consistency and completeness
```

**Decision Flow:**
```
1. checkAuthorization('backend', 'github', 'create_pull_request')
   → { allowed: true, tier: 2, action: 'require-review', ... }

2. If tier === 1: Auto-allow, audit log, proceed
   If tier === 2: Allow, audit log, flag for Phase 10 review
   If tier === 3: Allow, audit log, escalate to Phase 10 approval
   If tier >= 4: Deny, audit log attempt, reason why
```

---

## Integration with Other Phases

**Requires:**
- Phase 8 (Verification) — Used by audit logger for result classification
- Phase 9 (Metrics) — Tool usage tracked in audit log
- Phase 10 (Review Pipeline) — Tier 2/3 operations gated by approval workflow
- ADR-INT-001 — Authorization policy and tool access rules

**Enables:**
- Agents can now propose and implement code (Tier 2)
- Agents can now read/write project files (Tier 1/2)
- Operators can audit all agent tool usage
- Phase 13 can add PostgreSQL, Jira, Slack with same framework

---

## Agent Workflow Examples

### Backend Agent: Create PR with Code Changes

**Workflow:**
```javascript
// 1. Architect designs API
// 2. Backend implements
// 3. Backend reads existing file (Tier 1, auto-allow)
const code = mcp.call('filesystem:read_file', { path: 'src/api.js' });

// 4. Backend modifies code
const modified = addNewEndpoint(code);

// 5. Backend creates PR (Tier 2, review required)
const pr = mcp.call('github:create_pull_request', {
  repo: 'project/repo',
  title: 'Feature: User API',
  branch: 'feature/user-api',
  body: 'Implements user management endpoints'
});

// 6. Review pipeline:
//    - Verification agent checks code quality
//    - Observability tracks metrics
//    - Approval workflow routes to human reviewer
//    - Human approves or requests changes
```

### DevOps Agent: Merge and Deploy

**Workflow:**
```javascript
// 1. DevOps checks PR status (Tier 1, auto-allow)
const pr = mcp.call('github:get_pull_request', { number: 123 });

// 2. All checks pass; DevOps merges (Tier 3, approval required)
//    - Authorization enforcer: Tier 3, requires human approval
//    - Phase 10: Routes to escalation workflow
//    - Human approver: Reviews + approves merge
const result = mcp.call('github:merge_pull_request', {
  number: 123,
  merge_method: 'squash'
});

// 3. DevOps deploys (future: docker/kubernetes)
```

### Architect: Search and Analyze

**Workflow:**
```javascript
// 1. Architect searches codebase (Tier 1, auto-allow)
const results = mcp.call('github:search_code', {
  query: 'class UserService',
  repo: 'project/repo'
});

// 2. Architect reads API file (Tier 1, auto-allow)
const api = mcp.call('filesystem:read_file', { path: 'src/api.js' });

// 3. Architect queries knowledge base (Tier 1, auto-allow)
const standards = mcp.call('chroma:query_documents', {
  query: 'API design standards'
});

// 4. Architect produces analysis and ADR (no tool calls; knowledge work)
```

---

## Test Results

**Phase 12 Validation Suite:** 8/8 tests passing ✅

**Test Coverage:**
1. ✅ **Test 1:** `.mcp.json` schema valid, servers parseable
2. ✅ **Test 2:** Audit logger creates entries with all fields
3. ✅ **Test 3:** Audit logger sanitizes secrets from args
4. ✅ **Test 4:** Authorization allows Tier-1 tools
5. ✅ **Test 5:** Authorization blocks unauthorized agents
6. ✅ **Test 6:** Authorization routes Tier-2 correctly
7. ✅ **Test 7:** Authorization matrix is valid and complete
8. ✅ **Integration:** Full flow (authorization → execution → audit)

**Running Tests:**
```bash
npm run test:phase-12
```

---

## Usage Examples

### Example 1: Check Authorization

```javascript
const MCPAuthorization = require('./.claude/scripts/mcp-authorization.js');
const auth = new MCPAuthorization();

// Backend creating PR
const result = auth.checkAuthorization('backend', 'github', 'create_pull_request');
console.log(result);
// { allowed: true, tier: 2, action: 'require-review', ... }

// Architect merging (not allowed)
const result2 = auth.checkAuthorization('architect', 'github', 'merge_pull_request');
console.log(result2);
// { allowed: false, tier: 5, reason: 'Not authorized...', action: 'blocked' }
```

### Example 2: Log a Tool Call

```javascript
const MCPAuditLogger = require('./.claude/scripts/mcp-audit-logger.js');
const logger = new MCPAuditLogger();

logger.log('backend', 'github', 'create_pull_request', {
  repo: 'project/repo',
  title: 'Feature: Auth',
  token: 'secret123'  // Will be sanitized
}, 'success', { duration_ms: 1234 });

// Entry written to .claude/mcp-audit/audit-2026-06-08.jsonl
```

### Example 3: Query Audit Log

```javascript
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);

const entries = logger.query(startDate, new Date(), {
  agent_role: 'backend',
  result_status: 'success'
});

console.log(`Backend succeeded: ${entries.length} calls`);
```

### Example 4: Get Statistics

```javascript
const stats = logger.getStats();
console.log(`7-day stats:`);
console.log(`  Total calls: ${stats.total_calls}`);
console.log(`  By agent: ${JSON.stringify(stats.by_agent)}`);
console.log(`  Error rate: ${stats.error_rate}`);
```

---

## Directory Structure

**MCP Configuration:**
```
.mcp.json                                  (github, filesystem servers)
```

**Implementation Files:**
```
.claude/scripts/
├── mcp-audit-logger.js                    (audit trail, query API)
├── mcp-authorization.js                   (authorization matrix, enforcement)
└── validate-phase-12.js                   (test suite)
```

**Audit Logs:**
```
.claude/mcp-audit/
├── audit-2026-06-08.jsonl                 (day 1)
├── audit-2026-06-09.jsonl                 (day 2)
└── ... (90-day retention)
```

**Documentation:**
```
Vault/07-Decisions/ADR-INFRA-002.md        (Phase 12 infrastructure decisions)
Vault/03-Projects/AI Software Factory/Phase-12-MCP-Integration.md  (this file)
```

---

## Success Metrics

✅ **All criteria met:**

1. **MCP Configuration:** GitHub and Filesystem servers in `.mcp.json`
2. **Audit Logging:** Every tool call logged with metadata and secret sanitization
3. **Authorization:** Matrix enforces agent-to-tool access rules
4. **Integration:** Audit + Authorization + Phase 10 workflow seamlessly
5. **Documentation:** Agent workflows and usage patterns documented
6. **Testing:** 8/8 tests passing, full integration verified
7. **ADR:** Infrastructure decisions documented in ADR-INFRA-002

---

## Known Limitations

**Current:**
- GitHub/Filesystem require MCP servers to be available (npx will fetch at runtime)
- Authorization is code-based (not enforced at runtime by sandbox)
- Audit logs are local JSON files (not centralized database)
- No visualization dashboard for audit logs yet

**Future (Phase 13+):**
- MCP API endpoint to expose audit logs remotely
- HTML dashboard for audit log visualization
- Machine learning for anomaly detection in tool usage
- Automated alerts on suspicious patterns
- Integration with Slack/email for approver notifications

---

## Related Documentation

- [[../07-Decisions/ADR-INFRA-002.md|ADR-INFRA-002]] — Infrastructure decisions
- [[../07-Decisions/ADR-INT-001.md|ADR-INT-001]] — MCP integration policy
- [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]] — Approval tiers
- [[../02-Technologies/MCP_SERVERS.md|MCP_SERVERS.md]] — Server inventory
- Phase 10: Review Pipeline + Observability
- Phase 13: Multi-Agent Collaboration

---

**Status:** ✅ Production Ready  
**Test Pass Rate:** 100% (8/8)  
**Next Phase:** Phase 13 (Multi-Agent Collaboration + Advanced MCP)
