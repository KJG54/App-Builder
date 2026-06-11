---
type: template
status: active
last_updated: 2026-06-11
tags: [template, strategic-review, architecture, annual]
related: [Repository-Constitution.md, 07-Decisions/DECISIONS.md, simplification-audit-v1.0.md]
---

# Strategic Architecture Review Prompt

**Use:** Annually, or before major architectural pivots. NOT a regular skill — this prompt questions foundational decisions.

**Prerequisite:** Read all ADRs in `Vault/07-Decisions/` and the Repository Constitution before running this review. Recommendations that contradict a deliberate ADR must flag the conflict explicitly.

**Output:** Not a task list — an ideal-state design with a delta report comparing current state to ideal.

---

## How to Use

Copy this prompt into a Claude session (or invoke as a structured review). At the end, add:

> "Now compare this ideal design to the current repository. Produce a delta report: what matches the ideal (keep), what diverges (rebuild or remove), and what's acceptable technical debt (defer)."

---

## The Prompt

You are a senior software architect, AI systems engineer, and technical auditor.

Your task is to perform a "Day 0" design analysis of this project — what would it look like if designed optimally today from scratch?

**Important constraint:** You have already read all existing ADRs and the Repository Constitution. Where your ideal design conflicts with a deliberate architectural decision, flag the conflict rather than silently overriding it.

---

### Phase 1: Project Understanding

Analyze the repository and determine:
- Primary purpose and long-term goals
- Core functionality vs. optional features
- Current strengths and weaknesses

Provide a concise summary before continuing.

---

### Phase 2: Core Foundation

If starting from an empty repository today:
- What are the first 5 folders you create, and why?
- What are the first 5 files you create, and why?
- What documentation exists from Day 1?

---

### Phase 3: Essential Architecture

What are the absolute core systems? (Systems required before any feature development begins.) Explain why each is necessary.

---

### Phase 4: Tool Evaluation

For every tool currently available, answer: Keep, Remove, or Replace?

| Tool | Verdict | Reason |
|------|---------|--------|

---

### Phase 5: Skill Evaluation

- Essential skills (directly contribute to project success)
- Non-essential skills (add complexity without meaningful value)  
- Missing skills (should exist but don't)

---

### Phase 6: MCP Evaluation

For each MCP: Critical, Useful, Optional, or Unnecessary?

Which would you install first if starting from scratch?  
Which would you never install?

---

### Phase 7: Agent Architecture

What agents would exist? What agents should not exist?

---

### Phase 8: Ideal Repository Structure

Design the ideal directory tree with brief explanations.

---

### Phase 9: Build Order

If the repository were empty today, what is the ideal implementation sequence? Rank every major component by priority with reasoning.

---

### Phase 10: Ruthless Simplification

Assume the current project contains unnecessary complexity.

**The core question:** "If this project needed to be reduced by 50% while preserving 95% of its value, what would be removed first?"

Identify:
- Over-engineering
- Premature optimization  
- Redundant tooling
- Duplicate functionality
- Excessive documentation
- Unnecessary MCP servers
- Unnecessary skills

---

### Phase 11: Final Classification

Produce four lists:
- **Must Keep** — foundational
- **Should Keep** — useful but not critical
- **Should Rebuild** — right concept, needs redesign
- **Remove Entirely** — negative or zero value

---

### Phase 12: Delta Report (Critical — Do Not Skip)

Compare ideal state to current state:
- What matches the ideal? (Keep as-is)
- What diverges materially? (Rebuild or remove)
- What's acceptable technical debt? (Defer, document, revisit annually)
- What ADRs does this analysis conflict with? (Flag explicitly)

---

## Deliverables

1. Executive Summary
2. Ideal Folder Structure
3. Ideal Tool List
4. Ideal Skill List
5. Ideal MCP List
6. Agent Architecture
7. Build Order Roadmap
8. Simplification Opportunities
9. Keep / Rebuild / Remove Matrix
10. **Delta Report: Ideal vs. Current**

---

*This template is intentionally NOT a slash command. Strategic reviews that question foundational decisions should be deliberate, not casual.*
