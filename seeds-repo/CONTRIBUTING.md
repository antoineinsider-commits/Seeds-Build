# Contributing to SEEDS

## Branching

- `main` — always deployable.
- `staging` — pre-production integration branch.
- Feature work happens on `feature/<short-description>` branches off
  `staging`, merged via pull request.

## Commits

Use conventional, imperative commit messages, e.g.:

```
feat(matching): add category weight to scoring
fix(auth): reject expired refresh tokens
docs(security): document IDOR test coverage
```

## Pull requests

- Every PR runs the CI pipeline (`.github/workflows/ci.yml`): install,
  dependency audit, lint, and tests. All must pass before merge.
- No PR should introduce a real secret, credential, or API key — use
  `.env.example` placeholders and reference the real values from your
  deployment platform's secret store.
- Security-relevant changes (auth, permissions, payment handling, file
  uploads) should update `docs/SECURITY.md`'s control matrix in the same
  PR, including moving items from "Planned" to "Implemented" only once
  they're actually tested.

## Code review

Treat AI-generated code the same as any contributor's first draft: read
it, run the tests, and don't merge anything you don't understand.
