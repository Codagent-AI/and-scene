# and-scene

And Scene is a project for building a presentation-generation agent skill.

The intended presentation model is not a stack of unrelated slides. It is one
diagrammatic scene that evolves through named steps: elements appear, move,
collapse, connect, and re-label as the talk arc develops.

## Layout

- `src/presentation-kit/`: the style-neutral scene kit (stage, navigation, chrome, node primitives).
- `src/presentations/`: the explicit registry and the committed reference presentation, `how-to-make-a-presentation`.
- `skills/presentation/`: the agent skill (`SKILL.md`), its `scripts/scaffold.mjs` helper, and `templates/`.
  `templates/bootstrap/` carries a copy of the kit and verification scripts; run `node scripts/sync-template.mjs` after changing them.
- `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`: production verification and screenshot diagnostics.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests
npm run lint
npm run build
npm run verify            # build plus a real-browser render of every sample step
npm run inspect -- how-to-make-a-presentation   # settled screenshots in inspection/ plus advisory warnings
npm run test:integration  # bootstrap and screenshot-helper suites (Chromium, npm ci)
npm run test:e2e          # verification gate and its failure modes
```
