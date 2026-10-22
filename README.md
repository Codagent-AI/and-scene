# and-scene

And Scene turns a topic into a browser presentation that works as **one evolving
diagrammatic scene**: entities appear, move, connect, and re-label across named
steps instead of living on disconnected slides.

It ships as an agent skill (`skills/presentation/`), a reusable, style-neutral
scene kit (`src/presentation-kit/`), and a worked example
(`src/presentations/how-to-make-a-presentation/`).

## Commands

```bash
npm ci
npm run dev                                   # Vite dev server
npm test                                      # fast Vitest unit and contract tests
npm run lint                                  # ESLint
npm run build                                 # TypeScript + production build
npm run verify                                # build, then render every step in Chromium on 127.0.0.1
npm run inspect -- how-to-make-a-presentation # settled screenshots + advisory visual warnings
npm run test:integration                      # bootstrap materialization and screenshot-helper tests
npm run test:e2e                              # verify success and failure end-to-end tests
npm run sync:bootstrap                        # refresh the skill's bootstrap template from this repo
```

`npm run inspect` writes `inspection/<slug>/step-NN.png` (NN is the zero-based step
index, and warnings print as `WARN step <index> <kind>: …`). Options: `--out`,
`--viewport WxH` (default `1440x900`), `--settle-ms` (default `1200`), `--no-build`.
Warnings are advisory and never change the exit code.

Playwright needs a Chromium build: `npx playwright install chromium`.

## Layout

- `skills/presentation/`: `SKILL.md`, helper scripts, and `templates/` (a bootstrap app
  and a new-presentation template). `templates/bootstrap` mirrors the kit and scripts
  byte for byte; run `npm run sync:bootstrap` after changing them.
- `src/presentation-kit/`: the scene kit (stage, navigation, chrome, node primitives).
  It owns behavior, geometry and `data-presentation-*` hooks, and no visual style.
- `src/presentations/`: the explicit registry (`index.ts`) and each presentation's
  folder. `/` shows the landing page; `/<slug>` lazy-loads that presentation.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`: verification and inspection.
