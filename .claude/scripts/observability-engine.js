/**
 * Observability Engine
 *
 * Purpose: Aggregate metrics, detect anomalies, generate reports
 * Part of Phase 10: Review Pipeline + Observability
 *
 * Usage:
 *   const observability = new ObservabilityEngine();
 *   const metrics = observability.getRoleMetrics('architect', '7d');
 *   const dashboard = observability.getDashboard();
 */

const fs = require('fs');
const path = require('path');

class ObservabilityEngine {
  constructor(metricsDir = null, reviewsDir = null) {
    if (!metricsDir) {
      metricsDir = path.resolve(__dirname, '..', 'metrics');
    }
    if (!reviewsDir) {
      reviewsDir = path.resolve(__dirname, '..', 'reviews');
    }
    this.metricsDir = metricsDir;
    this.reviewsDir = reviewsDir;
  }

  /**
   * Get quality metrics for a role
   * @param {string} agentRole - Agent role (architect, backend, frontend, devops)
   * @param {string} timeRange - Time range ("7d", "30d", "all")
   * @returns {Object} Quality metrics and trend
   */
  getRoleMetrics(agentRole, timeRange = '7d') {
    const reviews = this.getReviewsForRole(agentRole, timeRange);

    if (reviews.length === 0) {
      return this.emptyMetrics();
    }

    // Calculate averages
    const avgCompliance = this.average(reviews.map(r => r.scores.compliance));
    const avgOverall = this.average(reviews.map(r => r.scores.overall));
    const approvalRate = reviews.filter(r => r.approval.status === 'approved').length / reviews.length;

    // Calculate issue breakdown
    const issueBreakdown = {
      critical: 0,
      major: 0,
      minor: 0,
    };

    reviews.forEach(r => {
      issueBreakdown.critical += (r.verification.issues || []).filter(i => i.severity === 'critical').length;
      issueBreakdown.major += (r.verification.issues || []).filter(i => i.severity === 'major').length;
      issueBreakdown.minor += (r.verification.issues || []).filter(i => i.severity === 'minor').length;
    });

    // Calculate trend
    const trend = this.calculateTrend(reviews);

    return {
      agent_role: agentRole,
      time_range: timeRange,
      total_reviews: reviews.length,
      avg_compliance_score: avgCompliance.toFixed(1),
      avg_overall_score: avgOverall.toFixed(1),
      approval_rate: (approvalRate * 100).toFixed(1),
      issue_breakdown: issueBreakdown,
      trend: trend,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get version performance comparison
   * @param {string} agentRole - Agent role
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Object} Comparison metrics
   */
  getVersionComparison(agentRole, version1, version2) {
    const reviews1 = this.getReviewsForVersion(agentRole, version1);
    const reviews2 = this.getReviewsForVersion(agentRole, version2);

    if (reviews1.length === 0 || reviews2.length === 0) {
      return {
        error: 'Insufficient data for comparison',
        version1_count: reviews1.length,
        version2_count: reviews2.length,
      };
    }

    const metrics1 = this.calculateVersionMetrics(reviews1, version1);
    const metrics2 = this.calculateVersionMetrics(reviews2, version2);

    // Calculate deltas
    const scoreComplianceDelta = metrics2.avg_compliance - metrics1.avg_compliance;
    const approvalRateDelta = metrics2.approval_rate - metrics1.approval_rate;

    // Determine recommendation
    let recommendation = 'equivalent';
    if (scoreComplianceDelta > 2) {
      recommendation = 'promote-v2';
    } else if (scoreComplianceDelta < -2) {
      recommendation = 'revert-v1';
    }

    return {
      version1: {
        name: version1,
        count: reviews1.length,
        ...metrics1,
      },
      version2: {
        name: version2,
        count: reviews2.length,
        ...metrics2,
      },
      deltas: {
        compliance_delta: scoreComplianceDelta.toFixed(1),
        approval_rate_delta: approvalRateDelta.toFixed(1),
      },
      recommendation: recommendation,
    };
  }

  /**
   * Detect quality anomalies
   * @param {string} agentRole - Agent role
   * @returns {Object} Detected anomalies
   */
  detectAnomalies(agentRole) {
    const reviews = this.getReviewsForRole(agentRole, '30d');

    if (reviews.length < 5) {
      return {
        agent_role: agentRole,
        alert_count: 0,
        alerts: [],
      };
    }

    const alerts = [];

    // Check for quality drops
    const trendAnalysis = this.analyzeTrend(reviews);
    if (trendAnalysis.slope < -0.5) {
      alerts.push({
        type: 'quality-drop',
        severity: 'high',
        message: `Quality declining: ${trendAnalysis.recent_avg.toFixed(1)}% vs ${trendAnalysis.baseline_avg.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check for high issue rate
    const totalIssues = reviews.reduce((sum, r) => sum + (r.verification.issues || []).length, 0);
    const avgIssuesPerReview = totalIssues / reviews.length;

    if (avgIssuesPerReview > 5) {
      alerts.push({
        type: 'high-issue-rate',
        severity: 'medium',
        message: `High issue rate: ${avgIssuesPerReview.toFixed(1)} issues/review`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check for low approval rate
    const approvalRate = reviews.filter(r => r.approval.status === 'approved').length / reviews.length;
    if (approvalRate < 0.7) {
      alerts.push({
        type: 'low-approval-rate',
        severity: 'medium',
        message: `Low approval rate: ${(approvalRate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      agent_role: agentRole,
      alert_count: alerts.length,
      alerts: alerts,
    };
  }

  /**
   * Get pipeline health dashboard
   * @returns {Object} Dashboard data
   */
  getDashboard() {
    const allReviews = this.loadAllReviews();
    const roles = ['architect', 'backend', 'frontend', 'devops'];

    // Calculate overall metrics
    const totalReviews = allReviews.length;
    const approvalRate = allReviews.length > 0
      ? (allReviews.filter(r => r.approval.status === 'approved').length / allReviews.length * 100).toFixed(1)
      : 0;

    const avgQuality = allReviews.length > 0
      ? this.average(allReviews.map(r => r.scores.overall)).toFixed(1)
      : 0;

    // Get metrics for each role
    const roleMetrics = {};
    roles.forEach(role => {
      roleMetrics[role] = this.getRoleMetrics(role, '7d');
    });

    // Detect all anomalies
    const activeAlerts = [];
    roles.forEach(role => {
      const anomalies = this.detectAnomalies(role);
      anomalies.alerts.forEach(alert => {
        activeAlerts.push({ ...alert, agent_role: role });
      });
    });

    // Get top issues
    const topIssues = this.getTopIssues(10);

    return {
      summary: {
        total_reviews: totalReviews,
        approval_rate: approvalRate,
        avg_quality_score: avgQuality,
        active_alerts: activeAlerts.length,
      },
      by_role: roleMetrics,
      active_alerts: activeAlerts.slice(0, 5),
      top_issues: topIssues,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate detailed report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} agentRole - Optional filter by role
   * @returns {Object} Detailed report
   */
  generateReport(startDate, endDate, agentRole = null) {
    const reviews = this.getReviewsInDateRange(startDate, endDate, agentRole);

    if (reviews.length === 0) {
      return {
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        agent_role: agentRole,
        error: 'No reviews in period',
      };
    }

    // Calculate metrics
    const avgCompliance = this.average(reviews.map(r => r.scores.compliance));
    const avgOverall = this.average(reviews.map(r => r.scores.overall));
    const approvalRate = reviews.filter(r => r.approval.status === 'approved').length / reviews.length;

    // Issue summary
    const issueSummary = {};
    reviews.forEach(r => {
      (r.verification.issues || []).forEach(issue => {
        const category = issue.category || 'unknown';
        issueSummary[category] = (issueSummary[category] || 0) + 1;
      });
    });

    // Performance summary
    const avgResponseTime = this.average(reviews.map(r => r.performance.response_time_ms));
    const avgTokenUsage = this.average(reviews.map(r => r.performance.token_usage));
    const totalCost = reviews.reduce((sum, r) => sum + (r.performance.cost_usd || 0), 0);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      agent_role: agentRole,
      review_count: reviews.length,
      quality: {
        avg_compliance_score: avgCompliance.toFixed(1),
        avg_overall_score: avgOverall.toFixed(1),
        approval_rate: (approvalRate * 100).toFixed(1),
      },
      issues: issueSummary,
      performance: {
        avg_response_time_ms: avgResponseTime.toFixed(0),
        avg_token_usage: avgTokenUsage.toFixed(0),
        total_cost_usd: totalCost.toFixed(3),
      },
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Get top issues across all reviews
   * @private
   */
  getTopIssues(limit = 10) {
    const allReviews = this.loadAllReviews();
    const issueCounts = {};

    allReviews.forEach(review => {
      (review.verification.issues || []).forEach(issue => {
        const key = `${issue.category}-${issue.id}`;
        if (!issueCounts[key]) {
          issueCounts[key] = {
            id: issue.id,
            category: issue.category,
            message: issue.message,
            count: 0,
          };
        }
        issueCounts[key].count++;
      });
    });

    return Object.values(issueCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Calculate version metrics
   * @private
   */
  calculateVersionMetrics(reviews, version) {
    return {
      avg_compliance: this.average(reviews.map(r => r.scores.compliance)).toFixed(1),
      avg_overall: this.average(reviews.map(r => r.scores.overall)).toFixed(1),
      approval_rate: (reviews.filter(r => r.approval.status === 'approved').length / reviews.length * 100).toFixed(1),
    };
  }

  /**
   * Calculate trend (improvement or degradation)
   * @private
   */
  calculateTrend(reviews) {
    if (reviews.length < 2) return 'insufficient-data';

    const firstHalf = reviews.slice(0, Math.floor(reviews.length / 2));
    const secondHalf = reviews.slice(Math.floor(reviews.length / 2));

    const firstAvg = this.average(firstHalf.map(r => r.scores.overall));
    const secondAvg = this.average(secondHalf.map(r => r.scores.overall));

    const delta = secondAvg - firstAvg;

    if (Math.abs(delta) < 1) return 'stable';
    return delta > 0 ? 'improving' : 'degrading';
  }

  /**
   * Analyze trend details
   * @private
   */
  analyzeTrend(reviews) {
    const scores = reviews.map(r => r.scores.overall);

    const baseline = this.average(scores.slice(0, Math.floor(scores.length / 2)));
    const recent = this.average(scores.slice(Math.floor(scores.length / 2)));

    const slope = (recent - baseline) / Math.max(1, scores.length / 2);

    return {
      baseline_avg: baseline,
      recent_avg: recent,
      slope: slope,
    };
  }

  /**
   * Get reviews for a specific role
   * @private
   */
  getReviewsForRole(agentRole, timeRange) {
    const endDate = new Date();
    const startDate = new Date();

    if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }

    return this.getReviewsInDateRange(startDate, endDate, agentRole);
  }

  /**
   * Get reviews for a specific version
   * @private
   */
  getReviewsForVersion(agentRole, version) {
    const allReviews = this.loadAllReviews();
    return allReviews.filter(r => r.agent_role === agentRole && r.prompt_version === version);
  }

  /**
   * Get reviews in date range
   * @private
   */
  getReviewsInDateRange(startDate, endDate, agentRole = null) {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const allReviews = this.loadAllReviews();

    return allReviews.filter(r => {
      const timestamp = new Date(r.timestamp).getTime();
      const inRange = timestamp >= startTime && timestamp <= endTime;
      const roleMatch = !agentRole || r.agent_role === agentRole;
      return inRange && roleMatch;
    });
  }

  /**
   * Load all reviews
   * @private
   */
  loadAllReviews() {
    if (!fs.existsSync(this.reviewsDir)) {
      return [];
    }

    return fs.readdirSync(this.reviewsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(this.reviewsDir, f), 'utf8'));
        } catch (error) {
          return null;
        }
      })
      .filter(r => r !== null);
  }

  /**
   * Calculate average
   * @private
   */
  average(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Empty metrics object
   * @private
   */
  emptyMetrics() {
    return {
      total_reviews: 0,
      avg_compliance_score: 0,
      avg_overall_score: 0,
      approval_rate: 0,
      issue_breakdown: { critical: 0, major: 0, minor: 0 },
      trend: 'no-data',
    };
  }
}

module.exports = ObservabilityEngine;
