/**
 * Verification Rules Engine
 *
 * Purpose: Check outputs against rules to identify compliance issues
 * Part of Phase 8: Verification Layer implementation
 *
 * Usage:
 *   const engine = new VerificationRulesEngine();
 *   const result = engine.verify(output, "backend", context);
 */

class VerificationRulesEngine {
  constructor() {
    this.rules = this.loadRules();
    this.stats = {
      checks: 0,
      issues: 0,
      approved: 0,
      feedback: 0,
      rejected: 0,
    };
  }

  /**
   * Verify output against rules
   * @param {string} output - The output to verify (design, code, deployment)
   * @param {string} role - Agent role: architect, backend, frontend, devops
   * @param {Object} context - Context (standards, ADRs, requirements)
   * @returns {Object} Verification result {status, issues, suggestions}
   */
  verify(output, role, context = {}) {
    this.stats.checks++;

    // Load relevant rules for this role
    const roleRules = this.getRulesForRole(role);

    // Run all checks
    const issues = [];
    for (const rule of roleRules) {
      try {
        if (!rule.check(output)) {
          issues.push({
            id: rule.id,
            category: rule.category,
            severity: rule.severity,
            message: rule.message,
            suggestion: rule.suggestion,
          });
        }
      } catch (error) {
        // Rule failed to execute (should not happen, but handle gracefully)
        console.error(`Rule ${rule.id} failed:`, error.message);
      }
    }

    // Determine overall status
    const status = this.determineStatus(issues);

    // Track statistics
    this.recordStats(status);

    return {
      status,
      issues,
      summary: {
        critical: issues.filter(i => i.severity === "Critical").length,
        major: issues.filter(i => i.severity === "Major").length,
        minor: issues.filter(i => i.severity === "Minor").length,
      },
      metadata: {
        role,
        timestamp: new Date().toISOString(),
        rules_checked: roleRules.length,
        rules_passed: roleRules.length - issues.length,
        rules_failed: issues.length,
      }
    };
  }

  /**
   * Load all verification rules
   * @private
   */
  loadRules() {
    return {
      security: [
        {
          id: "no-hardcoded-secrets",
          severity: "Critical",
          category: "Security",
          message: "Hardcoded secrets/credentials found",
          suggestion: "Use environment variables or secure vault for all secrets",
          check: output => !this.containsSecrets(output),
        },
        {
          id: "tls-required",
          severity: "Critical",
          category: "Security",
          message: "Unencrypted connections found",
          suggestion: "Use HTTPS/TLS 1.3+ for all network communication",
          check: output => !this.hasInsecureConnections(output),
        },
        {
          id: "input-validation",
          severity: "Major",
          category: "Security",
          message: "Missing input validation",
          suggestion: "Validate all user inputs at system boundaries",
          check: output => this.hasInputValidation(output),
        },
        {
          id: "auth-required",
          severity: "Major",
          category: "Security",
          message: "Public API endpoints lack authentication",
          suggestion: "Require OAuth 2.0 or similar for all API endpoints",
          check: output => !this.hasUnauthenticatedEndpoints(output),
        },
        {
          id: "sql-injection-safe",
          severity: "Critical",
          category: "Security",
          message: "SQL injection vulnerability pattern detected",
          suggestion: "Use parameterized queries or ORM with automatic escaping",
          check: output => !this.hasSQLInjectionPattern(output),
        },
      ],
      architecture: [
        {
          id: "modularity",
          severity: "Major",
          category: "Architecture",
          message: "Functions too large (>100 lines)",
          suggestion: "Break functions into smaller modules with single responsibility",
          check: output => this.functionsAreModular(output),
        },
        {
          id: "type-hints",
          severity: "Major",
          category: "Architecture",
          message: "Missing type hints on functions",
          suggestion: "Add type hints to all function signatures (TypeScript/Python/Go)",
          check: output => this.hasTypeHints(output),
        },
        {
          id: "no-adr-violation",
          severity: "Major",
          category: "Architecture",
          message: "Violates established architectural decision",
          suggestion: "Check ADRs and align with established patterns",
          check: output => !this.violatesADR(output),
        },
        {
          id: "versioning",
          severity: "Major",
          category: "Architecture",
          message: "No versioning for breaking changes",
          suggestion: "Use semantic versioning and document breaking changes",
          check: output => this.hasProperVersioning(output),
        },
        {
          id: "documented-tech-choice",
          severity: "Minor",
          category: "Architecture",
          message: "Technology choice not documented",
          suggestion: "Document in ADR why this technology was chosen",
          check: output => this.hasTechDecision(output),
        },
      ],
      testing: [
        {
          id: "test-coverage",
          severity: "Major",
          category: "Testing",
          message: "Test coverage below 80%",
          suggestion: "Write unit and integration tests; aim for >80% coverage",
          check: output => this.hasAdequateTestCoverage(output),
        },
        {
          id: "unit-tests",
          severity: "Major",
          category: "Testing",
          message: "Missing unit tests",
          suggestion: "Add unit tests for all public functions",
          check: output => this.hasUnitTests(output),
        },
        {
          id: "integration-tests",
          severity: "Minor",
          category: "Testing",
          message: "Missing integration tests",
          suggestion: "Add integration tests for critical paths",
          check: output => this.hasIntegrationTests(output),
        },
      ],
      coding: [
        {
          id: "naming-conventions",
          severity: "Minor",
          category: "Coding",
          message: "Unclear variable names (single letters, cryptic names)",
          suggestion: "Use descriptive names: camelCase (JS), snake_case (Python)",
          check: output => this.hasGoodNaming(output),
        },
        {
          id: "no-magic-numbers",
          severity: "Minor",
          category: "Coding",
          message: "Magic numbers found without named constants",
          suggestion: "Define named constants for all hardcoded numbers",
          check: output => !this.hasMagicNumbers(output),
        },
        {
          id: "comments-explain-why",
          severity: "Minor",
          category: "Coding",
          message: "Comments duplicate code instead of explaining why",
          suggestion: "Comments should explain WHY, not WHAT (code shows what)",
          check: output => this.commentsExplainWhy(output),
        },
      ],
      documentation: [
        {
          id: "api-documented",
          severity: "Major",
          category: "Documentation",
          message: "API endpoints not documented",
          suggestion: "Generate OpenAPI/Swagger documentation for all endpoints",
          check: output => this.hasAPIDocumentation(output),
        },
        {
          id: "readme-present",
          severity: "Minor",
          category: "Documentation",
          message: "No README or component documentation",
          suggestion: "Add README with setup instructions and usage examples",
          check: output => this.hasReadme(output),
        },
      ],
    };
  }

  /**
   * Get rules applicable to a specific role
   * @private
   */
  getRulesForRole(role) {
    const allRules = [
      ...this.rules.security,
      ...this.rules.architecture,
      ...this.rules.testing,
      ...this.rules.coding,
      ...this.rules.documentation,
    ];

    // Filter rules by role relevance
    switch (role.toLowerCase()) {
      case "architect":
        return allRules.filter(r =>
          r.category === "Architecture" || r.category === "Security"
        );
      case "backend":
        return allRules.filter(r =>
          r.category !== "Architecture" // All except high-level architecture
        );
      case "frontend":
        return allRules.filter(r =>
          r.category === "Coding" || r.category === "Security" || r.category === "Testing"
        );
      case "devops":
        return allRules.filter(r =>
          r.category === "Security" || r.category === "Documentation"
        );
      default:
        return allRules;
    }
  }

  /**
   * Determine overall verification status
   * @private
   */
  determineStatus(issues) {
    const critical = issues.filter(i => i.severity === "Critical");
    const major = issues.filter(i => i.severity === "Major");

    if (critical.length > 0) return "REJECTED";
    if (major.length > 0) return "FEEDBACK";
    return "APPROVED";
  }

  /**
   * Record statistics for this verification
   * @private
   */
  recordStats(status) {
    if (status === "APPROVED") this.stats.approved++;
    else if (status === "FEEDBACK") this.stats.feedback++;
    else if (status === "REJECTED") this.stats.rejected++;
  }

  /**
   * Utility: Check if output contains hardcoded secrets
   * @private
   */
  containsSecrets(output) {
    const secretPatterns = [
      /password\s*=\s*['"][^'"]*['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]*['"]/i,
      /secret\s*=\s*['"][^'"]*['"]/i,
      /token\s*=\s*['"][^'"]*['"]/i,
      /aws[_-]?secret/i,
    ];

    return secretPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Utility: Check for insecure connections
   * @private
   */
  hasInsecureConnections(output) {
    return /http:\/\//i.test(output) && !/https:\/\//i.test(output);
  }

  /**
   * Utility: Check if input validation is present
   * @private
   */
  hasInputValidation(output) {
    return /validate|sanitize|validate|check/i.test(output);
  }

  /**
   * Utility: Check for unauthenticated endpoints
   * @private
   */
  hasUnauthenticatedEndpoints(output) {
    return /@public|@unprotected|no[_-]auth|no[_-]security/i.test(output);
  }

  /**
   * Utility: Check for SQL injection patterns
   * @private
   */
  hasSQLInjectionPattern(output) {
    return /sql.*\+|concatenat|format.*query|String\.format|f"select/i.test(output);
  }

  /**
   * Utility: Check if functions are modular
   * @private
   */
  functionsAreModular(output) {
    // Count lines in functions (simple heuristic)
    return output.split('\n').length < 100 || /function|def|class/i.test(output);
  }

  /**
   * Utility: Check for type hints
   * @private
   */
  hasTypeHints(output) {
    return /:\s*(string|number|boolean|int|float|bool|str|dict)/i.test(output) ||
           /=>\s*[A-Z]|Promise|async/i.test(output);
  }

  /**
   * Utility: Check for ADR violations
   * @private
   */
  violatesADR(output) {
    // Simplified: check for deprecated patterns
    return /deprecated|old[_-]pattern|legacy|remove[_-]soon/i.test(output);
  }

  /**
   * Utility: Check for proper versioning
   * @private
   */
  hasProperVersioning(output) {
    return /v\d+\.\d+\.\d+|version\s*[=:]|BREAKING|breaking[_-]change/i.test(output);
  }

  /**
   * Utility: Check for documented tech choice
   * @private
   */
  hasTechDecision(output) {
    return /why|rationale|chose|decision|because/i.test(output);
  }

  /**
   * Utility: Check test coverage
   * @private
   */
  hasAdequateTestCoverage(output) {
    return /coverage|test|spec|describe|it\(|assert/i.test(output);
  }

  /**
   * Utility: Check for unit tests
   * @private
   */
  hasUnitTests(output) {
    return /test|spec|describe|it\(|@test|def test_/i.test(output);
  }

  /**
   * Utility: Check for integration tests
   * @private
   */
  hasIntegrationTests(output) {
    return /integration|e2e|end[_-]to[_-]end|fixture|setup|teardown/i.test(output);
  }

  /**
   * Utility: Check naming conventions
   * @private
   */
  hasGoodNaming(output) {
    // Check for single-letter variables (bad naming)
    return !/(?:let|var|const)\s+[a-z]\s*=|function [a-z]\(|def [a-z]\(/i.test(output);
  }

  /**
   * Utility: Check for magic numbers
   * @private
   */
  hasMagicNumbers(output) {
    // Simplified: look for standalone numbers
    return /:\s*\d{2,}|=\s*\d{2,}|const|CONST/i.test(output);
  }

  /**
   * Utility: Check if comments explain WHY
   * @private
   */
  commentsExplainWhy(output) {
    const commentPattern = /\/\/|#|\*\*/;
    const hasComments = commentPattern.test(output);
    // Simplified: assume comments explain WHY if they contain certain keywords
    return !hasComments || /why|because|workaround|note|important/i.test(output);
  }

  /**
   * Utility: Check for API documentation
   * @private
   */
  hasAPIDocumentation(output) {
    return /openapi|swagger|@api|@route|@get|@post|@endpoint|documentation/i.test(output);
  }

  /**
   * Utility: Check for README
   * @private
   */
  hasReadme(output) {
    return /readme|setup|installation|usage|example|quickstart/i.test(output);
  }

  /**
   * Get verification statistics
   */
  getStats() {
    return {
      total_checks: this.stats.checks,
      approved: this.stats.approved,
      feedback: this.stats.feedback,
      rejected: this.stats.rejected,
      approval_rate: this.stats.checks > 0
        ? (this.stats.approved / this.stats.checks).toFixed(2)
        : "N/A",
    };
  }

  /**
   * Get summary of all rules
   */
  getSummary() {
    let summary = "Verification Rules Summary\n";
    summary += "==========================\n\n";

    for (const [category, rules] of Object.entries(this.rules)) {
      summary += `${category.toUpperCase()} (${rules.length} rules)\n`;
      for (const rule of rules) {
        summary += `  - [${rule.severity}] ${rule.id}: ${rule.message}\n`;
      }
      summary += "\n";
    }

    return summary;
  }
}

/**
 * Example usage (for testing)
 */
if (require.main === module) {
  const engine = new VerificationRulesEngine();

  console.log("Verification Rules Engine initialized");
  console.log(`Total rules loaded: ${Object.values(engine.rules).reduce((sum, arr) => sum + arr.length, 0)}`);
  console.log("\n" + engine.getSummary());

  // Example verification
  const testOutput = `
    // Good example code
    function calculateTotal(items: Item[]): number {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `;

  const result = engine.verify(testOutput, "backend");
  console.log("\nExample Verification Result:");
  console.log(JSON.stringify(result, null, 2));
}

module.exports = VerificationRulesEngine;
