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
