---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Semgrep

**Purpose:** Static application security testing (SAST) and code quality analysis — catches OWASP vulnerabilities, anti-patterns, and policy violations in generated and human-written code.

**Type:** CLI tool (Python)

**Integration:** `npm run scan:code`

---

## Why It Exists

When the App Builder framework generates code, that code may contain security vulnerabilities (SQL injection, XSS, insecure deserialization, hardcoded paths, etc.) that pass unit tests but fail in production. Semgrep runs pattern-based rules against source files without executing them — it is language-agnostic and finds structural code issues that linters miss.

---

## Installation

```bash
pip install semgrep
```

Verify: `semgrep --version`

**Note:** Semgrep requires Python 3.8+. On Windows, ensure `python` resolves to Python 3.

---

## How It's Wired

### Manual scan (recommended before PRs)

```bash
npm run scan:code
# equivalent: semgrep --config=auto .
```

`--config=auto` fetches the recommended Semgrep ruleset for detected languages. Requires internet access on first run (rules are cached after).

### Targeted security scan

```bash
semgrep --config=p/owasp-top-ten .
semgrep --config=p/secrets .
semgrep --config=p/python .
```

### Scan specific files

```bash
semgrep --config=auto path/to/file.py
```

---

## Semgrep Is Not in the Pre-commit Hook

`--config=auto` fetches rules over the network (~1–3s). This makes it too slow for blocking every commit. Run it manually before opening a PR, or add it to a CI step.

---

## Rule Sources

| Config | Contents |
|--------|----------|
| `auto` | Recommended rules for detected languages |
| `p/owasp-top-ten` | OWASP Top 10 vulnerability patterns |
| `p/python` | Python-specific anti-patterns |
| `p/javascript` | JS/TS-specific anti-patterns |
| `p/secrets` | Credential patterns (complement to Gitleaks) |

---

## Integration Points

- Pairs with [[Gitleaks.md]] — Semgrep handles code quality, Gitleaks handles secrets
- Run both together: `npm run scan`
- Most valuable when reviewing AI-generated code before shipping

---

## References

- [Semgrep docs](https://semgrep.dev/docs/)
- [Semgrep registry](https://semgrep.dev/r)
- [[Gitleaks.md]] — Companion secret scanner
- [[02-Technologies/README.md]] — Technology index
