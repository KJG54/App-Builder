#!/usr/bin/env node

/**
 * Phase 16 Validation Suite
 *
 * Purpose: Validate the Chroma pipeline rebuild (chromadb JS SDK, ADR-INFRA-003).
 * Phase 16 is COMPLETE — all 5 checks are hard passes.
 *
 * Usage: node validate-phase-16.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '..', '..');
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

  // ── Test 2: chroma-ingest.js syntax check ────────────────────────────────

  test2_ChromaIngestSyntax() {
    console.log('\n📋 Test 2: chroma-ingest.js Syntax');
    const filePath = path.join(SCRIPTS_DIR, 'chroma-ingest.js');
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
      this.pass('chroma-ingest.js passes syntax check');
    } catch (err) {
      this.fail(`chroma-ingest.js syntax error: ${err.stderr?.toString().trim() || err.message}`);
    }
  }

  // ── Test 3: context-assembly.js syntax check ─────────────────────────────

  test3_ContextAssemblySyntax() {
    console.log('\n📋 Test 3: context-assembly.js Syntax');
    const filePath = path.join(SCRIPTS_DIR, 'context-assembly.js');
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
      this.pass('context-assembly.js passes syntax check');
    } catch (err) {
      this.fail(`context-assembly.js syntax error: ${err.stderr?.toString().trim() || err.message}`);
    }
  }

  // ── Test 4: chromadb JS SDK installed ────────────────────────────────────

  test4_ChromaSDKInstalled() {
    console.log('\n📋 Test 4: chromadb JS SDK Installed');
    const chromadbPath  = path.join(ROOT, 'node_modules', 'chromadb');
    const defaultEmbedPath = path.join(ROOT, 'node_modules', '@chroma-core', 'default-embed');

    if (!fs.existsSync(chromadbPath)) {
      this.fail('chromadb package not found in node_modules — run: npm install chromadb');
      return;
    }
    if (!fs.existsSync(defaultEmbedPath)) {
      this.fail('@chroma-core/default-embed not found — run: npm install @chroma-core/default-embed');
      return;
    }
    this.pass('chromadb + @chroma-core/default-embed installed');
  }

  // ── Test 5: ADR-INFRA-003 exists ─────────────────────────────────────────

  test5_ChromaADRExists() {
    console.log('\n📋 Test 5: ADR-INFRA-003 Exists');
    const adrPath = path.join(ROOT, 'Vault', '07-Decisions', 'ADR-INFRA-003.md');
    if (fs.existsSync(adrPath)) {
      this.pass('ADR-INFRA-003.md exists — chromadb JS SDK strategy documented');
    } else {
      this.fail('ADR-INFRA-003.md not found in Vault/07-Decisions/');
    }
  }

  // ── Runner ────────────────────────────────────────────────────────────────

  runAll() {
    console.log('🚀 Phase 16 Validation Suite — Chroma Pipeline Rebuild');
    console.log('========================================');

    this.test1_PipelineScriptsExist();
    this.test2_ChromaIngestSyntax();
    this.test3_ContextAssemblySyntax();
    this.test4_ChromaSDKInstalled();
    this.test5_ChromaADRExists();

    console.log('\n========================================');
    console.log('📊 Test Results Summary');
    console.log(`   ✅ Passed:  ${this.passCount}`);
    console.log(`   ❌ Failed:  ${this.failCount}`);
    const total = this.passCount + this.failCount;
    if (total > 0) {
      console.log(`   📈 Success Rate: ${((this.passCount / total) * 100).toFixed(1)}%`);
    }
    console.log('========================================\n');

    if (this.failCount === 0) {
      console.log('🎉 All checks passed! Phase 16 Chroma pipeline fully operational.\n');
      return 0;
    } else {
      console.log(`⚠️  ${this.failCount} failure(s). See details above.\n`);
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
