---
type: Skill
name: "{{skill-identifier}}"
version: "1.0"
phase: {{phase-number}}
status: Draft
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, {{domain}}, {{pattern-type}}, {{additional-tags}}]
related: [{{ADR-references}}, {{standard-references}}, {{agent-references}}]
last_updated: "{{today}}"
created_date: {{today}}
created_by: {{agent-or-person-name}}
validation_status: Draft
maintenance_owner: {{team-or-role}}
next_review_date: {{3-months-from-today}}
---

# Skill: {{Full Skill Name}} v1.0

**Skill ID:** {{skill-identifier}}-v1.0  
**Domain:** {{Architecture | Implementation | Infrastructure | Cross-Cutting}}  
**Status:** 🔧 Draft  
**Complexity:** {{Low | Medium | High}} ({{estimated-time}} to implement)

---

## Problem Statement

You need to {{describe problem you're solving}}.

**Key Requirements:**
- {{requirement 1}}
- {{requirement 2}}
- {{requirement 3}}

This skill captures {{the solution pattern}} proven across {{N}} implementations.

---

## Solution: Architecture / Design Pattern

### Overview

{{High-level explanation of the solution. 1-2 paragraphs.}}

### Key Components

#### Component 1: {{Name}}
**Responsibility:** {{What does this component do?}}

**Pattern:** {{How does it work?}}

**Key Methods/Features:**
- {{method or feature 1}}
- {{method or feature 2}}
- {{method or feature 3}}

**Example:**
```{{language}}
// or describe the pattern in text if code isn't applicable
{{example code or pseudocode}}
```

#### Component 2: {{Name}}
{{Repeat structure above}}

#### Component 3: {{Name}}
{{Repeat structure above}}

### Architecture Diagram (Optional)

```
{{ASCII diagram or description of component interaction}}
```

---

## Checklist / Security / Quality Gates

Before implementing this pattern, verify:

- [ ] {{Gate 1}}
- [ ] {{Gate 2}}
- [ ] {{Gate 3}}
- [ ] {{Security concern 1}}
- [ ] {{Performance consideration 1}}
- [ ] {{Compliance requirement 1}}

---

## Component Implementation Guide

### Component 1: {{Name}}

**File:** `{{file path}}`

**Responsibilities:**
- {{responsibility 1}}
- {{responsibility 2}}

**Key Methods:**
- `method1() → return_type` — {{description}}
- `method2(param) → return_type` — {{description}}

**Example Implementation:**
```{{language}}
{{code example}}
```

### Component 2: {{Name}}

{{Repeat structure above}}

---

## When to Use This Skill

### ✅ Use This Skill When

- {{use case 1}}
- {{use case 2}}
- {{use case 3}}

### ❌ Don't Use This Skill When

- {{anti-pattern 1}}
- {{anti-pattern 2}}
- {{when to use a different skill}}

---

## Constraints & Prerequisites

### Technical Constraints

- **Requires:** {{dependency 1}} (version {{version}})
- **Requires:** {{dependency 2}}
- **Optional:** {{optional dependency}}

### Operational Constraints

- **Setup Time:** {{hours}} hours
- **Implementation Time:** {{weeks}} weeks
- **Deployment:** {{deployment strategy}}
- **Rollback Plan:** {{how to rollback}}

### Security Constraints

- **Mandatory:** {{security requirement 1}}
- **Mandatory:** {{security requirement 2}}
- **Required Review:** {{approval gates}}

---

## Dependencies

### Related Skills

- [[{{related-skill-v1.0}}]] — {{description}}
- [[{{related-skill-v2.0}}]] — {{description}}

### Required Standards

- {{Standard 1}} — {{why this applies}}
- {{Standard 2}} — {{why this applies}}

### External Tools

- {{Tool 1}} (version {{range}})
- {{Tool 2}} (optional, for {{use case}})

---

## Variations & Adaptations

### Variation 1: {{Use Case}}

**Context:** {{When would you use this variation?}}

**Adaptations:**
- {{adaptation 1}}
- {{adaptation 2}}

**Key Differences from Base Pattern:**
- {{difference 1}}

### Variation 2: {{Use Case}}

{{Repeat structure above}}

---

## Implementation Timeline

**Phase 1: {{Name}} ({{duration}})**
- [ ] {{task 1}}
- [ ] {{task 2}}
- **Deliverable:** {{what's complete}}

**Phase 2: {{Name}} ({{duration}})**
- [ ] {{task 1}}
- [ ] {{task 2}}
- **Deliverable:** {{what's complete}}

**Phase 3: {{Name}} ({{duration}})**
- [ ] {{task 1}}
- [ ] {{task 2}}
- **Deliverable:** {{what's complete}}

---

## Lessons Learned

### What Worked

✅ {{positive lesson 1}}  
✅ {{positive lesson 2}}  
✅ {{positive lesson 3}}

### What Surprised Us

⚠️ {{unexpected challenge 1}}  
⚠️ {{unexpected challenge 2}}

### What We'd Do Differently

🔧 {{improvement 1}}  
🔧 {{improvement 2}}

---

## Success Metrics

### Implementation Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to deliver | {{estimate}} | Project timeline |
| Code coverage | {{%}} | Test reports |
| Performance | {{benchmark}} | Load testing |
| Security | {{criteria}} | Audit results |

### Operational Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Uptime | {{%}} | Monitoring dashboard |
| Latency | {{ms}} | Request timing |
| Error rate | {{%}} | Log analysis |
| Adoption | {{%}} | Usage metrics |

---

## Related Skills

- [[{{skill-v1.0}}]] — {{description}}
- [[{{skill-v2.0}}]] — {{description}}

**See also:** [[README.md|Skills System Overview]]

---

## Deprecation Notes

(This section is empty for new skills. When a newer version is created, document: "Use v2.0 instead because...")

---

## Quick Reference

**Problem:** {{Problem in one sentence}}  
**Solution:** {{Solution in one sentence}}  
**Time:** {{hours/weeks}} to implement  
**Complexity:** {{Low|Medium|High}}  
**Maintenance Owner:** {{Team}}  
**Review Cycle:** {{3 months | 6 months | yearly}}

**Use this skill if you're:**
- ✅ {{use case 1}}
- ✅ {{use case 2}}

**Don't use this skill if you're:**
- ❌ {{anti-pattern 1}}
- ❌ {{anti-pattern 2}}

---

## How to Use This Template

1. **Copy this file** to `Vault/05-Prompts/Skills/{{Domain}}/{{skill-name}}-v1.0.md`
2. **Replace all `{{...}}` placeholders** with your content
3. **Keep the YAML frontmatter** (metadata at top)
4. **Set `status: Draft`** initially
5. **Request review** by setting `validation_status: Under Review`
6. **Once approved**, change to `status: Active` and `validation_status: Approved`

---

**Skill Created:** {{today}}  
**Last Updated:** {{today}}  
**Status:** 🔧 Draft (awaiting review)  
**Next Steps:** Submit for {{team}} review
