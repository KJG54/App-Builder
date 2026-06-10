#!/usr/bin/env node

/**
 * Phase 15 Validation Suite
 *
 * Purpose: Validate agent memory system, session handoff, and Vault seeding
 * Tests: 6 scenarios covering memory scripts, handoff extraction, and Vault structure
 *
 * Usage: node validate-phase-15.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');
const VAULT_DIR = path.join(ROOT, 'Vault');

class Phase15Validator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
  }

  // ── Test 1: Core scripts exist ────────────────────────────────────────────

  test1_CoreScriptsExist() {
    console.log('\n📋 Test 1: Phase 15 Core Scripts Exist');
    const required = ['seed-agent-memory.js', 'session-handoff.js'];
    for (const script of required) {
      const filePath = path.join(SCRIPTS_DIR, script);
      if (fs.existsSync(filePath)) {
        this.pass(`${script} exists`);
      } else {
        this.fail(`${script} not found at ${filePath}`);
      }
    }
  }

  // ── Test 2: seed-agent-memory.js syntax check ────────────────────────────

  test2_SeedAgentMemoryLoadable() {
    console.log('\n📋 Test 2: seed-agent-memory.js Syntax');
    this._syntaxCheck('seed-agent-memory.js');
  }

  // ── Test 3: session-handoff.js syntax check ───────────────────────────────

  test3_SessionHandoffLoadable() {
    console.log('\n📋 Test 3: session-handoff.js Syntax');
    this._syntaxCheck('session-handoff.js');
  }

  _syntaxCheck(scriptName) {
    const { execSync } = require('child_process');
    const filePath = path.join(SCRIPTS_DIR, scriptName);
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
      this.pass(`${scriptName} passes syntax check`);
    } catch (err) {
      this.fail(`${scriptName} has syntax errors: ${err.stderr ? err.stderr.toString() : err.message}`);
    }
  }

  // ── Test 4: Vault agent memory directories exist ──────────────────────────

  test4_VaultMemoryStructure() {
    console.log('\n📋 Test 4: Vault Agent Memory Structure');
    const expectedDirs = [
      path.join(VAULT_DIR, '01-Standards'),
      path.join(VAULT_DIR, '02-Technologies'),
      path.join(VAULT_DIR, '03-Projects'),
      path.join(VAULT_DIR, '05-Prompts'),
      path.join(VAULT_DIR, '08-Retrospectives'),
      path.join(VAULT_DIR, '10-Known-Problems'),
    ];
    let allPresent = true;
    for (const dir of expectedDirs) {
      if (!fs.existsSync(dir)) {
        this.fail(`Expected Vault directory missing: ${path.relative(ROOT, dir)}`);
        allPresent = false;
      }
    }
    if (allPresent) {
      this.pass(`All ${expectedDirs.length} required Vault directories present`);
    }
  }

  // ── Test 5: At least one session summary exists in Vault/08-Retrospectives ─

  test5_SessionSummaryExists() {
    console.log('\n📋 Test 5: Session Summaries in Vault');
    const retroDir = path.join(VAULT_DIR, '08-Retrospectives');
    if (!fs.existsSync(retroDir)) {
      this.fail('Vault/08-Retrospectives/ does not exist');
      return;
    }
    const files = fs.readdirSync(retroDir).filter(f => f.endsWith('.md'));
    if (files.length > 0) {
      this.pass(`${files.length} session summary file(s) in Vault/08-Retrospectives/`);
    } else {
      this.fail('No session summary .md files found in Vault/08-Retrospectives/');
    }
  }

  // ── Test 6: Known-Problems Vault files have correct frontmatter casing ─────

  test6_KnownProblemsMetadata() {
    console.log('\n📋 Test 6: Known-Problems Frontmatter Casing');
    const kpDir = path.join(VAULT_DIR, '10-Known-Problems');
    if (!fs.existsSync(kpDir)) {
      this.pass('Vault/10-Known-Problems/ not yet populated (acceptable)');
      return;
    }
    const files = fs.readdirSync(kpDir).filter(f => f.endsWith('.md'));
    if (files.length === 0) {
      this.pass('No Known-Problem files yet (acceptable)');
      return;
    }
    let violations = 0;
    for (const file of files) {
      const content = fs.readFileSync(path.join(kpDir, file), 'utf8');
      const typeMatch = content.match(/^type:\s*(.+)$/m);
      const statusMatch = content.match(/^status:\s*(.+)$/m);
      if (typeMatch && typeMatch[1].trim() !== typeMatch[1].trim().toLowerCase()) {
        this.fail(`${file}: type value not lowercase (got "${typeMatch[1].trim()}")`);
        violations++;
      }
      if (statusMatch && statusMatch[1].trim() !== statusMatch[1].trim().toLowerCase()) {
        this.fail(`${file}: status value not lowercase (got "${statusMatch[1].trim()}")`);
        violations++;
      }
    }
    if (violations === 0) {
      this.pass(`${files.length} Known-Problem file(s) — all frontmatter values are lowercase`);
    }
  }

  // ── Runner ────────────────────────────────────────────────────────────────

  runAll() {
    console.log('🚀 Phase 15 Validation Suite');
    console.log('========================================');

    this.test1_CoreScriptsExist();
    this.test2_SeedAgentMemoryLoadable();
    this.test3_SessionHandoffLoadable();
    this.test4_VaultMemoryStructure();
    this.test5_SessionSummaryExists();
    this.test6_KnownProblemsMetadata();

    console.log('\n========================================');
    console.log('📊 Test Results Summary');
    console.log(`   ✅ Passed: ${this.passCount}`);
    console.log(`   ❌ Failed: ${this.failCount}`);
    const total = this.passCount + this.failCount;
    if (total > 0) {
      console.log(`   📈 Success Rate: ${((this.passCount / total) * 100).toFixed(1)}%`);
    }
    console.log('========================================\n');

    if (this.failCount === 0) {
      console.log('🎉 All tests passed! Phase 15 validated.\n');
      return 0;
    } else {
      console.log(`⚠️  ${this.failCount} test(s) failed. See details above.\n`);
      return 1;
    }
  }

  pass(msg) { this.passCount++; console.log(`   ✅ ${msg}`); }
  fail(msg) { this.failCount++; console.log(`   ❌ ${msg}`); }
}

if (require.main === module) {
  const v = new Phase15Validator();
  process.exit(v.runAll());
}

module.exports = Phase15Validator;
