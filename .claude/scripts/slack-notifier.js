/**
 * Slack Notifier
 * Sends notifications about task progress and escalations
 * Gracefully no-ops if SLACK_TOKEN not configured
 */

class SlackNotifier {
  constructor() {
    this.slackToken = process.env.SLACK_TOKEN;
    this.slackChannel = process.env.SLACK_CHANNEL || '#bot-notifications';
    this.enabled = !!this.slackToken;
  }

  /**
   * Post a message to Slack
   * @param {string} message - Message text (plain or markdown)
   * @param {string} channel - Slack channel (optional, uses default)
   * @returns {object} { success: bool, channel, message_id? }
   */
  notify(message, channel = null) {
    const targetChannel = channel || this.slackChannel;

    if (!this.enabled) {
      console.log(`[Slack-NoOp] ${targetChannel}: ${message}`);
      return { success: true, channel: targetChannel, message_id: 'noop', reason: 'SLACK_TOKEN not set' };
    }

    // In real implementation, would call Slack MCP server here
    // For now, log to console
    console.log(`[Slack] ${targetChannel}: ${message}`);

    return {
      success: true,
      channel: targetChannel,
      message_id: `msg-${Date.now()}`,
    };
  }

  /**
   * Notify task completion
   * @param {object} taskStatus - Task with stats from orchestrator.getTaskStatus()
   * @returns {object} { success, ... }
   */
  notifyTaskComplete(taskStatus) {
    const duration = taskStatus.stats.duration_minutes
      ? ` in ${taskStatus.stats.duration_minutes}m`
      : '';

    const message = `✅ **Task Complete**: ${taskStatus.description}
- Subtasks: ${taskStatus.stats.completed}/${taskStatus.stats.total}
- Duration:${duration}
- Status: ${taskStatus.status.toUpperCase()}`;

    return this.notify(message);
  }

  /**
   * Notify task escalation (blocked, requires human approval)
   * @param {object} taskStatus
   * @param {object} subtask - Subtask that failed
   * @param {string} reason - Why escalation is needed
   * @returns {object} { success, ... }
   */
  notifyEscalation(taskStatus, subtask, reason) {
    const message = `⚠️ **Escalation Required**
- Task: ${taskStatus.description}
- Agent: ${subtask.agent}
- Subtask: ${subtask.description}
- Reason: ${reason}
- Action: Awaiting human approval (Phase 10 approval workflow)`;

    return this.notify(message);
  }

  /**
   * Notify subtask completion (moving to next agent)
   * @param {object} subtask - Completed subtask
   * @param {object} nextSubtask - Next subtask (or null if task complete)
   * @returns {object} { success, ... }
   */
  notifySubtaskComplete(subtask, nextSubtask) {
    if (nextSubtask) {
      const message = `✓ ${subtask.agent} completed: ${subtask.description}
→ Next: ${nextSubtask.subtask.agent} will ${nextSubtask.subtask.description}`;
      return this.notify(message);
    } else {
      const message = `✓ ${subtask.agent} completed: ${subtask.description}
→ All subtasks done!`;
      return this.notify(message);
    }
  }

  /**
   * Notify task started
   * @param {object} task - New task record
   * @returns {object} { success, ... }
   */
  notifyTaskStarted(task) {
    const message = `🚀 **Task Started**: ${task.description}
- Subtasks: ${task.subtasks.length}
- Agents: ${Array.from(new Set(task.subtasks.map(s => s.agent))).join(', ')}`;

    return this.notify(message);
  }

  /**
   * Notify if Slack is enabled
   * @returns {bool}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get configuration status
   * @returns {object} { enabled, channel, reason? }
   */
  getStatus() {
    return {
      enabled: this.enabled,
      channel: this.slackChannel,
      reason: this.enabled ? 'SLACK_TOKEN set' : 'SLACK_TOKEN not configured',
    };
  }
}

module.exports = SlackNotifier;
