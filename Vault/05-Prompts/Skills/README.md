---
type: Reference
phase: 7
status: Active
authority: facts
chroma_collection: global-standards
tags: [skills, learning, framework, agent-capabilities]
related: [ADR-ARCH-001, AI_SKILLS.md, Architect.md, Backend.md]
last_updated: 2026-06-08
---

# Skills System Overview

**What is a Skill?**

A skill is a **reusable solution to a problem class**, captured as a versioned, validated design pattern that agents can retrieve and apply.

**Why Skills?**

Without skills, agents solve the same problems repeatedly from first principles. With skills, agents recognize problem patterns, retrieve proven solutions, and apply them in minutes instead of hours.

**Example:**
- **Problem:** "Design a user authentication system"
- **Traditional:** Architect thinks 4+ hours, designs from scratch
- **With Skill:** Architect retrieves `user-authentication-system-design-v1.0` (validated pattern), applies to context in 30 minutes
- **Result:** 10x faster, consistent quality, documented lessons learned

---

## How to Use Skills

### For Agents: Retrieve and Apply

**Step 1: Query for available skills**

```javascript
assembleContext(
  "{{YOUR_TASK}}",
  "ai-software-factory",
  { includeSkills: true, skillDomains: ["Architecture"] }
)
```

**Example queries:**
- "Design user authentication system" → Returns `user-authentication-system-design-v1.0`
- "Implement REST API" → Returns `rest-api-implementation-v1.0`, `error-handling-patterns-v1.0`
- "Deploy to production" → Returns `docker-containerization-v1.0`, `ci-cd-pipeline-v1.0`

**Step 2: Review the skill**

When a skill is returned, read:
1. **Problem Statement** — Does it match your task?
2. **Solution Pattern** — Is the architecture applicable?
3. **Success Metrics** — Did it work before? How much faster/better?
4. **Lessons Learned** — What surprised the skill creator?
5. **Dependencies** — What other skills or standards does this depend on?

**Step 3: Apply the skill to your context**

Use the skill's:
- Architecture/design pattern
- Security checklist
- Component list
- Implementation timeline
- Related skills (for related problems)

**Step 4: Document in your output**

Reference the skill you used:
```markdown
## Design Approach

Applied skill: user-authentication-system-design-v1.0

**Architecture:**
[Your design, following the skill's pattern]

**Security Checklist:**
- [ ] OAuth 2.0 + OIDC (from skill)
- [ ] MFA required for admins (from skill)
- [ ] Audit logging (from skill)

**Timeline & Complexity:**
[Your estimate, informed by skill's timeline]

**Related Skills Applied:**
- oauth2-implementation-v1.0 (for OAuth component)
- mfa-provider-implementation-v1.0 (for MFA)
```

---

## How to Create Skills

### When to Create a Skill

**Create a skill when:**
- ✅ Solution took >4 hours (worth capturing)
- ✅ Solution is likely to recur (problem class, not one-off)
- ✅ Solution is domain-specific (domain knowledge, not generic)
- ✅ Solution can apply to multiple contexts (reusable pattern)
- ✅ Solution is validated (worked in production, success metrics clear)

**Don't create a skill when:**
- ❌ Solution is one-off or project-specific
- ❌ Solution is too simple (code snippet, not architecture)
- ❌ Solution is experimental (not yet validated)
- ❌ Solution already exists (check SKILLS-INDEX.md first)

### Skill Creation Workflow

**Step 1: Extract the Solution Pattern**

After solving a hard problem, ask:
- What was the **problem class**? (not just "user X", but "design auth system")
- What's the **core architecture**? (OAuth + MFA + audit logging)
- What's the **checklist**? (steps agents should follow)
- What are **key components**? (AuthService, TokenManager, MFAProvider)
- What's the **timeline**? (how long should this take?)

**Step 2: Create Skill File**

```bash
# File location
Vault/05-Prompts/Skills/{Domain}/{problem-class}-v1.0.md

# Example
Vault/05-Prompts/Skills/Architecture/user-authentication-system-design-v1.0.md
```

Use the skill template: [[../../Templates/Skill.md]]

**Step 3: Propose for Review**

1. Set `status: Draft`
2. Set `validation_status: Under Review`
3. Post for review with team
4. Reviewers check:
   - [ ] Problem statement is clear and reusable
   - [ ] Solution follows standards (ADRs, security)
   - [ ] Solution doesn't conflict with existing skills
   - [ ] Success metrics are measurable
   - [ ] Related skills identified

**Step 4: Approval**

Once approved:
1. Set `status: Active`
2. Set `validation_status: Approved`
3. Add `maintenance_owner` and `next_review_date` (3 months)
4. File indexed to Chroma (automatic)
5. Agents can now query and use the skill

---

## Skill Structure

### Metadata (YAML Frontmatter)

```yaml
---
type: Skill
name: "user-authentication-system-design"      # Kebab-case identifier
version: "1.0"                                   # Semantic versioning
phase: 7                                         # Phase when skill created
status: Active | Deprecated | Beta              # Current lifecycle state
authority: facts                                 # Skills are facts (authoritative)
chroma_collection: {project}-skills
tags: [skill, authentication, design-pattern]   # Searchable tags
related: [ADR-SEC-001, Security Standards, Backend Agent]
created_date: 2026-06-08
created_by: Architect Agent
validation_status: Approved | Under Review
maintenance_owner: Security Team
next_review_date: 2026-09-08                    # Review every 3 months
---
```

**Key Fields:**
- **name:** Problem class (kebab-case, lowercase)
- **version:** Semantic versioning (v1.0 stable, v1.1 minor update, v2.0 breaking change)
- **status:** Active = recommended, Deprecated = use v2.0 instead, Beta = not yet validated
- **validation_status:** Draft/Under Review/Approved (who approved?)
- **maintenance_owner:** Team responsible for keeping skill current
- **next_review_date:** When to check if still applicable (skills can rot)

### Content Structure

```markdown
# Skill: {{Full Name}} v{{version}}

## Problem Statement
What problem does this skill solve? Why does it matter? Who has it?

## Solution (Design Pattern)

### Architecture / Key Concepts
How do you solve it? What are the main components?

### Checklist / Implementation Steps
Concrete steps agents follow.

### Component List / Key Decisions
What parts, patterns, or decisions are involved?

### Implementation Timeline / Complexity
How long does it take? What's the effort?

## When to Use This Skill
- ✅ Use when: [conditions]
- ❌ Don't use when: [conditions]

## Constraints
Any limitations, security concerns, or required approvals?

## Dependencies
- Skill: {{related-skills}}
- Standard: {{required-standards}}
- Tool: {{required-tools}}

## Variations
Different contexts where this skill applies.

## Lessons Learned
What did we discover? What surprised us?

## Success Metrics
How do we know if the skill worked?

## Related Skills
[[other-skill-v1.0]]
[[other-skill-v2.0]]

## Deprecation Notes
(Empty until deprecated; then: "Use v2.0 instead because...")
```

---

## Skill Lifecycle

### States

```
Draft
  ↓ (author submits for review)
Under Review
  ↓ (approved by security/maintainer)
Active
  ↓ (new better skill created)
Deprecated
  ↓ (migrated to new version)
Archived
```

### Approval Process

**Draft → Under Review**
- Author: "Skill ready for review, set status = Under Review"
- Reviewers: Notified of new skill pending review

**Under Review → Active**
- Reviewers use checklist:
  - Problem statement is clear and reusable ✅
  - Solution follows standards (ADRs, security) ✅
  - Doesn't conflict with existing skills ✅
  - Success metrics measurable ✅
  - Related skills identified ✅
- Approver: Sets `status: Active`, `validation_status: Approved`
- Skill indexed to Chroma (agents can now query it)

**Active → Deprecated**
- When: New version created (v2.0)
- Action: Set `status: Deprecated` on v1.0
- Message: "Use {{new-skill-v2.0}} instead because..."
- Agents: See deprecation warning when querying

**Deprecated → Archived**
- When: All projects migrated to new version
- Action: Move to `Vault/05-Prompts/Skills/Deprecated/`
- Impact: No longer appears in default searches

---

## Versioning Rules

### Semantic Versioning: MAJOR.MINOR.PATCH

```
v1.0.0 = First stable release
v1.1.0 = Add new feature (new MFA method, optional)
v1.0.1 = Bug fix (typo, clarification)
v2.0.0 = Breaking change (OAuth → SAML)
```

### When to Bump

**v1.0 → v1.1 (MINOR)**
- Add optional new section
- Add new variation (mobile context)
- Improve existing section with examples
- Update lessons learned
- **Backward compatible:** Agents using v1.0 can upgrade to v1.1 without issues

**v1.0 → v1.0.1 (PATCH)**
- Fix typo or clarify wording
- Add example code
- Improve formatting
- **Backward compatible:** Only documentation, no content changes

**v1.0 → v2.0 (MAJOR)**
- Remove or change required section
- Replace core technology (OAuth → SAML)
- Fundamentally different approach
- **Breaking change:** Agents must consciously choose v1.0 or v2.0

### Deprecation Strategy

When creating v2.0:
1. New skill created as v2.0 (status: Beta initially)
2. v1.0 marked (status: Deprecated)
3. Deprecation note: "Use v2.0 instead because..."
4. Plan migration: "All projects should upgrade by {{date}}"
5. After migration: v1.0 moved to Deprecated/ folder

---

## Skill Management

### Master Index

See [[SKILLS-INDEX.md]] for:
- All skills across all domains
- Status (Active, Beta, Deprecated)
- Domain (Architecture, Implementation, Infrastructure, Cross-Cutting)
- Maintenance owner and next review date
- Quick reference table

### Domains

**Architecture Skills** — System design, component interaction, data flow
- `user-authentication-system-design-v1.0`
- `api-design-v1.0`
- `microservice-architecture-v1.0`
- `database-schema-design-v1.0`

**Implementation Skills** — Code patterns, libraries, frameworks
- `oauth2-implementation-v1.0`
- `rest-api-implementation-v1.0`
- `error-handling-patterns-v1.0`
- `testing-strategy-v1.0`

**Infrastructure Skills** — Deployment, monitoring, operations
- `docker-containerization-v1.0`
- `kubernetes-deployment-v1.0`
- `ci-cd-pipeline-v1.0`
- `monitoring-setup-v1.0`

**Cross-Cutting Skills** — Processes, practices applicable everywhere
- `code-review-process-v1.0`
- `documentation-generation-v1.0`
- `performance-optimization-v1.0`

---

## Retrieving Skills

### Query Examples

**Architect querying for design skills:**
```
Query: "design user authentication system"
Domain filter: Architecture
Result: user-authentication-system-design-v1.0 (relevance: 0.95)
```

**Backend querying for implementation:**
```
Query: "implement OAuth 2.0 integration"
Domain filter: Implementation
Result: oauth2-implementation-v1.0 (relevance: 0.92)
```

**DevOps querying for deployment:**
```
Query: "deploy application to production with Docker"
Domain filter: Infrastructure
Result: docker-containerization-v1.0 (relevance: 0.88)
```

### Caching

Skills are cached for **1 hour** (rarely change):
- First query: Hits Chroma (~200ms)
- Subsequent queries: In-memory cache (~5ms)
- Speedup: **40x faster** for repeated queries
- Cache invalidation: Automatic when skill updated

---

## Success Metrics

### For Skill Users (Agents)

✅ **Time Savings**
- Before: 4+ hours to design/implement from scratch
- After: 30-60 minutes applying skill pattern
- Metric: **10x faster** delivery

✅ **Quality Consistency**
- Before: Varies based on agent knowledge
- After: Follows validated pattern
- Metric: **Security audits pass 95%+ first time**

✅ **Knowledge Transfer**
- Before: Expert knowledge siloed
- After: Captured in skill + lessons learned
- Metric: **New team members can apply skill in week 1**

### For Skill Creators

✅ **Reuse Ratio**
- How many times was this skill applied after creation?
- Metric: **Skill applied to 2+ projects within 6 months**

✅ **Deprecation Rate**
- How long until skill superseded by v2.0?
- Metric: **Active skills maintained for 12+ months before deprecation**

✅ **Maintenance Load**
- How often does skill need updates?
- Metric: **Skill reviewed quarterly, minor updates only**

---

## Related Documentation

- [[ADR-ARCH-001]] — Knowledge-First Pipeline (skills are Phase 3: Learning)
- [[AI_SKILLS.md]] — Agent capabilities (skills expand these)
- [[Templates/Skill.md]] — Skill creation template
- [[SKILLS-INDEX.md]] — Master index of all skills

---

## FAQ

**Q: How is a skill different from a standard or ADR?**

A: 
- **Standard** = Rule everyone must follow (e.g., "always use HTTPS")
- **ADR** = Decision rationale (e.g., "we chose PostgreSQL because...")
- **Skill** = Solution pattern to a problem (e.g., "here's how to design auth")

**Q: Can agents create skills, or only humans?**

A: Agents can propose and create skills, but approval requires human review (security/domain expertise).

**Q: What if a skill becomes outdated?**

A: Mark it as Deprecated, create v2.0, and plan migration. Old skill remains available for reference.

**Q: How do I know which skill to use?**

A: Query Chroma with your problem statement. Relevance scores show best matches. Read the skill's "When to Use" section.

**Q: Can skills depend on other skills?**

A: Yes, skills can reference related skills in their Dependencies section. Agents retrieve the skill + its dependencies.

**Q: How long should I wait before creating a skill?**

A: After solving a problem successfully, validate it 2+ times before capturing as skill. This ensures it's truly reusable.

---

**Last Updated:** 2026-06-08  
**Next Review:** 2026-09-08
