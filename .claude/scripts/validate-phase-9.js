#!/usr/bin/env node

/**
 * Phase 9 Validation & Testing Suite
 *
 * Purpose: Validate that prompt versioning and metrics systems work correctly
 * Tests: 5 scenarios covering metrics, versioning, A/B testing
 *
 * Usage: node validate-phase-9.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const MetricsCollector = require('./metrics-collector.js');
const PromptVersionManager = require('./prompt-version-manager.js');
const ABTestRunner = require('./ab-test-runner.js');

class Phase9Validator {
  constructor() {
    // Isolated temp dir prevents cross-run metric accumulation
    this.testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase9-test-'));
    this.collector = new MetricsCollector(this.testDir);
    this.manager = new PromptVersionManager();
    this.runner = new ABTestRunner(this.testDir);
    this.passCount = 0;
    this.failCount = 0;
  }

  cleanup() {
    try { fs.rmSync(this.testDir, { recursive: true, force: true }); } catch {}
  }

  /**
   * Test 1: Metrics Collection
   */
  test1_MetricsCollection() {
    console.log("\n📋 Test 1: Metrics Collection");
    try {
      // Record a sample output
      const output = {
        agentRole: 'architect',
        promptVersion: 'architect-v1.0.0',
        input: 'Design a REST API for user management',
        domain: 'api',
      };

      const verification = {
        status: 'APPROVED',
        summary: { critical: 0, major: 0, minor: 2 },
      };

      const performance = {
        responsetime_ms: 2340,
        token_usage: 1920,
        cost_usd: 0.055,
      };

      const outputId = this.collector.recordOutput(output, verification, performance);

      this.assert(outputId, "Should generate output ID");

      // Get aggregate metrics
      const metrics = this.collector.getAggregateMetrics('architect-v1.0.0');

      this.assert(metrics.total_outputs === 1, "Should have 1 output recorded");
      this.assert(metrics.success_rate === 1, "Success rate should be 100%");
      this.assert(metrics.avg_compliance_score > 80, "Compliance score should be >80");

      this.pass("Metrics recorded and aggregated correctly");
    } catch (error) {
      this.fail(`Metrics collection failed: ${error.message}`);
    }
  }

  /**
   * Test 2: Version History Tracking
   */
  test2_VersionHistoryTracking() {
    console.log("\n📋 Test 2: Version History Tracking");
    try {
      // Get active version
      const activeVersion = this.manager.getActiveVersion('architect');

      this.assert(activeVersion, "Should have active version");
      this.assert(activeVersion.status === 'active', "Status should be 'active'");
      this.assert(activeVersion.version.includes('v'), "Version should include 'v'");

      // List versions
      const versions = this.manager.listVersions('architect');

      this.assert(versions.length > 0, "Should have at least one version");
      this.assert(versions[0].version, "Version should have version field");

      this.pass("Version history tracking working: " + versions.length + " versions");
    } catch (error) {
      this.fail(`Version tracking failed: ${error.message}`);
    }
  }

  /**
   * Test 3: A/B Test Creation and Execution
   */
  test3_ABTestExecution() {
    console.log("\n📋 Test 3: A/B Test Execution");
    try {
      // Create test
      const scenarios = [
        { name: 'API Design', role: 'architect' },
        { name: 'DB Schema', role: 'architect' },
      ];

      const testId = this.runner.createTest(
        'architect-v1.0.0',
        'architect-v1.1.0-test',
        scenarios,
        3 // small sample for speed
      );

      this.assert(testId, "Should generate test ID");

      // Run test
      const results = this.runner.runTest(testId);

      this.assert(results.baseline_group, "Should have baseline group results");
      this.assert(results.variant_group, "Should have variant group results");
      this.assert(results.baseline_group.length > 0, "Baseline group should have outputs");
      this.assert(results.variant_group.length > 0, "Variant group should have outputs");

      this.pass("A/B test executed: " + results.baseline_group.length + " outputs per group");
    } catch (error) {
      this.fail(`A/B test failed: ${error.message}`);
    }
  }

  /**
   * Test 4: A/B Test Analysis
   */
  test4_ABTestAnalysis() {
    console.log("\n📋 Test 4: A/B Test Analysis");
    try {
      // Create and run a test first
      const scenarios = [{ name: 'Simple Task', role: 'backend' }];
      const testId = this.runner.createTest(
        'backend-v1.0.0',
        'backend-v1.1.0-test',
        scenarios,
        5
      );

      this.runner.runTest(testId);

      // Analyze results
      const analysis = this.runner.analyzeResults(testId);

      this.assert(analysis.baseline_metrics, "Should have baseline metrics");
      this.assert(analysis.variant_metrics, "Should have variant metrics");
      this.assert(typeof analysis.pValue === 'number', "Should have p-value");
      this.assert(analysis.pValue >= 0 && analysis.pValue <= 1, "p-value should be 0-1");
      this.assert(['baseline', 'variant', 'no-difference'].includes(analysis.winner), "Should determine winner");

      this.pass("A/B test analyzed: winner=" + analysis.winner + ", p=" + analysis.pValue.toFixed(4));
    } catch (error) {
      this.fail(`A/B test analysis failed: ${error.message}`);
    }
  }

  /**
   * Test 5: Metrics Comparison
   */
  test5_MetricsComparison() {
    console.log("\n📋 Test 5: Metrics Comparison");
    try {
      // Record multiple outputs to create variance
      for (let i = 0; i < 3; i++) {
        const output = {
          agentRole: 'frontend',
          promptVersion: 'frontend-v1.0.0',
          input: `Build component ${i}`,
          domain: 'ui',
        };

        const verification = {
          status: 'APPROVED',
          summary: { critical: 0, major: 0, minor: 1 },
        };

        this.collector.recordOutput(output, verification);
      }

      // Get metrics
      const metrics = this.collector.getAggregateMetrics('frontend-v1.0.0');

      this.assert(metrics.total_outputs >= 3, "Should have at least 3 outputs");
      this.assert(typeof metrics.avg_compliance_score === 'number', "Should have avg compliance score");
      this.assert(metrics.avg_compliance_score >= 0 && metrics.avg_compliance_score <= 100, "Score should be 0-100");
      this.assert(typeof metrics.success_rate === 'number', "Should have success rate");

      this.pass("Metrics comparison working: " + metrics.total_outputs + " outputs, avg score=" + metrics.avg_compliance_score.toFixed(1));
    } catch (error) {
      this.fail(`Metrics comparison failed: ${error.message}`);
    }
  }

  /**
   * Integration Test: Full Pipeline
   */
  integrationTest_FullPipeline() {
    console.log("\n🔗 Integration Test: Full Pipeline");
    try {
      // 1. Record outputs with metrics
      for (let i = 0; i < 5; i++) {
        const output = {
          agentRole: 'devops',
          promptVersion: 'devops-v1.0.0',
          input: 'Deploy service',
        };

        const verification = {
          status: i < 4 ? 'APPROVED' : 'FEEDBACK',
          summary: { critical: 0, major: i === 4 ? 1 : 0, minor: 0 },
        };

        this.collector.recordOutput(output, verification);
      }

      // 2. Check metrics
      const metrics = this.collector.getAggregateMetrics('devops-v1.0.0');
      this.assert(metrics.total_outputs === 5, "Should have 5 outputs");
      this.assert(metrics.success_rate === 0.8, "Should have 80% success rate");

      // 3. Check version info
      const activeVersion = this.manager.getActiveVersion('devops');
      this.assert(activeVersion.version === 'v1.0.0', "Should be v1.0.0");

      // 4. Create A/B test
      const scenarios = [{ name: 'Deployment', role: 'devops' }];
      const testId = this.runner.createTest(
        'devops-v1.0.0',
        'devops-v1.1.0-test',
        scenarios,
        3
      );

      this.runner.runTest(testId);
      const analysis = this.runner.analyzeResults(testId);

      this.assert(analysis.winner, "Should determine winner");

      this.pass("Full pipeline working: metrics → versions → A/B testing");
    } catch (error) {
      this.fail(`Full pipeline failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log("🚀 Phase 9 Validation Suite");
    console.log("========================================");

    // Core functionality tests
    this.test1_MetricsCollection();
    this.test2_VersionHistoryTracking();
    this.test3_ABTestExecution();
    this.test4_ABTestAnalysis();
    this.test5_MetricsComparison();

    // Integration test
    this.integrationTest_FullPipeline();

    // Summary
    console.log("\n========================================");
    console.log("📊 Test Results Summary");
    console.log(`   ✅ Passed: ${this.passCount}`);
    console.log(`   ❌ Failed: ${this.failCount}`);
    const totalTests = this.passCount + this.failCount;
    if (totalTests > 0) {
      console.log(`   📈 Success Rate: ${((this.passCount / totalTests) * 100).toFixed(1)}%`);
    }
    console.log("========================================\n");

    if (this.failCount === 0) {
      console.log("🎉 All tests passed! Phase 9 ready for production.\n");
      return 0;
    } else {
      console.log(`⚠️  ${this.failCount} test(s) failed. See details above.\n`);
      return 1;
    }
  }

  /**
   * Helper: Assert condition
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Helper: Mark test as passing
   */
  pass(message) {
    this.passCount++;
    console.log(`   ✅ ${message}`);
  }

  /**
   * Helper: Mark test as failing
   */
  fail(message) {
    this.failCount++;
    console.log(`   ❌ ${message}`);
  }
}

// Run tests
if (require.main === module) {
  const validator = new Phase9Validator();
  const exitCode = validator.runAll();
  validator.cleanup();
  process.exit(exitCode);
}

module.exports = Phase9Validator;
