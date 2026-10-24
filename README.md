# and-scene

And Scene turns a topic into a browser presentation that works as **one
evolving diagrammatic scene**: entities keep a stable identity and appear,
move, connect, and re-label as named steps advance, instead of a stack of
unrelated slides.

## What is here

- `skills/presentation/` — the distributable agent skill (`SKILL.md`), its
  scaffold helper (`scripts/scaffold.mjs`), and the templates it copies
  (`templates/bootstrap/`, `templates/presentation/`).
- `src/presentation-kit/` — the canonical, style-neutral React scene kit
  (engine, chrome, generic node primitives). It ships no colors, fonts, or CSS
  framework; presentations own their look and target `data-presentation-*` hooks.
- `src/presentations/` — the presentation registry and the committed sample,
  *How to Use This Skill to Make a Presentation* (`/how-to-make-a-presentation`).
- `scripts/verify.mjs` — builds the app and steps every registered
  presentation through a real browser; `scripts/inspect-presentation.mjs` —
  settled per-step screenshots plus advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                  # fast unit and contract tests (Vitest)
npm run lint
npm run build
npm run verify            # build + browser render of every step (needs Playwright Chromium)
npm run inspect -- how-to-make-a-presentation   # screenshots under .presentation-inspect/
npm run test:integration  # slower browser-backed integration and end-to-end suites
```

`skills/presentation/templates/bootstrap/` holds a byte-aligned snapshot of the
kit and the verification scripts. After changing any of them run
`npm run sync:templates`; `npm test` fails while the snapshot has drifted.
