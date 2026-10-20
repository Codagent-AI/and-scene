# and-scene

And Scene is a presentation-generation agent skill plus the React scene kit it
builds on.

A presentation is not a stack of unrelated slides. It is one diagrammatic scene
that evolves through named steps: elements appear, move, connect, and re-label as
the explanation develops. Entities keep a stable identity, so what persists morphs
in place, newcomers enter after the morphs settle, and departing entities exit.

## Layout

| Path | What it is |
|---|---|
| `skills/presentation/` | The distributable agent skill (`SKILL.md`) and its scaffold templates |
| `src/presentation-kit/` | The canonical, style-neutral React scene kit |
| `src/presentations/` | The presentation registry and the worked sample, "How to Use This Skill to Make a Presentation" |
| `scripts/verify.mjs` | Build plus real-browser render verification (`npm run verify`) |
| `scripts/inspect-presentation.mjs` | Settled screenshots and advisory visual diagnostics (`npm run inspect`) |

The kit owns behavior, geometry and stable `data-presentation-*` hooks only. Each
presentation owns its colors, typography, spacing and component treatments.

## Development

```bash
npm ci
npm test                  # fast Vitest unit and contract tests
npm run lint              # ESLint
npm run build             # TypeScript and production build
npm run verify            # build, then render the sample through every step in Chromium
npm run inspect -- how-to-make-a-presentation   # screenshots in inspection/<slug>/
npm run test:integration  # bootstrap template and screenshot helper (browser-backed)
npm run test:e2e          # npm run verify against the repo and against faulty copies
npm run dev
```

Browser-backed commands need Chromium for Playwright (`npx playwright install chromium`).
Local automation uses `127.0.0.1`.

### Keeping the template aligned

`skills/presentation/templates/bootstrap/` is a snapshot used to scaffold a fresh
project. Its kit, `scripts/`, router and TypeScript config are byte-identical copies;
after changing any of them run `npm run sync:template`. Only the outline data
(`scripts/verify.config.json`) and the placeholder presentation differ.
