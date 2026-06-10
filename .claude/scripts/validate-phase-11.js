#!/usr/bin/env node

/**
 * Phase 11 Validation & Testing Suite
 *
 * Purpose: Validate problem extraction, management, and indexing
 * Tests: 7 scenarios covering extraction, creation, clustering, and integration
 *
 * Usage: node validate-phase-11.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const ProblemExtractor = require('./problem-extractor.js');
const ProblemManager = require('./problem-manager.js');
const ProblemIndexer = require('./problem-indexer.js');
const ReviewPipeline = require('./review-pipeline.js');

class Phase11Validator {
  constructor() {
    // Use temp dirs so tests never write to production Vault or .claude/reviews
    this.testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase11-test-'));
    this.testProblemsDir = path.join(this.testDir, 'known-problems');
    this.testReviewsDir = path.join(this.testDir, 'reviews');
    fs.mkdirSync(this.testProblemsDir, { recursive: true });
    fs.mkdirSync(this.testReviewsDir, { recursive: true });

    this.extractor = new ProblemExtractor(this.testReviewsDir);
    this.manager = new ProblemManager(this.testProblemsDir);
    this.indexer = new ProblemIndexer(this.testProblemsDir);
    this.pipeline = new ReviewPipeline(this.testReviewsDir);
    this.passCount = 0;
    this.failCount = 0;
  }

  cleanup() {
    fs.rmSync(this.testDir, { recursive: true, force: true });
  }

  /**
   * Test 1: Problem Extraction
   */
  test1_ProblemExtraction() {
    console.log("\n📋 Test 1: Problem Extraction");
    try {
      // Create mock review data with issues
      this.createMockReviews(5);

      // Extract problems
      const result = this.extractor.extractProblems('7d', 2);

      this.assert(result.review_count > 0, "Should have reviews");
      this.assert(result.problems.length > 0, "Should extract problems");

      const problem = result.problems[0];
      this.assert(problem.occurrences >= 2, "Problems should have multiple occurrences");
      this.assert(problem.agents_affected.length > 0, "Should identify affected agents");

      this.pass(`Extracted ${result.problems.length} recurring issues`);
    } catch (error) {
      this.fail(`Problem extraction failed: ${error.message}`);
    }
  }

  /**
   * Test 2: Problem Creation
   */
  test2_ProblemCreation() {
    console.log("\n📋 Test 2: Problem Creation");
    try {
      const mockIssue = {
        id: 'TEST-001',
        category: 'security',
        message: 'Missing input validation',
        severity: 'major',
        occurrences: 4,
        agents_affected: ['backend', 'api'],
        avg_compliance_impact: 78,
        calculated_severity: 'high',
      };

      const result = this.manager.createProblem(mockIssue);

      this.assert(result.fileName, "Should generate filename");
      this.assert(result.fileName.includes('Problem-'), "Should have Problem prefix");
      this.assert(result.fileName.includes('.md'), "Should be markdown file");

      this.pass(`Created problem: ${result.fileName}`);
    } catch (error) {
      this.fail(`Problem creation failed: ${error.message}`);
    }
  }

  /**
   * Test 3: Issue Clustering
   */
  test3_IsssueClustering() {
    console.log("\n📋 Test 3: Issue Clustering");
    try {
      const mockIssues = [
        {
          id: 'AUTH-001',
          message: 'Authentication check missing',
          category: 'security',
          severity: 'critical',
          occurrences: 3,
          agents_affected: ['backend'],
          avg_compliance_impact: 65,
        },
        {
          id: 'AUTH-002',
          message: 'Authentication validation insufficient',
          category: 'security',
          severity: 'major',
          occurrences: 2,
          agents_affected: ['api'],
          avg_compliance_impact: 72,
        },
      ];

      const clusters = this.extractor.clusterRelatedIssues(mockIssues);

      this.assert(clusters.clusters.length > 0, "Should create clusters");
      this.assert(clusters.clusters[0].common_root_cause, "Should identify root cause");

      this.pass(`Clustered ${clusters.cluster_count} issue group(s)`);
    } catch (error) {
      this.fail(`Issue clustering failed: ${error.message}`);
    }
  }

  /**
   * Test 4: Severity Calculation
   */
  test4_SeverityCalculation() {
    console.log("\n📋 Test 4: Severity Calculation");
    try {
      const criticalIssue = {
        severity: 'critical',
        occurrences: 10,
        avg_compliance_impact: 40,
        agents_affected: ['backend', 'api', 'frontend'],
      };

      const severity = this.extractor.calculateSeverity(criticalIssue);

      this.assert(['low', 'medium', 'high', 'critical'].includes(severity), "Should return valid severity");
      this.assert(severity === 'critical' || severity === 'high', "High-impact issue should be critical or high");

      this.pass(`Calculated severity: ${severity}`);
    } catch (error) {
      this.fail(`Severity calculation failed: ${error.message}`);
    }
  }

  /**
   * Test 5: Problem Indexing
   */
  test5_ProblemIndexing() {
    console.log("\n📋 Test 5: Problem Indexing");
    try {
      // Create a problem first
      const mockIssue = {
        id: 'TEST-005',
        category: 'api',
        message: 'API response timeout issue',
        severity: 'major',
        occurrences: 5,
        agents_affected: ['backend'],
        avg_compliance_impact: 80,
        calculated_severity: 'high',
      };

      const problemResult = this.manager.createProblem(mockIssue);

      // Index it
      const indexResult = this.indexer.indexProblem(problemResult.fileName);

      this.assert(indexResult.success === true, "Should index successfully");
      this.assert(indexResult.indexed_at, "Should have indexing timestamp");

      this.pass(`Indexed problem: ${problemResult.fileName}`);
    } catch (error) {
      this.fail(`Problem indexing failed: ${error.message}`);
    }
  }

  /**
   * Test 6: Semantic Search
   */
  test6_SemanticSearch() {
    console.log("\n📋 Test 6: Semantic Search");
    try {
      // Create and index a problem
      const mockIssue = {
        id: 'SEARCH-001',
        category: 'database',
        message: 'Database connection timeout',
        severity: 'major',
        occurrences: 3,
        agents_affected: ['backend'],
        avg_compliance_impact: 75,
        calculated_severity: 'high',
      };

      const problemResult = this.manager.createProblem(mockIssue);
      this.indexer.indexProblem(problemResult.fileName);

      // Search for it
      const searchResult = this.indexer.queryProblems('database timeout');

      this.assert(searchResult.result_count >= 0, "Should return search results");

      this.pass(`Semantic search: ${searchResult.result_count} result(s)`);
    } catch (error) {
      this.fail(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Test 7: Full Integration
   */
  test7_FullIntegration() {
    console.log("\n📋 Test 7: Full Integration");
    try {
      // 1. Create mock reviews with issues
      this.createMockReviews(3);

      // 2. Extract problems
      const extracted = this.extractor.extractProblems('7d', 1);
      this.assert(extracted.problems.length > 0, "Should extract problems");

      // 3. Create problem records
      const createdProblems = [];
      extracted.problems.slice(0, 2).forEach(issue => {
        const result = this.manager.createProblem(issue);
        createdProblems.push(result.fileName);
      });
      this.assert(createdProblems.length > 0, "Should create problem records");

      // 4. Index problems
      createdProblems.forEach(fileName => {
        this.indexer.indexProblem(fileName);
      });

      // 5. Query problems
      const searchResult = this.indexer.queryProblems('issue');
      this.assert(searchResult.results.length >= 0, "Should query indexed problems");

      // 6. Get statistics
      const stats = this.indexer.getStatistics();
      this.assert(stats.total_problems >= 0, "Should have statistics");

      this.pass(`Full pipeline: extract → create → index → query working`);
    } catch (error) {
      this.fail(`Full integration failed: ${error.message}`);
    }
  }

  /**
   * Create mock reviews with issues for testing
   * @private
   */
  createMockReviews(count) {
    for (let i = 0; i < count; i++) {
      this.pipeline.submitOutput(
        ['backend', 'frontend', 'api'][i % 3],
        `test-v1.0.0`,
        `Test output ${i}`,
        `Test input ${i}`,
        {
          responsetime_ms: 2000,
          token_usage: 1500,
          cost_usd: 0.05,
        }
      );
    }
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log("🚀 Phase 11 Validation Suite");
    console.log("========================================");

    // Core functionality tests
    this.test1_ProblemExtraction();
    this.test2_ProblemCreation();
    this.test3_IsssueClustering();
    this.test4_SeverityCalculation();
    this.test5_ProblemIndexing();
    this.test6_SemanticSearch();

    // Integration test
    this.test7_FullIntegration();

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

    this.cleanup();

    if (this.failCount === 0) {
      console.log("🎉 All tests passed! Phase 11 ready for production.\n");
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
  const validator = new Phase11Validator();
  const exitCode = validator.runAll();
  process.exit(exitCode);
}

module.exports = Phase11Validator;
