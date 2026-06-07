# ADR-INT-001: MCP Server Integration Policy

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 3 — Requirements Management  
**Category:** Integration (INT)

---

## Decision

The Application Builder Framework integrates with external systems via **Model Context Protocol (MCP) servers**. MCP servers provide a language-agnostic interface for agents to:
- Access external APIs (GitHub, Jira, AWS, etc.)
- Execute system commands (shell, Docker, etc.)
- Query databases and knowledge systems

All agent integrations must:
1. **Use MCP protocol** (not direct API calls)
2. **Follow MCP server standards** (defined in [[02-Technologies/MCP_SERVERS.md]])
3. **Require human approval** for sensitive operations (see [[ADR-SEC-001]])
4. **Be discoverable** (configured in `.mcp.json`)

---

## Context

### The Problem: Scattered Integrations

Without a standard integration pattern, agents access external systems directly:
- Each agent learns custom API for each system
- No consistent authentication/authorization
- Difficult to audit who accessed what
- Inconsistent error handling
- Hard to revoke access (must update all agents)

### Why MCP

Model Context Protocol (MCP) is an open standard that provides:
- **Unified interface** (agents use same MCP API for all systems)
- **Language-agnostic** (MCP works with Python, Node.js, Go, etc.)
- **Discoverable** (agents list available tools at runtime)
- **Auditable** (all tool calls can be logged)
- **Secure** (authentication centralized; easy to revoke)

### Why Important for Application Builder

The Application Builder uses **specialized agents** (Architect, Backend, Frontend, Security, DevOps, etc.). Each agent needs access to different systems:
- **Architect:** GitHub (architecture docs), Linear (requirements)
- **Backend:** GitHub (code), Jira (tasks), AWS (staging)
- **Frontend:** GitHub (code), Figma (designs)
- **Security:** GitHub (code scan), Linear (security tickets)
- **DevOps:** GitHub (deployment), AWS (infrastructure), Docker (containers)

Without standardization, each agent would reimplement authentication, error handling, and authorization. MCP solves this by providing a single, extensible integration point.

---

## Alternatives Considered

### Alternative 1: Direct API Calls

**Agents call external APIs directly (GitHub, Jira, AWS, etc.)**

Pros:
- Simple (no abstraction layer)
- Full control (agents can use all API features)

Cons:
- No unified interface (each API different)
- Authentication scattered (agent 1 knows GitHub API, agent 2 knows Jira API)
- Hard to audit (no central logging)
- Hard to revoke access (must update all agents)
- Difficult to test (need live external systems)

### Alternative 2: Custom Agent Adapter Layer

**Build custom adapters for each integration**

Pros:
- Unified interface (we control it)
- Customizable (can optimize for our use case)

Cons:
- High maintenance (must maintain all adapters)
- Scales poorly (10 systems = 10 adapters to maintain)
- Reinvents wheel (MCP already exists)
- Not language-agnostic (tied to our implementation language)

### Alternative 3: MCP Protocol (CHOSEN)

**Use open MCP standard for all integrations**

Pros:
- Industry standard (open specification)
- Unified interface (all tools follow MCP)
- Language-agnostic (works with any language)
- Discoverable (agents list tools at runtime)
- Auditable (centralized logging)
- Extensible (easy to add new servers)
- Secure (centralized auth)

Cons:
- Dependency on MCP specification (must track updates)
- Some features may not map cleanly to MCP

**We choose MCP** because it provides the standardization we need without reinventing the wheel.

---

## Implementation

### MCP Configuration

All MCP servers configured in `.mcp.json` (project root):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "disabled": false
    },
    "github-codebase": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github-codebase"],
      "env": {
        "GITHUB_REPO": "owner/repo",
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "disabled": false
    },
    "aws": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_REGION": "us-east-1"
      },
      "disabled": false
    }
  }
}
```

**Storage:** Committed to Git (no secrets; credentials in environment variables)

---

### Available MCP Servers

Current inventory tracked in [[02-Technologies/MCP_SERVERS.md]]:

| Server | Purpose | Tools |
|--------|---------|-------|
| **github** | GitHub integration | clone, push, pull, create PR, list issues |
| **github-codebase** | Search and analyze repository | search files, read, grep |
| **aws** | AWS service access | EC2, S3, Lambda, CloudFormation |
| **linear** | Linear issue tracking | create issue, update, search, link |
| **docker** | Docker container control | build, run, inspect, logs |
| **chroma** | Vector database access | query, add documents, create collections |

---

### MCP Tool Access Rules

**Tier 1: Available to All Agents (with audit logging)**

Safe, read-only operations:
- `github:search_repositories` — Search GitHub
- `github-codebase:search_files` — Search project files
- `chroma:query_documents` — Search knowledge base

**Tier 2: Requires Code Review Approval** (see [[ADR-SEC-001]] Tier 2)

Code-modifying operations:
- `github:create_pull_request` — Create PR
- `github:push_branch` — Push code
- `github-codebase:create_file` — Add file

**Tier 3: Requires Human Approval** (see [[ADR-SEC-001]] Tier 3)

Infrastructure-modifying operations:
- `aws:create_instance` — Launch EC2 instance
- `aws:deploy_lambda` — Deploy function
- `docker:push_image` — Push image to registry

**Tier 4-5: Human-Only** (see [[ADR-SEC-001]] Tier 4-5)

Irreversible operations:
- `aws:delete_database` — Delete RDS instance
- `github:delete_repository` — Delete repo

---

### Agent Authorization Matrix

Which agents can use which MCP servers:

| Agent | github | aws | docker | chroma | linear |
|-------|--------|-----|--------|--------|--------|
| **Architect** | Search | Read | Read | Query | Create/Update |
| **Backend** | PR/Push (Tier 2) | Read staging | Build | Query | Update |
| **Frontend** | PR/Push (Tier 2) | — | Build | Query | Update |
| **Security** | Search | Read (audit) | — | Query | Create (security) |
| **DevOps** | Merge (Tier 3) | Deploy (Tier 3) | Push (Tier 3) | — | Update |
| **QA** | Search | Read staging | Run tests | Query | Create (bugs) |

**Read** = Query-only (no modification)  
**Tier 2+** = Requires approval per [[ADR-SEC-001]]

---

### Adding New MCP Servers

Process for integrating a new external system:

1. **Identify need:** What system is needed? Why?
2. **Find MCP server:** Does MCP server exist for this system?
   - Yes: Add to `.mcp.json`
   - No: Build custom MCP server or request from community
3. **Document:** Add to [[02-Technologies/MCP_SERVERS.md]]
4. **Configure:** Set authentication and environment variables
5. **Test:** Verify agents can discover and use tools
6. **Secure:** Define which agents can access (authorization matrix)
7. **Audit:** Enable logging for tool usage

---

### Error Handling

All MCP tool errors must be caught and handled gracefully:

```python
try:
    result = mcp_client.call("github:create_pull_request", {
        "repo": "owner/repo",
        "title": "Feature: User Auth",
        "branch": "feature/auth"
    })
except MCPToolError as e:
    logger.error(f"GitHub tool failed: {e}")
    # Fall back to human approval
    flag_for_human_decision(f"Cannot create PR: {e}")
```

---

## Related Standards

[[Security Standards]] — Principle of Least Privilege (agent authorization)  
[[Coding Standards]] — Error handling  
[[Architecture Standards]] — Service integration patterns

---

## Related Decisions

**Decision 3:** Human Authority Preserved — [[ADR-SEC-001]] (approval tiers apply to MCP tools)  
**Decision 7:** 8 Agent Roles — [[AI_SKILLS.md]] (agent capabilities per role)

---

## Implementation Timeline

- **Phase 3:** MCP configuration and authorization matrix defined
- **Phase 5:** MCP server implementations integrated
- **Phase 6+:** Additional MCP servers added per requirements

---

## Consequences

### Positive

✅ Unified integration interface (agents use same pattern for all systems)  
✅ Language-agnostic (not tied to Python, Node.js, etc.)  
✅ Discoverable (agents list available tools at runtime)  
✅ Auditable (all tool calls can be logged)  
✅ Secure (centralized auth; easy to revoke)  
✅ Extensible (easy to add new systems)  
✅ Standardized error handling  

### Negative

❌ Dependency on MCP standard (must track specification changes)  
❌ Some systems may not have MCP servers (may need custom implementation)  
❌ Added complexity vs. direct API calls  

### Mitigations

- Monitor MCP spec; plan migrations if needed
- Community maintains most popular servers (GitHub, AWS, etc.)
- Complexity is justified by security and auditability benefits

---

## Security Considerations

### Authentication

All MCP tool authentication uses environment variables:

```json
{
  "github": {
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

**Rule:** Never commit secrets; use environment variables or secret manager.

See [[Security Standards]] — Secrets Management.

### Authorization

Agent access to MCP tools controlled via authorization matrix (above).

Agents cannot:
- Call tools outside their authorization tier
- Escalate their own permissions
- Access other agent's credentials

Enforced via:
- Code review (check agent code for unauthorized tool calls)
- Logging (audit trail of all tool usage)
- Phase 5+ runtime enforcement (agent sandbox blocks unauthorized calls)

### Audit Trail

All MCP tool calls logged with:
- Agent name
- Tool name
- Arguments (sanitized; no secrets)
- Result (success or error)
- Timestamp

**Retention:** 90 days minimum (configurable per security policy)

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR establishing MCP integration policy
- Defined MCP as standard for all integrations
- Specified tool access rules and approval tiers
- Created authorization matrix for agents
- Documented security and audit requirements

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 5 (when MCP servers integrated)
