<!--
Thanks for opening a PR! 💛 Please fill this in. The PR template is part of
the contract — if any box is checked falsely, review will bounce.

For non-trivial work please open an issue first (see CONTRIBUTING.md).
-->

## Summary

<!-- One paragraph: what does this PR do, and why? Not "how". -->

Closes #<issue>

## Type of change

- [ ] 🐛 Bug fix (non-breaking)
- [ ] ✨ Feature (non-breaking)
- [ ] 💥 Breaking change
- [ ] ♻️ Refactor (no behavior change)
- [ ] 📝 Documentation
- [ ] 🧪 Tests only
- [ ] 🔧 Tooling / CI / build
- [ ] ⏪ Revert

## Affected areas

<!-- Tick all that apply. -->

- [ ] `apps/web`
- [ ] `apps/core-api`
- [ ] `packages/reader-core`
- [ ] `packages/render-engine`
- [ ] `packages/pdf-adapter`
- [ ] `packages/reader-ui`
- [ ] `packages/design-tokens`
- [ ] `packages/ui`
- [ ] `packages/api-contracts`
- [ ] `packages/telemetry`
- [ ] `packages/config`
- [ ] Tooling / CI
- [ ] Documentation

## How was this tested?

<!-- Commands, scenarios, manual steps, screenshots. -->

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Screenshots / recordings

<!-- Required for any UI change. Include light, dark, and high-contrast themes for UI work. -->

| Before | After |
| :----: | :---: |
|        |       |

## Spec impact

<!-- Which canonical specs change? Link the sections. -->

- [ ] `PRD.md` — _section/\_n/a_
- [ ] `ARCHITECTURE.md` — _section/\_n/a_
- [ ] `UX-SPECIFICATION.md` — _section/\_n/a_
- [ ] `DESIGN-SYSTEM-SPEC.md` — _section/\_n/a_
- [ ] `FEATURE-SPECIFICATION.md` — _section/\_n/a_
- [ ] `READER-SPEC.md` — _section/\_n/a_
- [ ] None — purely additive within an already-documented contract.

## Checklist

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) and an appropriate scope.
- [ ] One concern per PR; no unrelated changes.
- [ ] CI is green locally (`format:check`, `lint`, `typecheck`, `test`, `build`).
- [ ] Tests added/updated for every public API change.
- [ ] Documentation and specs updated where they drift.
- [ ] No upward imports / no architectural boundary violations.
- [ ] Accessibility considered (keyboard, screen reader, theme, responsive).
- [ ] No `console.log` left behind; structured logger only.
- [ ] No new dependencies (or each is justified in the description).
- [ ] [`CHANGELOG.md`](../CHANGELOG.md) `Unreleased` updated if user-visible.

## Reviewer notes

<!-- Anything the reviewer should look at first, known limitations, follow-ups. -->
