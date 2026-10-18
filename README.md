# and-scene

And Scene is a presentation-generation agent skill plus the scene kit it builds on.

A presentation is not a stack of unrelated slides. It is one diagrammatic scene that evolves
through named steps: elements appear, move, connect, and re-label as the talk arc develops.

## Layout

- `skills/presentation/` — the distributable agent skill (`SKILL.md`), its helper scripts, and the
  bootstrap and presentation templates.
- `src/presentation-kit/` — the canonical, style-neutral React scene kit. The copy under
  `skills/presentation/templates/bootstrap/` must stay byte-identical; refresh it with
  `node tools/sync-bootstrap-template.mjs`.
- `src/presentations/` — the explicit presentation registry and the worked sample,
  "How to Use This Skill to Make a Presentation".
- `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` — production build and browser-render
  verification, and per-step screenshot capture with advisory visual warnings.

## Development

```bash
npm ci
npm run dev
npm test                    # fast unit and contract tests
npm run lint
npm run build
npm run test:integration    # bootstrap materialization and screenshot helper (Chromium)
npm run test:e2e            # npm run verify against the sample and against faulty copies (Chromium)
npm run verify              # build plus browser-render verification of the sample
npm run inspect -- how-to-make-a-presentation   # screenshots in .inspection/ plus warnings
```

Browser-backed scripts use Playwright Chromium and install it on first use if it is missing.
