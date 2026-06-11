# Framework Skills Reference

All available slash commands and their purposes. Type any command in Claude Code to invoke it.

---

## Project Lifecycle

### `/discover`
**Purpose:** Run a structured discovery interview before starting any project.  
**Use when:** You have a project idea and need to extract requirements, constraints, and assumptions before planning or building.  
**Output:** A project specification document saved to Vault.

### `/plan-project`
**Purpose:** Generate a phased implementation plan from a completed project specification.  
**Use when:** Discovery is done and you need a step-by-step build plan with phases, milestones, and validation criteria.  
**Output:** A phase plan saved to Vault and `.claude/plans/`.

---

## Repository Health

### `/audit`
**Purpose:** Comprehensive one-time health snapshot of the entire repository.  
**Use when:** First time auditing the project, after major changes, or when something feels off.  
**Output:** Audit report in `Vault/Logs/` with a prioritized task plan.  
**Difference from /guardian:** One-shot deep scan vs. ongoing trend tracking.

### `/guardian`
**Purpose:** Continuous health monitoring with trend tracking and improvement backlog.  
**Use when:** Regular check-ins to see if the project is getting healthier or drifting toward debt.  
**Output:** Guardian report in `Vault/Logs/` with severity-grouped findings and trend notes vs. prior runs.  
**Difference from /audit:** Tracks trends over time; run regularly, not just once.

### `/curator`
**Purpose:** Find and resolve dead, redundant, misplaced, and contradictory assets.  
**Use when:** The repository feels bloated or you want to verify recently changed files are clean.  
**Modes:**
- `/curator` — Incremental (phases 3–5, scoped to recent changes). Default. Fast.
- `/curator full` — Full 9-phase investigation. Use quarterly.  
**Output:** Curator report in `Vault/Logs/` with a consolidation roadmap.

### `/simplify`
**Purpose:** Answer one question — what can be removed while preserving 95% of the value?  
**Use when:** The project feels over-engineered or you want a complexity budget review.  
**Output:** Simplification report in `Vault/Logs/` with zero-effort and approval-required removals.

### `/efficiency`
**Purpose:** Identify runtime waste — tokens, context size, MCP schema cost, directory scope, memory bloat.  
**Use when:** Sessions feel slow or expensive, or after adding new MCPs/skills/memory entries.  
**Output:** Efficiency report in `Vault/Logs/` with quick wins and approval-required changes.

---

## When to Use Which

| Situation | Command |
|-----------|---------|
| Starting a new project | `/discover` → `/plan-project` |
| First health check ever | `/audit` |
| Regular health check | `/guardian` |
| After adding new files/skills | `/curator` |
| Project feels bloated | `/simplify` |
| Sessions feel slow | `/efficiency` |
| Quarterly deep clean | `/curator full` |

---

## Skill Files

All skills live in `Vault/05-Prompts/Skills/Cross-Cutting/`. Each skill file defines the full workflow, classification system, allowed actions, and output template. Read a skill file to understand exactly what it does before invoking it.

| Slash Command | Skill File |
|--------------|-----------|
| `/audit` | `ai-software-factory-audit-v1.0.md` |
| `/guardian` | `project-guardian-v1.0.md` |
| `/curator` | `repository-curator-v1.0.md` |
| `/simplify` | `simplification-audit-v1.0.md` |
| `/efficiency` | `runtime-efficiency-engineer-v1.0.md` |
| `/discover` | `project-discovery-interview-v1.0.md` |
| `/plan-project` | `phase-plan-generator-v1.0.md` |

---

## Full Skills Index

For the complete skills inventory including Architecture, Implementation, and Infrastructure domains, see `Vault/05-Prompts/Skills/SKILLS-INDEX.md`.
