# Scripts (maintainer / perf)

Opt-in tools — **not** part of `yarn gate`.

| Script | Command | Purpose |
|--------|---------|---------|
| Seed test data | `yarn seed:test-data` | Accounts, characters, items + 200 bench docs |
| CRUD bench | `yarn bench:crud` | Sequential driver updates (default 200) |
| Doc audit | `yarn doc-audit` | Export ↔ docs checklist |
| Scout | `yarn scout` | Diff reminders + gate |

## Prerequisites

```bash
# PowerShell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/cfx_mongodb_test"

yarn seed:test-data
yarn bench:crud --updates 200
```

## Export-path batch test

```bash
yarn test:integration
```

Includes `batch-update.test.ts` — 200 inserts + 200 updates via real exports.

Fixture shape: [../tests/fixtures/perf-seed.json](../tests/fixtures/perf-seed.json)
