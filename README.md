# and-scene

And Scene is an agent skill and scene kit for building browser presentations that work as
**one evolving diagram**: elements appear, move, connect, and re-label as the explanation
develops, instead of a deck of disconnected slides.

- `skills/presentation/` – the distributable agent skill (`SKILL.md`) and scaffold templates.
- `src/presentation-kit/` – the style-neutral React scene kit (stage, navigation, chrome, node primitives).
- `src/presentations/` – the registry and the committed sample, *How to Use This Skill to Make a Presentation*
  (`/how-to-make-a-presentation`).
- `scripts/verify.mjs` – build + real-browser render check of every registered presentation.
- `scripts/inspect-presentation.mjs` – per-step screenshots plus advisory visual diagnostics.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests (Vitest)
npm run test:integration  # slower integration + end-to-end tests (Chromium, npm ci in a temp app)
npm run lint
npm run build
npm run verify            # build, then render every step of every presentation in Chromium
npm run inspect -- how-to-make-a-presentation [--viewport 390x844]
```

`verify` and `inspect` need Playwright's Chromium (`npx playwright install chromium`).
`inspect` writes screenshots to `.inspection/<slug>/<viewport>/` (git-ignored).

## Keeping templates in sync

`skills/presentation/templates/bootstrap/` carries a snapshot of the kit and the two scripts.
After changing `src/presentation-kit/` or `scripts/`, run `npm run sync:templates`; a unit test fails on drift.
