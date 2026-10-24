# and-scene

And Scene builds browser presentations that work as **one evolving diagram**: stable
entities appear, move, connect and re-label across named steps instead of being redrawn on
disconnected slides.

- `skills/presentation/`: the distributable agent skill (`SKILL.md`), its helper
  (`scripts/presentation-tool.mjs`) and the scaffold templates (`templates/bootstrap/`,
  `templates/presentation/`).
- `src/presentation-kit/`: the canonical, style-neutral React scene kit (motion, fixed 880 × 380
  canvas, present/browse navigation, chrome hooks). Presentations own all colors, typography and
  spacing; the kit ships no styles.
- `src/presentations/`: the registry and the worked example, *How to Use This Skill to Make a
  Presentation* (`/how-to-make-a-presentation`).
- `scripts/verify.mjs`: builds the app and renders every configured presentation, step by step,
  in Chromium.
- `scripts/inspect-presentation.mjs`: per-step screenshots plus advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                    # fast unit and contract tests (Vitest)
npm run test:integration    # slower filesystem/browser integration and end-to-end tests
npm run lint
npm run build               # tsc -b + production build
npm run verify              # build + browser render check of verify.config.json presentations
npm run inspect -- how-to-make-a-presentation   # screenshots in .inspection/<slug>/
```

`verify` and `inspect` need Playwright's Chromium (`npx playwright install chromium`).

## Keeping the template snapshot in sync

`skills/presentation/templates/bootstrap/` carries byte-identical copies of the scene kit, the
verification/inspection scripts and the routing shell. After changing any of them run

```bash
npm run sync:templates
```

(`node scripts/sync-templates.mjs --check` reports drift; a unit test fails on it).
