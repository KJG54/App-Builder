# CLAUDE.md

## Project Mission

This project is an Application Builder Framework.

The goal is to provide a modular foundation that enables AI agents and human developers to rapidly design, plan, build, document, test, and maintain software projects.

The framework must remain:

* Modular
* Extensible
* Technology-agnostic
* AI-friendly
* Human-friendly
* Easy to understand
* Easy to maintain

The framework should support creation of:

* Desktop applications
* Web applications
* APIs
* AI systems
* Games
* Automation tools
* Internal business tools
* Future project types not yet defined

Long-term flexibility is more important than short-term convenience.

---

# Core Principles

## Preserve Modularity

Always prefer reusable modules over project-specific implementations.

Do not hardcode assumptions that only work for a single project type.

Every major component should be capable of being reused elsewhere.

---

## Avoid Framework Lock-In

Do not design around a specific language, framework, database, UI library, AI provider, or infrastructure provider unless explicitly instructed.

Recommend technologies based on project requirements.

Never assume:

* Python
* Node.js
* React
* Electron
* PostgreSQL
* OpenAI
* Claude
* Docker

unless specifically requested.

---

## Keep Architecture Clean

Before creating a new system:

1. Search for an existing implementation.
2. Determine whether it can be extended.
3. Reuse before replacing.
4. Extend before rebuilding.

Do not create duplicate systems.

Do not create competing implementations.

Do not leave abandoned code paths.

---

# Required Workflow

Claude must follow the workflow below for all non-trivial tasks.

## Phase 1: Discovery

Before making changes:

* Read relevant files.
* Read project documentation.
* Read architecture documentation.
* Search vault references.
* Search implementation history.

Provide findings before making major changes.

---

## Phase 2: Planning

For significant changes:

* Explain current state.
* Explain proposed changes.
* Explain risks.
* Explain alternatives.

Wait for approval before implementation.

---

## Phase 3: Implementation

During implementation:

* Make the smallest viable change.
* Preserve existing behavior.
* Avoid unrelated modifications.
* Maintain compatibility whenever possible.

---

## Phase 4: Validation

Before completing work:

* Verify functionality.
* Check for regressions.
* Validate assumptions.
* Review logs and outputs.

---

## Phase 5: Documentation

After significant work:

Update:

* Relevant documentation
* Architecture notes
* Vault references
* Implementation history

Knowledge gained should not be lost.

---

# Approval Requirements

Claude MUST obtain approval before:

* Architectural changes
* Dependency changes
* Package installation
* Database schema changes
* Major refactors
* Deleting files
* Renaming directories
* Reorganizing project structure
* Introducing new frameworks
* Breaking compatibility

Provide reasoning before requesting approval.

---

# Command Execution Rules

## Detect Environment First

Before generating commands:

Determine:

* CMD
* PowerShell
* Bash
* WSL
* Git Bash
* Linux Shell
* macOS Terminal

Never assume the shell environment.

---

## Command Safety

Prefer non-destructive commands.

Explain destructive operations before execution.

Never execute bulk deletion commands without approval.

Never execute commands that may irreversibly destroy project data without approval.

---

# Vault Rules

The Vault is a long-term project memory system.

Treat it as a source of truth.

The Obsidian Vault (`Vault/` directory) combined with Chroma vector database stores:
* Standards and principles (01-Standards)
* Technology guides (02-Technologies)
* Project architecture and planning (03-Projects)
* Workflows and processes (04-Workflows)
* Skills and capabilities (05-Prompts)
* Decisions and rationale (07-Decisions)
* Session summaries and retrospectives (08-Retrospectives)
* Requirements (09-Requirements)
* Known problems and solutions (10-Known-Problems)
* Templates (Templates)

---

## Before Work

Search vault records for:

* Previous decisions ([[07-Decisions/DECISIONS.md]])
* Existing architecture ([[03-Projects/AI Software Factory/Architecture/Current.md]])
* Agent capabilities ([[05-Prompts/AI_SKILLS.md]])
* MCP server inventory ([[02-Technologies/MCP_SERVERS.md]])
* Historical implementations
* Known issues and solutions

---

## After Work

Record:

* Decisions made
* Architectural changes
* Lessons learned
* Known limitations
* Future improvements

---

## Vault Entry Requirements

Entries should include:

* Date
* Task
* Summary
* Files affected
* Reasoning
* Outcome

Knowledge should be discoverable later.

---

# File Organization and Storage Rules

## Directory Structure and Purpose

Files must be stored in appropriate directories for consistency, discoverability, and seamless knowledge transfer.

### Vault Directory (`Vault/`) — Permanent Knowledge

**Purpose:** Source of truth for project knowledge. Discoverable via Chroma semantic search. Persists across sessions and projects.

**What goes here:**
* All standards documents (01-Standards/)
* All technology guides (02-Technologies/)
* All project architecture and planning (03-Projects/)
* All workflows and processes (04-Workflows/)
* All agent skills and prompts (05-Prompts/)
* All architectural decisions (07-Decisions/)
* All session summaries and retrospectives (08-Retrospectives/)
* All requirements documents (09-Requirements/)
* All known problems and solutions (10-Known-Problems/)
* All templates (Templates/)

**Rules:**
* Every significant deliverable MUST have a Vault copy
* Phase plans (Phase-1-Foundation.md, Phase-2-Knowledge-System.md, etc.) must be saved to `Vault/03-Projects/AI Software Factory/`
* Documents must be discoverable via backlinks and Chroma indexing
* Never leave work product only in `.claude/` directories

### Project Directory (`./ ` root) — Operational Configuration

**Purpose:** Runtime configuration and operational files needed for immediate project execution.

**What goes here:**
* CLAUDE.md (governance document, read before every task)
* WORKFLOW.md (git workflow and discipline)
* docker-compose.yml (service orchestration)
* .mcp.json (MCP server configuration)
* .gitignore (version control exclusions)
* Project source code (if any: src/, app/, agents/, etc.)

**Rules:**
* Files here are committed to Git
* Changes require approval per Approval Requirements
* Keep minimal; prefer Vault for documentation

### Claude Working Directory (`.claude/`) — Session Artifacts

**Purpose:** Temporary working files that aid planning but aren't permanent deliverables.

**What goes here:**
* `.claude/plans/` — Working versions of phase plans (before Vault copy created)
* `.claude/projects/.../memory/` — Session-persistent memory (MEMORY.md, feedback_*.md, etc.)
* Temporary analysis files (marked with `_` prefix, e.g., `_analysis.json`)

**Rules:**
* Files here are NOT committed to Git (excluded by .gitignore)
* Working plans go here FIRST, then copied to Vault for permanence
* Memory files are persistent across sessions; use MEMORY.md as index
* Temporary analysis files should be prefixed with `_` and excluded from git

### Docker Directory (`docker/`) — Infrastructure as Code

**Purpose:** Container definitions and infrastructure code.

**What goes here:**
* Dockerfile templates (Dockerfile.base, Dockerfile.python, etc.)
* Docker-related configuration
* Volume mount points (docker/volumes/chroma/)

**Rules:**
* Part of project infrastructure; committed to Git
* docker/volumes/ contents are Git-ignored but mount point should exist
* Changes require approval per Approval Requirements

---

## Phase Plans and Documentation Storage Pattern

**All phase plans follow this two-location pattern:**

1. **Working location:** `.claude/plans/phase-N-*.md` — Used during planning and implementation
2. **Reference location:** `Vault/03-Projects/AI Software Factory/Phase-N-*.md` — Permanent record for future sessions

**Why both?**
* Working location: Keeps active planning in session context
* Reference location: Ensures knowledge transfers to future sessions and is discoverable via Chroma

**Implementation:**
* Create working plan in `.claude/plans/` during planning phase
* After user approval, create mirror copy in Vault location
* Both files maintained in sync during implementation
* After phase completion, primary reference is Vault copy

---

## Knowledge Transfer Checklist

Before completing any significant work:

- [ ] All deliverables have Vault copies (not just working copies)
- [ ] Phase plans saved to both `.claude/plans/` (working) AND `Vault/03-Projects/` (permanent)
- [ ] Session learnings recorded in memory files (MEMORY.md updated)
- [ ] Decisions documented in Vault/07-Decisions/ (ADRs or DECISIONS.md)
- [ ] Architecture changes documented in Vault/03-Projects/
- [ ] Session summary created in Vault/08-Retrospectives/ (if significant work)
- [ ] All backlinks functional (Vault files reference related documents)
- [ ] No orphaned documentation (all new files linked from parent categories)
- [ ] Temporary analysis files excluded from Git (start with `_` prefix)

---

# Documentation Rules

Documentation must stay synchronized with implementation.

Do not allow documentation drift.

If behavior changes:

Update documentation.

If architecture changes:

Update architecture documentation.

---

# Code Quality Rules

Prefer:

* Readability
* Maintainability
* Simplicity

Over:

* Cleverness
* Premature optimization
* Excessive abstraction

---

# Refactoring Rules

Refactor only when:

* Solving a real problem
* Reducing complexity
* Improving maintainability
* Eliminating duplication

Do not refactor for personal preference.

---

# AI Collaboration Rules

When uncertain:

Ask questions.

Do not guess.

Do not invent requirements.

Do not fabricate implementations.

Do not assume missing context.

---

# Success Criteria

The Application Builder should become progressively:

* More modular
* Better documented
* Easier to extend
* Easier for AI agents to understand
* Easier for humans to understand
* Easier to maintain

Every change should move the project closer to these goals.
