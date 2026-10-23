# and-scene

And Scene is a project for building presentation-generation agent skills.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Development

```bash
npm ci
npm run dev        # local app; presentations live at /<slug>
npm test           # fast unit and contract tests
npm run lint
npm run build      # TypeScript and production build
npm run verify     # build, reference sample outline, and browser render of every step
npm run inspect -- how-to-make-a-presentation   # settled screenshots + advisory warnings
npm run test:integration   # bootstrap materialization and screenshot helper (slow)
npm run test:e2e           # verification failure contract (slow)
```

Browser-backed checks use Chromium through Playwright. Install it once with
`npx playwright install chromium` if it is not already available.

## Layout

- `src/presentation-kit/`: the reusable scene kit. It owns behavior, layout geometry, and stable hooks, and no visual defaults.
- `src/presentations/`: the registry and the committed reference sample.
- `skills/presentation/`: the distributable skill (`SKILL.md`), its scaffold helper, and the templates it copies.
- `scripts/`: `verify.mjs` (deterministic gate) and `inspect-presentation.mjs` (screenshots and advisory warnings).
- `tests/`: unit tests (`tests/unit`), integration tests (`tests/integration`), and end-to-end tests (`tests/e2e`).

`src/presentation-kit/`, the sample, and the root scripts are mirrored in
`skills/presentation/templates/bootstrap/`. Keep the two copies byte-identical;
the integration suite checks this.
