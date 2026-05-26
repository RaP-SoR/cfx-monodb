## Summary

<!-- What changed and why -->

## Type

- [ ] Export / API behavior
- [ ] Bug fix (no contract change)
- [ ] Documentation only
- [ ] CI / release pipeline
- [ ] Tests only

## Checklist

See **[docs/CHECKLIST.md](docs/CHECKLIST.md)** — minimum:

- [ ] `yarn gate` passed locally (`yarn scout` optional)
- [ ] `docs/API.md` updated if export behavior changed
- [ ] `fxmanifest.lua` `server_exports` if new export
- [ ] Tests updated (`tests/api-contract.test.ts` for contract changes)

## Breaking change?

- [ ] No
- [ ] Yes — describe CTFFramework impact:

## Test plan

- [ ] `yarn gate`
- [ ] Manual server / CTFFramework (if applicable):
