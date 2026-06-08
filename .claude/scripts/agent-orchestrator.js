/**
 * Agent Orchestrator
 * Coordinates multi-agent task execution with dependency tracking and context sharing
 * Integrates with Phase 12 audit logging and authorization
 * Integrates with Phase 5 Chroma context retrieval and Phase 13 Slack notifications
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MCPAuditLogger = require('./mcp-audit-logger');
const MCPAuthorization = require('./mcp-authorization');
const ApprovalWorkflow = require('./approval-workflow');
const { assembleContext } = require('./context-assembly');
const SlackNotifier = require('./slack-notifier');

class AgentOrchestrator {
  constructor(tasksDir = '.claude/tasks', projectName = 'ai-software-factory') {
    this.tasksDir = tasksDir;
    this.projectName = projectName;
    this.auditLogger = new MCPAuditLogger('.claude/mcp-audit');
    this.authorization = new MCPAuthorization();
    this.approvalWorkflow = new ApprovalWorkflow('.claude/approvals');
    this.slackNotifier = new SlackNotifier();

    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
  }

  /**
   * Generate unique IDs
   */
  generateId(prefix) {
    const timestamp = new Date().toISOString().split('T')[0];
    const hash = crypto.randomBytes(4).toString('hex').substring(0, 6);
    return `${prefix}-${timestamp}-${hash}`;
  }

  /**
   * Validate task has no circular dependencies
   * Uses depth-first search to detect cycles
   */
  validateNoDependencyCycles(subtasks) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (subtaskId) => {
      visited.add(subtaskId);
      recursionStack.add(subtaskId);

      const subtask = subtasks.find(s => s.id === subtaskId);
      const depIds = subtask?.depends_on_ids || [];

      for (const depId of depIds) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true; // Back edge found, cycle exists
        }
      }

      recursionStack.delete(subtaskId);
      return false;
    };

    // Check for cycles starting from each node
    for (const subtask of subtasks) {
      if (!visited.has(subtask.id)) {
        if (hasCycle(subtask.id)) {
          throw new Error(`Circular dependency detected in task dependencies`);
        }
      }
    }
  }

  /**
   * Create a new task with subtasks
   * @param {string} description - Task description (e.g., "Build user authentication")
   * @param {array} subtaskDefs - Array of { agent, description, depends_on: [ids or indices] }
   * @returns {object} Task record with ID-based dependencies
   */
  createTask(description, subtaskDefs) {
    // Validate inputs
    if (!description || description.trim().length === 0) {
      throw new Error('Task description is required and cannot be empty');
    }
    if (!Array.isArray(subtaskDefs) || subtaskDefs.length === 0) {
      throw new Error('At least one subtask is required');
    }

    // Validate each subtask definition
    for (let i = 0; i < subtaskDefs.length; i++) {
      const def = subtaskDefs[i];

      if (!def.agent) {
        throw new Error(`Subtask ${i}: agent is required`);
      }
      if (!def.description) {
        throw new Error(`Subtask ${i}: description is required`);
      }

      // Validate depends_on (can be indices or IDs at input)
      const depIndices = def.depends_on || [];
      for (const depIdx of depIndices) {
        if (!Number.isInteger(depIdx) || depIdx < 0 || depIdx >= subtaskDefs.length) {
          throw new Error(`Subtask ${i}: invalid dependency index ${depIdx}`);
        }
        if (depIdx === i) {
          throw new Error(`Subtask ${i}: cannot depend on itself`);
        }
      }
    }

    const taskId = this.generateId('task');

    // Create subtasks and build mapping from indices to IDs
    const subtasks = subtaskDefs.map((def, idx) => ({
      id: `${taskId}-subtask-${String(idx + 1).padStart(3, '0')}`,
      index: idx,
      agent: def.agent,
      description: def.description,
      status: 'pending',
      depends_on_ids: [], // Will be populated below
      output_file: null,
      assigned_at: null,
      completed_at: null,
      error: null,
    }));

    // Convert index-based dependencies to ID-based dependencies
    for (let i = 0; i < subtasks.length; i++) {
      const depIndices = subtaskDefs[i].depends_on || [];
      subtasks[i].depends_on_ids = depIndices.map(idx => subtasks[idx].id);
    }

    // Validate for circular dependencies
    this.validateNoDependencyCycles(subtasks);

    const task = {
      id: taskId,
      description,
      status: 'pending',
      created: new Date().toISOString(),
      completed: null,
      subtasks,
    };

    this.writeTask(task);

    this.auditLogger.log('orchestrator', 'task-management', 'create_task', {
      task_id: taskId,
      subtask_count: subtasks.length,
    }, 'success', { duration_ms: 0 });

    return task;
  }

  /**
   * Get next subtask that is ready to assign (all dependencies complete)
   * Uses ID-based dependency lookup for robustness
   * @param {string} taskId
   * @returns {object} { subtask, context } or null if none available
   */
  getNextSubtask(taskId) {
    const task = this.readTask(taskId);
    if (!task) return null;

    for (const subtask of task.subtasks) {
      if (subtask.status !== 'pending') continue;

      // Check if all dependencies are complete (ID-based lookup)
      const depIds = subtask.depends_on_ids || [];
      const depsComplete = depIds.every(depId => {
        const depSubtask = task.subtasks.find(s => s.id === depId);
        if (!depSubtask) {
          throw new Error(`Invalid dependency ID ${depId} in subtask ${subtask.id}`);
        }
        return depSubtask.status === 'complete';
      });

      if (!depsComplete) continue;

      // Get context from prior subtasks
      const context = this.getSharedContext(taskId, subtask.index);

      return {
        task_id: taskId,
        subtask,
        context,
      };
    }

    return null;
  }

  /**
   * Assign a subtask to an agent (mark it in_progress, validate authorization)
   * @param {string} taskId
   * @param {string} subtaskId
   * @returns {object} { allowed, subtask, context, reason? }
   */
  assignSubtask(taskId, subtaskId) {
    const task = this.readTask(taskId);
    const subtask = task.subtasks.find(s => s.id === subtaskId);

    if (!subtask) {
      return { allowed: false, reason: 'Subtask not found' };
    }

    if (subtask.status !== 'pending') {
      return { allowed: false, reason: `Subtask already ${subtask.status}` };
    }

    // Validate agent exists in authorization matrix
    if (!this.authorization.isValidAgent(subtask.agent)) {
      return { allowed: false, reason: `Unknown agent role: ${subtask.agent}` };
    }

    // Mark as assigned
    subtask.status = 'in_progress';
    subtask.assigned_at = new Date().toISOString();

    // Update task status to in_progress on first assignment
    if (task.status === 'pending') {
      task.status = 'in_progress';
    }

    this.writeTask(task);

    // Get context
    const context = this.getSharedContext(taskId, subtask.index);

    this.auditLogger.log('orchestrator', 'task-management', 'assign_subtask', {
      task_id: taskId,
      agent: subtask.agent,
    }, 'success');

    return {
      allowed: true,
      task_id: taskId,
      subtask,
      context,
    };
  }

  /**
   * Complete a subtask and advance to next
   * @param {string} taskId
   * @param {string} subtaskId
   * @param {string} output - Work product/output from agent
   * @returns {object} { status, next_subtask? }
   */
  completeSubtask(taskId, subtaskId, output) {
    const task = this.readTask(taskId);
    const subtask = task.subtasks.find(s => s.id === subtaskId);

    if (!subtask) {
      return { status: 'error', reason: 'Subtask not found' };
    }

    // Validate subtask is in progress (state machine enforcement)
    if (subtask.status !== 'in_progress') {
      return { status: 'error', reason: `Cannot complete subtask with status '${subtask.status}' - must be in_progress` };
    }

    // Write output file
    const outputPath = path.join(this.tasksDir, `${subtask.id}-output.md`);
    fs.writeFileSync(outputPath, output, 'utf-8');

    // Update subtask
    subtask.status = 'complete';
    subtask.completed_at = new Date().toISOString();
    subtask.output_file = outputPath;

    // Check if all subtasks complete
    const allComplete = task.subtasks.every(s => s.status === 'complete');
    if (allComplete) {
      task.status = 'complete';
      task.completed = new Date().toISOString();
    } else {
      task.status = 'in_progress';
    }

    this.writeTask(task);

    this.auditLogger.log('orchestrator', 'task-management', 'complete_subtask', {
      task_id: taskId,
      agent: subtask.agent,
      all_complete: allComplete,
    }, 'success');

    // Send Slack notification (gracefully no-op if not configured)
    const nextSubtask = allComplete ? null : this.getNextSubtask(taskId);
    this.slackNotifier.notifySubtaskComplete(subtask, nextSubtask);

    // If task complete, also send task completion notification
    if (allComplete) {
      const taskStatus = this.getTaskStatus(taskId);
      this.slackNotifier.notifyTaskComplete(taskStatus);
    }

    return {
      status: allComplete ? 'task_complete' : 'subtask_complete',
      task_id: taskId,
      next_subtask: nextSubtask,
    };
  }

  /**
   * Escalate a subtask (mark blocked, trigger approval workflow)
   * @param {string} taskId
   * @param {string} subtaskId
   * @param {string} reason - Why escalation is needed
   * @returns {object} { status, escalation_id }
   */
  escalateSubtask(taskId, subtaskId, reason) {
    const task = this.readTask(taskId);
    const subtask = task.subtasks.find(s => s.id === subtaskId);

    if (!subtask) {
      return { status: 'error', reason: 'Subtask not found' };
    }

    subtask.status = 'blocked';
    subtask.error = reason;
    task.status = 'blocked';

    this.writeTask(task);

    const escalationId = this.generateId('escalation');

    // Route to Phase 10 approval workflow
    const escalationRecord = {
      id: escalationId,
      task_id: taskId,
      subtask_id: subtaskId,
      agent: subtask.agent,
      agent_description: subtask.description,
      reason: reason,
      task_description: task.description,
      requested_date: new Date().toISOString(),
      status: 'pending-approval',
    };

    try {
      this.approvalWorkflow.saveEscalation(escalationRecord);
    } catch (err) {
      console.error(`Error routing escalation ${escalationId} to approval workflow:`, err.message);
    }

    this.auditLogger.log('orchestrator', 'escalation', 'escalate_subtask', {
      task_id: taskId,
      subtask_id: subtaskId,
      agent: subtask.agent,
      reason,
      escalation_id: escalationId,
    }, 'escalation', { escalation_id: escalationId });

    // Send Slack escalation notification (gracefully no-op if not configured)
    const taskStatus = this.getTaskStatus(taskId);
    this.slackNotifier.notifyEscalation(taskStatus, subtask, reason);

    return {
      status: 'escalated',
      task_id: taskId,
      escalation_id: escalationId,
    };
  }

  /**
   * Get shared context for an agent (all prior work + Chroma context)
   * @param {string} taskId
   * @param {number} beforeSubtaskIndex - Only include subtasks before this index
   * @returns {object} { prior_outputs: [...], chroma_context: {...}, task_description, ... }
   */
  async getSharedContext(taskId, beforeSubtaskIndex = null) {
    const task = this.readTask(taskId);
    if (!task) return {};

    const priorOutputs = [];

    for (const subtask of task.subtasks) {
      if (beforeSubtaskIndex !== null && subtask.index >= beforeSubtaskIndex) {
        break;
      }

      if (subtask.status === 'complete' && subtask.output_file) {
        try {
          const content = fs.readFileSync(subtask.output_file, 'utf-8');
          priorOutputs.push({
            agent: subtask.agent,
            description: subtask.description,
            completed_at: subtask.completed_at,
            output: content,
          });
        } catch (err) {
          // Output file not found; skip
        }
      }
    }

    // Retrieve Chroma context (facts and standards from vault)
    let chromaContext = null;
    try {
      chromaContext = await assembleContext(
        task.description,
        this.projectName,
        { includeSession: false, maxResults: 5 }
      );
    } catch (err) {
      console.error(`Failed to retrieve Chroma context: ${err.message}`);
      chromaContext = { error: err.message };
    }

    return {
      task_id: taskId,
      task_description: task.description,
      prior_outputs: priorOutputs,
      completed_by: priorOutputs.map(p => p.agent),
      chroma_context: chromaContext,
    };
  }

  /**
   * Get full task status
   * @param {string} taskId
   * @returns {object} Task with stats
   */
  getTaskStatus(taskId) {
    const task = this.readTask(taskId);
    if (!task) return null;

    const completed = task.subtasks.filter(s => s.status === 'complete').length;
    const total = task.subtasks.length;
    const percentDone = total === 0 ? 0 : Math.round((completed / total) * 100);

    let duration = null;
    if (task.completed) {
      const start = new Date(task.created);
      const end = new Date(task.completed);
      duration = Math.round((end - start) / 1000 / 60); // minutes
    }

    return {
      ...task,
      stats: {
        completed,
        total,
        percent_done: percentDone,
        duration_minutes: duration,
      },
    };
  }

  /**
   * List all tasks, optionally filtered by status
   * @param {string} status - Filter by status (pending, in_progress, complete, blocked)
   * @returns {array} Task summaries
   */
  listTasks(status = null) {
    if (!fs.existsSync(this.tasksDir)) {
      return [];
    }

    const files = fs.readdirSync(this.tasksDir);
    const taskFiles = files.filter(f => f.startsWith('task-') && f.endsWith('.json'));

    const tasks = [];
    for (const file of taskFiles) {
      try {
        const content = fs.readFileSync(path.join(this.tasksDir, file), 'utf-8');
        const task = JSON.parse(content);

        if (status === null || task.status === status) {
          tasks.push(this.getTaskStatus(task.id));
        }
      } catch (err) {
        // Skip malformed files
      }
    }

    return tasks.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  /**
   * Helper: Read task from disk
   */
  readTask(taskId) {
    const filePath = path.join(this.tasksDir, `${taskId}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      return null;
    }
  }

  /**
   * Helper: Write task to disk
   */
  writeTask(task) {
    const filePath = path.join(this.tasksDir, `${task.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf-8');
  }

  /**
   * Get statistics across all tasks
   */
  getStatistics() {
    const tasks = this.listTasks();

    const stats = {
      total_tasks: tasks.length,
      by_status: {
        pending: 0,
        in_progress: 0,
        complete: 0,
        blocked: 0,
      },
      total_subtasks: 0,
      avg_subtasks_per_task: 0,
      completed_tasks: 0,
      blocked_tasks: 0,
    };

    for (const task of tasks) {
      stats.by_status[task.status]++;
      stats.total_subtasks += task.subtasks.length;

      if (task.status === 'complete') stats.completed_tasks++;
      if (task.status === 'blocked') stats.blocked_tasks++;
    }

    if (tasks.length > 0) {
      stats.avg_subtasks_per_task = (stats.total_subtasks / tasks.length).toFixed(1);
    }

    return stats;
  }
}

module.exports = AgentOrchestrator;
