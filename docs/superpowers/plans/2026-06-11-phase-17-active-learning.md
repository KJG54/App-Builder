# Phase 17 Active Learning Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three Phase 17 active learning scripts — `memory-updater.js` (staged agent memory updates), `cost-analyzer.js` (cost aggregation from outputs.json), and `vault-auditor.js` (deterministic vault health checks) — plus a validator and orchestrator integration.

**Architecture:** Each script is a standalone CommonJS module with a class API and a CLI entry point. `memory-updater.js` is also wired into `agent-orchestrator.js` via `completeSubtask()`. All three are tested by a new `validate-phase-17-learning.js` added to `npm test`.

**Tech Stack:** Node.js, CommonJS modules, `js-yaml` (already a dependency via `seed-agent-memory.js`), no new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `.claude/scripts/memory-updater.js` | Create | Record outcomes, write pending YAML, CLI review/apply/discard |
| `.claude/scripts/cost-analyzer.js` | Create | Aggregate outputs.json costs, spike detection, write report |
| `.claude/scripts/vault-auditor.js` | Create | 3 deterministic vault health checks, write report |
| `.claude/scripts/agent-orchestrator.js` | Modify | Add `this.memoryUpdater` to constructor + `completeSubtask()` hook |
| `.claude/scripts/validate-phase-17-learning.js` | Create | 10-test validator for all three scripts |
| `package.json` | Modify | Add `test:phase-17-learning` and append to `test:all` / `test` chains |

---

## Task 1: Validator skeleton (failing)

**Files:**
- Create: `.claude/scripts/validate-phase-17-learning.js`

- [ ] **Step 1: Write the validator skeleton with all 10 test stubs**

```javascript
#!/usr/bin/env node
/**
 * Phase 17 Active Learning Validator
 * 10 tests — no Docker required.
 * Usage: node validate-phase-17-learning.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');
const VAULT_DIR   = path.join(ROOT, 'Vault');
const METRICS_DIR = path.join(ROOT, '.claude', 'metrics');

class Phase17LearningValidator {
  constructor() { this.passCount = 0; this.failCount = 0; }
  pass(msg) { console.log(`   ✅ PASS: ${msg}`); this.passCount++; }
  fail(msg) { console.error(`   ❌ FAIL: ${msg}`); this.failCount++; }

  test1_ScriptsExist() {
    console.log('\n📋 Test 1: Scripts Exist');
    for (const s of ['memory-updater.js', 'cost-analyzer.js', 'vault-auditor.js']) {
      fs.existsSync(path.join(SCRIPTS_DIR, s))
        ? this.pass(`${s} exists`)
        : this.fail(`${s} not found`);
    }
  }

  test2_SyntaxCheck() {
    console.log('\n📋 Test 2: Syntax Check');
    for (const s of ['memory-updater.js', 'cost-analyzer.js', 'vault-auditor.js']) {
      try {
        execSync(`node --check "${path.join(SCRIPTS_DIR, s)}"`, { stdio: 'pipe' });
        this.pass(`${s} syntax OK`);
      } catch (e) {
        this.fail(`${s} syntax error: ${e.stderr?.toString().trim() || e.message}`);
      }
    }
  }

  test3_MemoryUpdaterWritesPendingFile() {
    console.log('\n📋 Test 3: recordOutcome() writes pending file, not memory.yaml');
    const tmpDir = path.join(ROOT, '.claude', '.test-memory-updater');
    try {
      // Set up temp agent memory dir
      fs.mkdirSync(tmpDir, { recursive: true });
      const agentDir = path.join(tmpDir, 'architect');
      fs.mkdirSync(agentDir, { recursive: true });
      const yaml = require('js-yaml');
      const baseline = {
        agent: 'architect', version: '1.0.0',
        score_baselines: { compliance: 90, completeness: 80, security: 95, consistency: 75, documentation: 70 },
        successful_patterns: [], failed_patterns: [], recommendations: [],
        last_updated: '2026-06-01',
      };
      fs.writeFileSync(path.join(agentDir, 'memory.yaml'), yaml.dump(baseline), 'utf8');

      const { MemoryUpdater } = require(path.join(SCRIPTS_DIR, 'memory-updater'));
      const updater = new MemoryUpdater(tmpDir);
      // Run synchronously — recordOutcome is async but writes synchronously after await
      const result = updater.recordOutcome({
        agent: 'architect',
        domain: 'api',
        scores: { compliance: 92, completeness: 82, security: 97, consistency: 73, documentation: 68 },
      });

      // If async, wrap in a promise chain for the validator
      Promise.resolve(result).then(() => {
        const files = fs.readdirSync(agentDir);
        const pending = files.filter(f => f.startsWith('memory-pending-'));
        pending.length > 0
          ? this.pass('pending file written')
          : this.fail('no pending file written');

        const memContent = fs.readFileSync(path.join(agentDir, 'memory.yaml'), 'utf8');
        !memContent.includes('pending')
          ? this.pass('memory.yaml not modified')
          : this.fail('memory.yaml was modified');
      }).catch(e => this.fail(`recordOutcome error: ${e.message}`))
        .finally(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
    } catch (e) {
      this.fail(`test3 error: ${e.message}`);
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }

  test4_BaselineCalculation() {
    console.log('\n📋 Test 4: Rolling baseline calculation (80/20 weighted average)');
    try {
      const { computeNewBaselines } = require(path.join(SCRIPTS_DIR, 'memory-updater'));
      const current  = { compliance: 90, completeness: 80 };
      const incoming = { compliance: 100, completeness: 60 };
      const result   = computeNewBaselines(current, incoming);
      // compliance: 0.8*90 + 0.2*100 = 72+20 = 92
      // completeness: 0.8*80 + 0.2*60 = 64+12 = 76
      Math.round(result.compliance) === 92
        ? this.pass('compliance baseline: 90 + score 100 → 92')
        : this.fail(`compliance expected 92, got ${result.compliance}`);
      Math.round(result.completeness) === 76
        ? this.pass('completeness baseline: 80 + score 60 → 76')
        : this.fail(`completeness expected 76, got ${result.completeness}`);
    } catch (e) {
      this.fail(`computeNewBaselines error: ${e.message}`);
    }
  }

  test5_RegressionFlag() {
    console.log('\n📋 Test 5: Regression flagged when score drops >10 points');
    try {
      const { detectRegressions } = require(path.join(SCRIPTS_DIR, 'memory-updater'));
      // compliance drop of 15 → regression; completeness drop of 5 → fine
      const regressions = detectRegressions(
        { compliance: 90, completeness: 80 },
        { compliance: 75, completeness: 76 }
      );
      regressions.includes('compliance')
        ? this.pass('compliance regression detected (drop 15)')
        : this.fail('compliance regression not detected');
      !regressions.includes('completeness')
        ? this.pass('completeness not flagged (drop 4)')
        : this.fail('completeness falsely flagged');
    } catch (e) {
      this.fail(`detectRegressions error: ${e.message}`);
    }
  }

  test6_CostAnalyzerLoadsData() {
    console.log('\n📋 Test 6: CostAnalyzer loads outputs.json records');
    try {
      const { CostAnalyzer } = require(path.join(SCRIPTS_DIR, 'cost-analyzer'));
      const analyzer = new CostAnalyzer(METRICS_DIR);
      const records  = analyzer.loadAllRecords();
      records.length > 0
        ? this.pass(`loaded ${records.length} cost records`)
        : this.fail('no records loaded');
      const hasFields = records.every(r => r.agent_role && r.timestamp && r.performance?.cost_usd !== undefined);
      hasFields
        ? this.pass('all records have agent_role, timestamp, cost_usd')
        : this.fail('some records missing required fields');
    } catch (e) {
      this.fail(`CostAnalyzer error: ${e.message}`);
    }
  }

  test7_SpikeDetection() {
    console.log('\n📋 Test 7: Spike detection uses 3× median threshold');
    try {
      const { detectSpikes } = require(path.join(SCRIPTS_DIR, 'cost-analyzer'));
      // median of [1,1,1,1,1,1,1,1,1,10] = 1; 10 > 3*1 → spike
      const records = [
        ...Array(9).fill(null).map((_, i) => ({ id: `${i}`, agent_role: 'test', domain: 'api', timestamp: '2026-06-11T00:00:00Z', performance: { cost_usd: 1 } })),
        { id: 'spike', agent_role: 'test', domain: 'api', timestamp: '2026-06-11T00:00:00Z', performance: { cost_usd: 10 } },
      ];
      const spikes = detectSpikes(records);
      spikes.length === 1 && spikes[0].id === 'spike'
        ? this.pass('spike detected at 10× median cost')
        : this.fail(`expected 1 spike, got ${spikes.length}: ${JSON.stringify(spikes.map(s => s.id))}`);
    } catch (e) {
      this.fail(`detectSpikes error: ${e.message}`);
    }
  }

  test8_VaultAuditorRunsChecks() {
    console.log('\n📋 Test 8: VaultAuditor runs all 3 checks without error');
    try {
      const { VaultAuditor } = require(path.join(SCRIPTS_DIR, 'vault-auditor'));
      const auditor = new VaultAuditor(VAULT_DIR);
      const report  = auditor.run();
      ['staleDocs', 'missingStatus', 'unreferencedAdrs'].every(k => Array.isArray(report[k]))
        ? this.pass('all 3 check arrays present in report')
        : this.fail('report missing one or more check arrays');
    } catch (e) {
      this.fail(`VaultAuditor error: ${e.message}`);
    }
  }

  test9_AuditorReportFormat() {
    console.log('\n📋 Test 9: VaultAuditor report is valid markdown');
    try {
      const { VaultAuditor } = require(path.join(SCRIPTS_DIR, 'vault-auditor'));
      const auditor  = new VaultAuditor(VAULT_DIR);
      const report   = auditor.run();
      const markdown = auditor.formatReport(report, new Date('2026-06-11'));
      markdown.includes('# Vault Health Report')
        ? this.pass('report contains expected header')
        : this.fail('report missing header');
      markdown.includes('## Summary')
        ? this.pass('report contains Summary section')
        : this.fail('report missing Summary section');
    } catch (e) {
      this.fail(`report format error: ${e.message}`);
    }
  }

  test10_OrchestratorHasMemoryUpdater() {
    console.log('\n📋 Test 10: AgentOrchestrator instantiates MemoryUpdater');
    try {
      const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'agent-orchestrator.js'), 'utf8');
      src.includes('MemoryUpdater')
        ? this.pass('MemoryUpdater referenced in agent-orchestrator.js')
        : this.fail('MemoryUpdater not found in agent-orchestrator.js');
      src.includes('memoryUpdater')
        ? this.pass('this.memoryUpdater used in orchestrator')
        : this.fail('this.memoryUpdater not found in orchestrator');
    } catch (e) {
      this.fail(`orchestrator check error: ${e.message}`);
    }
  }

  async run() {
    console.log('\n🔍 Phase 17 Active Learning Validator');
    console.log('━'.repeat(40));
    this.test1_ScriptsExist();
    this.test2_SyntaxCheck();
    this.test3_MemoryUpdaterWritesPendingFile();
    this.test4_BaselineCalculation();
    this.test5_RegressionFlag();
    this.test6_CostAnalyzerLoadsData();
    this.test7_SpikeDetection();
    this.test8_VaultAuditorRunsChecks();
    this.test9_AuditorReportFormat();
    this.test10_OrchestratorHasMemoryUpdater();

    // Wait for async test3
    await new Promise(r => setTimeout(r, 300));

    console.log('\n' + '━'.repeat(40));
    console.log(`Results: ${this.passCount} passed, ${this.failCount} failed\n`);
    if (this.failCount > 0) {
      console.error('❌ Phase 17 Learning: FAILURES\n');
      process.exit(1);
    }
    console.log('✅ Phase 17 Active Learning: ALL PASS\n');
  }
}

new Phase17LearningValidator().run().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run validator to confirm all tests fail**

```
node .claude/scripts/validate-phase-17-learning.js
```

Expected: 10 FAILs (scripts don't exist yet).

- [ ] **Step 3: Commit skeleton**

```
git add .claude/scripts/validate-phase-17-learning.js
git commit -m "test: Phase 17 learning validator skeleton (all failing)"
```

---

## Task 2: memory-updater.js

**Files:**
- Create: `.claude/scripts/memory-updater.js`

- [ ] **Step 1: Write memory-updater.js**

```javascript
#!/usr/bin/env node
/**
 * Memory Updater — Phase 17.1
 *
 * Records completed subtask outcomes into agent memory.yaml via a staged
 * pending-file pattern. memory.yaml is NEVER written directly — human must
 * run --apply to commit a pending update.
 *
 * CLI:
 *   node memory-updater.js --review              List pending updates
 *   node memory-updater.js --apply <timestamp>   Apply a pending update
 *   node memory-updater.js --discard <timestamp> Discard a pending update
 */

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULT_MEMORY_DIR = path.resolve(__dirname, '..', '..', 'Vault', '14-Agent-Memory');

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Compute new rolling baselines using 80/20 weighted average.
 * Only updates score types present in both current and incoming.
 * @param {Object} current   - current score_baselines from memory.yaml
 * @param {Object} incoming  - new scores from the completed task
 * @returns {Object} updated baselines (same keys as current)
 */
function computeNewBaselines(current, incoming) {
  const result = { ...current };
  for (const key of Object.keys(current)) {
    if (incoming[key] !== undefined && typeof incoming[key] === 'number') {
      result[key] = 0.8 * current[key] + 0.2 * incoming[key];
    }
  }
  return result;
}

/**
 * Detect which score types regressed (current_baseline - new_score > 10).
 * @param {Object} currentBaselines
 * @param {Object} newScores
 * @returns {string[]} array of score type keys that regressed
 */
function detectRegressions(currentBaselines, newScores) {
  return Object.keys(currentBaselines).filter(key => {
    const incoming = newScores[key];
    return typeof incoming === 'number' && (currentBaselines[key] - incoming) > 10;
  });
}

// ---------------------------------------------------------------------------
// MemoryUpdater class
// ---------------------------------------------------------------------------

class MemoryUpdater {
  constructor(memoryDir = DEFAULT_MEMORY_DIR) {
    this.memoryDir = memoryDir;
  }

  /**
   * Record a completed subtask outcome.
   * Reads current memory.yaml, computes new baselines, writes pending file.
   * Never touches memory.yaml directly.
   *
   * @param {Object} opts
   * @param {string} opts.agent   - agent role key (e.g. 'architect')
   * @param {string} opts.domain  - task domain (e.g. 'api')
   * @param {Object} opts.scores  - verification scores from completed task
   */
  async recordOutcome({ agent, domain = 'general', scores = {} }) {
    const agentDir  = path.join(this.memoryDir, agent);
    const memFile   = path.join(agentDir, 'memory.yaml');

    if (!fs.existsSync(memFile)) {
      console.warn(`[MemoryUpdater] No memory.yaml for agent "${agent}" — skipping`);
      return;
    }

    const current = yaml.load(fs.readFileSync(memFile, 'utf8'));
    const currentBaselines = current.score_baselines || {};
    const newBaselines     = computeNewBaselines(currentBaselines, scores);
    const regressions      = detectRegressions(currentBaselines, scores);

    // Build pending state
    const pending = {
      ...current,
      score_baselines: newBaselines,
      last_updated: new Date().toISOString().slice(0, 10),
      _pending_meta: {
        recorded_at: new Date().toISOString(),
        domain,
        incoming_scores: scores,
        regressions: regressions.length > 0
          ? regressions.map(k => `⚠️ REGRESSION: ${k} dropped from ${currentBaselines[k].toFixed(1)} to ${scores[k]}`)
          : [],
      },
    };

    const timestamp   = new Date().toISOString().replace(/[:.]/g, '-');
    const pendingFile = path.join(agentDir, `memory-pending-${timestamp}.yaml`);
    fs.writeFileSync(pendingFile, yaml.dump(pending), 'utf8');

    if (regressions.length > 0) {
      console.warn(`[MemoryUpdater] ⚠️  REGRESSIONS for ${agent}: ${regressions.join(', ')}`);
      console.warn(`[MemoryUpdater] Review with: node memory-updater.js --review`);
    } else {
      console.log(`[MemoryUpdater] Pending update written for ${agent} (${pendingFile})`);
    }
  }

  /**
   * List all pending files across all agents with a summary.
   */
  review() {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    let found = 0;
    for (const agent of agents) {
      const agentDir = path.join(this.memoryDir, agent);
      const pending  = fs.readdirSync(agentDir).filter(f => f.startsWith('memory-pending-'));
      for (const file of pending) {
        found++;
        const data = yaml.load(fs.readFileSync(path.join(agentDir, file), 'utf8'));
        const meta = data._pending_meta || {};
        const regressionCount = meta.regressions?.length || 0;
        const tag = regressionCount > 0 ? `⚠️  ${regressionCount} regression(s)` : '✅ no regressions';
        const timestamp = file.replace('memory-pending-', '').replace('.yaml', '');
        console.log(`\n  Agent:      ${agent}`);
        console.log(`  Timestamp:  ${timestamp}`);
        console.log(`  Domain:     ${meta.domain || 'unknown'}`);
        console.log(`  Status:     ${tag}`);
        if (regressionCount > 0) {
          meta.regressions.forEach(r => console.log(`              ${r}`));
        }
        console.log(`  Apply:      node memory-updater.js --apply ${timestamp}`);
        console.log(`  Discard:    node memory-updater.js --discard ${timestamp}`);
      }
    }

    if (found === 0) console.log('  No pending memory updates.');
    else console.log(`\n  ${found} pending update(s) total.`);
  }

  /**
   * Apply a pending update: copy pending file → memory.yaml, delete pending.
   * @param {string} timestamp - the timestamp portion of the filename
   */
  apply(timestamp) {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const agentDir    = path.join(this.memoryDir, agent);
      const pendingFile = path.join(agentDir, `memory-pending-${timestamp}.yaml`);
      if (!fs.existsSync(pendingFile)) continue;

      // Strip _pending_meta before writing to memory.yaml
      const data = yaml.load(fs.readFileSync(pendingFile, 'utf8'));
      delete data._pending_meta;
      fs.writeFileSync(path.join(agentDir, 'memory.yaml'), yaml.dump(data), 'utf8');
      fs.unlinkSync(pendingFile);
      console.log(`✅ Applied memory update for ${agent} (${timestamp})`);
      return;
    }

    console.error(`❌ No pending file found with timestamp: ${timestamp}`);
    process.exit(1);
  }

  /**
   * Discard a pending update without applying.
   * @param {string} timestamp
   */
  discard(timestamp) {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const pendingFile = path.join(this.memoryDir, agent, `memory-pending-${timestamp}.yaml`);
      if (!fs.existsSync(pendingFile)) continue;
      fs.unlinkSync(pendingFile);
      console.log(`🗑️  Discarded pending update for ${agent} (${timestamp})`);
      return;
    }

    console.error(`❌ No pending file found with timestamp: ${timestamp}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const updater = new MemoryUpdater();

  if (args[0] === '--review') {
    console.log('\n📋 Pending Memory Updates\n');
    updater.review();
  } else if (args[0] === '--apply' && args[1]) {
    updater.apply(args[1]);
  } else if (args[0] === '--discard' && args[1]) {
    updater.discard(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node memory-updater.js --review');
    console.log('  node memory-updater.js --apply <timestamp>');
    console.log('  node memory-updater.js --discard <timestamp>');
  }
}

module.exports = { MemoryUpdater, computeNewBaselines, detectRegressions };
```

- [ ] **Step 2: Run tests 1–5 to verify they pass**

```
node .claude/scripts/validate-phase-17-learning.js 2>&1 | grep -E "Test [1-5]|PASS|FAIL"
```

Expected: Tests 1–5 pass (scripts exist, syntax OK, pending file written, baseline math correct, regression detection correct).

- [ ] **Step 3: Commit**

```
git add .claude/scripts/memory-updater.js
git commit -m "feat: memory-updater.js — staged agent memory updates (Phase 17.1)"
```

---

## Task 3: cost-analyzer.js

**Files:**
- Create: `.claude/scripts/cost-analyzer.js`

- [ ] **Step 1: Write cost-analyzer.js**

```javascript
#!/usr/bin/env node
/**
 * Cost Analyzer — Phase 17.2
 *
 * Aggregates cost data from .claude/metrics/*/v1.0.0/outputs.json.
 * Detects cost spikes using 3× median threshold per agent.
 * Writes Vault/Logs/cost-report-YYYY-MM-DD.md
 *
 * CLI:
 *   node cost-analyzer.js [--agent architect] [--days 30] [--no-write]
 */

const fs   = require('fs');
const path = require('path');

const DEFAULT_METRICS_DIR = path.resolve(__dirname, '..', 'metrics');
const DEFAULT_LOG_DIR     = path.resolve(__dirname, '..', '..', 'Vault', 'Logs');

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Detect cost spikes: records where cost > 3× the agent's median cost.
 * @param {Array} records - all outputs.json records (any agents)
 * @returns {Array} spike records, each augmented with { medianCost, multiple }
 */
function detectSpikes(records) {
  // Group by agent
  const byAgent = {};
  for (const r of records) {
    const agent = r.agent_role || 'unknown';
    (byAgent[agent] = byAgent[agent] || []).push(r);
  }

  const spikes = [];
  for (const [agent, agentRecords] of Object.entries(byAgent)) {
    const costs  = agentRecords.map(r => r.performance?.cost_usd || 0).sort((a, b) => a - b);
    const median = costs[Math.floor(costs.length / 2)];
    if (median === 0) continue;
    for (const r of agentRecords) {
      const cost = r.performance?.cost_usd || 0;
      if (cost > 3 * median) {
        spikes.push({ ...r, medianCost: median, multiple: cost / median });
      }
    }
  }
  return spikes;
}

// ---------------------------------------------------------------------------
// CostAnalyzer class
// ---------------------------------------------------------------------------

class CostAnalyzer {
  constructor(metricsDir = DEFAULT_METRICS_DIR) {
    this.metricsDir = metricsDir;
  }

  /**
   * Load all outputs.json records from all agents.
   * @returns {Array} flat array of all records
   */
  loadAllRecords() {
    const records = [];
    if (!fs.existsSync(this.metricsDir)) return records;

    const agents = fs.readdirSync(this.metricsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const outputFile = path.join(this.metricsDir, agent, 'v1.0.0', 'outputs.json');
      if (!fs.existsSync(outputFile)) continue;
      try {
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        const arr  = Array.isArray(data) ? data : Object.values(data);
        records.push(...arr);
      } catch (e) {
        console.warn(`[CostAnalyzer] Could not parse ${outputFile}: ${e.message}`);
      }
    }
    return records;
  }

  /**
   * Build aggregation report from records.
   * @param {Array}  records
   * @param {number} days    - limit to last N days (0 = no limit)
   * @param {string} agent   - filter to one agent (null = all)
   */
  buildReport(records, { days = 30, agent = null } = {}) {
    // Filter
    let filtered = records;
    if (agent) filtered = filtered.filter(r => r.agent_role === agent);
    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      filtered = filtered.filter(r => r.timestamp >= cutoff);
    }

    if (filtered.length === 0) return { totalCost: 0, byAgent: {}, byDomain: {}, byDay: {}, spikes: [] };

    // Total
    const totalCost = filtered.reduce((s, r) => s + (r.performance?.cost_usd || 0), 0);

    // By agent
    const byAgent = {};
    for (const r of filtered) {
      const a = r.agent_role || 'unknown';
      if (!byAgent[a]) byAgent[a] = { total: 0, count: 0, costs: [] };
      byAgent[a].total += r.performance?.cost_usd || 0;
      byAgent[a].count++;
      byAgent[a].costs.push(r.performance?.cost_usd || 0);
    }
    for (const a of Object.keys(byAgent)) {
      const costs  = byAgent[a].costs.sort((x, y) => x - y);
      byAgent[a].median  = costs[Math.floor(costs.length / 2)];
      byAgent[a].average = byAgent[a].total / byAgent[a].count;
      delete byAgent[a].costs;
    }

    // By domain
    const byDomain = {};
    for (const r of filtered) {
      const d = r.domain || 'unknown';
      if (!byDomain[d]) byDomain[d] = { total: 0, count: 0 };
      byDomain[d].total += r.performance?.cost_usd || 0;
      byDomain[d].count++;
    }

    // By day
    const byDay = {};
    for (const r of filtered) {
      const day = (r.timestamp || '').slice(0, 10);
      if (!day) continue;
      byDay[day] = (byDay[day] || 0) + (r.performance?.cost_usd || 0);
    }

    const spikes = detectSpikes(filtered);

    return { totalCost, byAgent, byDomain, byDay, spikes, recordCount: filtered.length };
  }

  /**
   * Format report as markdown.
   * @param {Object} report - output of buildReport()
   * @param {Date}   date
   * @returns {string} markdown
   */
  formatReport(report, date) {
    const d    = date.toISOString().slice(0, 10);
    const fmt  = n => `$${n.toFixed(4)}`;
    const lines = [`# Cost Report — ${d}\n`];

    lines.push(`## Summary`);
    lines.push(`- **Total spend:** ${fmt(report.totalCost)}`);
    lines.push(`- **Records analyzed:** ${report.recordCount}`);
    lines.push(`- **Spikes detected:** ${report.spikes.length}\n`);

    lines.push(`## Per-Agent`);
    lines.push(`| Agent | Total | Records | Median/task | Avg/task |`);
    lines.push(`|-------|-------|---------|-------------|----------|`);
    for (const [a, s] of Object.entries(report.byAgent)) {
      lines.push(`| ${a} | ${fmt(s.total)} | ${s.count} | ${fmt(s.median)} | ${fmt(s.average)} |`);
    }
    lines.push('');

    lines.push(`## Per-Domain`);
    lines.push(`| Domain | Total | Records |`);
    lines.push(`|--------|-------|---------|`);
    for (const [d2, s] of Object.entries(report.byDomain)) {
      lines.push(`| ${d2} | ${fmt(s.total)} | ${s.count} |`);
    }
    lines.push('');

    lines.push(`## Daily Spend`);
    lines.push(`| Date | Total |`);
    lines.push(`|------|-------|`);
    for (const [day, total] of Object.entries(report.byDay).sort()) {
      lines.push(`| ${day} | ${fmt(total)} |`);
    }
    lines.push('');

    if (report.spikes.length > 0) {
      lines.push(`## ⚠️ Cost Spikes`);
      lines.push(`| ID | Agent | Domain | Date | Cost | Multiple of Median |`);
      lines.push(`|----|-------|--------|------|------|--------------------|`);
      for (const s of report.spikes) {
        const day = (s.timestamp || '').slice(0, 10);
        lines.push(`| ${s.id} | ${s.agent_role} | ${s.domain || '-'} | ${day} | ${fmt(s.performance.cost_usd)} | ${s.multiple.toFixed(1)}× |`);
      }
    } else {
      lines.push(`## Cost Spikes\nNone detected.`);
    }

    return lines.join('\n');
  }

  /**
   * Run full analysis and optionally write report.
   */
  analyze({ days = 30, agent = null, write = true, logDir = DEFAULT_LOG_DIR } = {}) {
    const records = this.loadAllRecords();
    const report  = this.buildReport(records, { days, agent });
    const now     = new Date();
    const md      = this.formatReport(report, now);

    if (write) {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const outPath = path.join(logDir, `cost-report-${now.toISOString().slice(0, 10)}.md`);
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`✅ Cost report written to ${outPath}`);
    } else {
      console.log(md);
    }

    return report;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args    = process.argv.slice(2);
  const noWrite = args.includes('--no-write');
  const days    = parseInt((args.find(a => a.startsWith('--days='))  || '').replace('--days=', '') ||
                           (args[args.indexOf('--days')  + 1])      || '30');
  const agent   = (args.find(a => a.startsWith('--agent=')) || '').replace('--agent=', '') ||
                  (args.includes('--agent') ? args[args.indexOf('--agent') + 1] : null);

  new CostAnalyzer().analyze({ days, agent, write: !noWrite });
}

module.exports = { CostAnalyzer, detectSpikes };
```

- [ ] **Step 2: Run tests 6–7**

```
node .claude/scripts/validate-phase-17-learning.js 2>&1 | grep -E "Test [6-7]|PASS|FAIL"
```

Expected: Tests 6 and 7 pass.

- [ ] **Step 3: Commit**

```
git add .claude/scripts/cost-analyzer.js
git commit -m "feat: cost-analyzer.js — outputs.json aggregation + spike detection (Phase 17.2)"
```

---

## Task 4: vault-auditor.js

**Files:**
- Create: `.claude/scripts/vault-auditor.js`

- [ ] **Step 1: Write vault-auditor.js**

```javascript
#!/usr/bin/env node
/**
 * Vault Auditor — Phase 17.6
 *
 * Three deterministic health checks:
 *   1. Stale docs — last_updated frontmatter > 30 days ago
 *   2. Known-Problems missing status field
 *   3. ADRs not referenced by any Fact in Vault/11-Facts/
 *
 * CLI:
 *   node vault-auditor.js [--no-write] [--stale-days 60]
 */

const fs   = require('fs');
const path = require('path');

const DEFAULT_VAULT_DIR = path.resolve(__dirname, '..', '..', 'Vault');
const DEFAULT_LOG_DIR   = path.resolve(__dirname, '..', '..', 'Vault', 'Logs');
const STALE_DAYS_DEFAULT = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)/);
    if (m) result[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return result;
}

function walkMd(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMd(full, results);
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

// ---------------------------------------------------------------------------
// VaultAuditor class
// ---------------------------------------------------------------------------

class VaultAuditor {
  constructor(vaultDir = DEFAULT_VAULT_DIR, staleDays = STALE_DAYS_DEFAULT) {
    this.vaultDir  = vaultDir;
    this.staleDays = staleDays;
  }

  /**
   * Check 1: Stale docs (last_updated frontmatter > staleDays ago).
   * Files without last_updated are skipped (not flagged).
   * @param {Date} now
   * @returns {string[]} relative paths of stale files
   */
  checkStaleDocs(now = new Date()) {
    const cutoff = new Date(now - this.staleDays * 24 * 60 * 60 * 1000);
    const stale  = [];

    for (const file of walkMd(this.vaultDir)) {
      try {
        const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
        if (!fm.last_updated) continue;
        const updated = new Date(fm.last_updated);
        if (isNaN(updated.getTime())) continue;
        if (updated < cutoff) stale.push(path.relative(this.vaultDir, file).replace(/\\/g, '/'));
      } catch { /* skip unreadable */ }
    }
    return stale;
  }

  /**
   * Check 2: Known-Problems missing status field.
   * @returns {string[]} relative paths missing status
   */
  checkMissingStatus() {
    const problemsDir = path.join(this.vaultDir, '10-Known-Problems');
    const missing = [];
    if (!fs.existsSync(problemsDir)) return missing;

    for (const file of fs.readdirSync(problemsDir).filter(f => f.endsWith('.md'))) {
      try {
        const fm = parseFrontmatter(fs.readFileSync(path.join(problemsDir, file), 'utf8'));
        if (!fm.status) missing.push(`10-Known-Problems/${file}`);
      } catch { /* skip */ }
    }
    return missing;
  }

  /**
   * Check 3: ADRs not referenced by any file in Vault/11-Facts/.
   * A reference is any occurrence of the ADR filename (without .md extension).
   * @returns {string[]} ADR filenames (without extension) that are unreferenced
   */
  checkUnreferencedAdrs() {
    const adrDir   = path.join(this.vaultDir, '07-Decisions');
    const factsDir = path.join(this.vaultDir, '11-Facts');
    if (!fs.existsSync(adrDir)) return [];

    // Build one big string of all Facts content for fast searching
    let factsContent = '';
    if (fs.existsSync(factsDir)) {
      for (const f of walkMd(factsDir)) {
        try { factsContent += fs.readFileSync(f, 'utf8') + '\n'; } catch {}
      }
    }

    const unreferenced = [];
    for (const file of fs.readdirSync(adrDir).filter(f => f.endsWith('.md'))) {
      const basename = file.replace(/\.md$/, '');
      if (!factsContent.includes(basename)) unreferenced.push(basename);
    }
    return unreferenced;
  }

  /**
   * Run all three checks.
   * @param {Date} now
   * @returns {{ staleDocs: string[], missingStatus: string[], unreferencedAdrs: string[] }}
   */
  run(now = new Date()) {
    return {
      staleDocs:        this.checkStaleDocs(now),
      missingStatus:    this.checkMissingStatus(),
      unreferencedAdrs: this.checkUnreferencedAdrs(),
    };
  }

  /**
   * Format the report object as markdown.
   * @param {{ staleDocs, missingStatus, unreferencedAdrs }} report
   * @param {Date} date
   * @returns {string}
   */
  formatReport(report, date) {
    const d     = date.toISOString().slice(0, 10);
    const icon  = n => n === 0 ? '✅' : '⚠️';
    const lines = [`# Vault Health Report — ${d}\n`];

    lines.push(`## Summary`);
    lines.push(`${icon(report.staleDocs.length)}        Check 1: Stale Docs (>${this.staleDays} days) — ${report.staleDocs.length} flagged`);
    lines.push(`${icon(report.missingStatus.length)}        Check 2: Known-Problems missing status — ${report.missingStatus.length} flagged`);
    lines.push(`${icon(report.unreferencedAdrs.length)}        Check 3: Unreferenced ADRs — ${report.unreferencedAdrs.length} flagged\n`);

    lines.push(`## Check 1: Stale Documents`);
    if (report.staleDocs.length === 0) {
      lines.push('No stale documents found.\n');
    } else {
      lines.push(`The following documents have not been updated in >${this.staleDays} days:\n`);
      report.staleDocs.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    lines.push(`## Check 2: Known-Problems Missing Status`);
    if (report.missingStatus.length === 0) {
      lines.push('All Known-Problem files have a status field.\n');
    } else {
      lines.push('The following files are missing a `status:` frontmatter field:\n');
      report.missingStatus.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    lines.push(`## Check 3: Unreferenced ADRs`);
    if (report.unreferencedAdrs.length === 0) {
      lines.push('All ADRs are referenced by at least one Fact.\n');
    } else {
      lines.push('The following ADRs are not referenced by any file in `Vault/11-Facts/`:\n');
      report.unreferencedAdrs.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Run all checks and optionally write the report.
   */
  audit({ write = true, logDir = DEFAULT_LOG_DIR } = {}) {
    const now    = new Date();
    const report = this.run(now);
    const md     = this.formatReport(report, now);

    if (write) {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const outPath = path.join(logDir, `vault-health-${now.toISOString().slice(0, 10)}.md`);
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`✅ Vault health report written to ${outPath}`);
    } else {
      console.log(md);
    }

    return report;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args      = process.argv.slice(2);
  const noWrite   = args.includes('--no-write');
  const staleDays = parseInt(
    (args.find(a => a.startsWith('--stale-days=')) || '').replace('--stale-days=', '') ||
    (args.includes('--stale-days') ? args[args.indexOf('--stale-days') + 1] : '') ||
    String(STALE_DAYS_DEFAULT)
  );

  new VaultAuditor(DEFAULT_VAULT_DIR, staleDays).audit({ write: !noWrite });
}

module.exports = { VaultAuditor };
```

- [ ] **Step 2: Run tests 8–9**

```
node .claude/scripts/validate-phase-17-learning.js 2>&1 | grep -E "Test [8-9]|PASS|FAIL"
```

Expected: Tests 8 and 9 pass.

- [ ] **Step 3: Commit**

```
git add .claude/scripts/vault-auditor.js
git commit -m "feat: vault-auditor.js — 3 deterministic vault health checks (Phase 17.6)"
```

---

## Task 5: Wire memory-updater into agent-orchestrator.js

**Files:**
- Modify: `.claude/scripts/agent-orchestrator.js`

- [ ] **Step 1: Add MemoryUpdater require at the top of agent-orchestrator.js**

After the existing requires (around line 18), add:

```javascript
const MemoryUpdater = require('./memory-updater');
```

- [ ] **Step 2: Instantiate in constructor**

In the `AgentOrchestrator` constructor, after `this.slackNotifier = new SlackNotifier();` (around line 27), add:

```javascript
this.memoryUpdater = new MemoryUpdater();
```

- [ ] **Step 3: Add hook in completeSubtask() after subtask.status = 'complete'**

In `completeSubtask()`, after `subtask.status = 'complete';` (around line 363), add:

```javascript
      // Phase 17.1: queue memory update (non-blocking)
      try {
        await this.memoryUpdater.recordOutcome({
          agent:  subtask.agent  || 'unknown',
          domain: task.domain   || 'general',
          scores: subtask.verificationResult || {},
        });
      } catch (muErr) {
        console.warn('[MemoryUpdater] Non-blocking error:', muErr.message);
      }
```

- [ ] **Step 4: Run test 10**

```
node .claude/scripts/validate-phase-17-learning.js 2>&1 | grep -E "Test 10|PASS|FAIL"
```

Expected: Test 10 passes.

- [ ] **Step 5: Run full validator**

```
node .claude/scripts/validate-phase-17-learning.js
```

Expected: 10 passed, 0 failed.

- [ ] **Step 6: Commit**

```
git add .claude/scripts/agent-orchestrator.js
git commit -m "feat: wire MemoryUpdater into completeSubtask() (Phase 17.1)"
```

---

## Task 6: Add to npm test chain

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add test:phase-17-learning script and append to test chains**

Open `package.json`. Add after `"test:phase-17"`:

```json
"test:phase-17-learning": "node ./.claude/scripts/validate-phase-17-learning.js",
```

In both `"test:all"` and `"test"` strings, append before the closing quote:

```
&& node ./.claude/scripts/validate-phase-17-learning.js
```

- [ ] **Step 2: Run full test suite**

```
npm test
```

Expected: all suites pass including the new Phase 17 learning suite at the end.

- [ ] **Step 3: Commit**

```
git add package.json
git commit -m "test: add validate-phase-17-learning.js to npm test chain"
```

---

## Self-Review

**Spec coverage:**
- ✅ 17.1 memory-updater.js — recordOutcome, pending file, 80/20 baseline, regression detection, CLI
- ✅ 17.1 completeSubtask() hook — Task 5
- ✅ 17.2 cost-analyzer.js — loadAllRecords, buildReport, spike detection (3× median), formatReport, CLI
- ✅ 17.6 vault-auditor.js — all 3 checks, formatReport, CLI with `--stale-days`
- ✅ validate-phase-17-learning.js — 10 tests covering all scripts + orchestrator integration
- ✅ package.json — test:phase-17-learning added, appended to test:all and test

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `computeNewBaselines(current, incoming)` — used in test4 ✅
- `detectRegressions(currentBaselines, newScores)` — used in test5 ✅
- `CostAnalyzer.loadAllRecords()` — used in test6 ✅
- `detectSpikes(records)` — used in test7 ✅
- `VaultAuditor.run()` → returns `{ staleDocs, missingStatus, unreferencedAdrs }` — used in test8 ✅
- `VaultAuditor.formatReport(report, date)` — used in test9 ✅
- `MemoryUpdater` in orchestrator — checked in test10 ✅
