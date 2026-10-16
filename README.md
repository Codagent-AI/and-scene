# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on.

A presentation is **one diagrammatic scene** that evolves through named steps:
entities keep a stable identity, so elements appear, move, connect, and re-label
instead of being replaced slide by slide.

## Layout

| Path | What it is |
| --- | --- |
| `skills/presentation/` | The distributable agent skill (`SKILL.md`), its helper script, and scaffold templates |
| `src/presentation-kit/` | Canonical, style-neutral React scene kit (stage, navigation, chrome, node primitives) |
| `src/presentations/` | The presentation registry and the worked sample, "How to Use This Skill to Make a Presentation" |
| `scripts/verify.mjs` | Build + production browser render verification |
| `scripts/inspect-presentation.mjs` | Per-step screenshots and advisory visual diagnostics |

The kit owns behavior, layout geometry, and `data-presentation-*` hooks only. Each
presentation owns its colors, typography, spacing, and component treatments in its own CSS.

## Development

```bash
npm ci
npm run dev                 # http://127.0.0.1:5173/
npm test                    # Vitest unit, component, and contract tests
npm run lint
npm run build               # tsc -b && vite build
npm run verify              # build, then render every step of every presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # screenshots in .presentation-inspect/ + warnings
npm run test:integration    # bootstrap materialization, inspection helper, verify failure modes
```

`verify` and `inspect` need a Playwright Chromium (`npx playwright install chromium`).

## Keeping the skill snapshot in sync

`skills/presentation/templates/bootstrap/` is a snapshot used to bootstrap other projects.
After changing `src/presentation-kit/`, the app shell, the scripts, or
`skills/presentation/templates/presentation/`, run:

```bash
node scripts/sync-templates.mjs          # rewrite the snapshot
node scripts/sync-templates.mjs --check  # report drift only
```

A contract test fails on drift.
