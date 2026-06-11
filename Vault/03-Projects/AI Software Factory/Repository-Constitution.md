---
type: architecture
status: active
last_updated: 2026-06-11
author: Claude-Builder-Agent
tags: [constitution, standards, governance, curator, runtime-efficiency]
related: [CLAUDE.md, WORKFLOW.md, 07-Decisions/DECISIONS.md, Architecture/Current.md]
---

# Repository Constitution

**The governing standard for what this repository should look like.**

This document is NOT Claude's operating rules (that's `CLAUDE.md`).  
This document is NOT the history of decisions (that's `DECISIONS.md`).  
This document IS the project-specific definition of "correct" — the rulebook that audits, curators, and reviews measure against.

Every Curator or efficiency review must read this document before making recommendations.

---

## Project Identity

**Name:** AI Software Factory  
**Type:** Application Builder Framework  
**Primary Runtime:** Node.js ≥ 20  
**AI Platform:** Claude (Anthropic) via Claude Code CLI  
**Knowledge Store:** Obsidian Vault + Chroma vector DB  
**Infrastructure:** Docker (local services only)

The framework must remain: modular, technology-agnostic, AI-friendly, human-friendly, easy to understand, easy to maintain.

---

## Directory Structure Rules

Every file must live in one of these locations. Files outside these boundaries are misplaced.

### Project Root (`./`)

Operational configuration only:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude operating rules (governance) |
| `WORKFLOW.md` | Git workflow and discipline |
| `GETTING-STARTED.md` | User-facing getting started guide |
| `docker-compose.yml` | Service orchestration |
| `.mcp.json` | MCP server configuration |
| `.gitignore` | Version control exclusions |
| `package.json` | Node.js scripts and dependencies |
| `index.js` | Framework entry point (if any) |

**Rule:** No documentation files except `GETTING-STARTED.md`. All other docs go to Vault.

### Vault (`Vault/`)

Permanent knowledge, source of truth. Discoverable via Chroma.

| Directory | Content |
|-----------|---------|
| `01-Standards/` | Coding, architecture, security, documentation standards |
| `02-Technologies/` | Technology guides (MCP servers, Docker, Chroma) |
| `03-Projects/` | Project architecture, roadmaps, phase docs |
| `04-Workflows/` | Process workflows |
| `05-Prompts/` | Agent prompts and skills |
| `07-Decisions/` | ADRs and DECISIONS.md index |
| `08-Retrospectives/` | Session summaries |
| `09-Requirements/` | Project specs and requirements |
| `10-Known-Problems/` | Known issues and solutions |
| `Templates/` | Document templates |
| `Logs/` | Generated reports (guardian, vault health) |

**Rule:** Every significant deliverable must have a Vault copy. No orphaned docs.

### Claude Working Directory (`.claude/`)

Session artifacts and tooling. NOT committed (per `.gitignore`).

| Directory | Content |
|-----------|---------|
| `.claude/scripts/` | Validators, orchestration, automation scripts (`.js` only) |
| `.claude/hooks/` | Hook scripts (SessionStart, PostCompact) |
| `.claude/commands/` | Slash command definitions (`.md` files) |
| `.claude/plans/` | Working phase plans (before Vault copy) |

**Rules:**
- `.claude/scripts/` contains code only — no `.md` or `.py` files
- Documentation for scripts goes in Vault, not alongside the script
- Temp files prefixed with `_`, excluded from git

### Docker (`docker/`)

Container definitions and infrastructure. Committed.

---

## File Naming Conventions

| Asset Type | Convention | Example |
|-----------|-----------|---------|
| Vault docs | `kebab-case.md` | `phase-15-agent-memory.md` |
| Skills | `skill-name-v{major}.{minor}.md` | `repository-curator-v1.0.md` |
| ADRs | `ADR-{DOMAIN}-{###}.md` | `ADR-INFRA-003.md` |
| Validators | `validate-phase-{N}.js` | `validate-phase-16.js` |
| Scripts | `kebab-case.js` | `chroma-ingest.js` |
| Session summaries | `Session-Summary-YYYY-MM-DD-HH-MM.md` | auto-generated |
| Phase docs | `Phase-{N}-{Name}.md` | `Phase-15-Agent-Memory.md` |

**Rule:** No uppercase in Vault filenames except ADRs and Session-Summary (legacy).

---

## Documentation Requirements by Asset Type

### Every Vault document must have:
```yaml
---
type: [see types below]
status: [draft | active | complete | deprecated]
last_updated: YYYY-MM-DD
---
```

### Every Skill must additionally have:
```yaml
name: "skill-name"
version: "1.0"
authority: [facts | design | process]
chroma_collection: ai-software-factory-skills
tags: [skill, domain-tag, ...]
maintenance_owner: [Human | Agent | Team]
next_review_date: YYYY-MM-DD
```

### Every ADR must have:
- Date, Status, Context, Problem Statement, Options Considered, Decision, Consequences, Follow-Up Actions

### Every phase doc must reference:
- Status (complete/in-progress), goal, deliverables, validation method, related ADRs

---

## Valid Vault Document Types

`spec | log | architecture | guide | decision | retrospective | session | workflow | skill | index | template`

---

## Skill Standards

### Versioning
- Files named `skill-name-v{major}.{minor}.md`
- Breaking changes = major bump; additions = minor bump
- Old version kept as deprecated until all references updated

### Domains
- `Architecture/` — system design, component design
- `Implementation/` — code patterns, libraries, testing
- `Infrastructure/` — deployment, monitoring, CI/CD
- `Cross-Cutting/` — processes applicable across all domains

### Status lifecycle
`Draft → Beta → Active → Deprecated`

### Size limit
Skills should be ≤ 300 lines. Content beyond that belongs in the Constitution or referenced Vault docs.

### Review cadence
90-day quarterly review. Stale skills (no review in 120+ days) flagged by Curator.

### Required sections (in order)
1. Problem Statement
2. Trigger Examples
3. Required Inputs
4. Allowed Actions
5. Approval Required
6. Core Workflow
7. Output Template
8. Quality Bar

---

## MCP Standards

### Currently approved MCP servers

| MCP | Status | Use case |
|-----|--------|----------|
| `filesystem` | Active | File read/write in project directories |
| `github` | Active | Git operations, PRs |
| `chroma` | Optional | Vector DB (requires Docker) |
| `context7` | Active | Library documentation lookup |
| `playwright` | Optional | Browser automation |
| `figma` | Optional | Design operations |

**Rule:** MCPs that require authentication (slack, sentry, linear, huggingface) should be disabled in `settings.local.json` when not actively used in a project. The context cost of unused auth-required MCPs is pure overhead.

### Adding a new MCP
Requires an ADR if it changes the development workflow. Document in `Vault/02-Technologies/MCP_SERVERS.md`.

---

## Agent Standards

### Existing agents (Vault/05-Prompts/)
Architect, Backend, Frontend, DevOps, QA, Security, Documentation, Verification

### When to create a new agent vs. extend an existing one
- New agent: distinct domain with unique tools and no overlap with existing agents
- Extend: adding capabilities to an agent's existing domain

### Agent prompt size limit
≤ 500 lines. Longer prompts should extract reusable logic into skills.

---

## Test Requirements

### What must have a validator
- Every major phase of the AI Software Factory must have `validate-phase-N.js`
- Every validator must be in `npm run test:all`

### Test isolation rules
- Tests must not write to `Vault/10-Known-Problems/` or any production Vault directory
- Test artifacts go to `.claude/.test-{name}/` (auto-created, gitignored)
- Tests must be idempotent — running three times produces identical results

### Side-effect prohibition
Running `npm test` must produce zero changes to tracked files.

---

## Deprecation Protocol

When retiring an asset:

1. Change `status: deprecated` in frontmatter
2. Add `deprecated_by: [replacement asset]` field
3. Add deprecation note at top of file
4. Keep file for 90 days minimum before deletion
5. Update all references to point to replacement
6. Record decision in DECISIONS.md if architectural

**Rule:** Never delete without deprecation step. "Archive" is not a valid shortcut.

---

## Decision Recording Rules

An ADR is required when:
- Changing the technology stack (new language, framework, DB)
- Changing deployment strategy
- Changing AI provider or model strategy
- Adding/removing MCP servers that affect development workflow
- Any decision that would surprise a new team member six months from now

Minor decisions (which file to put something in, naming choices) go in commit messages, not ADRs.

---

## Git Hygiene Rules

- Commit messages: one line, imperative mood, lowercase prefix (`feat:`, `fix:`, `docs:`, `audit:`, `refactor:`)
- No `Co-Authored-By` trailers
- No tracked-but-gitignored files (run `git ls-files -ci --exclude-standard` — must return empty)
- No untracked documentation files at session end

---

## Constitution Review

This document should be reviewed and updated:
- When a new major technology is added
- When directory structure changes
- When skill format evolves
- At minimum annually

**Version:** 1.0 (2026-06-11)
