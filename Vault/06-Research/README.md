# Research Workspace

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

The **Research folder** is home for exploratory work, experiments, investigations, and vendor evaluations.

**Principle:** Everything here is **exploratory and not yet authoritative**. Research becomes facts only when it's published (migrated to Standards, ADRs, or Technologies).

---

## Types of Research

### Technology Spikes
Exploring how a technology works:
- "Can Chroma handle 100k documents?"
- "How does PostgreSQL handle migrations?"
- "What's the performance profile of FastAPI?"

### Architectural Exploration
Investigating design approaches:
- "Should we use microservices or monolith?"
- "What does a knowledge-first pipeline look like?"
- "How do we structure domains?"

### Vendor Evaluation
Comparing products or services:
- "Chroma vs. Pinecone vs. Weaviate?"
- "AWS vs. GCP vs. Azure?"
- "Python 3.10 vs. 3.11?"

### Experiments
Testing ideas before committing:
- "Can we batch Chroma queries?"
- "Does lazy-loading reduce API latency?"
- "What if we cache query results?"

### Investigations
Debugging and learning:
- "Why is deployment slow?"
- "How does Docker compose handle networking?"
- "What's the Obsidian plugin architecture?"

---

## Research Maturity Path

```
1. EXPLORATORY
   └─ Loose notes, unverified findings
      └─ Time: Days 1-2
      
2. IN-PROGRESS
   └─ Structured findings, preliminary conclusions
      └─ Time: Days 2-5
      
3. MATURE
   └─ Conclusions documented, tested, ready to publish
      └─ Time: Day 5+
      
4. PUBLISHED
   └─ Migrated to Standards / ADRs / Technologies
      └─ Final: Formal documentation in proper folder
```

---

## Research File Structure

```
Research/
├── Technology-Spikes/          # How does tech X work?
│   ├── Chroma-Indexing-Performance.md
│   └── PostgreSQL-Migration-Strategy.md
├── Architectural-Exploration/  # Design questions
│   ├── Microservices-vs-Monolith.md
│   └── Service-Boundary-Design.md
├── Vendor-Evaluation/          # Product comparisons
│   ├── VectorDB-Comparison.md
│   └── Cloud-Provider-Analysis.md
├── Experiments/                # Testing ideas
│   ├── Batch-Query-Performance.md
│   └── API-Caching-Viability.md
└── Investigations/             # Problem-solving
    ├── Deployment-Performance-Issue.md
    └── Docker-Networking-Debug.md
```

---

## Research Template

```markdown
# [Research Topic]

**Status:** Exploratory | In-Progress | Mature | Published  
**Started:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD  
**Owner:** [Your name or Claude model]

---

## Research Question

[What are we trying to learn?]

---

## Approach

[How are we investigating?]

---

## Findings

### Finding 1
[What did we learn?]

### Finding 2
[Next discovery...]

---

## Conclusion

[What's the takeaway? What should we do with this?]

---

## Next Steps

[If mature: where should this go? (Standards / ADR / Technology guide)]

---

## Links

- Related research: [[Other-Research.md]]
- If future ADR: Will become [[../07-Decisions/ADR-XXX-###.md|ADR-XXX-###]]

---

**Last Updated:** YYYY-MM-DD
```

---

## Publishing Research

When research is mature and ready to become authoritative knowledge:

1. **Decide destination:**
   - Technology finding → [[../02-Technologies/README.md|Technology guide]]
   - Architecture decision → [[../07-Decisions/README.md|New ADR]]
   - Best practice → [[../01-Standards/README.md|Standard update]]

2. **Create formal document** in destination folder

3. **Link back:** Research file should reference the published version

4. **Update research file status:** `Status: Published`

Example flow:
```
Research/Technology-Spikes/Chroma-Performance.md (Status: Mature)
    ↓
[[../02-Technologies/Chroma.md]] (Published)
    ↓
Chroma-Performance.md (Status: Published)
    └─ "See published version: [[../02-Technologies/Chroma.md]]"
```

---

## Archive Old Research

Research older than 3 months:
- If **mature but not published**: Extract insights into proper folder, then mark `Status: Archived`
- If **superseded**: Mark `Status: Archived` and link to newer research
- If **irrelevant**: Delete

---

## Chroma Indexing

Research documents are indexed to `{project}-research` collection:

```yaml
---
type: Research
status: Exploratory | In-Progress | Mature | Published
authority: sessions              # Not authoritative; exploratory
chroma_collection: {project}-research
tags: [topic-tags, investigation-type]
related: [related-research, future-ADR]
---
```

This allows agents to:
- Understand what's been explored
- Avoid re-doing research
- Build on prior investigations

---

## Research Do's & Don'ts

✅ **DO:**
- Explore freely (this is the safe space to experiment)
- Document findings clearly
- Link related research
- Mark status as you progress
- Publish when mature

❌ **DON'T:**
- Treat research as authority (it's not)
- Leave mature research unpublished indefinitely
- Create hard-to-find nested structures
- Forget to update status
- Leave dead-end research without conclusion

---

## When to Use Research vs. Inbox

| Situation | Use Inbox | Use Research |
|-----------|-----------|--------------|
| Quick note during session | ✅ | ❌ |
| Days-long exploration | ❌ | ✅ |
| Temporary draft | ✅ | ❌ |
| Multiple findings | ❌ | ✅ |
| Will be published | ❌ | ✅ |
| Will be deleted | ✅ | ❌ |

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../02-Technologies/README.md|Technology Guide]]
