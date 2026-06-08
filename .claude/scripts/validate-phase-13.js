/**
 * Phase 13 Validation Suite
 * Tests agent orchestrator, task management, and workflow coordination
 * Run: node .claude/scripts/validate-phase-13.js
 */

const fs = require('fs');
const path = require('path');
const AgentOrchestrator = require('./agent-orchestrator');
const SlackNotifier = require('./slack-notifier');

class Phase13Validator {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.testDir = path.join('.claude', '.test-phase13');
  }

  log(message) {
    console.log(message);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async test(name, fn) {
    this.totalTests++;
    try {
      await fn.call(this);
      this.passedTests++;
      this.testResults.push({ name, status: 'PASS' });
      this.log(`✓ Test ${this.totalTests}: ${name}`);
    } catch (err) {
      this.testResults.push({ name, status: 'FAIL', error: err.message });
      this.log(`✗ Test ${this.totalTests}: ${name}`);
      this.log(`  Error: ${err.message}`);
      if (err.stack) {
        this.log(`  Stack: ${err.stack.split('\n').slice(0, 3).join('\n  ')}`);
      }
    }
  }

  cleanup() {
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true });
    }
  }

  // Test 1: Orchestrator creates task with subtasks
  testCreateTask() {
    return this.test('Orchestrator creates task with subtasks', () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Build user authentication', [
        { agent: 'architect', description: 'Design auth API', depends_on: [] },
        { agent: 'backend', description: 'Implement auth endpoints', depends_on: [0] },
        { agent: 'qa', description: 'Write integration tests', depends_on: [1] },
      ]);

      this.assert(task.id, 'Task ID generated');
      this.assert(task.subtasks.length === 3, 'Task has 3 subtasks');
      this.assert(task.subtasks[0].agent === 'architect', 'Subtask 0 is architect');
      this.assert(task.subtasks[1].agent === 'backend', 'Subtask 1 is backend');
      this.assert(task.subtasks[2].agent === 'qa', 'Subtask 2 is QA');
      this.assert(task.status === 'pending', 'Task status is pending');
    });
  }

  // Test 2: Dependencies are respected (B waits for A)
  testDependencies() {
    return this.test('Dependencies are respected; getNextSubtask returns in order', async () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Three-step process', [
        { agent: 'backend', description: 'Step 1', depends_on: [] },
        { agent: 'qa', description: 'Step 2', depends_on: [0] },
        { agent: 'architect', description: 'Step 3', depends_on: [1] },
      ]);

      // First subtask should be available
      let next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'backend', 'First subtask is backend');
      this.assert(next.subtask.index === 0, 'First subtask index is 0');

      // Assign then complete first subtask
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, 'Output from step 1');

      // Second subtask should now be available
      next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'qa', 'Second subtask is qa');

      // Assign then complete second subtask
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, 'Output from step 2');

      // Third subtask should now be available
      next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'architect', 'Third subtask is architect');
    });
  }

  // Test 3: Context sharing - agents see prior work
  testContextSharing() {
    return this.test('Context sharing: next agent sees prior agent output', async () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Two-step with context', [
        { agent: 'architect', description: 'Design API', depends_on: [] },
        { agent: 'backend', description: 'Implement API', depends_on: [0] },
      ]);

      // Architect completes
      let next = await o.getNextSubtask(task.id);
      const architectOutput = '# API Design\n\nGET /users\nPOST /users\nPUT /users/{id}';
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, architectOutput);

      // Backend gets next subtask with architect's context
      next = await o.getNextSubtask(task.id);
      this.assert(next.context.prior_outputs.length >= 1, 'Context has prior outputs');
      this.assert(next.context.prior_outputs.some(po => po.agent === 'architect'), 'Prior outputs include architect');
    });
  }

  // Test 4: Subtask assignment and completion flow
  testSubtaskFlow() {
    return this.test('Subtask assignment and completion flow works', async () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Simple task', [
        { agent: 'backend', description: 'Do work', depends_on: [] },
      ]);

      const subtask = task.subtasks[0];

      // Assign subtask
      const assigned = await o.assignSubtask(task.id, subtask.id);
      this.assert(assigned.allowed === true, 'Assignment allowed');
      this.assert(assigned.subtask.status === 'in_progress', 'Status changed to in_progress');

      // Complete subtask
      const completed = await o.completeSubtask(task.id, subtask.id, 'Work done!');
      this.assert(completed.status === 'task_complete', 'Task marked complete (only 1 subtask)');

      // Verify in task status
      const taskStatus = o.getTaskStatus(task.id);
      this.assert(taskStatus.status === 'complete', 'Task status is complete');
      this.assert(taskStatus.stats.percent_done === 100, 'Completion is 100%');
    });
  }

  // Test 5: Escalation marks subtask blocked
  testEscalation() {
    return this.test('Escalation marks subtask blocked and escalates', () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Task with escalation', [
        { agent: 'backend', description: 'Do work', depends_on: [] },
      ]);

      const subtask = task.subtasks[0];
      o.assignSubtask(task.id, subtask.id);

      // Escalate
      const escalation = o.escalateSubtask(task.id, subtask.id, 'Requires human approval');
      this.assert(escalation.status === 'escalated', 'Escalation status returned');
      this.assert(escalation.escalation_id, 'Escalation ID generated');

      // Verify task is blocked
      const taskStatus = o.getTaskStatus(task.id);
      this.assert(taskStatus.status === 'blocked', 'Task status is blocked');
      this.assert(taskStatus.subtasks[0].error === 'Requires human approval', 'Error stored');
    });
  }

  // Test 6: Slack notifications (with graceful no-op)
  testSlackNotifier() {
    return this.test('Slack notifier gracefully handles missing token', () => {
      // Ensure token is not set
      const oldToken = process.env.SLACK_TOKEN;
      delete process.env.SLACK_TOKEN;

      const notifier = new SlackNotifier();
      this.assert(notifier.isEnabled() === false, 'Notifier disabled without token');

      const result = notifier.notify('Test message');
      this.assert(result.success === true, 'Notification succeeds even when disabled');
      this.assert(result.reason === 'SLACK_TOKEN not set', 'Reason logged');

      const status = notifier.getStatus();
      this.assert(status.enabled === false, 'Status shows disabled');

      // Restore token if it existed
      if (oldToken) process.env.SLACK_TOKEN = oldToken;
    });
  }

  // Test 7: Task listing and filtering
  testTaskListing() {
    return this.test('Task listing and filtering by status works', async () => {
      const testDir = path.join(this.testDir, 'test7');
      const o = new AgentOrchestrator(testDir);

      // Create 3 tasks
      const task1 = o.createTask('Task 1', [
        { agent: 'backend', description: 'Work', depends_on: [] },
      ]);

      const task2 = o.createTask('Task 2', [
        { agent: 'backend', description: 'Work', depends_on: [] },
      ]);

      const task3 = o.createTask('Task 3', [
        { agent: 'backend', description: 'Work', depends_on: [] },
      ]);

      // Complete task 1
      const next1 = await o.getNextSubtask(task1.id);
      await o.assignSubtask(task1.id, next1.subtask.id);
      await o.completeSubtask(task1.id, next1.subtask.id, 'Done');

      // Assign task 2 (mark in_progress but don't complete)
      const next2 = await o.getNextSubtask(task2.id);
      await o.assignSubtask(task2.id, next2.subtask.id);

      // List all
      const all = o.listTasks();
      this.assert(all.length === 3, 'List shows 3 tasks');

      // List by status
      const complete = o.listTasks('complete');
      this.assert(complete.length === 1, 'Filter complete: 1 task (task1)');

      // task2 status changes to in_progress on first assignment
      const inProgress = o.listTasks('in_progress');
      this.assert(inProgress.length >= 1, 'Filter in_progress: at least 1 task');
    });
  }

  // Test 8: Statistics aggregation
  testStatistics() {
    return this.test('Statistics aggregation across tasks', () => {
      const testDir = path.join(this.testDir, 'test8');
      const o = new AgentOrchestrator(testDir);

      o.createTask('Task A', [
        { agent: 'a1', description: 'Step 1', depends_on: [] },
        { agent: 'a2', description: 'Step 2', depends_on: [0] },
      ]);

      o.createTask('Task B', [
        { agent: 'b1', description: 'Work', depends_on: [] },
      ]);

      const stats = o.getStatistics();
      this.assert(stats.total_tasks === 2, 'Total tasks: 2');
      this.assert(stats.total_subtasks === 3, 'Total subtasks: 3');
      this.assert(stats.avg_subtasks_per_task === '1.5', 'Average: 1.5');
      this.assert(stats.by_status.pending === 2, 'Pending: 2 tasks');
    });
  }

  // Test 9: Full multi-subtask workflow
  testFullWorkflow() {
    return this.test('Full workflow: design→implement→test with context flow', async () => {
      const o = new AgentOrchestrator(this.testDir);

      const task = o.createTask('Complete feature', [
        { agent: 'architect', description: 'Design feature API', depends_on: [] },
        { agent: 'backend', description: 'Implement endpoints', depends_on: [0] },
        { agent: 'qa', description: 'Write tests', depends_on: [1] },
      ]);

      // Architect designs
      let next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'architect', 'Architect gets first subtask');
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, '# API Design\nGET /feature\nPOST /feature');

      // Backend implements (receives architect context)
      next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'backend', 'Backend gets second subtask');
      this.assert(next.context.completed_by && next.context.completed_by.includes('architect'), 'Backend sees architect work');
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, '// Implement GET and POST endpoints');

      // QA tests (receives both prior contexts)
      next = await o.getNextSubtask(task.id);
      this.assert(next.subtask.agent === 'qa', 'QA gets third subtask');
      this.assert(next.context.completed_by && next.context.completed_by.length >= 2, 'QA sees 2+ prior agents');
      this.assert(next.context.prior_outputs && next.context.prior_outputs.length >= 2, 'QA has 2+ prior outputs');
      await o.assignSubtask(task.id, next.subtask.id);
      await o.completeSubtask(task.id, next.subtask.id, '// Write integration tests');

      // Verify task complete
      const final = o.getTaskStatus(task.id);
      this.assert(final.status === 'complete', 'Task is complete');
      this.assert(final.stats.percent_done === 100, 'Completion: 100%');
    });
  }

  // Test 10: Context isolation (agents don't see unrelated tasks)
  testContextIsolation() {
    return this.test('Context isolation: agents only see their task context', async () => {
      const o = new AgentOrchestrator(this.testDir);

      const taskA = o.createTask('Task A', [
        { agent: 'backend', description: 'Task A work', depends_on: [] },
      ]);

      const taskB = o.createTask('Task B', [
        { agent: 'backend', description: 'Task B work', depends_on: [] },
      ]);

      // Complete task A
      const nextA = await o.getNextSubtask(taskA.id);
      await o.assignSubtask(taskA.id, nextA.subtask.id);
      await o.completeSubtask(taskA.id, nextA.subtask.id, 'Task A output');

      // Get context for task B
      const nextB = await o.getNextSubtask(taskB.id);
      const contextB = nextB.context;

      // Verify task B context doesn't include task A
      this.assert(contextB.prior_outputs && contextB.prior_outputs.length === 0, 'Task B has no prior outputs');
      this.assert(contextB.task_id === taskB.id, 'Context is for task B');
    });
  }

  async run() {
    this.log('\n=== Phase 13 Validation Suite ===\n');

    await this.testCreateTask();
    await this.testDependencies();
    await this.testContextSharing();
    await this.testSubtaskFlow();
    await this.testEscalation();
    await this.testSlackNotifier();
    await this.testTaskListing();
    await this.testStatistics();
    await this.testFullWorkflow();
    await this.testContextIsolation();

    // Summary
    this.log(`\n=== Summary ===`);
    this.log(`Total: ${this.totalTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.totalTests - this.passedTests}`);

    // Cleanup
    this.cleanup();

    if (this.passedTests === this.totalTests) {
      this.log('\n✓ All tests passed!');
      return 0;
    } else {
      this.log(`\n✗ ${this.totalTests - this.passedTests} test(s) failed`);
      return 1;
    }
  }
}

if (require.main === module) {
  const validator = new Phase13Validator();
  validator.run().then(code => process.exit(code));
}

module.exports = Phase13Validator;
