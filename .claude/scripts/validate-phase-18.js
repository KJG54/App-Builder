#!/usr/bin/env node

/**
 * Phase 18 Validation Suite
 *
 * Purpose: Validate Phase 18 build pipeline deliverables — scaffold-project.js,
 * build-runner.js, ship-project.js existence and syntax, and GETTING-STARTED guide.
 *
 * Usage: node validate-phase-18.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');
const VAULT_DIR   = path.join(ROOT, 'Vault');

class Phase18Validator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
  }

  // ── Test 1: Core build pipeline scripts exist ─────────────────────────────

  test1_PipelineScriptsExist() {
    console.log('\n📋 Test 1: Build Pipeline Scripts Exist');
    const required = ['scaffold-project.js', 'build-runner.js', 'ship-project.js'];
    for (const script of required) {
      const filePath = path.join(SCRIPTS_DIR, script);
      if (fs.existsSync(filePath)) {
        this.pass(`${script} exists`);
      } else {
        this.fail(`${script} not found — required for Phase 18`);
      }
    }
  }

  // ── Test 2: Syntax checks for all three pipeline scripts ─────────────────

  test2_PipelineScriptSyntax() {
    console.log('\n📋 Test 2: Build Pipeline Script Syntax');
    const scripts = ['scaffold-project.js', 'build-runner.js', 'ship-project.js'];
    for (const script of scripts) {
      const filePath = path.join(SCRIPTS_DIR, script);
      if (!fs.existsSync(filePath)) continue;
      try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        this.pass(`${script} passes syntax check`);
      } catch (err) {
        this.fail(`${script} syntax error: ${err.stderr?.toString().trim() || err.message}`);
      }
    }
  }

  // ── Test 3: npm scripts for scaffold/build/ship exist ─────────────────────

  test3_NpmScriptsExist() {
    console.log('\n📋 Test 3: npm Scripts for Pipeline Commands');
    const pkgPath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      this.fail('package.json not found');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts || {};
    for (const cmd of ['scaffold', 'build', 'ship']) {
      if (scripts[cmd]) {
        this.pass(`npm run ${cmd} defined`);
      } else {
        this.fail(`npm run ${cmd} not defined in package.json`);
      }
    }
  }

  // ── Test 4: GETTING-STARTED.md exists ────────────────────────────────────

  test4_GettingStartedExists() {
    console.log('\n📋 Test 4: GETTING-STARTED.md Exists');
    const docPath = path.join(ROOT, 'GETTING-STARTED.md');
    if (fs.existsSync(docPath)) {
      const size = fs.statSync(docPath).size;
      this.pass(`GETTING-STARTED.md exists (${(size / 1024).toFixed(1)}KB)`);
    } else {
      this.fail('GETTING-STARTED.md not found in project root');
    }
  }

  // ── Test 5: Phase plan generator skill exists ─────────────────────────────

  test5_PhasePlanGeneratorSkillExists() {
    console.log('\n📋 Test 5: Phase Plan Generator Skill Exists');
    const skillPath = path.join(
      VAULT_DIR, '05-Prompts', 'Skills', 'Cross-Cutting',
      'phase-plan-generator-v1.0.md'
    );
    if (fs.existsSync(skillPath)) {
      this.pass('phase-plan-generator-v1.0.md skill file exists');
    } else {
      this.fail('phase-plan-generator-v1.0.md not found in Vault/05-Prompts/Skills/Cross-Cutting/');
    }
  }

  // ── Test 6: validate-phase-17 and validate-phase-18 in test:all ──────────

  test6_TestAllIncludes17And18() {
    console.log('\n📋 Test 6: npm run test:all Includes Phase 17 and 18');
    const pkgPath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      this.fail('package.json not found');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const testAll = pkg.scripts?.['test:all'] || '';
    const has17 = testAll.includes('validate-phase-17');
    const has18 = testAll.includes('validate-phase-18');
    if (has17 && has18) {
      this.pass('test:all includes validate-phase-17 and validate-phase-18');
    } else {
      if (!has17) this.fail('test:all missing validate-phase-17');
      if (!has18) this.fail('test:all missing validate-phase-18');
    }
  }

  // ── Runner ─────────────────────────────────────────────────────────────────

  runAll() {
    console.log('🚀 Phase 18 Validation Suite — Project Build Pipeline');
    console.log('========================================');

    this.test1_PipelineScriptsExist();
    this.test2_PipelineScriptSyntax();
    this.test3_NpmScriptsExist();
    this.test4_GettingStartedExists();
    this.test5_PhasePlanGeneratorSkillExists();
    this.test6_TestAllIncludes17And18();

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
      console.log('🎉 All checks passed! Phase 18 build pipeline fully operational.\n');
      return 0;
    } else {
      console.log(`⚠️  ${this.failCount} failure(s). See details above.\n`);
      return 1;
    }
  }

  pass(msg) { this.passCount++; console.log(`   ✅ ${msg}`); }
  fail(msg) { this.failCount++; console.log(`   ❌ ${msg}`); }
}

if (require.main === module) {
  const v = new Phase18Validator();
  process.exit(v.runAll());
}

module.exports = Phase18Validator;
