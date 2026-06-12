---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Gitleaks

**Purpose:** Secret scanning — detects hardcoded API keys, tokens, passwords, and credentials in git history and staged files.

**Type:** CLI binary (not an MCP server)

**Integration:** Pre-commit hook + `npm run scan:secrets`

---

## Why It Exists

AI-assisted code generation increases the risk of accidentally committing secrets — an agent may include a literal API key in generated config, a test fixture, or a `.env` example. Gitleaks catches this at commit time, before the credential reaches remote history.

---

## Installation

```powershell
# Windows (winget)
winget install gitleaks

# Windows (scoop)
scoop install gitleaks

# macOS/Linux (brew)
brew install gitleaks
```

Verify: `gitleaks version`

---

## How It's Wired

### Pre-commit hook (automatic)

`.git/hooks/pre-commit` runs `gitleaks protect --staged` on every `git commit`. If a secret is found, the commit is blocked with an explanation.

This hook is **not committed to the repo** (lives in `.git/hooks/`) — each developer must install gitleaks locally. If gitleaks is absent, the hook warns but does not block.

### Manual full-repo scan

```bash
npm run scan:secrets
# equivalent: gitleaks detect --source . --no-git
```

Run this to scan all working-tree files regardless of git history.

### Scan git history

```bash
gitleaks detect --source .
```

Scans all commits in history — useful when first adopting gitleaks on an existing repo.

---

## False Positive Handling

Add an inline comment to suppress a specific finding:

```python
API_KEY = "test-key-not-real"  # gitleaks:allow
```

Or use a `.gitleaks.toml` allowlist file at the repo root.

---

## Integration Points

- Pairs with [[Semgrep.md]] — Gitleaks handles secrets, Semgrep handles code quality
- Run both via `npm run scan`
- Relevant before every PR — add to CI eventually

---

## References

- [Gitleaks GitHub](https://github.com/gitleaks/gitleaks)
- [[Semgrep.md]] — Companion SAST tool
- [[02-Technologies/README.md]] — Technology index
