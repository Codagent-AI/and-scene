# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Layout

- `skills/presentation/`: the agent skill (`SKILL.md`) and its scaffold templates
- `src/presentation-kit/`: the style-neutral scene kit (hooks, geometry and motion only)
- `src/presentations/`: the registry and the reference presentation
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: build/render verification and screenshots

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests
npm run lint
npm run build
npm run verify            # build + render every registered presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
npm run test:integration  # bootstrap template and screenshot helper (needs Chromium)
npm run test:e2e          # production verification and its failure modes (needs Chromium)
```

Install the browser once with `npx playwright install chromium`.
