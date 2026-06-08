/**
 * Metrics Collector
 *
 * Purpose: Record output quality metrics from verification results
 * Part of Phase 9: Prompt Versioning + Performance Tracking
 *
 * Usage:
 *   const collector = new MetricsCollector();
 *   collector.recordOutput(output, verificationResult, performanceData);
 *   const agg = collector.getAggregateMetrics('architect-v1.0.0');
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MetricsCollector {
  constructor(metricsDir = null) {
    if (!metricsDir) {
      // __dirname is .claude/scripts
      // We need to go to .claude/metrics (use resolve for absolute path)
      metricsDir = path.resolve(__dirname, '..', 'metrics');
    }
    this.metricsDir = metricsDir;
    this.ensureDirectory();
    this.cache = new Map(); // In-memory cache of loaded metrics
  }

  /**
   * Record a single output with its metrics
   * @param {Object} output - Agent output being measured
   * @param {Object} verificationResult - Result from verification (status, issues, etc.)
   * @param {Object} performanceData - Latency and token info
   * @returns {string} Output ID for tracking
   */
  recordOutput(output, verificationResult, performanceData = {}) {
    const outputId = this.generateId();

    // Extract data from output
    const { agentRole, promptVersion, input, domain = 'general' } = output;

    // Build output record
    const record = {
      id: outputId,
      timestamp: new Date().toISOString(),
      agent_role: agentRole,
      prompt_version: promptVersion,
      input: input ? input.substring(0, 500) : '', // Truncate for storage

      // Verification scores
      verification: {
        status: verificationResult.status,
        compliance_score: this.calculateComplianceScore(verificationResult),
        completeness_score: verificationResult.completeness_score || 80,
        security_score: this.calculateSecurityScore(verificationResult),
        consistency_score: verificationResult.consistency_score || 75,
        documentation_score: verificationResult.documentation_score || 70,
        issues_critical: verificationResult.summary?.critical || 0,
        issues_major: verificationResult.summary?.major || 0,
        issues_minor: verificationResult.summary?.minor || 0,
      },

      // Performance metrics
      performance: {
        response_time_ms: performanceData.responsetime_ms || 0,
        token_usage: performanceData.token_usage || 0,
        cost_usd: performanceData.cost_usd || 0,
      },

      // Metadata
      input_complexity: this.assessComplexity(input),
      domain: domain,
      success: verificationResult.status !== 'REJECTED',
    };

    // Save to file
    this.saveOutputRecord(agentRole, promptVersion, record);

    // Invalidate cache for this version
    const cacheKey = `${agentRole}:${promptVersion}`;
    this.cache.delete(cacheKey);

    return outputId;
  }

  /**
   * Get aggregate metrics for a prompt version
   * @param {string} promptVersion - e.g., "architect-v1.0.0"
   * @returns {Object} Aggregate metrics
   */
  getAggregateMetrics(promptVersion) {
    const [role, version] = this.parsePromptVersion(promptVersion);

    // Check cache first
    const cacheKey = `${role}:${version}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Load outputs for this version
    const outputs = this.loadOutputsForVersion(role, version);

    if (outputs.length === 0) {
      return this.emptyAggregateMetrics(promptVersion);
    }

    // Calculate aggregates
    const aggregate = {
      prompt_version: promptVersion,
      total_outputs: outputs.length,
      success_rate: this.calculateSuccessRate(outputs),
      rejection_rate: this.calculateRejectionRate(outputs),
      rework_rate: this.calculateReworkRate(outputs),

      avg_compliance_score: this.calculateAverage(outputs, 'verification.compliance_score'),
      avg_completeness_score: this.calculateAverage(outputs, 'verification.completeness_score'),
      avg_security_score: this.calculateAverage(outputs, 'verification.security_score'),
      avg_consistency_score: this.calculateAverage(outputs, 'verification.consistency_score'),
      avg_documentation_score: this.calculateAverage(outputs, 'verification.documentation_score'),

      avg_response_time_ms: this.calculateAverage(outputs, 'performance.response_time_ms'),
      avg_token_usage: this.calculateAverage(outputs, 'performance.token_usage'),
      avg_cost_usd: this.calculateAverage(outputs, 'performance.cost_usd'),

      total_issues_critical: outputs.reduce((sum, o) => sum + (o.verification.issues_critical || 0), 0),
      total_issues_major: outputs.reduce((sum, o) => sum + (o.verification.issues_major || 0), 0),
      total_issues_minor: outputs.reduce((sum, o) => sum + (o.verification.issues_minor || 0), 0),
    };

    // Cache it
    this.cache.set(cacheKey, aggregate);

    return aggregate;
  }

  /**
   * Compare two prompt versions
   * @param {string} version1 - e.g., "architect-v1.0.0"
   * @param {string} version2 - e.g., "architect-v1.1.0"
   * @returns {Object} Comparison report
   */
  compareVersions(version1, version2) {
    const metrics1 = this.getAggregateMetrics(version1);
    const metrics2 = this.getAggregateMetrics(version2);

    // Calculate deltas
    const deltas = {
      compliance_score: metrics2.avg_compliance_score - metrics1.avg_compliance_score,
      success_rate: metrics2.success_rate - metrics1.success_rate,
      rework_rate: metrics1.rework_rate - metrics2.rework_rate, // Lower is better
      response_time: metrics1.avg_response_time_ms - metrics2.avg_response_time_ms, // Lower is better
    };

    // Determine if difference is significant
    const winner = this.determineWinner(metrics1, metrics2, deltas);

    return {
      version1: version1,
      version2: version2,
      metrics1: metrics1,
      metrics2: metrics2,
      deltas: deltas,
      winner: winner,
      summary: this.generateComparisonSummary(version1, version2, deltas, winner),
    };
  }

  /**
   * Get version history (all versions for a role)
   * @param {string} role - Agent role (architect, backend, etc.)
   * @returns {Array} List of versions with aggregate metrics
   */
  getVersionHistory(role) {
    const roleDir = path.join(this.metricsDir, role);

    if (!fs.existsSync(roleDir)) {
      return [];
    }

    const versionDirs = fs.readdirSync(roleDir)
      .filter(f => fs.statSync(path.join(roleDir, f)).isDirectory());

    return versionDirs.map(version => {
      const metrics = this.getAggregateMetrics(`${role}-${version}`);
      return {
        version: `${role}-${version}`,
        total_outputs: metrics.total_outputs,
        success_rate: metrics.success_rate,
        avg_compliance_score: metrics.avg_compliance_score,
      };
    }).sort((a, b) => b.total_outputs - a.total_outputs);
  }

  /**
   * Calculate compliance score from verification result
   * @private
   */
  calculateComplianceScore(verificationResult) {
    const { critical = 0, major = 0, minor = 0 } = verificationResult.summary || {};

    // Score: 100 if no issues, -30 per critical, -10 per major, -5 per minor
    let score = 100 - (critical * 30) - (major * 10) - (minor * 5);
    return Math.max(0, Math.min(100, score)); // Clamp 0-100
  }

  /**
   * Calculate security score
   * @private
   */
  calculateSecurityScore(verificationResult) {
    // If any critical security issues, score is low
    const hasCritical = (verificationResult.issues || [])
      .some(i => i.severity === 'Critical' && i.category === 'Security');

    if (hasCritical) {
      return 0;
    }

    const { critical = 0, major = 0, minor = 0 } = verificationResult.summary || {};
    let score = 100 - (major * 20) - (minor * 5);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate success rate (% APPROVED)
   * @private
   */
  calculateSuccessRate(outputs) {
    const approved = outputs.filter(o => o.verification.status === 'APPROVED').length;
    return outputs.length > 0 ? (approved / outputs.length) : 0;
  }

  /**
   * Calculate rejection rate (% REJECTED)
   * @private
   */
  calculateRejectionRate(outputs) {
    const rejected = outputs.filter(o => o.verification.status === 'REJECTED').length;
    return outputs.length > 0 ? (rejected / outputs.length) : 0;
  }

  /**
   * Calculate rework rate (% FEEDBACK)
   * @private
   */
  calculateReworkRate(outputs) {
    const feedback = outputs.filter(o => o.verification.status === 'FEEDBACK').length;
    return outputs.length > 0 ? (feedback / outputs.length) : 0;
  }

  /**
   * Calculate average of a nested field
   * @private
   */
  calculateAverage(outputs, fieldPath) {
    if (outputs.length === 0) return 0;

    const sum = outputs.reduce((acc, output) => {
      const value = this.getNestedValue(output, fieldPath);
      return acc + (value || 0);
    }, 0);

    return sum / outputs.length;
  }

  /**
   * Get nested value from object (e.g., 'verification.compliance_score')
   * @private
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * Assess input complexity
   * @private
   */
  assessComplexity(input) {
    if (!input) return 'low';

    const length = input.length;
    if (length < 200) return 'low';
    if (length < 1000) return 'medium';
    return 'high';
  }

  /**
   * Determine which version is better
   * @private
   */
  determineWinner(metrics1, metrics2, deltas) {
    // Version 2 wins if:
    // - compliance score higher AND success rate higher
    // OR - compliance score significantly higher (>3 points)

    const complianceBetter = metrics2.avg_compliance_score > metrics1.avg_compliance_score;
    const successBetter = metrics2.success_rate > metrics1.success_rate;
    const complianceHigherBy = metrics2.avg_compliance_score - metrics1.avg_compliance_score;

    if (complianceBetter && successBetter) {
      return 'version2';
    }

    if (complianceHigherBy >= 3) {
      return 'version2';
    }

    if (metrics1.avg_compliance_score > metrics2.avg_compliance_score) {
      return 'version1';
    }

    return 'no-difference';
  }

  /**
   * Generate human-readable comparison summary
   * @private
   */
  generateComparisonSummary(v1, v2, deltas, winner) {
    const lines = [
      `Comparing ${v1} vs ${v2}`,
      `Compliance: ${deltas.compliance_score > 0 ? '+' : ''}${deltas.compliance_score.toFixed(1)}%`,
      `Success Rate: ${deltas.success_rate > 0 ? '+' : ''}${(deltas.success_rate * 100).toFixed(1)}%`,
      `Rework Reduction: ${deltas.rework_rate > 0 ? '+' : ''}${(deltas.rework_rate * 100).toFixed(1)}%`,
      `Response Time: ${deltas.response_time > 0 ? '+' : ''}${deltas.response_time.toFixed(0)}ms`,
      `Winner: ${winner}`,
    ];

    return lines.join('\n');
  }

  /**
   * Empty aggregate metrics (when no data)
   * @private
   */
  emptyAggregateMetrics(promptVersion) {
    return {
      prompt_version: promptVersion,
      total_outputs: 0,
      success_rate: 0,
      rejection_rate: 0,
      rework_rate: 0,
      avg_compliance_score: 0,
      avg_completeness_score: 0,
      avg_security_score: 0,
      avg_consistency_score: 0,
      avg_documentation_score: 0,
      avg_response_time_ms: 0,
      avg_token_usage: 0,
      avg_cost_usd: 0,
    };
  }

  /**
   * Save output record to file
   * @private
   */
  saveOutputRecord(agentRole, promptVersion, record) {
    // Parse promptVersion to extract actual version (e.g., "architect-v1.0.0" → "v1.0.0")
    const [role, version] = this.parsePromptVersion(promptVersion);
    const versionDir = path.join(this.metricsDir, role, version);
    this.ensureDirectoryPath(versionDir);

    const outputsFile = path.join(versionDir, 'outputs.json');
    const outputs = this.loadJson(outputsFile) || [];

    outputs.push(record);
    fs.writeFileSync(outputsFile, JSON.stringify(outputs, null, 2), 'utf8');
  }

  /**
   * Load outputs for a version
   * @private
   */
  loadOutputsForVersion(role, version) {
    const outputsFile = path.join(this.metricsDir, role, version, 'outputs.json');
    return this.loadJson(outputsFile) || [];
  }

  /**
   * Parse prompt version string
   * @private
   */
  parsePromptVersion(promptVersion) {
    // "architect-v1.0.0" → ["architect", "v1.0.0"]
    const match = promptVersion.match(/^(.+?)-(v\d+\.\d+\.\d+)$/);
    if (!match) {
      throw new Error(`Invalid prompt version format: ${promptVersion}`);
    }
    return [match[1], match[2]];
  }

  /**
   * Generate unique ID
   * @private
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Ensure metrics directory exists
   * @private
   */
  ensureDirectory() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  /**
   * Ensure directory path exists
   * @private
   */
  ensureDirectoryPath(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Load JSON file
   * @private
   */
  loadJson(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
    }
    return null;
  }

  /**
   * Get statistics
   */
  getStats() {
    const dirs = fs.readdirSync(this.metricsDir);
    let totalOutputs = 0;

    for (const roleDir of dirs) {
      const rolePath = path.join(this.metricsDir, roleDir);
      if (!fs.statSync(rolePath).isDirectory()) continue;

      const versions = fs.readdirSync(rolePath);
      for (const version of versions) {
        const outputsFile = path.join(rolePath, version, 'outputs.json');
        const outputs = this.loadJson(outputsFile) || [];
        totalOutputs += outputs.length;
      }
    }

    return {
      total_outputs: totalOutputs,
      cache_size: this.cache.size,
    };
  }
}

/**
 * Example usage (for testing)
 */
if (require.main === module) {
  const collector = new MetricsCollector();

  // Example: Record a single output
  const exampleOutput = {
    agentRole: 'architect',
    promptVersion: 'architect-v1.0.0',
    input: 'Design a REST API for user management',
    domain: 'api',
  };

  const exampleVerification = {
    status: 'APPROVED',
    summary: { critical: 0, major: 0, minor: 2 },
  };

  const examplePerformance = {
    responsetime_ms: 2340,
    token_usage: 1920,
    cost_usd: 0.055,
  };

  const outputId = collector.recordOutput(exampleOutput, exampleVerification, examplePerformance);
  console.log(`Recorded output: ${outputId}`);

  // Get aggregate metrics
  const agg = collector.getAggregateMetrics('architect-v1.0.0');
  console.log('\nAggregate Metrics:');
  console.log(JSON.stringify(agg, null, 2));

  // Get stats
  const stats = collector.getStats();
  console.log('\nCollector Stats:');
  console.log(JSON.stringify(stats, null, 2));
}

module.exports = MetricsCollector;
