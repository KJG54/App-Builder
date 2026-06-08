#!/usr/bin/env node

/**
 * Phase 8 Validation & Testing Suite
 *
 * Purpose: Validate that verification system works correctly
 * Tests: 5 scenarios covering rules, workflow, consistency
 *
 * Usage: node validate-phase-8.js
 */

const VerificationRulesEngine = require('./verification-rules-engine.js');

class Phase8Validator {
  constructor() {
    this.engine = new VerificationRulesEngine();
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Test 1: Rules Engine Loads Correctly
   */
  test1_RulesEngineInitialization() {
    console.log("\n📋 Test 1: Rules Engine Initialization");
    try {
      const ruleCount = Object.values(this.engine.rules)
        .reduce((sum, arr) => sum + arr.length, 0);

      this.assert(ruleCount >= 15, "Should have 15+ rules loaded");
      this.assert(this.engine.rules.security, "Security rules should exist");
      this.assert(this.engine.rules.architecture, "Architecture rules should exist");
      this.assert(this.engine.rules.testing, "Testing rules should exist");
      this.assert(this.engine.rules.coding, "Coding rules should exist");

      this.pass("Rules engine loaded with " + ruleCount + " rules");
    } catch (error) {
      this.fail(`Initialization failed: ${error.message}`);
    }
  }

  /**
   * Test 2: Approve Code without Critical Issues
   */
  test2_ApproveGoodCode() {
    console.log("\n📋 Test 2: Code without Critical Issues");
    try {
      const goodCode = `
        // Good example: type hints, tests, no secrets
        async function fetchUsers(id: string): Promise<User[]> {
          const users = await db.query('SELECT * FROM users WHERE id = ?', [id]);
          return users;
        }

        describe('fetchUsers', () => {
          it('returns array', async () => {
            const users = await fetchUsers('123');
            expect(users).toBeArray();
          });
        });
      `;

      const result = this.engine.verify(goodCode, "backend");

      // Good code should have zero critical issues
      this.assert(result.summary.critical === 0, "No critical issues in good code");
      // Status might be FEEDBACK (if minor issues) or APPROVED
      this.assert(result.status !== "REJECTED", "Good code should not be rejected");

      this.pass("Code verified: " + result.status + " (no critical issues)");
    } catch (error) {
      this.fail(`Approval test failed: ${error.message}`);
    }
  }

  /**
   * Test 3: Reject Code with Hardcoded Secrets
   */
  test3_RejectHardcodedSecrets() {
    console.log("\n📋 Test 3: Reject Hardcoded Secrets");
    try {
      const badCode = `
        const API_KEY = "sk-1234567890abcdef";
        const password = "superSecretPassword123";
      `;

      const result = this.engine.verify(badCode, "backend");

      this.assert(result.status === "REJECTED", "Code with secrets should be rejected");
      this.assert(result.summary.critical > 0, "Should have critical issues");
      this.assert(
        result.issues.some(i => i.id === "no-hardcoded-secrets"),
        "Should identify hardcoded secrets"
      );

      this.pass("Hardcoded secrets detected and rejected");
    } catch (error) {
      this.fail(`Secret detection failed: ${error.message}`);
    }
  }

  /**
   * Test 4: Feedback for Incomplete Code
   */
  test4_FeedbackForIncompleteCode() {
    console.log("\n📋 Test 4: Feedback for Incomplete Code");
    try {
      const incompleteCode = `
        function calculateTotal(items) {
          return items.reduce((sum, item) => sum + item.price, 0);
        }
        // No tests provided
      `;

      const result = this.engine.verify(incompleteCode, "backend");

      // Should have issues (either major or critical, but no critical security)
      this.assert(result.summary.critical === 0, "No critical security issues");
      this.assert(result.issues.length > 0, "Should have some issues");
      this.assert(result.status !== "APPROVED", "Incomplete code should not be approved");

      this.pass("Feedback provided: " + result.issues.length + " issues");
    } catch (error) {
      this.fail(`Feedback test failed: ${error.message}`);
    }
  }

  /**
   * Test 5: Role-Based Rule Filtering
   */
  test5_RoleBasedRuleFiltering() {
    console.log("\n📋 Test 5: Role-Based Rule Filtering");
    try {
      const architectOutput = `
        Architecture: Modular design with 4 components
        Technology: Node.js + PostgreSQL (chosen for scalability)
      `;

      const architectRules = this.engine.getRulesForRole("architect");
      const backendRules = this.engine.getRulesForRole("backend");

      this.assert(
        architectRules.length < backendRules.length,
        "Architect should have subset of rules"
      );
      this.assert(
        architectRules.some(r => r.category === "Architecture"),
        "Architect rules should include Architecture"
      );
      this.assert(
        !architectRules.some(r => r.category === "Testing"),
        "Architect rules shouldn't include Testing specifics"
      );

      this.pass("Role-based filtering working: architect=" + architectRules.length + " rules");
    } catch (error) {
      this.fail(`Role filtering failed: ${error.message}`);
    }
  }

  /**
   * Test 6: Multi-Role Consistency
   */
  test6_MultiRoleConsistency() {
    console.log("\n📋 Test 6: Multi-Role Consistency");
    try {
      const architectDesign = `
        Design: REST API with OAuth 2.0 authentication
        Endpoints: POST /users, GET /users/:id
      `;

      const backendCode = `
        async function getUser(id: string): Promise<User> {
          const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
          return user;
        }
      `;

      const architectResult = this.engine.verify(architectDesign, "architect");
      const backendResult = this.engine.verify(backendCode, "backend");

      // Both should pass verification in their respective contexts
      this.assert(
        architectResult.status !== "REJECTED",
        "Architecture design should be acceptable"
      );
      this.assert(
        backendResult.status !== "REJECTED",
        "Backend code should be acceptable"
      );

      this.pass("Multi-role consistency verified");
    } catch (error) {
      this.fail(`Consistency test failed: ${error.message}`);
    }
  }

  /**
   * Test 7: Statistics Tracking
   */
  test7_StatisticsTracking() {
    console.log("\n📋 Test 7: Statistics Tracking");
    try {
      // Run a verification
      const verification = this.engine.verify("function test(x) { return x + 1; }", "backend");

      const stats = this.engine.getStats();

      // Stats should have numeric values
      this.assert(typeof stats.total_checks === "number", "total_checks should be a number");
      this.assert(typeof stats.approved === "number", "approved should be a number");
      this.assert(typeof stats.feedback === "number", "feedback should be a number");
      this.assert(typeof stats.rejected === "number", "rejected should be a number");
      this.assert(
        stats.approval_rate === "N/A" || typeof stats.approval_rate === "string",
        "approval_rate should be tracked"
      );

      this.pass("Statistics tracked: " + stats.total_checks + " checks");
    } catch (error) {
      this.fail(`Statistics test failed: ${error.message}`);
    }
  }

  /**
   * Performance Test: Rules Execution Speed
   */
  testPerformance_RulesSpeed() {
    console.log("\n⚡ Performance Test: Rules Execution Speed");
    try {
      const output = `
        async function complex(items: Item[]): Promise<Total> {
          // 50 lines of code
          const result = items
            .filter(i => i.valid)
            .map(i => ({ ...i, processed: true }))
            .reduce((sum, i) => sum + i.value, 0);
          return { total: result, timestamp: new Date() };
        }
      `;

      const start = Date.now();
      const result = this.engine.verify(output, "backend");
      const elapsed = Date.now() - start;

      console.log(`   Verification latency: ${elapsed}ms`);
      console.log(`   Rules checked: ${result.metadata.rules_checked}`);
      console.log(`   Issues found: ${result.metadata.rules_failed}`);

      this.assert(elapsed < 100, "Verification should complete in <100ms");
      this.pass(`Rules executed in ${elapsed}ms`);
    } catch (error) {
      this.fail(`Performance test failed: ${error.message}`);
    }
  }

  /**
   * Quality Test: Issue Clarity
   */
  testQuality_IssueClarity() {
    console.log("\n✅ Quality Test: Issue Clarity");
    try {
      const badCode = `
        password = 'hardcoded123'
        x = 42  // magic number
        function a() {} // unclear name
      `;

      const result = this.engine.verify(badCode, "backend");

      // Verify each issue has required fields
      for (const issue of result.issues) {
        this.assert(issue.id, "Issue should have ID");
        this.assert(issue.category, "Issue should have category");
        this.assert(issue.severity, "Issue should have severity");
        this.assert(issue.message, "Issue should have message");
        this.assert(issue.suggestion, "Issue should have suggestion");
      }

      this.pass("All issues have clear, actionable feedback");
    } catch (error) {
      this.fail(`Quality test failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  runAll() {
    console.log("🚀 Phase 8 Verification Suite");
    console.log("========================================");

    // Core functionality tests
    this.test1_RulesEngineInitialization();
    this.test2_ApproveGoodCode();
    this.test3_RejectHardcodedSecrets();
    this.test4_FeedbackForIncompleteCode();
    this.test5_RoleBasedRuleFiltering();
    this.test6_MultiRoleConsistency();
    this.test7_StatisticsTracking();

    // Performance & quality tests
    this.testPerformance_RulesSpeed();
    this.testQuality_IssueClarity();

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
      console.log("🎉 All tests passed! Phase 8 ready for production.\n");
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
  const validator = new Phase8Validator();
  const exitCode = validator.runAll();
  process.exit(exitCode);
}

module.exports = Phase8Validator;
