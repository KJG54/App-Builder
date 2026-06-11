# Phase 17 Active Learning Scripts — Design Spec

**Date:** 2026-06-11  
**Status:** Approved  
**Phase:** 17.1 (memory-updater), 17.2 (cost-analyzer), 17.6 (vault-auditor)

---

## Context

Phase 17's active learning loop was deferred from the original Phase 17 cleanup deliverables. The three scripts below close the feedback loop: agents accumulate outcome history, costs are tracked, and vault health is auditable on demand.

Prerequisites already in place:
- `Vault/14-Agent-Memory/<agent>/memory.yaml` — seeded for all 5 agents (architect, backend, devops, frontend, qa)
- `.claude/metrics/*/v1.0.0/outputs.json` — 167+ records per agent with `performance.cost_usd`
- `agent-orchestrator.js` — `completeSubtask()` is the integration point
- `approval-workflow.js` — exists but is score-based; memory updates use a simpler pending-file pattern instead

---

## Script 1: memory-updater.js

### Purpose

Record completed subtask outcomes into agent memory, updating rolling score baselines and flagging regressions. All writes are staged — never committed automatically.

### Trigger

Called from `completeSubtask()` in `agent-orchestrator.js` after `subtask.status = 'complete'`, before `return`. Fire-and-forget (non-blocking — errors are warned, not thrown).

### Input

```js
{
  agent: 'architect',           // agent role key
  domain: 'api',                // task domain (falls back to 'general')
  scores: {                     // from subtask.verificationResult
    compliance: 95,
    completeness: 82,
    security: 98,
    consistency: 70,
    documentation: 68
  }
}
```

### Baseline Update Formula

Weighted rolling average: `new_baseline = 0.8 * current_baseline + 0.2 * new_score`

This dampens noise from a single outlier while converging toward the agent's true performance over time.

### Regression Detection

A regression is flagged when: `current_baseline - new_score > 10`

Regressions are annotated `⚠️ REGRESSION` in the pending file. They do not block the write — they surface information for the human reviewer.

### Pending File Pattern

Writes to `Vault/14-Agent-Memory/<agent>/memory-pending-<ISO-timestamp>.yaml`.

The pending file is a full replacement of `memory.yaml` — not a diff. The human reviews the whole proposed state. Regressions are annotated inline.

`memory.yaml` is never touched by `recordOutcome()`.

### CLI

```
node memory-updater.js --review
  Lists all pending files across all agents with a one-line diff summary
  (agent, date, score changes, regression count)

node memory-updater.js --apply <timestamp>
  Copies memory-pending-<timestamp>.yaml → memory.yaml
  Deletes the pending file
  Prints confirmation

node memory-updater.js --discard <timestamp>
  Deletes the pending file without applying
```

### API (for orchestrator integration)

```js
const updater = new MemoryUpdater();
await updater.recordOutcome({ agent, domain, scores });
```

### Error Handling

- Missing `memory.yaml` for agent → warn and skip (don't create)
- Missing or partial `scores` → use only the scores present; skip absent score types
- Filesystem errors → warn to console, never throw

---

## Script 2: cost-analyzer.js

### Purpose

Aggregate cost data already present in `outputs.json` records into a human-readable report. Detect cost spikes relative to each agent's own baseline.

### Input

All files matching `.claude/metrics/*/v1.0.0/outputs.json`.

Each record has: `agent_role`, `domain`, `timestamp`, `performance.cost_usd`.

### Aggregations

1. **Total spend** — sum across all agents and all time
2. **Per-agent breakdown** — total cost, record count, median cost per task, average cost per task
3. **Per-domain breakdown** — total cost and record count per domain across all agents
4. **Daily spend** — total cost per ISO date (last N days, default 30)

### Spike Detection

Spike threshold: **3× the agent's median cost per task**

Median is used (not mean) because mean is skewed by prior spikes. A task that costs 3× the agent's median is flagged. No hardcoded dollar threshold — adapts to actual usage.

### Output

`Vault/Logs/cost-report-<YYYY-MM-DD>.md`

Sections:
1. Summary (total spend, date range, record count)
2. Per-agent table
3. Per-domain table
4. Daily spend table (last 30 days or `--days N`)
5. Spikes list (agent, date, cost, multiple of median, task id)

### CLI

```
node cost-analyzer.js
  Full report, all agents, last 30 days

node cost-analyzer.js --agent architect
  Filter to one agent

node cost-analyzer.js --days 7
  Last 7 days only

node cost-analyzer.js --no-write
  Print report to stdout without writing to Vault/Logs/
```

---

## Script 3: vault-auditor.js

### Purpose

Run three deterministic health checks against the Vault and produce a structured report. Zero false positives is the primary quality bar.

### Check 1: Stale Documents

**Definition:** Any `.md` file in `Vault/` where the `last_updated` frontmatter field is a date more than 30 days before today.

**Uses frontmatter, not filesystem mtime** — git checkouts update mtime, creating false positives.

**Exclusions:** Files without `last_updated` frontmatter are skipped (not flagged — they may predate the standard).

### Check 2: Known-Problems Missing `status`

**Definition:** Any `.md` file in `Vault/10-Known-Problems/` that does not have a `status:` key in its YAML frontmatter.

All Known-Problem files should have `status: open | investigating | resolved`.

### Check 3: Unreferenced ADRs

**Definition:** Any `.md` file in `Vault/07-Decisions/` whose filename (without extension) does not appear as a string in any file under `Vault/11-Facts/`.

A referenced ADR looks like: `[[ADR-ARCH-001]]` or `ADR-ARCH-001` anywhere in a Facts file.

### Output

`Vault/Logs/vault-health-<YYYY-MM-DD>.md`

Structure:
```
# Vault Health Report — YYYY-MM-DD

## Summary
✅ Check 1: Stale Docs — N flagged
✅ Check 2: Known-Problems status — N flagged  
✅ Check 3: Unreferenced ADRs — N flagged

## Details
[one section per check, listing offending files]
```

### CLI

```
node vault-auditor.js
  Run all checks, write report

node vault-auditor.js --no-write
  Print to stdout without writing to Vault/Logs/

node vault-auditor.js --stale-days 60
  Override the 30-day stale threshold
```

---

## Integration: agent-orchestrator.js

Single addition to `completeSubtask()`, after `subtask.status = 'complete'`:

```js
// Phase 17.1: queue memory update (non-blocking)
try {
  await this.memoryUpdater.recordOutcome({
    agent:  subtask.agent,
    domain: task.domain || 'general',
    scores: subtask.verificationResult || {}
  });
} catch (e) {
  console.warn('[MemoryUpdater] Non-blocking error:', e.message);
}
```

`this.memoryUpdater` is instantiated in the `AgentOrchestrator` constructor alongside existing services.

---

## Validation

A new `validate-phase-17-learning.js` will cover:
- `memory-updater.js` syntax + exports
- `recordOutcome()` writes a pending file and does not touch `memory.yaml`
- Pending file contains correct rolling baseline calculation
- Regression flag present when score drops >10 points
- `cost-analyzer.js` syntax + exports
- Spike detection uses 3× median (unit test with known data)
- `vault-auditor.js` syntax + exports
- All three checks run without error on current Vault
- Report written to correct path

Added to `npm run test:all`.

---

## What Is Out of Scope (v1)

- Prompt health monitor (17.3) — needs ongoing prompt version tracking data
- Skill gap detection (17.4) — depends on 17.1 running for multiple sessions first
- Problem resolver (17.5) — follow-up after vault-auditor is stable
- ADR contradiction detection — deferred; requires semantic search, not string matching
