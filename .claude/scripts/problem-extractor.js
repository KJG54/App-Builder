/**
 * Problem Extractor
 *
 * Purpose: Identify recurring issues from observability data
 * Part of Phase 11: Known Problems Knowledge Base
 *
 * Usage:
 *   const extractor = new ProblemExtractor();
 *   const problems = extractor.extractProblems('7d', 3);
 *   const clusters = extractor.clusterRelatedIssues(problems);
 */

const fs = require('fs');
const path = require('path');

class ProblemExtractor {
  constructor(reviewsDir = null) {
    if (!reviewsDir) {
      reviewsDir = path.resolve(__dirname, '..', 'reviews');
    }
    this.reviewsDir = reviewsDir;
  }

  /**
   * Extract recurring issues from observability data
   * @param {string} timeRange - "7d", "30d", or "all"
   * @param {number} minOccurrences - Minimum occurrences to consider "recurring"
   * @returns {Object} Extracted problems with frequency and severity
   */
  extractProblems(timeRange = '7d', minOccurrences = 3) {
    const reviews = this.loadReviews(timeRange);

    if (reviews.length === 0) {
      return {
        time_range: timeRange,
        review_count: 0,
        problems: [],
      };
    }

    // Collect all issues from reviews
    const issueMap = {};

    reviews.forEach(review => {
      const issues = review.verification.issues || [];

      issues.forEach(issue => {
        const key = `${issue.category}-${issue.id}`;

        if (!issueMap[key]) {
          issueMap[key] = {
            id: issue.id,
            category: issue.category,
            message: issue.message,
            severity: issue.severity,
            occurrences: 0,
            agents_affected: new Set(),
            first_seen: review.timestamp,
            last_seen: review.timestamp,
            compliance_impact: [],
          };
        }

        const record = issueMap[key];
        record.occurrences++;
        record.agents_affected.add(review.agent_role);
        record.last_seen = review.timestamp;
        record.compliance_impact.push(review.scores.compliance);
      });
    });

    // Filter to recurring issues
    const problems = Object.values(issueMap)
      .filter(p => p.occurrences >= minOccurrences)
      .map(p => ({
        ...p,
        agents_affected: Array.from(p.agents_affected),
        avg_compliance_impact: this.average(p.compliance_impact),
        calculated_severity: this.calculateSeverity(p),
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    return {
      time_range: timeRange,
      review_count: reviews.length,
      min_occurrences: minOccurrences,
      recurring_problem_count: problems.length,
      problems: problems,
      extracted_at: new Date().toISOString(),
    };
  }

  /**
   * Analyze patterns in issue data
   * @param {Array} issues - Issue list from extractProblems
   * @returns {Object} Pattern analysis
   */
  analyzePatterns(issues) {
    if (issues.length === 0) {
      return {
        patterns: [],
        insights: 'No issues to analyze',
      };
    }

    const patterns = [];

    // Pattern 1: Issues by category
    const byCategory = {};
    issues.forEach(issue => {
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    });

    Object.entries(byCategory).forEach(([category, count]) => {
      if (count >= 2) {
        patterns.push({
          type: 'category-cluster',
          category: category,
          issue_count: count,
          description: `${count} recurring issues in ${category}`,
        });
      }
    });

    // Pattern 2: Issues by affected agent
    const byAgent = {};
    issues.forEach(issue => {
      issue.agents_affected.forEach(agent => {
        byAgent[agent] = (byAgent[agent] || 0) + 1;
      });
    });

    Object.entries(byAgent).forEach(([agent, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'agent-problem-concentration',
          agent: agent,
          issue_count: count,
          description: `${agent} agent has ${count} recurring issues`,
          recommendation: `Review and improve ${agent} agent output`,
        });
      }
    });

    // Pattern 3: High severity clustering
    const highSeverityIssues = issues.filter(i => ['critical', 'major'].includes(i.severity));
    if (highSeverityIssues.length >= 2) {
      patterns.push({
        type: 'high-severity-concentration',
        count: highSeverityIssues.length,
        description: `${highSeverityIssues.length} high-severity issues recurring`,
        recommendation: 'Prioritize fixes for these issues',
      });
    }

    return {
      pattern_count: patterns.length,
      patterns: patterns,
    };
  }

  /**
   * Cluster related issues together
   * @param {Array} issues - Issue list from extractProblems
   * @returns {Object} Clustered issues
   */
  clusterRelatedIssues(issues) {
    if (issues.length === 0) {
      return { clusters: [] };
    }

    const clusters = [];
    const processed = new Set();

    issues.forEach((issue, idx) => {
      if (processed.has(idx)) return;

      const cluster = {
        primary_issue: {
          id: issue.id,
          message: issue.message,
          occurrences: issue.occurrences,
        },
        related_issues: [],
        common_root_cause: null,
        agents_affected: new Set([...issue.agents_affected]),
        total_occurrences: issue.occurrences,
      };

      // Find related issues (same category or similar keywords)
      const keywords = this.extractKeywords(issue.message);

      issues.forEach((other, otherIdx) => {
        if (otherIdx === idx || processed.has(otherIdx)) return;

        const otherKeywords = this.extractKeywords(other.message);
        const commonKeywords = keywords.filter(k => otherKeywords.includes(k));

        // If same category or significant keyword overlap, consider related
        if (issue.category === other.category || commonKeywords.length >= 2) {
          cluster.related_issues.push({
            id: other.id,
            message: other.message,
            occurrences: other.occurrences,
          });
          cluster.total_occurrences += other.occurrences;
          other.agents_affected.forEach(a => cluster.agents_affected.add(a));
          processed.add(otherIdx);
        }
      });

      cluster.agents_affected = Array.from(cluster.agents_affected);

      // Infer common root cause
      if (issue.category === 'architecture') {
        cluster.common_root_cause = 'Architecture/design issue';
      } else if (issue.category === 'security') {
        cluster.common_root_cause = 'Security/compliance issue';
      } else if (issue.category === 'testing') {
        cluster.common_root_cause = 'Test coverage/quality issue';
      } else {
        cluster.common_root_cause = `Common ${issue.category} issue`;
      }

      clusters.push(cluster);
      processed.add(idx);
    });

    return {
      cluster_count: clusters.length,
      total_related_issues: issues.length,
      clusters: clusters.sort((a, b) => b.total_occurrences - a.total_occurrences),
    };
  }

  /**
   * Categorize an issue
   * @param {Object} issue - Issue to categorize
   * @returns {string} Category name
   */
  categorizeIssue(issue) {
    const categories = ['security', 'architecture', 'testing', 'coding', 'documentation'];

    // If issue has category, use it
    if (issue.category && categories.includes(issue.category)) {
      return issue.category;
    }

    // Try to infer from message keywords
    const message = (issue.message || '').toLowerCase();

    if (message.includes('security') || message.includes('auth') || message.includes('secret')) {
      return 'security';
    }
    if (message.includes('architecture') || message.includes('design') || message.includes('structure')) {
      return 'architecture';
    }
    if (message.includes('test') || message.includes('coverage') || message.includes('mock')) {
      return 'testing';
    }
    if (message.includes('code') || message.includes('format') || message.includes('style')) {
      return 'coding';
    }
    if (message.includes('doc') || message.includes('comment') || message.includes('readme')) {
      return 'documentation';
    }

    return 'unknown';
  }

  /**
   * Calculate severity based on impact
   * @private
   */
  calculateSeverity(problem) {
    const { occurrences, severity, avg_compliance_impact, agents_affected } = problem;

    // Base score from severity
    let score = 0;
    if (severity === 'critical') score = 40;
    else if (severity === 'major') score = 30;
    else if (severity === 'minor') score = 10;

    // Add impact from compliance
    const complianceLoss = 100 - avg_compliance_impact;
    score += complianceLoss * 0.3;

    // Add impact from frequency
    score += Math.min(occurrences * 5, 30);

    // Add impact from team width
    score += Math.min(agents_affected.length * 10, 20);

    // Determine final severity
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Extract keywords from text
   * @private
   */
  extractKeywords(text) {
    const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'and', 'or', 'not', 'if', 'this', 'that', 'these', 'those']);
    const words = text.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));
    return words;
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
   * Load reviews in time range
   * @private
   */
  loadReviews(timeRange) {
    if (!fs.existsSync(this.reviewsDir)) {
      return [];
    }

    const endDate = new Date();
    const startDate = new Date();

    if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    }
    // 'all' uses very old start date

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const files = fs.readdirSync(this.reviewsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(this.reviewsDir, f));

    return files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        const timestamp = new Date(data.timestamp).getTime();

        if (timestamp >= startTime && timestamp <= endTime) {
          return data;
        }
      } catch (error) {
        // Skip malformed files
      }
      return null;
    }).filter(r => r !== null);
  }
}

module.exports = ProblemExtractor;
