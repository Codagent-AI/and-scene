# and-scene

And Scene is a project for building browser presentations that evolve as one diagrammatic scene.
Each presentation is a set of ordered steps in which the same entities appear, move, connect, and
re-label. The reusable scene kit lives in `src/presentation-kit/`, and the presentation agent skill
lives in `skills/presentation/`.

## Development

```bash
npm ci
npm run dev
npm run build
```

## Checks

```bash
npm test                    # unit and contract tests (fast)
npm run test:integration    # materialized bootstrap and screenshot helper (browser and subprocess)
npm run test:e2e            # the verification gate against the repository and faulted copies
npm run lint
npm run build
npm run verify              # build, production preview on 127.0.0.1, and a Chromium step-through
npm run inspect -- how-to-make-a-presentation   # settled screenshots and advisory warnings
```

Screenshots are written to `inspection/` (git-ignored).

## Layout

- `src/presentation-kit/`: the scene kit (canonical source; the skill's bootstrap template carries a byte-identical copy)
- `src/presentations/`: the registry and the reference presentation, `how-to-make-a-presentation`
- `skills/presentation/`: the agent skill, its procedure (`SKILL.md`), and its templates
- `scripts/`: `verify.mjs` and `inspect-presentation.mjs`
