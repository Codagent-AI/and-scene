# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test               # fast unit and contract tests
npm run lint
npm run build          # tsc -b && vite build
npm run verify         # build, then render every step of every presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
npm run test:integration   # bootstrap materialization and screenshot helper (browser-backed)
npm run test:e2e           # production verification and its failure contract (browser-backed)
```

## Layout

- `skills/presentation/` - the agent skill (`SKILL.md`), its scaffold/registration helpers and templates.
- `src/presentation-kit/` - the canonical, style-neutral scene kit. Its bootstrap copy under
  `skills/presentation/templates/bootstrap/` must stay byte-aligned (`npm run sync:templates`).
- `src/presentations/` - the explicit registry and the worked sample, "How to Use This Skill to Make a Presentation".
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` - verification and screenshot helper.

Playwright needs Chromium: `npx playwright install chromium`.
