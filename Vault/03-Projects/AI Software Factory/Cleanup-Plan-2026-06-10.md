---
type: workflow
status: active
last_updated: 2026-06-10
related: []
---

# Cleanup Plan — 2026-06-10

A structured checklist for the 2026-06-10 session to ensure system health, vault integrity, and efficient workflows.

---

## 1. System Health

- [ ] **Docker running** — `docker ps` confirms chroma container is up
- [ ] **Chroma accessible** — `curl http://localhost:8000/api/v2/heartbeat` responds
- [ ] **MCP servers reachable** — test chroma and filesystem MCP tool calls
- [ ] **.env variables correct** — `cat .env` confirms PROJECT_ROOT, CHROMA_HOST, ports
- [ ] **wrap-up script works** — dry run `/wrap-up` without commit (or test commit if safe)

---

## 2. Git / Workflow

- [ ] **Phase 14 WIP files** — decide for each:
  - `.claude/scripts/state-machine.js` — integrate, archive, or hold?
  - `.claude/scripts/vault-validator.js` — integrate, archive, or hold?
  - `.claude/scripts/mcp-whitelist.js` — integrate, archive, or hold?
  - `.claude/scripts/test-phase-14-*.js` — run tests or delete?
  - `.claude/scripts/phase-14-integration.md` — move to Vault or delete?
  - `.claude/.fsm-state.json` — runtime artifact, safe to delete

- [ ] **.gitignore aligned** — untracked files are either committed or gitignored
- [ ] **No orphaned branches** — `git branch -a` shows only active work
- [ ] **Session summaries up to date** — latest Vault/08-Retrospectives entries reflect past 48 hours

---

## 3. Vault Health

- [ ] **YAML frontmatter** — all Vault documents have required fields:
  - `type` (spec, log, architecture, guide, decision, retrospective, session, workflow, etc.)
  - `status` (draft, active, deprecated, review, complete)
  - `last_updated` (YYYY-MM-DD)

- [ ] **Backlinks resolved** — no broken internal `[[references]]` in Vault files
- [ ] **Stub files removed** — Vault/08-Retrospectives, Vault/10-Known-Problems clean of test/placeholder files
- [ ] **Open problems reviewed** — Vault/10-Known-Problems: close resolved issues, update open ones
- [ ] **DECISIONS.md index current** — Vault/07-Decisions/DECISIONS.md lists all ADRs and references
- [ ] **No orphaned documents** — all Vault files have at least one inbound backlink or are explicitly uncategorized

---

## 4. Chroma Indexing

- [ ] **Collections exist** — `mcp__chroma__chroma_list_collections` returns expected collections
- [ ] **Document counts healthy** — `mcp__chroma__chroma_get_collection_count` shows non-zero counts
- [ ] **Query test passes** — run a semantic query (`mcp__chroma__chroma_query_documents`) on a known topic, confirm relevant docs return
- [ ] **New Vault docs indexed** — any Vault files created or modified since last indexing have been re-ingested to Chroma
- [ ] **Index metadata fresh** — collection metadata includes recent document counts

---

## 5. .claude Folder Organization

- [ ] **Phase 14 scripts** — for each integration question:
  - Is state-machine.js integrated into agent-orchestrator.js?
  - Is vault-validator.js integrated into chroma-ingest.js?
  - Is mcp-whitelist.js integrated into mcp-authorization.js?
  - If NOT integrated: move to Vault archive or document decision in ADR

- [ ] **test-phase-14-*.js files** — decide:
  - Run tests and capture results?
  - Move to Vault/tests/ or archive?
  - Delete if obsolete?

- [ ] **.fsm-state.json cleanup** — delete if stale (runtime artifact from previous sessions)
- [ ] **PHASE-14-SUMMARY.md** — move to Vault/03-Projects/Phase-Summary-14.md or delete
- [ ] **plans/ folder** — archive or delete completed phase plans (keep current/in-progress)

---

## 6. File & Folder Organization

- [ ] **All .claude/scripts documented** — each script has a clear purpose comment or README
- [ ] **All Vault files categorized** — no files in Vault root; all in subdirectories (01-Standards, 02-Technologies, etc.)
- [ ] **No root clutter** — files in project root belong there (CLAUDE.md, WORKFLOW.md, docker-compose.yml, .mcp.json, source code)
- [ ] **docker-compose.yml reviewed** — health checks current, services align with setup
- [ ] **.mcp.json reviewed** — only active MCP servers listed (chroma, filesystem, etc.)
- [ ] **CI/CD / workflows** — if any GitHub Actions or build scripts, confirm they're current

---

## Optional Enhancements (If Time)

- [ ] Update Vault/03-Projects/Architecture/Current.md with any changes from Phase 14
- [ ] Run full Chroma re-index as health check (expensive but thorough)
- [ ] Review and consolidate any duplicate Vault documents
- [ ] Add missing backlinks to isolated Vault files

---

## Sign-off

Once all 6 sections are complete:
- [ ] Create session summary: `Vault/08-Retrospectives/Session-Summary-2026-06-10-Cleanup.md`
- [ ] Commit: `docs: cleanup session 2026-06-10 — system health, vault, and org pass`
- [ ] Push to origin/main

---

**Status:** Ready for 2026-06-10 session

**Estimated time:** 2–3 hours depending on Phase 14 integration decisions
