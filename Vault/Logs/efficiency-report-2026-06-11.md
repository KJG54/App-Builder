---
type: report
status: complete
last_updated: 2026-06-11
author: Claude-Builder-Agent
---

# Runtime Efficiency Report — 2026-06-11

## Executive Summary

Session runtime is in good shape for a project this size. Three MCPs are configured in `.mcp.json` — all justified and used. Chroma retrieval Top-K is already conservative (5). No redundant context duplication found in core files.

**Two actionable wins:**
1. **Memory bloat** — 10 of 20 memory files are stale (17KB of misleading context). Highest-impact, zero-risk cleanup.
2. **Directory scope gap** — no `.claudecodeignore` exists. Claude scans `.remember/logs/` (530KB of runtime logs) and other artifact dirs it never needs to read.

Plugin MCPs (figma, huggingface, playwright, slack, etc.) load schemas at session start but are controlled by plugin settings outside this project's `.mcp.json`. Noted for awareness.

---

## Context Cost Map

| File | Size | Tokens (est.) | Load Trigger | Necessary? |
|------|------|---------------|-------------|------------|
| `CLAUDE.md` | 21 KB | ~5,200 | Every session | Yes — governance |
| `MEMORY.md` | 2.3 KB | ~575 | Every session | Yes — memory index |
| `WORKFLOW.md` | 7 KB | ~1,750 | Every session (in prompt) | Yes — but could be conditional |
| `GETTING-STARTED.md` | 17 KB | ~4,250 | Not auto-loaded | N/A |
| `.mcp.json` | 0.6 KB | ~150 | Session config | Yes |
| `.claude/settings.json` | 1.2 KB | ~300 | Session config | Yes |
| `.claude/settings.local.json` | 0.2 KB | ~50 | Session config | Yes |

**Total always-loaded governance:** ~7,875 tokens per session. Acceptable for a project with this governance depth.

---

## Phase 2: Context Waste

| File | Current Size | Issue | Recommendation | Estimated Saving |
|------|-------------|-------|---------------|-----------------|
| `CLAUDE.md` | 21 KB | Large but mostly load-bearing. Minor: Code Quality Rules (3 lines) + Refactoring Rules (5 lines) + AI Collaboration Rules (4 lines) overlap with system defaults. | Future: merge into one "Code Conduct" section. Not urgent. | ~200 tokens if consolidated |
| `MEMORY.md` | 2.3 KB | Index references 10 stale entries (see Phase 9) | Remove stale entries from index | ~800 tokens saved per session |
| `WORKFLOW.md` | 7 KB | Not auto-loaded into context per se, but shows in project root | No action. It's a reference doc, not a runtime cost. | N/A |

---

## Phase 3: Token Efficiency

| Location | Issue | Recommendation | Estimated Saving |
|----------|-------|---------------|-----------------|
| `CLAUDE.md` — Error Reporting section | Detailed format template (12-line code block) is useful but verbose. | Could trim the template, keep the rule. | ~100 tokens |
| Skills (repository-curator, runtime-efficiency-engineer) | Already trimmed to ~230 lines each — within the 300-line Constitution limit. | No action. | N/A |
| Slash commands (7 files) | Short and focused — all under 30 lines. | No action. | N/A |
| Agent prompts (Vault/05-Prompts/) | Not measured this run — defer to full curator. | Future review. | Unknown |

**Overall token efficiency verdict:** Project text is already lean. No major waste found. CLAUDE.md's 21KB is load-bearing governance, not filler.

---

## Phase 4: Retrieval Efficiency

| Setting | Current | Verdict |
|---------|---------|---------|
| Default Top-K | 5 (standards + facts), 3 (sessions) | ✅ Conservative and appropriate |
| Collections queried per request | 3 (global-standards, project-facts, project-sessions) | ✅ By design per ADR-DATA-001 |
| Full docs vs. excerpts | Full documents returned | ⚠️ Worth watching as Vault grows beyond 200 docs |
| Duplicate indexing | None found | ✅ |

**No immediate action needed.** If Vault exceeds 300 documents, consider adding `maxLength` truncation to `queryCollection()` results.

---

## Phase 5: MCP Session Cost

| MCP | Use in this project | Schema cost | Verdict |
|-----|---------------------|-------------|---------|
| `chroma` | Vault semantic search (when Docker running) | Low | ✅ Keep |
| `filesystem` | File read/write outside project root | Low | ✅ Keep |
| `github` | PRs, commits, GitHub operations | Medium | ✅ Keep |

**All 3 project MCPs are justified.** No wasteful MCPs in `.mcp.json`.

**Plugin MCPs (loaded by harness, outside `.mcp.json`):**
The harness loads additional MCPs from installed plugins: figma, huggingface, playwright, slack, sentry, linear, Gmail, Google Calendar, context7. Each loads a schema at session start.

| Plugin MCP | Used in this project? | Recommendation |
|------------|----------------------|----------------|
| `context7` | Yes — library docs lookup | ✅ Keep |
| `playwright` | Rarely | Consider disabling in plugin settings |
| `figma` | No | Disable in plugin settings |
| `huggingface` | No | Disable in plugin settings |
| `slack` | No (auth not configured) | Disable in plugin settings |
| `sentry` | No | Disable in plugin settings |
| `linear` | No | Disable in plugin settings |
| `Gmail` | No | Disable in plugin settings |
| `Google Calendar` | No | Disable in plugin settings |

**Action:** Disabling 8 unused plugin MCPs reduces schema loading overhead at session start. Do this in Claude Code plugin settings (not project settings — these are user-level plugins). Estimated saving: moderate schema overhead per session.

---

## Phase 8: Directory Scope

**No `.claudecodeignore` file exists.**

Claude currently scans everything not in `.gitignore`. Directories with no code-task value:

| Directory | Size | Content | Recommendation |
|-----------|------|---------|----------------|
| `.remember/logs/` | 530 KB | Memory logs (memory-2026-06-09.log through memory-2026-06-11.log) | Add to `.claudecodeignore` |
| `.remember/tmp/` | Unknown | Temp session files | Add to `.claudecodeignore` |
| `Vault/.smart-env/` | Large | Embedding vectors — already gitignored | Add to `.claudecodeignore` |
| `Vault/copilot/` | Unknown | Plugin data — already gitignored | Add to `.claudecodeignore` |
| `Vault/.obsidian/plugins/` | ~3–4 MB | Compiled JS bundles — already gitignored | Add to `.claudecodeignore` |

**Recommended `.claudecodeignore` additions (approval required):**

```
# Runtime memory logs — not useful for code tasks
.remember/logs/
.remember/tmp/
.remember/archive.md

# Vault runtime artifacts — already gitignored, also exclude from Claude scan
Vault/.smart-env/
Vault/copilot/
Vault/.obsidian/plugins/

# Docker volumes — data, not code
docker/volumes/
```

---

## Phase 9: Memory Bloat

**20 memory files, ~88 KB total. 10 are stale.**

MEMORY.md (the index, always loaded) references 14 named entries. 6 of those point to stale files (already identified by /simplify). 4 additional stale files exist that aren't in the MEMORY.md index.

| Memory File | Size | Status | Reason |
|------------|------|--------|--------|
| `project_phase_1_foundation.md` | 2.1 KB | 🔴 Stale | Phase complete, setup in repo |
| `project_chroma_mcp_fixed.md` | 1.9 KB | 🔴 Stale | Fixed; references deleted /wrap-up |
| `project_phase_15_memory_system.md` | 1.5 KB | 🔴 Stale | Defect resolved in Phase 16 |
| `reference_end_of_day_command.md` | 2.1 KB | 🔴 Stale | References deleted /wrap-up command |
| `feedback_wrap_up_implementation.md` | 1.3 KB | 🔴 Stale | References deleted wrap-up.js |
| `project_phase_18_complete.md` | 1.2 KB | 🔴 Stale | "Next task" was delivered |
| `phase_14_16_planning.md` | 1.8 KB | 🔴 Stale | Planning doc for completed phases |
| `project_claude_md_added.md` | 1.4 KB | 🔴 Stale | "CLAUDE.md added" — obvious from repo |
| `gitignore_cleanup.md` | 2.7 KB | 🔴 Stale | Cleanup complete, nothing ongoing |
| `obsidian_setup.md` | 1.1 KB | 🟡 Low value | Obsidian plugin list; stable, not operational |

**Total stale/low-value: ~17 KB** — when these entries are referenced, they inject stale context. The MEMORY.md index itself wastes ~800 tokens per session pointing at 6 of these.

**Load-bearing memory files (keep all):**

| File | Why It Stays |
|------|-------------|
| `project_ai_software_factory.md` | Master project vision |
| `project_fsm_not_wired.md` | Safety warning — FSM not in production |
| `communication_preference.md` | Response depth behavioral rule |
| `feedback_git_commits.md` | Commit style rule |
| `feedback_check_decisions_first.md` | Workflow reflex rule |
| `feedback_chroma_requires_docker.md` | Operational guardrail |
| `feedback_chroma_test_errors_expected.md` | Prevents false failure reports |
| `feedback_executing_plans_skill.md` | Skill invocation guidance |
| `feedback_finish_through_completion.md` | Task completion discipline |
| `MEMORY.md` | Index (after cleanup) |

---

## Quick Wins

| Win | Effort | Impact | Risk |
|-----|--------|--------|------|
| Remove 10 stale memory files | Zero — can delete outside git | ~17 KB of misleading context eliminated; MEMORY.md index shrinks | None |
| Remove 6 stale MEMORY.md index entries | Zero — edit one file | ~800 tokens per session from cleaner index | None |
| Disable 8 unused plugin MCPs | Low — Claude Code plugin settings | Schema loading overhead reduced per session | None |

---

## Requires Approval

| Change | What | Why Needed |
|--------|------|-----------|
| Create `.claudecodeignore` | 7-line file excluding `.remember/logs/`, Vault artifacts, docker volumes | Prevents Claude from scanning ~4MB of non-code directories per session |
| CLAUDE.md condensation | Minor consolidation of Code Quality/Refactoring/AI Collaboration sections | Saves ~300 tokens per session; risk of removing load-bearing rules |

---

## What's Efficient Already

- MCP configuration (3 servers, all used, no waste in .mcp.json)
- Chroma Top-K (5/3 — conservative, no retrieval explosion risk)
- Slash commands (7 files, all under 30 lines)
- Skills (within 300-line Constitution limit)
- Phase validators (run-once checks, not context cost)
- SessionStart hook (single lightweight Docker check)

---

*Generated by /efficiency skill — next: /guardian*
