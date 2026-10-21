# and-scene

And Scene generates browser presentations modeled as **one evolving diagrammatic scene**:
stable entities that appear, move, connect, and re-label across named steps, rather than a
stack of unrelated slides.

## Layout

- `skills/presentation/` — the distributable agent skill (`SKILL.md`) and its scaffold
  templates (`templates/bootstrap/`, `templates/presentation/`).
- `src/presentation-kit/` — the style-neutral React scene kit. Presentations own all visuals.
- `src/presentations/` — the explicit registry and the committed worked example,
  `how-to-make-a-presentation`.
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — build + browser-render
  verification and screenshot capture with advisory visual diagnostics.

`src/presentation-kit/` (non-test files) and `scripts/` are byte-identical to their copies under
`skills/presentation/templates/bootstrap/`; `npm test` fails if they drift.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests
npm run lint
npm run build             # tsc -b && vite build
npm run verify            # build + render every step of every registered presentation in Chromium
npm run inspect -- how-to-make-a-presentation   # screenshots in .inspection/<slug>/
npm run test:integration  # bootstrap materialization, screenshot helper (needs Chromium)
npm run test:e2e          # production verification pass and failure contract (needs Chromium)
```
