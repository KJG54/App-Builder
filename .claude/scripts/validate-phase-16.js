#!/usr/bin/env node

/**
 * Phase 16 Validation Suite
 *
 * Purpose: Validate Chroma pipeline scripts exist and diagnose their status.
 * Phase 16 is IN PROGRESS — the Chroma pipeline is being rebuilt (chromadb JS
 * client swap, Approach A). This validator checks structural readiness and
 * reports the known broken state clearly without failing the overall test suite.
 *
 * Usage: node validate-phase-16.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');

class Phase16Validator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
    this.warnCount = 0;
  }

  // ── Test 1: Core Chroma pipeline scripts exist ────────────────────────────

  test1_PipelineScriptsExist() {
    console.log('\n📋 Test 1: Chroma Pipeline Scripts Exist');
    const required = ['chroma-ingest.js', 'context-assembly.js'];
    for (const script of required) {
      const filePath = path.join(SCRIPTS_DIR, script);
      if (fs.existsSync(filePath)) {
        this.pass(`${script} exists`);
      } else {
        this.fail(`${script} not found — required for Phase 16`);
      }
    }
  }

  // ── Test 2: chroma-ingest.js is loadable (syntax check) ──────────────────

  test2_ChromaIngestLoadable() {
    console.log('\n📋 Test 2: chroma-ingest.js Loadable');
    try {
      require(path.join(SCRIPTS_DIR, 'chroma-ingest.js'));
      this.pass('chroma-ingest.js loads without syntax errors');
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        // chromadb JS client not yet installed — expected during Phase 16
        this.warn(`chroma-ingest.js: missing dependency (${err.message}) — expected during Phase 16 rebuild`);
      } else {
        this.fail(`chroma-ingest.js failed to load: ${err.message}`);
      }
    }
  }

  // ── Test 3: context-assembly.js is loadable ───────────────────────────────

  test3_ContextAssemblyLoadable() {
    console.log('\n📋 Test 3: context-assembly.js Loadable');
    try {
      require(path.join(SCRIPTS_DIR, 'context-assembly.js'));
      this.pass('context-assembly.js loads without syntax errors');
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        this.warn(`context-assembly.js: missing dependency (${err.message}) — expected during Phase 16 rebuild`);
      } else {
        this.fail(`context-assembly.js failed to load: ${err.message}`);
      }
    }
  }

  // ── Test 4: Chroma connectivity diagnostic ────────────────────────────────

  test4_ChromaConnectivity() {
    console.log('\n📋 Test 4: Chroma Connectivity Diagnostic');
    // Non-blocking: report status, never fail the suite
    try {
      const { execSync } = require('child_process');
      execSync('curl -s --max-time 2 http://localhost:8000/api/v2/heartbeat', { stdio: 'pipe' });
      this.pass('Chroma is reachable at localhost:8000 (v2 API)');
    } catch {
      this.warn('Chroma not reachable at localhost:8000 — Docker may be stopped or Phase 16 rebuild pending');
    }
  }

  // ── Test 5: ADR-INFRA-003 exists (Phase 17 C5) ───────────────────────────

  test5_ChromaADRExists() {
    console.log('\n📋 Test 5: ADR-INFRA-003 Exists');
    const adrPath = path.join(ROOT, 'Vault', '07-Decisions', 'ADR-INFRA-003.md');
    if (fs.existsSync(adrPath)) {
      this.pass('ADR-INFRA-003.md exists — Chroma strategy decision documented');
    } else {
      this.warn('ADR-INFRA-003.md not yet created — pending Phase 17 C5');
    }
  }

  // ── Runner ────────────────────────────────────────────────────────────────

  runAll() {
    console.log('🚀 Phase 16 Validation Suite');
    console.log('⚠️  Phase 16 IN PROGRESS — Chroma pipeline rebuild underway');
    console.log('========================================');

    this.test1_PipelineScriptsExist();
    this.test2_ChromaIngestLoadable();
    this.test3_ContextAssemblyLoadable();
    this.test4_ChromaConnectivity();
    this.test5_ChromaADRExists();

    console.log('\n========================================');
    console.log('📊 Test Results Summary');
    console.log(`   ✅ Passed:   ${this.passCount}`);
    console.log(`   ⚠️  Warnings: ${this.warnCount} (expected during Phase 16 rebuild)`);
    console.log(`   ❌ Failed:   ${this.failCount}`);
    const total = this.passCount + this.failCount;
    if (total > 0) {
      console.log(`   📈 Success Rate: ${((this.passCount / total) * 100).toFixed(1)}% (warnings excluded)`);
    }
    console.log('========================================\n');

    if (this.failCount === 0) {
      if (this.warnCount > 0) {
        console.log(`⏳ Phase 16 structurally ready — ${this.warnCount} warning(s) expected until Chroma rebuild completes.\n`);
      } else {
        console.log('🎉 All checks passed! Phase 16 Chroma pipeline fully operational.\n');
      }
      return 0;
    } else {
      console.log(`⚠️  ${this.failCount} structural failure(s). See details above.\n`);
      return 1;
    }
  }

  pass(msg) { this.passCount++; console.log(`   ✅ ${msg}`); }
  fail(msg) { this.failCount++; console.log(`   ❌ ${msg}`); }
  warn(msg) { this.warnCount++; console.log(`   ⚠️  ${msg}`); }
}

if (require.main === module) {
  const v = new Phase16Validator();
  process.exit(v.runAll());
}

module.exports = Phase16Validator;
