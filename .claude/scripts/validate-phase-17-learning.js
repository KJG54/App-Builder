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
      const result = updater.recordOutcome({
        agent: 'architect',
        domain: 'api',
        scores: { compliance: 92, completeness: 82, security: 97, consistency: 73, documentation: 68 },
      });

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
