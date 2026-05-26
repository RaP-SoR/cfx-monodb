# Integration tests

Real MongoDB wire-protocol tests (Track J). Unit tests in `tests/` remain fully mocked.

## Requirements

- MongoDB 7.x reachable from your machine
- Environment variable `TEST_MONGODB_URI`

Example:

```bash
export TEST_MONGODB_URI=mongodb://127.0.0.1:27017/cfx_mongodb_test
yarn test:integration
```

On Windows PowerShell:

```powershell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/cfx_mongodb_test"
yarn test:integration
```

## CI

GitHub Actions workflow `.github/workflows/integration.yml` starts `mongo:7` and sets `TEST_MONGODB_URI` automatically.

## Not in `yarn gate`

Integration tests are **opt-in** locally and run in a separate CI job so `yarn gate` stays fast without MongoDB.

Collections use the `it_` prefix and are dropped in `afterAll`.
