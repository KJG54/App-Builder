/**
 * Review Pipeline
 *
 * Purpose: Orchestrate verification, metrics collection, and approval workflow
 * Part of Phase 10: Review Pipeline + Observability
 *
 * Usage:
 *   const pipeline = new ReviewPipeline();
 *   const result = pipeline.submitOutput(agentRole, promptVersion, output, input);
 *   const review = pipeline.getReviewStatus(reviewId);
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const VerificationRulesEngine = require('./verification-rules-engine.js');
const MetricsCollector = require('./metrics-collector.js');

class ReviewPipeline {
  constructor(reviewsDir = null) {
    if (!reviewsDir) {
      reviewsDir = path.resolve(__dirname, '..', 'reviews');
    }
    this.reviewsDir = reviewsDir;
    this.engine = new VerificationRulesEngine();
    this.collector = new MetricsCollector();
    this.ensureReviewsDirectory();
  }

  /**
   * Submit an agent output for review
   * @param {string} agentRole - Agent role (architect, backend, frontend, devops)
   * @param {string} promptVersion - Prompt version (e.g., "backend-v1.0.0")
   * @param {string} output - The agent output to review (design, code, etc.)
   * @param {string} input - The original input/prompt
   * @param {Object} performanceData - Optional performance metrics
   * @returns {Object} Review record with ID and initial assessment
   */
  submitOutput(agentRole, promptVersion, output, input, performanceData = {}) {
    const reviewId = this.generateReviewId();

    // Run verification (Phase 8)
    const verification = this.engine.verify(output, agentRole, {});

    // Calculate scores
    const complianceScore = this.calculateComplianceScore(verification);
    const overallScore = this.calculateOverallScore(verification);

    // Determine approval tier
    const approvalTier = this.determineApprovalTier(overallScore);

    // Build review record
    const review = {
      id: reviewId,
      timestamp: new Date().toISOString(),
      agent_role: agentRole,
      prompt_version: promptVersion,

      verification: {
        status: verification.status,
        compliance_score: complianceScore,
        issues: verification.issues || [],
        categories: this.categorizeIssues(verification.issues || []),
      },

      scores: {
        compliance: complianceScore,
        overall: overallScore,
      },

      approval: {
        tier: approvalTier,
        status: this.getInitialApprovalStatus(approvalTier),
        reviewer: null,
        decision_date: null,
        feedback: null,
      },

      performance: {
        response_time_ms: performanceData.responsetime_ms || 0,
        token_usage: performanceData.token_usage || 0,
        cost_usd: performanceData.cost_usd || 0,
      },

      output_summary: output.substring(0, 1000),
      input_summary: input ? input.substring(0, 500) : '',
    };

    // Save review record
    this.saveReview(review);

    // Record in metrics system (Phase 9)
    this.recordInMetrics(agentRole, promptVersion, output, verification, performanceData, reviewId);

    // Determine next step
    let nextStep = 'pending';
    if (approvalTier === 'tier-1') {
      nextStep = 'approved';
      review.approval.status = 'approved';
      review.approval.decision_date = new Date().toISOString();
    }

    return {
      reviewId: reviewId,
      status: review.approval.status,
      compliance_score: complianceScore,
      overall_score: overallScore,
      approval_tier: approvalTier,
      next_step: nextStep,
      issues_count: (verification.issues || []).length,
    };
  }

  /**
   * Get review status
   * @param {string} reviewId - Review ID
   * @returns {Object} Full review record
   */
  getReviewStatus(reviewId) {
    const review = this.loadReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }
    return review;
  }

  /**
   * Approve an output
   * @param {string} reviewId - Review ID
   * @param {string} reviewer - Approver name
   */
  approveOutput(reviewId, reviewer = 'system') {
    const review = this.loadReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    review.approval.status = 'approved';
    review.approval.reviewer = reviewer;
    review.approval.decision_date = new Date().toISOString();

    this.saveReview(review);

    console.log(`✅ Approved ${reviewId} by ${reviewer}`);
    return review;
  }

  /**
   * Request feedback on output
   * @param {string} reviewId - Review ID
   * @param {string} feedback - Feedback message
   * @param {string} reviewer - Reviewer name
   */
  requestFeedback(reviewId, feedback, reviewer = 'system') {
    const review = this.loadReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    review.approval.status = 'feedback_requested';
    review.approval.reviewer = reviewer;
    review.approval.feedback = feedback;
    review.approval.decision_date = new Date().toISOString();

    this.saveReview(review);

    console.log(`📝 Feedback requested on ${reviewId}`);
    return review;
  }

  /**
   * Reject an output
   * @param {string} reviewId - Review ID
   * @param {string} reason - Rejection reason
   * @param {string} reviewer - Reviewer name
   */
  rejectOutput(reviewId, reason, reviewer = 'system') {
    const review = this.loadReview(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    review.approval.status = 'rejected';
    review.approval.reviewer = reviewer;
    review.approval.feedback = reason;
    review.approval.decision_date = new Date().toISOString();

    this.saveReview(review);

    console.log(`❌ Rejected ${reviewId}: ${reason}`);
    return review;
  }

  /**
   * Get pending reviews
   * @param {string} agentRole - Optional filter by agent role
   * @param {string} status - Optional filter by status
   * @returns {Array} Array of pending review records
   */
  getPendingReviews(agentRole = null, status = 'pending') {
    const files = fs.readdirSync(this.reviewsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(this.reviewsDir, f));

    const reviews = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (error) {
        return null;
      }
    }).filter(r => r !== null);

    return reviews.filter(r => {
      const roleMatch = !agentRole || r.agent_role === agentRole;
      const statusMatch = !status || r.approval.status === status;
      return roleMatch && statusMatch;
    });
  }

  /**
   * Get all reviews for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} agentRole - Optional filter by agent role
   * @returns {Array} Array of review records
   */
  getReviewsInDateRange(startDate, endDate, agentRole = null) {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const files = fs.readdirSync(this.reviewsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(this.reviewsDir, f));

    const reviews = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (error) {
        return null;
      }
    }).filter(r => r !== null);

    return reviews.filter(r => {
      const timestamp = new Date(r.timestamp).getTime();
      const inRange = timestamp >= startTime && timestamp <= endTime;
      const roleMatch = !agentRole || r.agent_role === agentRole;
      return inRange && roleMatch;
    });
  }

  /**
   * Calculate compliance score from verification results
   * @private
   */
  calculateComplianceScore(verification) {
    if (!verification.issues || verification.issues.length === 0) {
      return 100;
    }

    const issues = verification.issues;
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const majorCount = issues.filter(i => i.severity === 'major').length;
    const minorCount = issues.filter(i => i.severity === 'minor').length;

    // Score calculation: deduct points for each issue
    let score = 100;
    score -= criticalCount * 15;
    score -= majorCount * 8;
    score -= minorCount * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall quality score
   * @private
   */
  calculateOverallScore(verification) {
    if (!verification) {
      return 0;
    }

    const complianceScore = this.calculateComplianceScore(verification);
    const completenessScore = verification.completeness_score || 80;
    const securityScore = verification.security_score || 85;

    // Weighted average
    return (complianceScore * 0.5 + completenessScore * 0.3 + securityScore * 0.2);
  }

  /**
   * Determine approval tier based on overall score
   * @private
   */
  determineApprovalTier(overallScore) {
    if (overallScore >= 95) {
      return 'tier-1'; // Auto-approve
    } else if (overallScore >= 80) {
      return 'tier-2'; // Code review required
    } else {
      return 'tier-3'; // Approval + explanation required
    }
  }

  /**
   * Get initial approval status based on tier
   * @private
   */
  getInitialApprovalStatus(tier) {
    if (tier === 'tier-1') {
      return 'approved';
    }
    return 'pending';
  }

  /**
   * Categorize issues by type
   * @private
   */
  categorizeIssues(issues) {
    const categories = {
      security: 0,
      architecture: 0,
      testing: 0,
      coding: 0,
      documentation: 0,
    };

    issues.forEach(issue => {
      if (issue.category && categories.hasOwnProperty(issue.category)) {
        categories[issue.category]++;
      }
    });

    return categories;
  }

  /**
   * Record output in metrics system
   * @private
   */
  recordInMetrics(agentRole, promptVersion, output, verification, performanceData, reviewId) {
    try {
      const verificationResult = {
        status: verification.status,
        issues: verification.issues || [],
        summary: {
          critical: (verification.issues || []).filter(i => i.severity === 'critical').length,
          major: (verification.issues || []).filter(i => i.severity === 'major').length,
          minor: (verification.issues || []).filter(i => i.severity === 'minor').length,
        },
      };

      this.collector.recordOutput(
        { agentRole, promptVersion, input: output },
        verificationResult,
        performanceData
      );
    } catch (error) {
      console.error(`Failed to record metrics for review ${reviewId}:`, error.message);
    }
  }

  /**
   * Save review record to file
   * @private
   */
  saveReview(review) {
    const reviewPath = path.join(this.reviewsDir, `${review.id}.json`);
    fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2), 'utf8');
  }

  /**
   * Load review record from file
   * @private
   */
  loadReview(reviewId) {
    const reviewPath = path.join(this.reviewsDir, `${reviewId}.json`);

    try {
      if (fs.existsSync(reviewPath)) {
        return JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading review ${reviewId}:`, error.message);
    }

    return null;
  }

  /**
   * Generate review ID
   * @private
   */
  generateReviewId() {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex');
    return `review-${timestamp}-${random}`;
  }

  /**
   * Ensure reviews directory exists
   * @private
   */
  ensureReviewsDirectory() {
    if (!fs.existsSync(this.reviewsDir)) {
      fs.mkdirSync(this.reviewsDir, { recursive: true });
    }
  }
}

module.exports = ReviewPipeline;
