# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test                  # fast Vitest unit and contract tests
npm run lint              # ESLint
npm run build             # TypeScript and production build
npm run test:integration  # bootstrap + screenshot-helper tests (Chromium, network for npm ci)
npm run test:e2e          # full verification pass and fault-injection runs
npm run verify            # build, then render every registered presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
```

## Layout

- `src/presentation-kit/`: the style-neutral scene kit (stage, navigation, chrome, node primitives).
- `src/presentations/`: the explicit registry and the committed reference sample.
- `skills/presentation/`: the agent skill (`SKILL.md`) and its scaffold templates. The bootstrap
  template's kit and `scripts/` must stay byte-identical to the canonical copies; run
  `npm run sync:templates` after changing either.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: deterministic verification and
  screenshot diagnostics. App-owned expectations live in `verify.config.json`.

Browser tooling expects Playwright's Chromium (`npx playwright install chromium`); `playwright` is
pinned to the version whose Chromium revision matches the browsers installed here.
