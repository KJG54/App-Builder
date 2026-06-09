#!/usr/bin/env node

/**
 * Phase 14 Vault Validator Test Suite
 * Validates YAML frontmatter parsing and enforcement
 */

const { VaultValidator, REQUIRED_FIELDS, VALID_TYPES, VALID_STATUSES } = require('./vault-validator');

class Phase14ValidatorTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.validator = new VaultValidator('Vault');
  }

  /**
   * Test: Parse valid frontmatter
   */
  testParseFrontmatter() {
    console.log('\n📋 Test: Parse YAML Frontmatter');
    try {
      const content = `---
type: guide
status: active
last_updated: 2026-06-09
author: Test-Agent
---

# Document Body
This is the content.`;

      const parsed = this.validator.parseFrontmatter(content);
      this.assert(parsed.hasFrontmatter === true, 'Detected frontmatter');
      this.assert(parsed.frontmatter.type === 'guide', 'Parsed type field');
      this.assert(parsed.frontmatter.status === 'active', 'Parsed status field');
      this.assert(parsed.body.includes('Document Body'), 'Parsed body correctly');
    } catch (error) {
      this.fail(`Parse frontmatter: ${error.message}`);
    }
  }

  /**
   * Test: Validate correct frontmatter
   */
  testValidateFrontmatter() {
    console.log('\n📋 Test: Validate Valid Frontmatter');
    try {
      const validFM = {
        type: 'spec',
        status: 'active',
        last_updated: '2026-06-09'
      };

      const result = this.validator.validateFrontmatter(validFM);
      this.assert(result.isValid === true, 'Valid frontmatter accepted');
      this.assert(result.errors.length === 0, 'No errors in valid frontmatter');
    } catch (error) {
      this.fail(`Validate valid frontmatter: ${error.message}`);
    }
  }

  /**
   * Test: Reject missing required fields
   */
  testMissingRequiredFields() {
    console.log('\n📋 Test: Reject Missing Required Fields');
    try {
      const invalidFM = { type: 'guide' }; // Missing status and last_updated

      const result = this.validator.validateFrontmatter(invalidFM);
      this.assert(result.isValid === false, 'Invalid frontmatter rejected');
      this.assert(result.errors.length > 0, 'Errors reported');
      this.assert(result.errors.some(e => e.includes('status')), 'Missing status detected');
    } catch (error) {
      this.fail(`Missing fields test: ${error.message}`);
    }
  }

  /**
   * Test: Reject invalid type values
   */
  testInvalidType() {
    console.log('\n📋 Test: Reject Invalid Type Values');
    try {
      const invalidFM = {
        type: 'invalid_type',
        status: 'active',
        last_updated: '2026-06-09'
      };

      const result = this.validator.validateFrontmatter(invalidFM);
      this.assert(result.isValid === false, 'Invalid type rejected');
      this.assert(result.errors.some(e => e.includes('type')), 'Type validation error');
    } catch (error) {
      this.fail(`Invalid type test: ${error.message}`);
    }
  }

  /**
   * Test: Reject invalid date format
   */
  testInvalidDateFormat() {
    console.log('\n📋 Test: Reject Invalid Date Format');
    try {
      const invalidFM = {
        type: 'guide',
        status: 'active',
        last_updated: 'June 9 2026' // Invalid format
      };

      const result = this.validator.validateFrontmatter(invalidFM);
      this.assert(result.isValid === false, 'Invalid date format rejected');
      this.assert(result.errors.some(e => e.includes('last_updated')), 'Date format error');
    } catch (error) {
      this.fail(`Invalid date test: ${error.message}`);
    }
  }

  /**
   * Test: Generate default frontmatter
   */
  testGenerateFrontmatter() {
    console.log('\n📋 Test: Generate Default Frontmatter');
    try {
      const fm = this.validator.generateFrontmatter({
        type: 'decision',
        status: 'draft'
      });

      this.assert(fm.startsWith('---'), 'Frontmatter starts with ---');
      this.assert(fm.includes('type:'), 'Contains type field');
      this.assert(fm.includes('decision'), 'Contains correct type value');
    } catch (error) {
      this.fail(`Generate frontmatter: ${error.message}`);
    }
  }

  /**
   * Test: Auto-migrate document without frontmatter
   */
  testAutoMigration() {
    console.log('\n📋 Test: Auto-Migrate Document Without Frontmatter');
    try {
      const rawContent = '# My Document\n\nThis has no frontmatter.';
      const migrated = this.validator.autoMigrate(rawContent);

      this.assert(migrated.startsWith('---'), 'Migrated content starts with ---');
      this.assert(migrated.includes('# My Document'), 'Original content preserved');
      this.assert(migrated.includes('type:'), 'Frontmatter added');

      // Parse the migrated content
      const parsed = this.validator.parseFrontmatter(migrated);
      this.assert(parsed.hasFrontmatter === true, 'Migrated content has frontmatter');
      this.assert(parsed.body.includes('My Document'), 'Body preserved after migration');
    } catch (error) {
      this.fail(`Auto-migration: ${error.message}`);
    }
  }

  /**
   * Test: Detect content without frontmatter
   */
  testDetectMissingFrontmatter() {
    console.log('\n📋 Test: Detect Missing Frontmatter');
    try {
      const content = '# Document\n\nNo frontmatter here.';
      const parsed = this.validator.parseFrontmatter(content);

      this.assert(parsed.hasFrontmatter === false, 'Missing frontmatter detected');
      this.assert(parsed.frontmatter === null, 'No frontmatter object');
      this.assert(parsed.body === content, 'Full content treated as body');
    } catch (error) {
      this.fail(`Detect missing frontmatter: ${error.message}`);
    }
  }

  /**
   * Test: All valid type values
   */
  testValidTypes() {
    console.log('\n📋 Test: All Valid Type Values');
    try {
      VALID_TYPES.forEach(type => {
        const fm = {
          type,
          status: 'active',
          last_updated: '2026-06-09'
        };
        const result = this.validator.validateFrontmatter(fm);
        this.assert(result.isValid === true, `Type "${type}" valid`);
      });
    } catch (error) {
      this.fail(`Valid types test: ${error.message}`);
    }
  }

  /**
   * Test: All valid status values
   */
  testValidStatuses() {
    console.log('\n📋 Test: All Valid Status Values');
    try {
      VALID_STATUSES.forEach(status => {
        const fm = {
          type: 'guide',
          status,
          last_updated: '2026-06-09'
        };
        const result = this.validator.validateFrontmatter(fm);
        this.assert(result.isValid === true, `Status "${status}" valid`);
      });
    } catch (error) {
      this.fail(`Valid statuses test: ${error.message}`);
    }
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  assert(condition, message) {
    if (condition) {
      this.pass(message);
    } else {
      this.fail(message);
    }
  }

  pass(message) {
    console.log(`  ✓ ${message}`);
    this.testsPassed++;
  }

  fail(message) {
    console.error(`  ✗ ${message}`);
    this.testsFailed++;
  }

  // ============================================================================
  // Test Runner
  // ============================================================================

  runAllTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║      Phase 14 Vault Validator Test Suite             ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    this.testParseFrontmatter();
    this.testValidateFrontmatter();
    this.testMissingRequiredFields();
    this.testInvalidType();
    this.testInvalidDateFormat();
    this.testGenerateFrontmatter();
    this.testAutoMigration();
    this.testDetectMissingFrontmatter();
    this.testValidTypes();
    this.testValidStatuses();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log(`║  Results: ${this.testsPassed} passed, ${this.testsFailed} failed           ║`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    return this.testsFailed === 0 ? 0 : 1;
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  const tester = new Phase14ValidatorTests();
  const exitCode = tester.runAllTests();
  process.exit(exitCode);
}

module.exports = Phase14ValidatorTests;
