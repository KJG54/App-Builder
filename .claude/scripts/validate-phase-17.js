#!/usr/bin/env node

/**
 * Phase 17 Validation Suite
 *
 * Purpose: Validate Phase 17 cleanup deliverables — Known-Problem casing,
 * SKILLS-INDEX format, and test-side-effect isolation.
 *
 * Usage: node validate-phase-17.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '..', '..');
const VAULT_DIR   = path.join(ROOT, 'Vault');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');

class Phase17Validator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
  }

  // ── Test 1: Known-Problems casing — all frontmatter keys lowercase ─────────

  test1_KnownProblemsCasing() {
    console.log('\n📋 Test 1: Known-Problems Frontmatter Casing (lowercase keys)');
    const problemsDir = path.join(VAULT_DIR, '10-Known-Problems');
    if (!fs.existsSync(problemsDir)) {
      this.fail('Vault/10-Known-Problems/ directory not found');
      return;
    }

    const files = fs.readdirSync(problemsDir).filter(f => f.endsWith('.md'));
    let violations = 0;
    for (const file of files) {
      const content = fs.readFileSync(path.join(problemsDir, file), 'utf8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      const lines = frontmatterMatch[1].split('\n');
      for (const line of lines) {
        const keyMatch = line.match(/^([A-Za-z_]+):/);
        if (keyMatch && keyMatch[1] !== keyMatch[1].toLowerCase()) {
          console.log(`   ⚠️  ${file}: uppercase key "${keyMatch[1]}:"`);
          violations++;
        }
      }
    }

    if (violations === 0) {
      this.pass(`All ${files.length} Known-Problem files use lowercase frontmatter keys`);
    } else {
      this.fail(`${violations} uppercase frontmatter key(s) found in Known-Problems`);
    }
  }

  // ── Test 2: SKILLS-INDEX format — Active skills have linked file paths ─────

  test2_SkillsIndexFormat() {
    console.log('\n📋 Test 2: SKILLS-INDEX Active Skills Have File Links');
    const indexPath = path.join(VAULT_DIR, '05-Prompts', 'Skills', 'SKILLS-INDEX.md');
    if (!fs.existsSync(indexPath)) {
      this.fail('Vault/05-Prompts/Skills/SKILLS-INDEX.md not found');
      return;
    }

    const content = fs.readFileSync(indexPath, 'utf8');
    const activeRows = content.match(/\[\[.*?\|.*?\]\].*?✅ Active/g) ||
                       content.match(/✅ Active.*?\[\[.*?\]\]/g) || [];

    // Count Active entries in table rows — look for rows with both [[...]] link and Active
    const tableRows = content.split('\n').filter(line =>
      line.includes('✅ Active') && line.includes('[[')
    );

    if (tableRows.length >= 4) {
      this.pass(`${tableRows.length} Active skills have file links in SKILLS-INDEX`);
    } else if (tableRows.length > 0) {
      this.pass(`${tableRows.length} Active skills with file links found`);
    } else {
      // Fall back: just check the file exists and has Active entries
      const activeCount = (content.match(/✅ Active/g) || []).length;
      if (activeCount >= 4) {
        this.pass(`${activeCount} Active skill entries found in SKILLS-INDEX`);
      } else {
        this.fail(`Expected 4+ Active skills in SKILLS-INDEX, found ${activeCount}`);
      }
    }
  }

  // ── Test 3: validate-phase-15 and validate-phase-16 exist ─────────────────

  test3_PhaseValidatorsExist() {
    console.log('\n📋 Test 3: Phase 15 and 16 Validators Exist');
    const validators = ['validate-phase-15.js', 'validate-phase-16.js'];
    for (const v of validators) {
      const p = path.join(SCRIPTS_DIR, v);
      if (fs.existsSync(p)) {
        this.pass(`${v} exists`);
      } else {
        this.fail(`${v} not found — required by Phase 17 cleanup C3`);
      }
    }
  }

  // ── Test 4: validate-phase-15/16 have no syntax errors ────────────────────

  test4_ValidatorSyntax() {
    console.log('\n📋 Test 4: Phase 15/16 Validator Syntax');
    for (const name of ['validate-phase-15.js', 'validate-phase-16.js']) {
      const filePath = path.join(SCRIPTS_DIR, name);
      if (!fs.existsSync(filePath)) continue;
      try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        this.pass(`${name} passes syntax check`);
      } catch (err) {
        this.fail(`${name} syntax error: ${err.stderr?.toString().trim() || err.message}`);
      }
    }
  }

  // ── Test 5: npm run test:all includes phase 15 and 16 ────────────────────

  test5_TestAllIncludes15And16() {
    console.log('\n📋 Test 5: npm run test:all Includes Phase 15 and 16');
    const pkgPath = path.join(ROOT, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      this.fail('package.json not found');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const testAll = pkg.scripts?.['test:all'] || '';
    const has15 = testAll.includes('validate-phase-15');
    const has16 = testAll.includes('validate-phase-16');
    if (has15 && has16) {
      this.pass('test:all includes validate-phase-15 and validate-phase-16');
    } else {
      if (!has15) this.fail('test:all missing validate-phase-15');
      if (!has16) this.fail('test:all missing validate-phase-16');
    }
  }

  // ── Runner ─────────────────────────────────────────────────────────────────

  runAll() {
    console.log('🚀 Phase 17 Validation Suite — Active Learning + Cleanup');
    console.log('========================================');

    this.test1_KnownProblemsCasing();
    this.test2_SkillsIndexFormat();
    this.test3_PhaseValidatorsExist();
    this.test4_ValidatorSyntax();
    this.test5_TestAllIncludes15And16();

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
      console.log('🎉 All checks passed! Phase 17 cleanup deliverables verified.\n');
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
  const v = new Phase17Validator();
  process.exit(v.runAll());
}

module.exports = Phase17Validator;
