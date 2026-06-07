# Workflow — Debug Application

## Steps

1. Context Builder assembles: `global-known-problems`, `{project}-test-history`, relevant code, current architecture
2. Check `10-Known-Problems/` for matching symptoms
3. If known: apply documented resolution
4. If unknown: diagnose with QA Agent (Sonnet)
5. If complex: escalate to Opus
6. Document root cause and resolution in `10-Known-Problems/`
7. Ingest new entry into `global-known-problems`
8. Session summary updated

## Related

- [[10-Known-Problems]]
