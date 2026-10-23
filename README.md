# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev          # Vite dev server
npm test             # fast unit, component and contract tests (Vitest)
npm run lint
npm run build        # tsc -b && vite build
npm run verify       # build + production-preview render check of every sample step
npm run inspect -- how-to-make-a-presentation   # per-step screenshots + advisory warnings
npm run test:integration   # bootstrap + screenshot-helper tests (needs Chromium)
npm run test:e2e           # production verification journeys (needs Chromium)
```

## Layout

- `skills/presentation/`: the agent skill (`SKILL.md`), its scaffold helper, and the
  `templates/` used to bootstrap a fresh project. After changing `src/presentation-kit/`,
  `src/Router.tsx`, `src/route.ts`, `src/Landing.tsx`, `src/main.tsx` or the two scripts,
  run `npm run sync:templates` to refresh the bootstrap snapshot.
- `src/presentation-kit/`: the style-neutral scene kit (behavior, geometry and
  `data-presentation-*` hooks only; presentations own all styling).
- `src/presentations/`: the explicit registry and the committed reference sample.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: verification and inspection.

Playwright is pinned to the version whose Chromium build is installed in the
development environment; browsers come from `PLAYWRIGHT_BROWSERS_PATH`
(`npx playwright install chromium` otherwise).
