# Git Workflow & Development Process

This document defines the Git discipline, branching strategy, and approval gates for the Application Builder Framework project.

---

## Branch Strategy

### Branch Names and Purposes

```
main                              # Production-ready, stable code
develop                           # Integration branch for ongoing work
feature/<description>             # New features (e.g., feature/chroma-integration)
fix/<description>                 # Bug fixes (e.g., fix/vault-metadata)
docs/<description>                # Documentation updates (e.g., docs/workflow-guide)
infra/<description>               # Infrastructure changes (e.g., infra/docker-setup)
```

### Branch Lifecycle

**Main Branch (`main`):**
- Always stable and deployable
- Only receives merges from pull requests
- Requires human approval before merge
- All commits must be tracked in git history (no force-pushes)

**Develop Branch (`develop`):**
- Integration point for features
- Used starting Phase 2+
- Merges feature branches for testing before main
- Can receive direct commits (e.g., version bumps)

**Feature Branches:**
- Short-lived (days, not weeks)
- Based on `develop` (Phase 2+) or `main` (Phase 1)
- Delete after merge
- Never push directly to main

---

## Commit Conventions

### Message Format

```
<type>: <description>

[optional body explaining why, not what]
```

### Commit Types

- `feat:` — New feature or capability
- `fix:` — Bug fix
- `docs:` — Documentation changes (README, Vault entries, guides)
- `style:` — Formatting, whitespace (no logic change)
- `refactor:` — Code restructuring (no feature/fix)
- `test:` — Test additions or changes
- `chore:` — Build, dependency updates, tooling
- `infra:` — Infrastructure, Docker, deployment configuration

### Commit Rules

- **Max 70 characters** in subject line (for readability in logs)
- **Use lowercase** (except proper nouns)
- **No period** at end of subject
- **Describe why, not what** (what is evident in code; why belongs in message)
- **Atomic commits** — One logical change per commit
- **No force-pushes** to `main` or `develop`

### Commit Examples

```
feat: add semantic search to context builder

Enables retrieval of similar decisions from vault using Chroma
vector similarity, reducing manual context assembly time.

fix: correct vault metadata parsing for transclusion links

Parser was not handling [[...]] syntax correctly, causing
retrieval to miss related ADRs.

docs: add Phase 1 Foundation execution guide

Comprehensive walkthrough of VS Code, Docker, and Git setup.
Includes validation steps and troubleshooting.

infra: configure docker-compose for Chroma service

All services now containerized via docker-compose.yml.
Chroma runs on port 8000 with persistent storage.
```

---

## Pull Request Process

### Creating a PR

1. **Create branch** from `develop` or `main` (depending on phase)
2. **Push early and often** to prevent merge conflicts
3. **Open PR early** (even if incomplete) for visibility
4. **Link related work:**
   - Reference ADRs: "See ADR-ARCH-001 for design rationale"
   - Reference issues: "Closes #123" (when issue tracking exists)
   - Reference Vault entries: "Implementation of decision in Vault/07-Decisions/DECISIONS.md"

5. **Write clear description:**
   - What changes?
   - Why does it change?
   - How can reviewers verify?
   - Are there risks or edge cases?

### Merging a PR

1. **Code review:** At least one human approval required
2. **Automated checks:** If CI exists, all checks must pass
3. **Merge strategy:** Squash and merge for clean history (Phase 1+)
4. **Delete branch** after merge

---

## Approval Gates

Approval required before merge to `main`:

| Item | Approver | When | Process |
|------|----------|------|---------|
| Architecture changes | Human | Always | Review against DECISIONS.md and CLAUDE.md |
| Dependency changes | Human | Always | Verify compatibility and security |
| Database schema changes | Human | Always | Data migration strategy required |
| Security changes | Human + Security Agent (Phase 2+) | Always | Threat analysis documented |
| Major refactors | Human | Always | Impact analysis on other systems |
| Documentation | Self (Claude) or Human | Always | Reviewed for accuracy and completeness |

---

## Workflow Examples

### Creating a Feature Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/add-project-templates
# Make changes...
git add .
git commit -m "feat: add project templates for rapid setup"
git push -u origin feature/add-project-templates
```

### Creating a Pull Request

1. Push branch to GitHub
2. Open PR: Title is commit subject (e.g., "feat: add project templates")
3. Body includes:
   - What: "Adds 5 new project templates (API, Web, CLI, Desktop, AI)"
   - Why: "Reduces setup time for new projects; aligns with framework modularity"
   - How to verify: "Test each template with `claude init --template api`"
   - References: "Implements feature from Vault/09-Requirements/"

### Merging a Feature

```powershell
# After PR approval:
git checkout main
git pull origin main
git merge --squash feature/add-project-templates
git commit -m "feat: add project templates for rapid setup"
git push origin main
git push origin --delete feature/add-project-templates
```

---

## Command Reference

### Common Git Commands

```powershell
# Check status
git status

# Create and switch to feature branch
git checkout -b feature/my-feature

# View commit history
git log --oneline -10

# View changes
git diff

# Stage changes
git add .
git add specific-file.md

# Commit with message
git commit -m "type: description"

# Push to remote
git push -u origin feature/my-feature

# Pull latest
git pull origin main

# Merge another branch
git merge develop

# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

---

## Key Principles

1. **Reversibility** — Preserve history; use non-destructive operations when possible
2. **Traceability** — Every change has a reason; document it in commits and PRs
3. **Stability** — `main` is always safe; risky work happens in feature branches
4. **Collaboration** — Clear communication in commit messages and PR descriptions
5. **Discipline** — Follow conventions consistently; they enable automation later

---

## Related Documents

- **CLAUDE.md** — Project governance and approval requirements
- **Vault/07-Decisions/DECISIONS.md** — Major architectural decisions
- **Vault/03-Projects/AI Software Factory/Roadmap.md** — Phase timeline and milestones

---

**Last Updated:** 2026-06-07  
**Status:** Phase 1 Foundation
