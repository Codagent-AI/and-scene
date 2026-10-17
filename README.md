# and-scene

And Scene turns a topic into a browser presentation that works as **one evolving diagram**: entities
keep their identity while they appear, move, connect and re-label from step to step.

- `skills/presentation/` — the agent skill (`SKILL.md`), its scaffold script and templates.
- `src/presentation-kit/` — the style-neutral React scene kit (motion, canvas scaling, navigation, chrome).
- `src/presentations/` — the presentation registry and the worked example,
  "How to Use This Skill to Make a Presentation" (`/how-to-make-a-presentation`).
- `scripts/verify.mjs` — build plus real-browser render of every step of every registered presentation.
- `scripts/inspect-presentation.mjs` — settled per-step screenshots and advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                    # fast unit and contract tests (Vitest)
npm run lint
npm run build
npm run verify              # build + Chromium render of every step on 127.0.0.1
npm run inspect -- how-to-make-a-presentation   # screenshots in inspection-output/<slug>/
npm run test:integration    # slower browser/filesystem integration and end-to-end tests
```

`npm run verify` and `npm run inspect` need a Playwright Chromium (`npx playwright install chromium`).

## Keeping copies aligned

`skills/presentation/templates/bootstrap/` is a snapshot used to scaffold new projects. Its
`src/presentation-kit/` (without tests) and `scripts/` must stay byte-identical to the root copies.
After changing either, run `npm run sync:template`; a unit test fails on drift.
