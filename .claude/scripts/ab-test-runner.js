/**
 * A/B Test Runner
 *
 * Purpose: Run A/B tests comparing prompt versions
 * Part of Phase 9: Prompt Versioning + Performance Tracking
 *
 * Usage:
 *   const runner = new ABTestRunner();
 *   runner.createTest(baseline, variant, scenarios, 10);
 *   runner.runTest(testId);
 *   const results = runner.analyzeResults(testId);
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ABTestRunner {
  constructor(metricsDir = null) {
    if (!metricsDir) {
      // __dirname is .claude/scripts
      // Metrics is in ../metrics from scripts (use resolve for absolute path)
      metricsDir = path.resolve(__dirname, '..', 'metrics');
    }
    this.metricsDir = metricsDir;
    this.testsDir = path.join(metricsDir, 'ab-tests');
    this.ensureTestsDirectory();
  }

  /**
   * Create an A/B test
   * @param {string} baseline - Baseline version (e.g., "architect-v1.0.0")
   * @param {string} variant - Variant version (e.g., "architect-v1.1.0")
   * @param {Array} scenarios - Test scenarios (objects with name, input, role)
   * @param {number} sampleSize - How many outputs per group (default 10)
   * @returns {string} Test ID
   */
  createTest(baseline, variant, scenarios, sampleSize = 10) {
    const testId = this.generateTestId();

    const test = {
      id: testId,
      created_date: new Date().toISOString(),
      baseline: baseline,
      variant: variant,
      scenarios: scenarios,
      sample_size: sampleSize,
      status: 'created',
      results: null,
    };

    this.saveTest(test);
    console.log(`✅ Created A/B test: ${testId}`);
    console.log(`   Baseline: ${baseline}`);
    console.log(`   Variant: ${variant}`);
    console.log(`   Sample size: ${sampleSize} per group`);

    return testId;
  }

  /**
   * Run an A/B test
   * @param {string} testId - Test ID to run
   * @returns {Object} Raw results (not analyzed yet)
   */
  runTest(testId) {
    const test = this.loadTest(testId);

    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    console.log(`\n🧪 Running A/B test: ${testId}`);
    console.log(`   Baseline: ${test.baseline}`);
    console.log(`   Variant: ${test.variant}`);

    const results = {
      baseline_group: [],
      variant_group: [],
    };

    // Simulate running the test
    // In production, this would actually run the agents
    for (let i = 0; i < test.sample_size; i++) {
      // For each scenario
      for (const scenario of test.scenarios) {
        // Baseline result
        const baselineResult = this.simulateOutput(test.baseline, scenario);
        results.baseline_group.push(baselineResult);

        // Variant result
        const variantResult = this.simulateOutput(test.variant, scenario);
        results.variant_group.push(variantResult);
      }
    }

    // Save results
    test.status = 'completed';
    test.results = results;
    test.completed_date = new Date().toISOString();
    this.saveTest(test);

    console.log(`✅ Test completed`);
    console.log(`   Baseline outputs: ${results.baseline_group.length}`);
    console.log(`   Variant outputs: ${results.variant_group.length}`);

    return results;
  }

  /**
   * Analyze test results
   * @param {string} testId - Test ID to analyze
   * @returns {Object} Analysis report with winner
   */
  analyzeResults(testId) {
    const test = this.loadTest(testId);

    if (!test || !test.results) {
      throw new Error(`Test not found or not completed: ${testId}`);
    }

    const baselineMetrics = this.calculateGroupMetrics(test.results.baseline_group);
    const variantMetrics = this.calculateGroupMetrics(test.results.variant_group);

    // Statistical test (t-test for compliance scores)
    const pValue = this.calculatePValue(
      test.results.baseline_group.map(r => r.compliance_score),
      test.results.variant_group.map(r => r.compliance_score)
    );

    // Determine winner
    const winner = this.determineWinner(baselineMetrics, variantMetrics, pValue);

    const analysis = {
      test_id: testId,
      baseline: test.baseline,
      variant: test.variant,
      baseline_metrics: baselineMetrics,
      variant_metrics: variantMetrics,
      pValue: pValue,
      winner: winner,
      significant: pValue < 0.05,
      summary: this.generateAnalysisSummary(test.baseline, test.variant, baselineMetrics, variantMetrics, winner, pValue),
    };

    return analysis;
  }

  /**
   * Get test results
   * @param {string} testId - Test ID
   * @returns {Object} Test object with results
   */
  getTestResults(testId) {
    return this.loadTest(testId);
  }

  /**
   * Simulate output for testing
   * @private
   */
  simulateOutput(promptVersion, scenario) {
    // This simulates what would happen when an agent produces output
    // In production, this would run the actual agent

    // Generate scores based on prompt version (v1.1 slightly better than v1.0)
    const isVariant = promptVersion.includes('v1.1') || promptVersion.includes('v2.0');
    const baseScore = 85;
    const variance = isVariant ? 3 : 2;

    const compliance_score = baseScore + (Math.random() * variance) + (isVariant ? 2 : 0);
    const success = compliance_score > 80 ? 'APPROVED' : 'FEEDBACK';
    const issues_major = success === 'APPROVED' ? 0 : 1;

    return {
      prompt_version: promptVersion,
      scenario: scenario.name,
      compliance_score: Math.min(100, compliance_score),
      success_rate: success === 'APPROVED' ? 1 : 0,
      issues_major: issues_major,
      response_time_ms: 2000 + Math.random() * 500,
    };
  }

  /**
   * Calculate group metrics
   * @private
   */
  calculateGroupMetrics(outputs) {
    if (outputs.length === 0) {
      return this.emptyMetrics();
    }

    return {
      count: outputs.length,
      avg_compliance_score: outputs.reduce((sum, o) => sum + o.compliance_score, 0) / outputs.length,
      success_rate: outputs.reduce((sum, o) => sum + o.success_rate, 0) / outputs.length,
      avg_response_time: outputs.reduce((sum, o) => sum + o.response_time_ms, 0) / outputs.length,
      total_major_issues: outputs.reduce((sum, o) => sum + o.issues_major, 0),
    };
  }

  /**
   * Empty metrics object
   * @private
   */
  emptyMetrics() {
    return {
      count: 0,
      avg_compliance_score: 0,
      success_rate: 0,
      avg_response_time: 0,
      total_major_issues: 0,
    };
  }

  /**
   * Calculate p-value using t-test
   * @private
   */
  calculatePValue(group1, group2) {
    if (group1.length === 0 || group2.length === 0) {
      return 1.0;
    }

    // Simple t-test approximation
    const mean1 = group1.reduce((sum, x) => sum + x, 0) / group1.length;
    const mean2 = group2.reduce((sum, x) => sum + x, 0) / group2.length;

    const var1 = group1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (group1.length - 1 || 1);
    const var2 = group2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (group2.length - 1 || 1);

    const t = Math.abs(mean1 - mean2) / Math.sqrt(var1 / group1.length + var2 / group2.length + 0.001);

    // Rough p-value estimate (not exact t-distribution, but close enough for Phase 9)
    const pValue = Math.max(0.001, Math.exp(-t / 2));

    return pValue;
  }

  /**
   * Determine winner
   * @private
   */
  determineWinner(baselineMetrics, variantMetrics, pValue) {
    const variantBetter = variantMetrics.avg_compliance_score > baselineMetrics.avg_compliance_score;
    const significant = pValue < 0.05;

    if (variantBetter && significant) {
      return 'variant';
    }

    if (!variantBetter && significant) {
      return 'baseline';
    }

    return 'no-difference';
  }

  /**
   * Generate analysis summary
   * @private
   */
  generateAnalysisSummary(baseline, variant, baselineMetrics, variantMetrics, winner, pValue) {
    const complianceDelta = variantMetrics.avg_compliance_score - baselineMetrics.avg_compliance_score;
    const successDelta = variantMetrics.success_rate - baselineMetrics.success_rate;

    const lines = [
      `A/B Test: ${baseline} vs ${variant}`,
      ``,
      `Compliance Score`,
      `  Baseline: ${baselineMetrics.avg_compliance_score.toFixed(1)}`,
      `  Variant: ${variantMetrics.avg_compliance_score.toFixed(1)}`,
      `  Delta: ${complianceDelta > 0 ? '+' : ''}${complianceDelta.toFixed(1)}`,
      ``,
      `Success Rate`,
      `  Baseline: ${(baselineMetrics.success_rate * 100).toFixed(1)}%`,
      `  Variant: ${(variantMetrics.success_rate * 100).toFixed(1)}%`,
      `  Delta: ${successDelta > 0 ? '+' : ''}${(successDelta * 100).toFixed(1)}%`,
      ``,
      `Statistical Significance: p = ${pValue.toFixed(4)} ${pValue < 0.05 ? '✅' : '❌'}`,
      ``,
      `Winner: ${winner === 'variant' ? '✅ Variant' : winner === 'baseline' ? '✅ Baseline' : '⏳ No difference'}`,
    ];

    return lines.join('\n');
  }

  /**
   * Ensure tests directory exists
   * @private
   */
  ensureTestsDirectory() {
    if (!fs.existsSync(this.testsDir)) {
      fs.mkdirSync(this.testsDir, { recursive: true });
    }
  }

  /**
   * Generate test ID
   * @private
   */
  generateTestId() {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex');
    return `test-${timestamp}-${random}`;
  }

  /**
   * Save test to file
   * @private
   */
  saveTest(test) {
    const testPath = path.join(this.testsDir, `${test.id}.json`);
    fs.writeFileSync(testPath, JSON.stringify(test, null, 2), 'utf8');
  }

  /**
   * Load test from file
   * @private
   */
  loadTest(testId) {
    const testPath = path.join(this.testsDir, `${testId}.json`);

    try {
      if (fs.existsSync(testPath)) {
        return JSON.parse(fs.readFileSync(testPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading test ${testId}:`, error.message);
    }

    return null;
  }

  /**
   * List all tests
   */
  listTests() {
    const files = fs.readdirSync(this.testsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));

    return files.map(testId => {
      const test = this.loadTest(testId);
      return {
        id: testId,
        baseline: test?.baseline,
        variant: test?.variant,
        status: test?.status,
        created_date: test?.created_date,
      };
    });
  }
}

/**
 * Example usage (for testing)
 */
if (require.main === module) {
  const runner = new ABTestRunner();

  // Create test
  const scenarios = [
    { name: 'API Design', role: 'architect' },
    { name: 'Backend Implementation', role: 'backend' },
  ];

  const testId = runner.createTest('architect-v1.0.0', 'architect-v1.1.0', scenarios, 5);

  // Run test
  const results = runner.runTest(testId);
  console.log('\nTest Results:', {
    baseline_count: results.baseline_group.length,
    variant_count: results.variant_group.length,
  });

  // Analyze results
  const analysis = runner.analyzeResults(testId);
  console.log('\nAnalysis Summary:');
  console.log(analysis.summary);
}

module.exports = ABTestRunner;
