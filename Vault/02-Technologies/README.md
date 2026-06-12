---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Technologies Reference

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder contains **technology reference guides** for tools and platforms used in the Application Builder Framework.

**Technology Stack Summary:**
- **Language:** Python 3.10+
- **Knowledge Storage:** Obsidian Vault + Chroma (vector database)
- **API Framework:** FastAPI (Phase 5+)
- **Database:** PostgreSQL (Phase 5+)
- **Infrastructure:** Docker + Docker Compose
- **Version Control:** Git (GitHub)
- **Model Context Protocol:** MCP (for AI agent integrations)

---

## Technology Guides

| Technology | Status | What It Is | Reference |
|-----------|--------|-----------|-----------|
| **Obsidian** | Active | Knowledge management tool; hosts this vault | [[Obsidian.md\|Obsidian Guide]] |
| **Chroma** | Active | Vector database for semantic search over vault | [[Chroma.md\|Chroma Guide]], [[Chroma-Indexing.md\|Indexing Strategy]] |
| **Docker** | Active | Containerization for services and Chroma | [[Docker.md\|Docker Guide]] |
| **FastAPI** | Planned (Phase 5) | Async Python API framework | [[FastAPI.md\|FastAPI Guide]] |
| **PostgreSQL** | Planned (Phase 5) | Relational database for facts, requirements | [[PostgreSQL.md\|PostgreSQL Guide]] |
| **Python** | Active | Primary implementation language | [[Python.md\|Python Guide]] |
| **MCP (Model Context Protocol)** | Active | Standard for AI agent integrations | [[MCP_SERVERS.md\|MCP Servers Index]] |
| **Git/GitHub** | Active | Version control and collaboration | See [[../04-Workflows/README.md\|Workflows]] |
| **Context7** | Active | Live library documentation for agents | [[Context7.md\|Context7 Guide]] |
| **Brave Search** | Active | Web search for research agents | [[BraveSearch.md\|Brave Search Guide]] |
| **Fetch** | Active | HTTP content fetching for agents | [[Fetch.md\|Fetch Guide]] |
| **Memory (MCP)** | Active | Persistent entity/relationship graph for agents | [[Memory.md\|Memory Guide]] |
| **Puppeteer** | Active | Browser automation and UI testing | [[Puppeteer.md\|Puppeteer Guide]] |
| **Obsidian MCP** | Active (needs plugin) | Vault-native read/write for agents | [[ObsidianMCP.md\|Obsidian MCP Guide]] |
| **Git MCP** | Active | Local git history/blame/diff for agents | [[GitMCP.md\|Git MCP Guide]] |
| **Sequential Thinking MCP** | Active | Structured chain-of-thought for agents | [[SequentialThinking.md\|Sequential Thinking Guide]] |
| **Gitleaks** | Active | Secret scanning; pre-commit hook | [[Gitleaks.md\|Gitleaks Guide]] |
| **Semgrep** | Active | SAST / code quality for generated code | [[Semgrep.md\|Semgrep Guide]] |

---

## Adding a New Technology

If you need to adopt a new technology (language, framework, database, service):

1. **Create an ADR** following [[../07-Decisions/ADR-PROC-001.md|ADR workflow]]
   - Title: "Use [Technology] for [purpose]"
   - Include: Context, Problem, Alternatives, Rationale, Consequences
   - Example: [[../07-Decisions/ADR-INFRA-001.md|ADR-INFRA-001]] (Docker for Chroma)

2. **Create a tech guide** in this folder
   - Use [[../Templates/Technology.md|Technology template]] (if exists)
   - Include: Purpose, installation, key concepts, integration points, known issues

3. **Update this README** with a row in the table above

4. **Link to related standards** (which standards does this tech enable?)

5. **Get approval** — Tier 3 decision requires human approval per [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]]

---

## Technology Dependencies

**By phase:**
- **Phase 1:** Python, Git, Obsidian, Docker (foundation)
- **Phase 3:** MCP servers (agent integrations)
- **Phase 5:** Chroma, FastAPI, PostgreSQL (full system)
- **Phase 6+:** Additional services as needed

**By role:**
- **Backend:** Python, FastAPI, PostgreSQL, MCP
- **Frontend:** TBD (not yet decided; see [[../09-Requirements/README.md|Requirements]])
- **DevOps:** Docker, Chroma, MCP (infrastructure)
- **Architect:** All (must understand all technologies)

---

## Tech Decision Criteria

When deciding on a technology, evaluate:

1. **Modularity** — Can this be swapped for another later?
2. **Maturity** — Is it stable? Good documentation? Active community?
3. **Team Skill** — Does the team know it, or is it a learning cost?
4. **Lock-In Risk** — Would switching be painful later?
5. **Cost** — Is it free? Self-hosted? Commercial?
6. **Integration** — How does it fit with other tech?

**See:** [[../01-Standards/Architecture Standards.md|Architecture Standards]] (technology selection)

---

## Cross-References

- **Related ADRs:**
  - [[../07-Decisions/ADR-INFRA-001.md|ADR-INFRA-001]] (Docker + Obsidian)
  - [[../07-Decisions/ADR-DATA-001.md|ADR-DATA-001]] (Chroma schema)
  - [[../07-Decisions/ADR-API-001.md|ADR-API-001]] (REST + FastAPI)

- **Related Standards:**
  - [[../01-Standards/Architecture Standards.md|Architecture Standards]] (modularity, tech selection)
  - [[../01-Standards/Coding Standards.md|Coding Standards]] (Python patterns)

- **Related Workflows:**
  - [[../04-Workflows/README.md|Workflows]] (which tools are used in which workflows)

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../07-Decisions/README.md|ADR Guide]]
