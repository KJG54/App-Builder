/**
 * Approval Workflow
 *
 * Purpose: Implement ADR-SEC-001 approval tiers for review pipeline
 * Part of Phase 10: Review Pipeline + Observability
 *
 * Tiers:
 * - Tier 1: High confidence (>95 score) → Auto-approve
 * - Tier 2: Standard (80-95 score) → Code review required
 * - Tier 3: Low confidence (<80 score) → Approval + explanation required
 *
 * Usage:
 *   const workflow = new ApprovalWorkflow();
 *   const action = workflow.routeForApproval(reviewRecord);
 */

const fs = require('fs');
const path = require('path');

class ApprovalWorkflow {
  constructor(workflowDir = null) {
    if (!workflowDir) {
      workflowDir = path.resolve(__dirname, '..', 'approvals');
    }
    this.workflowDir = workflowDir;
    this.ensureWorkflowDirectory();
  }

  /**
   * Route a review for approval based on tier
   * @param {Object} review - Review record from pipeline
   * @returns {Object} Action to take {tier, action, approver_required, escalation}
   */
  routeForApproval(review) {
    const tier = review.approval.tier;
    const overallScore = review.scores.overall;

    if (tier === 'tier-1') {
      return this.handleTier1(review);
    } else if (tier === 'tier-2') {
      return this.handleTier2(review);
    } else if (tier === 'tier-3') {
      return this.handleTier3(review);
    }

    throw new Error(`Unknown approval tier: ${tier}`);
  }

  /**
   * Handle Tier 1: Auto-approval for high-confidence outputs
   * @private
   */
  handleTier1(review) {
    console.log(`⚡ Tier 1: Auto-approving ${review.id} (score: ${review.scores.overall.toFixed(1)})`);

    return {
      tier: 'tier-1',
      action: 'auto-approve',
      approver_required: false,
      explanation: 'High confidence output (>95% score). Auto-approved per ADR-SEC-001 Tier 1.',
      escalation: null,
      decision_deadline: null,
      next_step: 'implement',
    };
  }

  /**
   * Handle Tier 2: Code review required for standard outputs
   * @private
   */
  handleTier2(review) {
    console.log(`📋 Tier 2: Code review needed for ${review.id} (score: ${review.scores.overall.toFixed(1)})`);

    // Create review request
    const reviewRequest = {
      id: `code-review-${review.id}`,
      review_id: review.id,
      agent_role: review.agent_role,
      tier: 'tier-2',
      priority: this.calculatePriority(review.scores.overall),
      issues_count: review.verification.issues.length,
      issue_categories: review.verification.categories,
      requested_date: new Date().toISOString(),
      decision_deadline: this.calculateDeadline('code-review'),
      status: 'pending-review',
    };

    this.saveReviewRequest(reviewRequest);

    return {
      tier: 'tier-2',
      action: 'code-review',
      approver_required: true,
      approver_type: 'code-reviewer',
      explanation: 'Standard output requires code review per ADR-SEC-001 Tier 2.',
      review_request_id: reviewRequest.id,
      priority: reviewRequest.priority,
      decision_deadline: reviewRequest.decision_deadline,
      next_step: 'pending-review',
    };
  }

  /**
   * Handle Tier 3: Approval + explanation required for low-confidence outputs
   * @private
   */
  handleTier3(review) {
    console.log(`⚠️  Tier 3: Escalation needed for ${review.id} (score: ${review.scores.overall.toFixed(1)})`);

    // Find critical issues
    const criticalIssues = review.verification.issues.filter(i => i.severity === 'critical');
    const majorIssues = review.verification.issues.filter(i => i.severity === 'major');

    // Create escalation request
    const escalation = {
      id: `escalation-${review.id}`,
      review_id: review.id,
      agent_role: review.agent_role,
      tier: 'tier-3',
      score: review.scores.overall,
      critical_issues: criticalIssues.length,
      major_issues: majorIssues.length,
      top_issues: criticalIssues.slice(0, 3).map(i => ({
        id: i.id,
        category: i.category,
        message: i.message,
        severity: i.severity,
      })),
      requested_date: new Date().toISOString(),
      decision_deadline: this.calculateDeadline('escalation'),
      status: 'pending-approval',
      escalation_reason: this.generateEscalationReason(review),
    };

    this.saveEscalation(escalation);

    return {
      tier: 'tier-3',
      action: 'escalation',
      approver_required: true,
      approver_type: 'approval-authority',
      explanation: 'Low-confidence output requires escalation per ADR-SEC-001 Tier 3.',
      escalation_id: escalation.id,
      critical_issues: escalation.critical_issues,
      major_issues: escalation.major_issues,
      decision_deadline: escalation.decision_deadline,
      next_step: 'pending-approval',
    };
  }

  /**
   * Approve a review request (Tier 2)
   * @param {string} reviewRequestId - Review request ID
   * @param {string} approver - Approver name
   * @param {string} comments - Optional approval comments
   */
  approveReviewRequest(reviewRequestId, approver, comments = '') {
    const request = this.loadReviewRequest(reviewRequestId);
    if (!request) {
      throw new Error(`Review request not found: ${reviewRequestId}`);
    }

    request.status = 'approved';
    request.approver = approver;
    request.approval_comments = comments;
    request.decision_date = new Date().toISOString();

    this.saveReviewRequest(request);

    console.log(`✅ Approved code review ${reviewRequestId}`);
    return request;
  }

  /**
   * Request changes on a review request
   * @param {string} reviewRequestId - Review request ID
   * @param {string} reviewer - Reviewer name
   * @param {string} feedback - Feedback/requested changes
   */
  requestChanges(reviewRequestId, reviewer, feedback) {
    const request = this.loadReviewRequest(reviewRequestId);
    if (!request) {
      throw new Error(`Review request not found: ${reviewRequestId}`);
    }

    request.status = 'changes-requested';
    request.reviewer = reviewer;
    request.feedback = feedback;
    request.decision_date = new Date().toISOString();

    this.saveReviewRequest(request);

    console.log(`📝 Changes requested on ${reviewRequestId}`);
    return request;
  }

  /**
   * Approve an escalation (Tier 3)
   * @param {string} escalationId - Escalation ID
   * @param {string} approver - Approver name
   * @param {string} decision - "approve" or "reject"
   * @param {string} explanation - Approval/rejection explanation
   */
  approveEscalation(escalationId, approver, decision, explanation) {
    const escalation = this.loadEscalation(escalationId);
    if (!escalation) {
      throw new Error(`Escalation not found: ${escalationId}`);
    }

    if (!['approve', 'reject'].includes(decision)) {
      throw new Error(`Invalid decision: ${decision}`);
    }

    escalation.status = decision === 'approve' ? 'approved' : 'rejected';
    escalation.approver = approver;
    escalation.approval_explanation = explanation;
    escalation.decision_date = new Date().toISOString();

    this.saveEscalation(escalation);

    const action = decision === 'approve' ? '✅ Approved' : '❌ Rejected';
    console.log(`${action} escalation ${escalationId}`);

    return escalation;
  }

  /**
   * Get pending approvals
   * @param {string} approverType - Optional filter: "code-reviewer" or "approval-authority"
   * @returns {Object} Pending reviews and escalations
   */
  getPendingApprovals(approverType = null) {
    const reviewRequests = this.getPendingReviewRequests(approverType);
    const escalations = this.getPendingEscalations(approverType);

    return {
      pending_code_reviews: reviewRequests,
      pending_escalations: escalations,
      total_pending: reviewRequests.length + escalations.length,
    };
  }

  /**
   * Get approval statistics
   * @returns {Object} Approval statistics
   */
  getApprovalStats() {
    const reviewRequests = this.loadAllReviewRequests();
    const escalations = this.loadAllEscalations();

    const approvalRate = this.calculateApprovalRate(reviewRequests, escalations);
    const avgDecisionTime = this.calculateAvgDecisionTime(reviewRequests, escalations);
    const pendingCount = reviewRequests.filter(r => r.status === 'pending-review').length +
                         escalations.filter(e => e.status === 'pending-approval').length;

    return {
      total_reviews: reviewRequests.length,
      total_escalations: escalations.length,
      approval_rate: approvalRate,
      pending_approvals: pendingCount,
      avg_decision_time_hours: avgDecisionTime,
    };
  }

  /**
   * Calculate priority based on score
   * @private
   */
  calculatePriority(score) {
    if (score >= 90) return 'low';
    if (score >= 85) return 'medium';
    return 'high';
  }

  /**
   * Calculate decision deadline
   * @private
   */
  calculateDeadline(type) {
    const deadline = new Date();
    if (type === 'code-review') {
      deadline.setDate(deadline.getDate() + 1); // 1 day for code review
    } else if (type === 'escalation') {
      deadline.setDate(deadline.getDate() + 3); // 3 days for escalation
    }
    return deadline.toISOString();
  }

  /**
   * Generate escalation reason
   * @private
   */
  generateEscalationReason(review) {
    const issues = review.verification.issues;
    const critical = issues.filter(i => i.severity === 'critical').length;
    const major = issues.filter(i => i.severity === 'major').length;

    const reasons = [];
    if (critical > 0) reasons.push(`${critical} critical issue(s)`);
    if (major > 0) reasons.push(`${major} major issue(s)`);
    reasons.push(`Low quality score (${review.scores.overall.toFixed(1)}%)`);

    return reasons.join('; ');
  }

  /**
   * Calculate approval rate
   * @private
   */
  calculateApprovalRate(reviewRequests, escalations) {
    const approved = reviewRequests.filter(r => r.status === 'approved').length +
                     escalations.filter(e => e.status === 'approved').length;
    const total = reviewRequests.length + escalations.length;

    if (total === 0) return 0;
    return (approved / total * 100).toFixed(1);
  }

  /**
   * Calculate average decision time
   * @private
   */
  calculateAvgDecisionTime(reviewRequests, escalations) {
    const decided = reviewRequests.filter(r => r.decision_date) +
                    escalations.filter(e => e.decision_date);

    if (decided.length === 0) return 0;

    const totalTime = decided.reduce((sum, item) => {
      const requested = new Date(item.requested_date || item.requested_date);
      const decided = new Date(item.decision_date);
      return sum + (decided - requested);
    }, 0);

    return (totalTime / decided.length / (1000 * 60 * 60)).toFixed(1);
  }

  /**
   * Load pending review requests
   * @private
   */
  getPendingReviewRequests(approverType = null) {
    return this.loadAllReviewRequests().filter(r => {
      const isPending = r.status === 'pending-review';
      const matchesType = !approverType || approverType === 'code-reviewer';
      return isPending && matchesType;
    });
  }

  /**
   * Load pending escalations
   * @private
   */
  getPendingEscalations(approverType = null) {
    return this.loadAllEscalations().filter(e => {
      const isPending = e.status === 'pending-approval';
      const matchesType = !approverType || approverType === 'approval-authority';
      return isPending && matchesType;
    });
  }

  /**
   * Load all review requests
   * @private
   */
  loadAllReviewRequests() {
    const dir = path.join(this.workflowDir, 'review-requests');
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        } catch (error) {
          return null;
        }
      })
      .filter(r => r !== null);
  }

  /**
   * Load all escalations
   * @private
   */
  loadAllEscalations() {
    const dir = path.join(this.workflowDir, 'escalations');
    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        } catch (error) {
          return null;
        }
      })
      .filter(e => e !== null);
  }

  /**
   * Save review request
   * @private
   */
  saveReviewRequest(request) {
    const dir = path.join(this.workflowDir, 'review-requests');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${request.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(request, null, 2), 'utf8');
  }

  /**
   * Load review request
   * @private
   */
  loadReviewRequest(requestId) {
    const dir = path.join(this.workflowDir, 'review-requests');
    const filePath = path.join(dir, `${requestId}.json`);

    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading review request ${requestId}:`, error.message);
    }

    return null;
  }

  /**
   * Save escalation
   * @private
   */
  saveEscalation(escalation) {
    const dir = path.join(this.workflowDir, 'escalations');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${escalation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(escalation, null, 2), 'utf8');
  }

  /**
   * Load escalation
   * @private
   */
  loadEscalation(escalationId) {
    const dir = path.join(this.workflowDir, 'escalations');
    const filePath = path.join(dir, `${escalationId}.json`);

    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error loading escalation ${escalationId}:`, error.message);
    }

    return null;
  }

  /**
   * Ensure workflow directory exists
   * @private
   */
  ensureWorkflowDirectory() {
    if (!fs.existsSync(this.workflowDir)) {
      fs.mkdirSync(this.workflowDir, { recursive: true });
    }
  }
}

module.exports = ApprovalWorkflow;
