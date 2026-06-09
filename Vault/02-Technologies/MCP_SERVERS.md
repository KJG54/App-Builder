---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# MCP Servers and Integrations

**Purpose:** Inventory of Model Context Protocol (MCP) servers available to AI agents in the AI Software Factory.

**Audience:** AI agents, developers

**Status:** Active - Updated as servers are integrated (Phase 12)

---

## MCP Server Overview

MCP Servers provide extended capabilities to AI agents working with this project. They act as tool access layers for:
- Filesystem operations
- Code repository access
- External API integrations
- Vector database operations
- Deployment automation

---

## Currently Configured MCP Servers (Phase 1-2)

### Chroma MCP Server

**Type:** Vector Database / Knowledge Management

**Purpose:** Semantic memory retrieval and context assembly for AI agents

**Status:** Active (Integrated)

**Capabilities:**
- Collection management (create, list, delete, modify)
- Document ingestion (add, update, delete)
- Semantic search and filtering
- Metadata-based querying
- Facts vs. sessions separation enforcement

**Configuration:**
- Host: localhost (Docker container)
- Default embedding function: Chroma default (all-MiniLM-L6-v2)
- Collections: 7 (global + project-specific)

**Usage Examples:**
```
Query: "semantic search for security standards"
Response: Returns relevant documents with similarity scores
```

**Documentation:** [[02-Technologies/Chroma]]

**Last Verified:** 2026-06-07

---

## Active MCP Servers (Phase 12+)

### GitHub MCP Server

**Type:** Code Repository Integration

**Purpose:** Repository operations, issue tracking, PR management

**Status:** Active (Integrated Phase 12)

**Expected Capabilities:**
- Repository read/write access
- Branch management
- Commit operations
- PR creation and review
- Issue tracking and linking

**Use Cases:**
- DevOps Agent: Automated deployment and release management
- Backend Agent: Code integration and testing
- Documentation Agent: Changelog generation from commits

**Security:** OAuth2 token-based authentication

**Configuration:** Integrated in `.mcp.json` with `GITHUB_TOKEN` env var

**Integration Point:** ADR-INFRA-002 (Phase 12)

---

### Filesystem MCP Server

**Type:** File System Access

**Purpose:** Local file operations for code generation and analysis

**Status:** Active (Integrated Phase 12)

**Capabilities:**
- Read files and directories
- Write and modify files
- Directory traversal and listing
- Pattern-based file operations

**Use Cases:**
- Backend/Frontend Agent: Code generation and modification
- All agents: Project file access and analysis
- DevOps: Configuration file management

**Configuration:** Integrated in `.mcp.json` with `ALLOWED_DIRECTORIES=PROJECT_ROOT`

**Integration Point:** ADR-INFRA-002 (Phase 12)

---

### PostgreSQL MCP Server

**Type:** Database Access

**Purpose:** Direct SQL execution and migration management

**Status:** Planned (Phase 13)

**Expected Capabilities:**
- Query execution
- Schema migration support
- Connection pooling
- Transaction management
- Performance monitoring

**Use Cases:**
- Backend Agent: Database operations
- QA Agent: Test data management
- Verification Agent: Compliance checking

**Security:** Environment variable secrets, least-privilege accounts

**Configuration:** [TBD Phase 13]

---

## Future MCP Servers (Phase 13+)

### Jira/Linear Integration

**Type:** Issue Tracking

**Purpose:** Task management and requirement tracking

**Status:** Planned (Phase 13)

**Expected Capabilities:**
- Issue creation and updates
- Requirement linking
- Sprint management
- Burndown tracking

---

### AWS/Cloud Provider Integration

**Type:** Infrastructure

**Purpose:** Cloud deployment and resource management

**Status:** Planned (Phase 13)

**Expected Capabilities:**
- EC2/container management
- Database provisioning
- Logging and monitoring
- Cost tracking

---

### Slack Integration

**Type:** Communication

**Purpose:** Team notifications and session summaries

**Status:** Planned (Phase 13)

**Expected Capabilities:**
- Message posting
- File sharing
- Summary delivery
- Alerts

---

## MCP Server Health Monitoring

### Current Status

| Server | Status | Last Check | Integration |
|--------|--------|-----------|---|
| Chroma | ✓ Active | 2026-06-08 | Phase 5 |
| GitHub | ✓ Active | 2026-06-08 | Phase 12 |
| Filesystem | ✓ Active | 2026-06-08 | Phase 12 |
| Slack | ✓ Active | 2026-06-08 | Phase 13 |
| PostgreSQL | Planned | — | Phase 14 |
| Jira | Planned | — | Phase 14 |

---

## Server Configuration by Environment

### Development Environment

**Servers Active:**
- Chroma (localhost, Docker)
- Filesystem (local Vault mount)

**Configuration:** Local Docker Compose setup

### Staging Environment

**Servers Active:**
[TBD - Phase 12]

### Production Environment

**Servers Active:**
[TBD - Phase 13]

---

## Security Considerations

### Chroma MCP

- **Access Control:** Local Docker network isolation
- **Credential Management:** No authentication required (local dev)
- **Data Sensitivity:** Moderate (development knowledge base)
- **Audit Logging:** [TBD - Phase 10]

### Future Servers

- **GitHub:** OAuth2 + personal access tokens
- **PostgreSQL:** Environment variable secrets, least-privilege DB accounts
- **AWS:** IAM role-based access
- **Slack:** Webhook tokens (Phase 13)

---

## MCP Server Roadmap

### Phase 5 (Chroma)
- ✓ Chroma integration

### Phase 12 (Advanced MCP)
- ✓ GitHub integration
- ✓ Filesystem integration
- ✓ Audit logging
- ✓ Authorization enforcement

### Phase 13 (Multi-Agent Orchestration)
- PostgreSQL MCP server integration
- Jira/Linear integration
- Slack integration
- AWS/infrastructure providers

---

## MCP Server Integration Guide

### Adding a New Server

1. **Define capabilities** — What tools will agents need?
2. **Implement MCP interface** — Create or install server
3. **Configure authentication** — Set up credentials securely
4. **Test with single agent** — Validate functionality
5. **Document usage patterns** — Add to agent skills
6. **Integrate into workflows** — Update 04-Workflows/
7. **Monitor performance** — Track in observability layer

### Testing Server Connection

```
Chroma server: Verify collection access with list_collections
[Future servers: TBD]
```

---

## Related Documents

- [[50_AI_SKILLS.md]] — Agent capabilities using these servers
- [[03-Projects/AI Software Factory/Architecture/Current]] — MCP layer design
- [[Docker.md]] — Docker/Compose configuration for servers
- [[04-Workflows/Build API]] — Example workflow using servers

---

**Last Updated:** 2026-06-08
**Total Servers:** 3 active + 3 planned
**Current Phase:** 12 (GitHub + Filesystem)
**Target Integration Phases:** 5, 12, 13
**Last Health Check:** 2026-06-08
