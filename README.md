# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev
npm test                 # fast unit and contract tests (Vitest)
npm run lint
npm run build            # tsc -b && vite build
npm run verify           # build + real-browser render of every sample step
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
npm run test:integration # INT-001 bootstrap template, INT-002 screenshot helper
npm run test:e2e         # E2E-001 / E2E-002 verify success and failure contract
```

## Layout

- `src/presentation-kit/`: style-neutral scene kit (canonical source)
- `src/presentations/`: registry and the `how-to-make-a-presentation` sample
- `skills/presentation/`: the agent skill, bootstrap template and presentation template
- `scripts/`: `verify.mjs` and `inspect-presentation.mjs`

`src/presentation-kit/` and `scripts/` are mirrored byte-for-byte under
`skills/presentation/templates/bootstrap/`; a unit test fails on drift.
